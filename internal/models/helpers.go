package models

import (
	"context"
	"fmt"
	"math"
	"strings"
	"sync"
	"time"

	"golang.org/x/exp/slices"
)

func deg2rad(degrees float64) float64 {
	return degrees * math.Pi / 180
}

func hsin(theta float64) float64 {
	return math.Pow(math.Sin(theta/2), 2)
}

// dist calculates a distance between 2 geo points
func dist(lat1, lon1, lat2, lon2 float64) float64 {
	lat1 = deg2rad(lat1)
	lon1 = deg2rad(lon1)
	lat2 = deg2rad(lat2)
	lon2 = deg2rad(lon2)

	r := 6378100.0
	h := hsin(lat2-lat1) + math.Cos(lat1)*math.Cos(lat2)*hsin(lon2-lon1)

	return 2 * r * math.Asin(math.Sqrt(h)) / 1000 / 1.852 // nautical miles
}

// getClassesForModel returns all defined classes for the aircraft
func getClassesForModel(classes map[string]string, model string) []string {
	var ac []string

	for key, element := range classes {
		elements := strings.Split(element, ",")
		// trim each element in slice to remove spaces
		for i, v := range elements {
			elements[i] = strings.TrimSpace(v)
		}

		if slices.Contains(elements, model) {
			ac = append(ac, key)
		}
	}

	// aircraft is not classified
	if len(ac) == 0 {
		ac = append(ac, model)
	}

	return ac
}

// initZeroFlightRecord inits an empty var of FlightRecord with 0:00/0 values for stats
func initZeroFlightRecord() FlightRecord {
	var fr FlightRecord

	fr.Time.SE = "0:00"
	fr.Time.ME = "0:00"
	fr.Time.MCC = "0:00"
	fr.Time.Total = "0:00"
	fr.Time.Night = "0:00"
	fr.Time.IFR = "0:00"
	fr.Time.PIC = "0:00"
	fr.Time.CoPilot = "0:00"
	fr.Time.Dual = "0:00"
	fr.Time.Instructor = "0:00"

	fr.Landings.Day = 0
	fr.Landings.Night = 0

	fr.SIM.Time = "0:00"

	fr.Time.CrossCountry = "0:00"

	return fr
}

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
func (m *DBModel) distance(departure, arrival string) int {
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
		return cachedDistance.(int)
	}

	dep, err1 := m.GetAirportByID(departure)
	arr, err2 := m.GetAirportByID(arrival)
	if err1 != nil || err2 != nil {
		return 0
	}

	d := int(dist(dep.Lat, dep.Lon, arr.Lat, arr.Lon))
	distanceCache.Store(key, d)
	return d
}

func (m *DBModel) processFlightrecord(fr *FlightRecord) {
	// calculate distance
	fr.Distance = m.distance(fr.Departure.Place, fr.Arrival.Place)

	// check for cross country flights
	if fr.Departure.Place != fr.Arrival.Place {
		fr.Time.CrossCountry = fr.Time.Total
	} else {
		fr.Time.CrossCountry = "0:00"
	}
}

// CreateDistanceCache fills cache map with calculated distances
func (m *DBModel) CreateDistanceCache() {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

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
