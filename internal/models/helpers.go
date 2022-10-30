package models

import (
	"math"
	"strings"

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
		if slices.Contains(strings.Split(element, ","), model) {
			ac = append(ac, key)
		}
	}

	// aircraft is not classified
	if len(ac) == 0 {
		ac = append(ac, model)
	}

	return ac
}
