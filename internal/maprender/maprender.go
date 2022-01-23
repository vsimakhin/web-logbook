package maprender

import (
	"fmt"
	"image"
	"image/color"
	"strings"

	sm "github.com/flopp/go-staticmaps"
	"github.com/golang/geo/s2"
	"github.com/vsimakhin/web-logbook/internal/models"
)

type MapRender struct {
	FlightRecords  []models.FlightRecord
	FilterDate     string `json:"filter_date"`
	FilterNoRoutes bool   `json:"filter_noroutes"`
	AirportsDB     map[string]models.Airport

	Img image.Image
}

func (mr *MapRender) Render() error {
	airportMarkers := make(map[string]struct{})
	routeLines := make(map[string]struct{})
	var err error

	// parsing
	for _, fr := range mr.FlightRecords {
		if fr.Departure.Place == "" || fr.Arrival.Place == "" {
			continue
		}
		if (mr.FilterDate != "" && strings.Contains(fr.Date, mr.FilterDate)) || mr.FilterDate == "" {
			// add to the list of the airport markers departure and arrival
			// it will be automatically a list of unique airports
			airportMarkers[fr.Departure.Place] = struct{}{}
			airportMarkers[fr.Arrival.Place] = struct{}{}

			// the same for the route lines
			if !mr.FilterNoRoutes {
				if fr.Departure.Place != fr.Arrival.Place {
					routeLines[fmt.Sprintf("%s-%s", fr.Departure.Place, fr.Arrival.Place)] = struct{}{}
				}
			}
		}
	}

	ctx := sm.NewContext()
	ctx.SetSize(1280, 1024)

	// generate routes lines
	for route := range routeLines {
		places := strings.Split(route, "-")

		if airport1, ok := mr.AirportsDB[places[0]]; ok {
			if airport2, ok := mr.AirportsDB[places[1]]; ok {

				ctx.AddObject(
					sm.NewPath(
						[]s2.LatLng{
							s2.LatLngFromDegrees(airport1.Lat, airport1.Lon),
							s2.LatLngFromDegrees(airport2.Lat, airport2.Lon),
						},
						color.Black,
						0.5),
				)
			}
		}
	}

	// generate airports markers
	for place := range airportMarkers {
		if airport, ok := mr.AirportsDB[place]; ok {
			ctx.AddObject(
				sm.NewMarker(
					s2.LatLngFromDegrees(airport.Lat, airport.Lon),
					color.RGBA{0xff, 0, 0, 0xff},
					16.0,
				),
			)
		}
	}

	mr.Img, err = ctx.Render()
	if err != nil {
		return err
	}

	return nil
}
