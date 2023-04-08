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

// SunriseSunset returns sunrise and sunset times
func (place *Place) SunriseSunset() (time.Time, time.Time) {
	sunrise, sunset := sunrise.SunriseSunset(place.Lat, place.Lon, place.Time.UTC().Year(), place.Time.UTC().Month(), place.Time.UTC().Day())

	return sunrise.UTC().Add(time.Duration(-30) * time.Minute), sunset.UTC().Add(time.Duration(30) * time.Minute)
}

// Sunrise returns aviation sunrise time
func (place *Place) Sunrise() time.Time {
	s, _ := place.SunriseSunset()
	return s
}

// Sunset returns aviation sunset time (+30 minutes from apparent sunset)
func (place *Place) Sunset() time.Time {
	_, s := place.SunriseSunset()
	return s
}

// MeetWithSun finds the point on the route where airplane meets with Sun (rised or set)
func (route *Route) meetWithSun(target string) Place {
	maxIterations := 20    // max iteratons, in case some error just not to iterate infinite
	maxDiffSeconds := 30.0 // tolerance in minutes, where we agreed we got the sunset/sunrise

	iter := 0

	var xPoint Place
	diff := time.Duration(0)

	startPoint := route.Departure
	endPoint := route.Arrival

	speed := route.FlightSpeed()

	for iter < maxIterations {
		iter++

		xPoint = midpoint(startPoint, endPoint)

		dist := distance(route.Departure, xPoint)
		flightTime := dist / speed * 60

		xPoint.Time = route.Departure.Time.Add(time.Duration(flightTime*60) * time.Second)

		if target == "sunrise" {
			diff = xPoint.Time.Sub(xPoint.Sunrise())
		} else {
			diff = xPoint.Time.Sub(xPoint.Sunset())
		}

		if math.Abs(diff.Seconds()) > maxDiffSeconds {
			if diff.Seconds() > 0 {
				endPoint = xPoint
			} else {
				startPoint = xPoint
			}
		} else {
			break
		}
	}

	return xPoint
}

// NightTime returns a calculated night time
func (route *Route) NightTime() time.Duration {
	nightTime := time.Duration(0)

	rdsr, rdss := route.Departure.SunriseSunset()
	rasr, rass := route.Arrival.SunriseSunset()

	if (route.Departure.Time.After(rdsr) && route.Departure.Time.Before(rdss)) &&
		(route.Arrival.Time.After(rasr) && route.Arrival.Time.Before(rass)) {
		// full day flight
		nightTime = time.Duration(0)

	} else if route.Departure.Time.After(rdsr) && route.Departure.Time.Before(rdss) {
		// flight from day to night, night landing
		point := route.meetWithSun("sunset")
		nightTime = route.Arrival.Time.Sub(point.Time)

	} else if route.Arrival.Time.After(rasr) && route.Arrival.Time.Before(rass) {
		// flight from night to day, day landing
		point := route.meetWithSun("sunrise")
		nightTime = point.Time.Sub(route.Departure.Time)

	} else {
		// full night time
		nightTime = route.FlightTime()

	}

	return nightTime
}
