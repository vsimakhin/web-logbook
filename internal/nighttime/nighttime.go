package nighttime

import (
	"math"
	"time"

	"github.com/mstephenholl/go-solar"
)

// Night means the hours between the end of evening civil twilight and
// the beginning of morning civil twilight. Civil twilight ends in the evening
// when the centre of the sun’s disc is 6 degrees below the horizon and begins
// in the morning when the centre of the sun’s disc is 6 degrees below the horizon
const NIGHT_SUN_ELEVATION = -6

type Place struct {
	Lat  float64
	Lon  float64
	Time time.Time
}

type Route struct {
	Departure Place
	Arrival   Place
}

func deg2rad(degrees float64) float64 {
	return degrees * math.Pi / 180
}

func hsin(theta float64) float64 {
	return math.Pow(math.Sin(theta/2), 2)
}

// midpoint calculates a middle point between two coordinates
func midpoint(start Place, end Place) Place {
	lat1 := deg2rad(start.Lat)
	lon1 := deg2rad(start.Lon)
	lat2 := deg2rad(end.Lat)
	lon2 := deg2rad(end.Lon)

	dlon := lon2 - lon1
	Bx := math.Cos(lat2) * math.Cos(dlon)
	By := math.Cos(lat2) * math.Sin(dlon)
	lat := math.Atan2(math.Sin(lat1)+math.Sin(lat2),
		math.Sqrt((math.Cos(lat1)+Bx)*(math.Cos(lat1)+Bx)+By*By))
	lon := lon1 + math.Atan2(By, (math.Cos(lat1)+Bx))

	lat = (lat * 180) / math.Pi
	lon = (lon * 180) / math.Pi

	return Place{
		Lat: lat,
		Lon: lon,
	}
}

// distance calculates a distance between 2 points
func distance(start Place, end Place) float64 {
	lat1 := deg2rad(start.Lat)
	lon1 := deg2rad(start.Lon)
	lat2 := deg2rad(end.Lat)
	lon2 := deg2rad(end.Lon)

	r := 6378100.0
	h := hsin(lat2-lat1) + math.Cos(lat1)*math.Cos(lat2)*hsin(lon2-lon1)

	return 2 * r * math.Asin(math.Sqrt(h)) / 1000 / 1.852 // nautical miles
}

// RouteDistance returns the route distance
func (route *Route) RouteDistance() float64 {
	return distance(route.Departure, route.Arrival)
}

// FlightTime calculates total flight time
func (route *Route) FlightTime() time.Duration {
	return route.Arrival.Time.Sub(route.Departure.Time)
}

// Speed calculates average speed in knots
func (route *Route) FlightSpeed() float64 {
	return route.RouteDistance() / route.FlightTime().Hours()
}

func (route *Route) NightTime() time.Duration {
	if route.Departure.Lat == route.Arrival.Lat && route.Departure.Lon == route.Arrival.Lon {
		// same place, training flights
		return nightCircuits(route.Departure, route.Arrival)
	} else {
		speed := route.FlightSpeed()
		speedPerMinute := speed / 60

		// assumed we split the route for the segments, not longer then 1 minute of flight
		milesPerMinute := speed / 60 * 1 // miles per 1 minutes

		return nightSegment(route.Departure, route.Arrival, milesPerMinute, speedPerMinute)
	}
}

func (route *Route) IsNightLanding() bool {
	loc := solar.NewLocation(route.Arrival.Lat, route.Arrival.Lon)
	elevation := solar.Elevation(loc, route.Arrival.Time.UTC())

	return elevation <= NIGHT_SUN_ELEVATION
}

func nightCircuits(start Place, end Place) time.Duration {
	loc := solar.NewLocation(end.Lat, end.Lon)
	nightTime := 0

	// let's iterate each minute from start time to end time and check sun elevation
	for t := start.Time; t.Before(end.Time); t = t.Add(time.Duration(1) * time.Minute) {
		elevation := solar.Elevation(loc, t.UTC())
		if elevation <= NIGHT_SUN_ELEVATION {
			nightTime++
		}
	}

	return time.Duration(nightTime) * time.Minute
}

func nightSegment(start Place, end Place, maxDistance float64, speedPerMinute float64) time.Duration {
	distance := distance(start, end)

	if distance > maxDistance {
		// too long, let's split it again
		mid := midpoint(start, end)
		// calculate time at the mid point
		flightTime := distance / 2 / speedPerMinute
		mid.Time = start.Time.Add(time.Duration(flightTime) * time.Minute)

		return nightSegment(start, mid, maxDistance, speedPerMinute) + nightSegment(mid, end, maxDistance, speedPerMinute)
	}

	loc := solar.NewLocation(end.Lat, end.Lon)
	sunElevation := solar.Elevation(loc, end.Time.UTC())

	if sunElevation > NIGHT_SUN_ELEVATION { // time is in civil twilight
		return 0
	}

	nightTime := time.Duration(distance / speedPerMinute * float64(time.Minute))
	return nightTime
}
