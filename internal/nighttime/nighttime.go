package nighttime

import (
	"math"
	"time"

	"github.com/nathan-osman/go-sunrise"
)

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

// SunriseSunset returns sunrise and sunset times or time.Time{} if there is no night
func (place *Place) SunriseSunset() (time.Time, time.Time, float64) {
	sunElevation := sunrise.Elevation(place.Lat, place.Lon, place.Time)
	sunRise, sunSet := sunrise.SunriseSunset(place.Lat, place.Lon, place.Time.UTC().Year(), place.Time.UTC().Month(), place.Time.UTC().Day())

	noNight := time.Time{}
	if sunRise == noNight || sunSet == noNight {
		return noNight, noNight, sunElevation
	}

	aviationSunRise := sunRise.Add(time.Duration(-30) * time.Minute)
	aviationSunSet := sunSet.Add(time.Duration(30) * time.Minute)

	return aviationSunRise, aviationSunSet, sunElevation
}

// Sunrise returns aviation sunrise time
func (place *Place) Sunrise() time.Time {
	s, _, _ := place.SunriseSunset()
	return s
}

// Sunset returns aviation sunset time (+30 minutes from apparent sunset)
func (place *Place) Sunset() time.Time {
	_, s, _ := place.SunriseSunset()
	return s
}

// Elevation returns sun elevation at the place
func (place *Place) Elevation() float64 {
	_, _, e := place.SunriseSunset()
	return e
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

func nightCircuits(start Place, end Place) time.Duration {
	sr, ss, _ := start.SunriseSunset()

	totalTime := end.Time.Sub(start.Time)

	if sr.IsZero() && ss.IsZero() {
		_, _, elevation := start.SunriseSunset()
		if elevation > 0 {
			return 0 // Polar day
		}
		return totalTime // Polar night
	}

	if sr.After(ss) {
		sr, ss = ss, sr // ensure sr is before ss
	}

	if start.Time.After(sr) && end.Time.Before(ss) {
		return 0 // fully within day
	}

	if (start.Time.Before(sr) && end.Time.Before(sr)) || (start.Time.After(ss) && end.Time.After(ss)) {
		return totalTime // fully in night
	}

	var nightTime time.Duration
	if start.Time.Before(sr) {
		nightTime += sr.Sub(start.Time)
	}
	if end.Time.After(ss) {
		nightTime += end.Time.Sub(ss)
	}

	return nightTime
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

	// get sunrise and sunset for the end point
	// it could be calculated for the middle point again to be more precise,
	// but it will add few more calculations and the error is not so high
	sr, ss, elevation := end.SunriseSunset()

	nightTime := time.Duration(distance / speedPerMinute * float64(time.Minute))

	if sr.Year() == 1 && ss.Year() == 1 {
		if elevation > 0 {
			// Polar day, no night time
			return 0
		}
		// Polar night, all time is night
		return nightTime
	}

	// day time
	if end.Time.After(sr) && end.Time.Before(ss) {
		return 0
	}

	return nightTime
}
