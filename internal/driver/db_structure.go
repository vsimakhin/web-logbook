package driver

var (
	schemaVersion = "22"

	UUID      = ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(36)"}
	DateTime  = ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(32)"}
	SmallText = ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(255)"}
	BigText   = ColumnType{SQLite: "TEXT", MySQL: "VARCHAR(512)"}
	FullText  = ColumnType{SQLite: "TEXT", MySQL: "TEXT"}
	SmallInt  = ColumnType{SQLite: "INTEGER", MySQL: "SMALLINT"}
	Int       = ColumnType{SQLite: "INTEGER", MySQL: "INT"}
	Real      = ColumnType{SQLite: "REAL", MySQL: "FLOAT"}
	Blob      = ColumnType{SQLite: "BLOB", MySQL: "LONGBLOB"}
)

var metadataTable = NewTable("metadata", "id", ColumnType{SQLite: "INTEGER", MySQL: "INT UNSIGNED AUTO_INCREMENT"},
	[]Column{
		{Name: "version", Type: ColumnType{SQLite: "VARCHAR(32)", MySQL: "VARCHAR(32)"}, Properties: "NOT NULL"},
		{Name: "created_at", Type: DateTime},
	})

var logbookTable = NewTable("logbook", "uuid", UUID,
	[]Column{
		{Name: "date", Type: DateTime, Properties: "NOT NULL"},
		{Name: "departure_place", Type: SmallText},
		{Name: "departure_time", Type: DateTime},
		{Name: "arrival_place", Type: SmallText},
		{Name: "arrival_time", Type: DateTime},
		{Name: "aircraft_model", Type: SmallText},
		{Name: "reg_name", Type: SmallText},
		{Name: "se_time", Type: DateTime},
		{Name: "me_time", Type: DateTime},
		{Name: "mcc_time", Type: DateTime},
		{Name: "total_time", Type: DateTime},
		{Name: "day_landings", Type: SmallInt},
		{Name: "night_landings", Type: SmallInt},
		{Name: "night_time", Type: DateTime},
		{Name: "ifr_time", Type: DateTime},
		{Name: "pic_time", Type: DateTime},
		{Name: "co_pilot_time", Type: DateTime},
		{Name: "dual_time", Type: DateTime},
		{Name: "instructor_time", Type: DateTime},
		{Name: "sim_type", Type: SmallText},
		{Name: "sim_time", Type: DateTime},
		{Name: "pic_name", Type: SmallText},
		{Name: "remarks", Type: FullText},
		{Name: "distance", Type: Real},
		{Name: "track", Type: Blob},
		{Name: "custom_fields", Type: FullText},
		{Name: "tags", Type: BigText, Properties: "NOT NULL DEFAULT ''"},
		{Name: "signature", Type: FullText},
	})

var airportsTable = NewTable("airports", "icao", SmallText,
	[]Column{
		{Name: "icao", Type: SmallText, Properties: "NOT NULL"},
		{Name: "iata", Type: SmallText, Index: true},
		{Name: "name", Type: SmallText},
		{Name: "city", Type: SmallText},
		{Name: "country", Type: SmallText},
		{Name: "elevation", Type: SmallInt},
		{Name: "lat", Type: Real},
		{Name: "lon", Type: Real},
	})

var customAirportsTable = NewTable("airports_custom", "name", SmallText,
	[]Column{
		{Name: "city", Type: SmallText},
		{Name: "country", Type: SmallText},
		{Name: "elevation", Type: SmallInt},
		{Name: "lat", Type: Real},
		{Name: "lon", Type: Real},
	})

var settingsTable = NewTable("settings2", "id", SmallInt,
	[]Column{
		{Name: "settings", Type: FullText},
	})

var licensingTable = NewTable("licensing", "uuid", UUID,
	[]Column{
		{Name: "category", Type: SmallText},
		{Name: "name", Type: SmallText},
		{Name: "number", Type: SmallText},
		{Name: "issued", Type: DateTime},
		{Name: "valid_from", Type: DateTime},
		{Name: "valid_until", Type: DateTime},
		{Name: "document_name", Type: BigText},
		{Name: "document", Type: Blob},
		{Name: "remarks", Type: FullText},
	})

