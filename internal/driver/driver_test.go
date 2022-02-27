package driver

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestDBStructure(t *testing.T) {
	assert.Contains(t, structure, "CREATE TABLE IF NOT EXISTS logbook")
	assert.Contains(t, structure, "CREATE UNIQUE INDEX IF NOT EXISTS logbook_uuid ON logbook(uuid)")
	assert.Contains(t, structure, "CREATE VIEW IF NOT EXISTS logbook_view")
	assert.Contains(t, structure, "CREATE TABLE IF NOT EXISTS airports")
	assert.Contains(t, structure, "CREATE UNIQUE INDEX IF NOT EXISTS airports_icao ON airports(icao)")
	assert.Contains(t, structure, "CREATE INDEX IF NOT EXISTS airports_iata ON airports(iata)")
	assert.Contains(t, structure, "CREATE TABLE IF NOT EXISTS settings")
	assert.Contains(t, structure, "CREATE TABLE IF NOT EXISTS licensing")
	assert.Contains(t, structure, "CREATE TABLE IF NOT EXISTS attachments")

}
