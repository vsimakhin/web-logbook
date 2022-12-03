package csvexport

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/vsimakhin/web-logbook/internal/models"
)

func TestFormatRecord(t *testing.T) {
	var e ExportCSV
	var fr models.FlightRecord

	assert.Equal(t, 23, len(e.formatRecord(&fr)))
	assert.Equal(t, 23, len(e.formatRecord(nil)))
}