var attachmentsTable = NewTable("attachments", "uuid", UUID,
	[]Column{
		{Name: "record_id", Type: UUID},
		{Name: "document_name", Type: BigText},
		{Name: "document", Type: Blob},
	})

var tokensTable = NewTable("tokens", "id", ColumnType{SQLite: "INTEGER", MySQL: "INT UNSIGNED AUTO_INCREMENT"},
	[]Column{
		{Name: "username", Type: UUID, Properties: "NOT NULL", Index: true},
		{Name: "token", Type: BigText, Properties: "NOT NULL"},
		{Name: "created_at", Type: DateTime, Properties: "NOT NULL"},
	})

var aircraftsTable = NewTable("aircrafts", "reg_name", SmallText,
	[]Column{
		{Name: "aircraft_model", Type: SmallText, Properties: "NOT NULL"},
		{Name: "custom_categories", Type: BigText, Properties: "NOT NULL DEFAULT ''"},
	})

var aircraftCategoriesTable = NewTable("aircraft_categories", "model", SmallText,
	[]Column{
		{Name: "categories", Type: BigText, Properties: "NOT NULL"},
		{Name: "time_fields_auto_fill", Type: FullText},
	})

var currencyTable = NewTable("currency", "uuid", UUID,
	[]Column{
		{Name: "name", Type: SmallText, Properties: "NOT NULL"},
		{Name: "metric", Type: SmallText, Properties: "NOT NULL"},
		{Name: "target_value", Type: Int, Properties: "NOT NULL"},
		{Name: "time_frame_unit", Type: SmallText, Properties: "NOT NULL"},
		{Name: "time_frame_value", Type: Int, Properties: "NOT NULL"},
		{Name: "time_frame_since", Type: DateTime, Properties: "NOT NULL DEFAULT ''"},
		{Name: "comparison", Type: SmallText, Properties: "NOT NULL"},
		{Name: "filters", Type: FullText},
	})

var customFieldsTable = NewTable("custom_fields", "uuid", UUID,
	[]Column{
		{Name: "name", Type: SmallText, Properties: "NOT NULL"},
		{Name: "description", Type: SmallText, Properties: "NOT NULL DEFAULT ''"},
		{Name: "category", Type: SmallText, Properties: "NOT NULL DEFAULT 'Custom'"},
		{Name: "type", Type: SmallText, Properties: "NOT NULL"},
		{Name: "stats_function", Type: SmallText, Properties: "NOT NULL"},
		{Name: "size_xs", Type: SmallInt, Properties: "NOT NULL"},
		{Name: "size_md", Type: SmallInt, Properties: "NOT NULL"},
		{Name: "size_lg", Type: SmallInt, Properties: "NOT NULL"},
		{Name: "display_order", Type: SmallInt, Properties: "NOT NULL"},
	})

var personsTable = NewTable("persons", "uuid", UUID,
	[]Column{
		{Name: "first_name", Type: SmallText, Properties: "NOT NULL"},
		{Name: "middle_name", Type: SmallText, Properties: "NOT NULL"},
		{Name: "last_name", Type: SmallText, Properties: "NOT NULL"},
		{Name: "phone", Type: SmallText, Properties: "NOT NULL DEFAULT ''"},
		{Name: "email", Type: SmallText, Properties: "NOT NULL DEFAULT ''"},
		{Name: "remarks", Type: BigText, Properties: "NOT NULL DEFAULT ''"},
	})

// TODO: currently the table has an index of uuid. But this is not necessary as
// person_uuid + log_uuid together can function as an index (also unique). But
// current setup doesn't allow that as-is. For now the uuid is just generated on
// the fly and then never used again.
var personToLogTable = NewTable("person_to_log", "uuid", UUID,
	[]Column{
		{Name: "person_uuid", Type: UUID, Properties: "NOT NULL"},
		{Name: "log_uuid", Type: UUID, Properties: "NOT NULL"},
		{Name: "role", Type: SmallText, Properties: "NOT NULL"},
	})

