package models

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/vsimakhin/web-logbook/internal/utils"
)

// DefaultTimeout is the default timeout for database queries
const DefaultTimeout = 60 * time.Second

// ContextWithTimeout creates a new context with a timeout
func (m *DBModel) ContextWithTimeout(timeout time.Duration) (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), timeout)
}

// ContextWithDefaultTimeout creates a new context with the default timeout
func (m *DBModel) ContextWithDefaultTimeout() (context.Context, context.CancelFunc) {
	return m.ContextWithTimeout(DefaultTimeout)
}

var distanceCache sync.Map

// distance calculates distance between 2 airports
func (m *DBModel) distance(departure, arrival string) float64 {
	if departure == arrival {
		return 0
	}

	var key string
	if strings.Compare(departure, arrival) > 0 {
		key = fmt.Sprintf("%s%s", departure, arrival)
	} else {
		key = fmt.Sprintf("%s%s", arrival, departure)
	}

	if cachedDistance, ok := distanceCache.Load(key); ok {
		return cachedDistance.(float64)
	}

	dep, err1 := m.GetAirportByID(departure)
	arr, err2 := m.GetAirportByID(arrival)
	if err1 != nil || err2 != nil {
		return 0
	}

	d := utils.Distance(dep.Lat, dep.Lon, arr.Lat, arr.Lon)
	distanceCache.Store(key, d)
	return d
}

func (m *DBModel) processFlightrecord(fr *FlightRecord) {
	// check for cross country flights
	if fr.Departure.Place != fr.Arrival.Place {
		fr.Time.CrossCountry = fr.Time.Total
	} else {
		fr.Time.CrossCountry = "0:00"
	}
}

func (m *DBModel) UpdateFlightRecordsDistance() {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	query := "SELECT uuid, departure_place, arrival_place FROM logbook WHERE distance IS NULL"
	rows, err := m.DB.QueryContext(ctx, query)

	if err != nil {
		return
	}
	defer rows.Close()

	// let's make it in transaction
	tx, err := m.DB.Begin()
	if err != nil {
		return
	}

	for rows.Next() {
		var fr FlightRecord
		if err := rows.Scan(&fr.UUID, &fr.Departure.Place, &fr.Arrival.Place); err != nil {
			return
		}

		fr.Distance = m.distance(fr.Departure.Place, fr.Arrival.Place)

		query = "UPDATE logbook SET distance = ? WHERE uuid = ?"
		_, err := tx.ExecContext(ctx, query, fr.Distance, fr.UUID)
		if err != nil {
			tx.Rollback()
			return
		}
	}

	// commit transaction
	if err = tx.Commit(); err != nil {
		return
	}
}

// CreateDistanceCache fills cache map with calculated distances
func (m *DBModel) CreateDistanceCache() {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	// clear cache
	distanceCache.Clear()

	query := "SELECT departure_place, arrival_place FROM logbook_view GROUP BY departure_place, arrival_place"
	rows, err := m.DB.QueryContext(ctx, query)

	if err != nil {
		return
	}
	defer rows.Close()

	for rows.Next() {
		var dep, arr string
		if err := rows.Scan(&dep, &arr); err != nil {
			return
		}

		m.distance(dep, arr)
	}
}
