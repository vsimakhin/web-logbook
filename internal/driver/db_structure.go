package driver

var logbookTable = NewTable("logbook", "uuid", ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(36)"},
	[]Column{
		{Name: "date", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(10)"}, Properties: "NOT NULL"},
		{Name: "departure_place", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(255)"}},
		{Name: "departure_time", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(4)"}},
		{Name: "arrival_place", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(255)"}},
		{Name: "arrival_time", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(4)"}},
		{Name: "aircraft_model", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(255)"}},
		{Name: "reg_name", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(255)"}},
		{Name: "se_time", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(10)"}},
		{Name: "me_time", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(10)"}},
		{Name: "mcc_time", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(10)"}},
		{Name: "total_time", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(10)"}},
		{Name: "day_landings", Type: ColumnType{SQLite: "INTEGER", MySQL: "SMALLINT"}},
		{Name: "night_landings", Type: ColumnType{SQLite: "INTEGER", MySQL: "SMALLINT"}},
		{Name: "night_time", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(10)"}},
		{Name: "ifr_time", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(10)"}},
		{Name: "pic_time", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(10)"}},
		{Name: "co_pilot_time", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(10)"}},
		{Name: "dual_time", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(10)"}},
		{Name: "instructor_time", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(10)"}},
		{Name: "sim_type", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(255)"}},
		{Name: "sim_time", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(10)"}},
		{Name: "pic_name", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(255)"}},
		{Name: "remarks", Type: ColumnType{SQLite: "TEXT", MySQL: "TEXT"}},
		{Name: "update_time", Type: ColumnType{SQLite: "INTEGER", MySQL: "INT"}},
	})

var airportsTable = NewTable("airports", "icao", ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(255)"},
	[]Column{
		{Name: "icao", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(255)"}, Properties: "NOT NULL"},
		{Name: "iata", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(255)"}, Index: true},
		{Name: "name", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(255)"}},
		{Name: "city", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(255)"}},
		{Name: "country", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(255)"}},
		{Name: "elevation", Type: ColumnType{SQLite: "INTEGER", MySQL: "SMALLINT"}},
		{Name: "lat", Type: ColumnType{SQLite: "REAL", MySQL: "FLOAT"}},
		{Name: "lon", Type: ColumnType{SQLite: "REAL", MySQL: "FLOAT"}},
	})

var customAirportsTable = NewTable("airports_custom", "name", ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(255)"},
	[]Column{
		{Name: "city", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(255)"}},
		{Name: "country", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(255)"}},
		{Name: "elevation", Type: ColumnType{SQLite: "INTEGER", MySQL: "SMALLINT"}},
		{Name: "lat", Type: ColumnType{SQLite: "REAL", MySQL: "FLOAT"}},
		{Name: "lon", Type: ColumnType{SQLite: "REAL", MySQL: "FLOAT"}},
	})

var settingsTable = NewTable("settings2", "id", ColumnType{SQLite: "INTEGER", MySQL: "SMALLINT"},
	[]Column{
		{Name: "settings", Type: ColumnType{SQLite: "TEXT", MySQL: "TEXT"}},
	})

var licensingTable = NewTable("licensing", "uuid", ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(36)"},
	[]Column{
		{Name: "category", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(255)"}},
		{Name: "name", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(255)"}},
		{Name: "number", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(255)"}},
		{Name: "issued", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(10)"}},
		{Name: "valid_from", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(10)"}},
		{Name: "valid_until", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(10)"}},
		{Name: "document_name", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(512)"}},
		{Name: "document", Type: ColumnType{SQLite: "BLOB", MySQL: "BLOB"}},
		{Name: "remarks", Type: ColumnType{SQLite: "TEXT", MySQL: "TEXT"}},
		{Name: "update_time", Type: ColumnType{SQLite: "INTEGER", MySQL: "INT"}},
	})

var attachmentsTable = NewTable("attachments", "uuid", ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(36)"},
	[]Column{
		{Name: "record_id", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(36)"}},
		{Name: "document_name", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(512)"}},
		{Name: "document", Type: ColumnType{SQLite: "BLOB", MySQL: "BLOB"}},
	})

var deletedItemsTable = NewTable("deleted_items", "uuid", ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(36)"},
	[]Column{
		{Name: "table_name", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(64)"}, Properties: "NOT NULL"},
		{Name: "delete_time", Type: ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(10)"}, Properties: "NOT NULL"},
	})

var logbookView = NewView("logbook_view",
	SQLQuery{
		SQLite: `
			SELECT uuid, date, substr(date,7,4) || substr(date,4,2) || substr(date,0,3) as m_date, departure_place, departure_time,
				arrival_place, arrival_time, aircraft_model, reg_name, se_time, me_time, mcc_time, total_time, iif(day_landings='',0,day_landings) as day_landings, iif(night_landings='',0,night_landings) as night_landings,
				night_time, ifr_time, pic_time, co_pilot_time, dual_time, instructor_time, sim_type, sim_time, pic_name, remarks, update_time
			FROM logbook;
			`,
		MySQL: `
			SELECT uuid, date, CONCAT(SUBSTRING(date,7,4), SUBSTRING(date,4,2), SUBSTRING(date,1,2)) as m_date, departure_place, departure_time,
				arrival_place, arrival_time, aircraft_model, reg_name, se_time, me_time, mcc_time, total_time, IF(day_landings='',0,day_landings) as day_landings, IF(night_landings='',0,night_landings) as night_landings,
				night_time, ifr_time, pic_time, co_pilot_time, dual_time, instructor_time, sim_type, sim_time, pic_name, remarks, update_time
			FROM logbook;
		`,
	},
)

var airportsView = NewView("airports_view",
	SQLQuery{
		SQLite: `
			SELECT icao, iata, name, city, country, elevation, lat, lon FROM airports
			UNION
			SELECT name as icao, name as iata, name, city, country, elevation, lat, lon FROM airports_custom
			`,
		MySQL: `
			SELECT icao, iata, name, city, country, elevation, lat, lon FROM airports
			UNION
			SELECT name as icao, name as iata, name, city, country, elevation, lat, lon FROM airports_custom
			`,
	},
)