var logbookView = NewView("logbook_view",
	SQLQuery{
		SQLite: `
			SELECT uuid, date, 
				substr(date,7,4) || substr(date,4,2) || substr(date,0,3) as m_date, 
				departure_place, departure_time, arrival_place, arrival_time, 
				aircraft_model, reg_name, se_time, me_time, mcc_time, total_time, 
				iif(day_landings='',0,day_landings) as day_landings, 
				iif(night_landings='',0,night_landings) as night_landings,
				night_time, ifr_time, pic_time, co_pilot_time, dual_time, 
				instructor_time, sim_type, sim_time, pic_name, remarks,
				IFNULL(distance, 0) distance, track, IFNULL(custom_fields, '{}') as custom_fields,
				CASE WHEN track IS NULL THEN 0 ELSE 1 END AS has_track,
				IFNULL(ac.cnt, 0) AS attachments_count,
				IFNULL(tags, '') AS tags, IFNULL(signature, '') AS signature
			FROM logbook
			LEFT JOIN (
  				SELECT record_id, COUNT(*) AS cnt FROM attachments GROUP BY record_id
			) ac ON ac.record_id = logbook.uuid;
			`,
		MySQL: `
			SELECT uuid, date, 
				CONCAT(SUBSTRING(date,7,4), SUBSTRING(date,4,2), SUBSTRING(date,1,2)) as m_date, 
				departure_place, departure_time, arrival_place, arrival_time, 
				aircraft_model, reg_name, se_time, me_time, mcc_time, total_time,
				IF(day_landings='',0,day_landings) as day_landings, 
				IF(night_landings='',0,night_landings) as night_landings,
				night_time, ifr_time, pic_time, co_pilot_time, dual_time, 
				instructor_time, sim_type, sim_time, pic_name, remarks,
				IFNULL(distance, 0) distance, track, IFNULL(custom_fields, '{}') as custom_fields,
				CASE WHEN track IS NULL THEN 0 ELSE 1 END AS has_track,
				IFNULL(ac.cnt, 0) AS attachments_count,
				IFNULL(tags, '') AS tags, IFNULL(signature, '') AS signature
			FROM logbook
			LEFT JOIN (
  				SELECT record_id, COUNT(*) AS cnt FROM attachments GROUP BY record_id
			) ac ON ac.record_id = logbook.uuid;
		`,
	},
)

var airportsView = NewView("airports_view",
	SQLQuery{
		SQLite: `
			SELECT icao, iata, name, city, country, elevation, lat, lon FROM airports
			UNION
			SELECT UPPER(name) as icao, UPPER(name) as iata, name, city, country, elevation, lat, lon FROM airports_custom
			`,
		MySQL: `
			SELECT icao, iata, name, city, country, elevation, lat, lon FROM airports
			UNION
			SELECT UPPER(name) as icao, UPPER(name) as iata, name, city, country, elevation, lat, lon FROM airports_custom
			`,
	},
)

var aircraftsView = NewView("aircrafts_view",
	SQLQuery{
		SQLite: `SELECT
					a.reg_name,
					a.aircraft_model,
					TRIM(
						TRIM(
							IFNULL(ac.categories, '')
						) ||
						CASE
							WHEN ac.categories IS NOT NULL AND ac.categories <> ''
								AND a.custom_categories <> '' THEN ', ' || a.custom_categories
							WHEN (ac.categories IS NULL OR ac.categories = '')
								AND a.custom_categories <> '' THEN a.custom_categories
							ELSE ''
						END
					) AS categories,
					IFNULL(ac.categories,'') AS model_categories,
					a.custom_categories
				FROM aircrafts a
				LEFT JOIN aircraft_categories ac ON a.aircraft_model = ac.model
				ORDER BY a.aircraft_model, a.reg_name`,
		MySQL: `SELECT 
					a.reg_name,
					a.aircraft_model,
					TRIM(
						CONCAT(
							IFNULL(ac.categories, ''),
							CASE
								WHEN ac.categories IS NOT NULL AND ac.categories <> ''
									AND a.custom_categories <> '' THEN CONCAT(', ', a.custom_categories)
								WHEN (ac.categories IS NULL OR ac.categories = '')
									AND a.custom_categories <> '' THEN a.custom_categories
								ELSE ''
							END
						)
					) AS categories,
					IFNULL(ac.categories,'') AS model_categories,
					a.custom_categories
				FROM aircrafts a
				LEFT JOIN aircraft_categories ac ON a.aircraft_model = ac.model
				ORDER BY a.aircraft_model, a.reg_name`,
	},
)
