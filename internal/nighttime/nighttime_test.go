package nighttime

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestKnownNightTime(t *testing.T) {
	// flight from EBBR to LKPR
	route := Route{
		Departure: Place{
			Lat:  50.9014015198,
			Lon:  4.4844398499,
			Time: time.Date(2022, 6, 3, 18, 53, 0, 0, time.UTC),
		},
		Arrival: Place{
			Lat:  50.1007995605,
			Lon:  14.2600002289,
			Time: time.Date(2022, 6, 3, 20, 16, 0, 0, time.UTC),
		},
	}

	nightTime := route.NightTime()

	assert.Equal(t, int(nightTime.Minutes()), 26)

}

func TestKnownNightTime2(t *testing.T) {
	// flight from OMS to SVX
	route := Route{
		Departure: Place{
			Lat:  54.966999,
			Lon:  73.310501,
			Time: time.Date(2023, 1, 1, 10, 00, 0, 0, time.UTC),
		},
		Arrival: Place{
			Lat:  56.743099,
			Lon:  60.802700,
			Time: time.Date(2023, 1, 1, 18, 00, 0, 0, time.UTC),
		},
	}

	nightTime := route.NightTime()

	assert.Equal(t, int(nightTime.Minutes()), 395)

}

func TestAllNightTime(t *testing.T) {
	// flight from LEPA to ESMX in the night
	route := Route{
		Departure: Place{
			Lat:  39.551700592,
			Lon:  2.7388100624,
			Time: time.Date(2021, 12, 8, 20, 4, 0, 0, time.UTC),
		},
		Arrival: Place{
			Lat:  56.9291000366,
			Lon:  14.7279996872,
			Time: time.Date(2021, 12, 8, 22, 53, 0, 0, time.UTC),
		},
	}

	nightTime := route.NightTime()
	assert.Equal(t, nightTime, route.FlightTime())

}

func TestAllDayTime(t *testing.T) {
	// flight from LEPA to ESMX in the night
	route := Route{
		Departure: Place{
			Lat:  39.551700592,
			Lon:  2.7388100624,
			Time: time.Date(2021, 12, 8, 10, 4, 0, 0, time.UTC),
		},
		Arrival: Place{
			Lat:  56.9291000366,
			Lon:  14.7279996872,
			Time: time.Date(2021, 12, 8, 12, 53, 0, 0, time.UTC),
		},
	}

	nightTime := route.NightTime()
	assert.Equal(t, int(nightTime.Minutes()), 0)
}
