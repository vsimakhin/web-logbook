package driver

var (
	schemaVersion = "37"

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
			WITH base AS (
				SELECT
					uuid,
					date,
					ROW_NUMBER() OVER (ORDER BY substr(date,7,4) || substr(date,4,2) || substr(date,0,3), departure_time) AS rn,
					substr(date,7,4) || substr(date,4,2) || substr(date,0,3) as m_date,
					departure_place, departure_time, arrival_place, arrival_time,
					aircraft_model, reg_name, se_time, me_time, mcc_time, total_time,
					iif(day_landings='',0,day_landings) as day_landings,
					iif(night_landings='',0,night_landings) as night_landings,
					night_time, ifr_time, pic_time, co_pilot_time, dual_time,
					instructor_time, sim_type, sim_time, pic_name, remarks,
					IFNULL(distance, 0) distance,
					track,
					IFNULL(custom_fields, '{}') as custom_fields,
					CASE WHEN track IS NULL THEN 0 ELSE 1 END AS has_track,
					IFNULL(ac.cnt, 0) AS attachments_count,
					IFNULL(tags, '') AS tags, IFNULL(signature, '') AS signature
				FROM logbook
				LEFT JOIN (
					SELECT record_id, COUNT(*) AS cnt FROM attachments GROUP BY record_id
				) ac ON ac.record_id = logbook.uuid
			)
			SELECT
				*,
				IFNULL(LAG(uuid) OVER (ORDER BY m_date, departure_time), '') AS prev_uuid,
				IFNULL(LEAD(uuid) OVER (ORDER BY m_date, departure_time), '') AS next_uuid
			FROM base
			`,
		MySQL: `
			WITH base AS (
				SELECT
					uuid,
					date,
					ROW_NUMBER() OVER (ORDER BY CONCAT(SUBSTRING(date, 7, 4),SUBSTRING(date, 4, 2),SUBSTRING(date, 1, 2),departure_time)) AS rn,
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
				) ac ON ac.record_id = logbook.uuid
			)
			SELECT
				*,
				IFNULL(LAG(uuid) OVER (ORDER BY m_date, departure_time), '') AS prev_uuid,
				IFNULL(LEAD(uuid) OVER (ORDER BY m_date, departure_time), '') AS next_uuid
			FROM base
		`,
	},
)

var logbookStatsView = NewView("logbook_stats_view",
	SQLQuery{
		SQLite: `
			WITH base AS (
				SELECT
					uuid,
					ROW_NUMBER() OVER (ORDER BY substr(date,7,4) || substr(date,4,2) || substr(date,0,3), departure_time) AS rn,
					date,
					substr(date,7,4) || '-' || substr(date,4,2) || '-' || substr(date,1,2) AS date_iso,
					substr(date,7,4) || substr(date,4,2) || substr(date,0,3) as m_date,
					departure_place,
					departure_time,
					arrival_place,
					arrival_time,
					CASE
						WHEN departure_time IS NULL OR departure_time = '' OR length(departure_time) != 4
						THEN datetime(
							substr(date,7,4) || '-' || substr(date,4,2) || '-' || substr(date,1,2) || ' 00:00'
						)
						ELSE datetime(
							substr(date,7,4) || '-' || substr(date,4,2) || '-' || substr(date,1,2)
							|| ' ' || substr(departure_time,1,2) || ':' || substr(departure_time,3,2)
						)
					END AS departure_dt,
					CASE
						WHEN arrival_time IS NULL OR arrival_time = '' OR length(arrival_time) != 4
						THEN datetime(
							substr(date,7,4) || '-' || substr(date,4,2) || '-' || substr(date,1,2) || ' 00:00'
							)
						ELSE datetime(
							substr(date,7,4) || '-' || substr(date,4,2) || '-' || substr(date,1,2)
							|| ' ' || substr(arrival_time,1,2) || ':' || substr(arrival_time,3,2),
							CASE
								WHEN departure_time IS NOT NULL
									AND departure_time != ''
									AND arrival_time < departure_time
								THEN '+1 day'
								ELSE '0 day'
							END
						)
					END AS arrival_dt,
					aircraft_model,
					reg_name,
					se_time,
					CAST(
						CASE
							WHEN se_time IS NULL OR se_time = '' OR instr(se_time, ':') = 0
							THEN 0
							ELSE CAST(substr(se_time,1,instr(se_time,':')-1) AS INTEGER) * 60
								+ CAST(substr(se_time,instr(se_time,':')+1) AS INTEGER)
						END AS INTEGER
					) AS se_time_m,
					me_time,
					CAST(
						CASE
							WHEN me_time IS NULL OR me_time = '' OR instr(me_time, ':') = 0
							THEN 0
							ELSE CAST(substr(me_time,1,instr(me_time,':')-1) AS INTEGER) * 60
								+ CAST(substr(me_time,instr(me_time,':')+1) AS INTEGER)
						END AS INTEGER
					) AS me_time_m,
					mcc_time,
					CAST(
						CASE
							WHEN mcc_time IS NULL OR mcc_time = '' OR instr(mcc_time, ':') = 0
							THEN 0
							ELSE CAST(substr(mcc_time,1,instr(mcc_time,':')-1) AS INTEGER) * 60
								+ CAST(substr(mcc_time,instr(mcc_time,':')+1) AS INTEGER)
						END AS INTEGER
					) AS mcc_time_m,
					total_time,
					CAST(
						CASE
							WHEN total_time IS NULL OR total_time = '' OR instr(total_time, ':') = 0
							THEN 0
							ELSE CAST(substr(total_time,1,instr(total_time,':')-1) AS INTEGER) * 60
								+ CAST(substr(total_time,instr(total_time,':')+1) AS INTEGER)
						END AS INTEGER
					) AS total_time_m,
					iif(day_landings='',0,day_landings) as day_landings, 
					iif(night_landings='',0,night_landings) as night_landings,
					night_time,
					CAST(
						CASE
							WHEN night_time IS NULL OR night_time = '' OR instr(night_time, ':') = 0
							THEN 0
							ELSE CAST(substr(night_time,1,instr(night_time,':')-1) AS INTEGER) * 60
								+ CAST(substr(night_time,instr(night_time,':')+1) AS INTEGER)
						END AS INTEGER
					) AS night_time_m,
					ifr_time,
					CAST(
						CASE
							WHEN ifr_time IS NULL OR ifr_time = '' OR instr(ifr_time, ':') = 0
							THEN 0
							ELSE CAST(substr(ifr_time,1,instr(ifr_time,':')-1) AS INTEGER) * 60
								+ CAST(substr(ifr_time,instr(ifr_time,':')+1) AS INTEGER)
						END AS INTEGER
					) AS ifr_time_m,
					pic_time,
					CAST(
						CASE
							WHEN pic_time IS NULL OR pic_time = '' OR instr(pic_time, ':') = 0
							THEN 0
							ELSE CAST(substr(pic_time,1,instr(pic_time,':')-1) AS INTEGER) * 60
								+ CAST(substr(pic_time,instr(pic_time,':')+1) AS INTEGER)
						END AS INTEGER
					) AS pic_time_m,
					co_pilot_time,
					CAST(
						CASE
							WHEN co_pilot_time IS NULL OR co_pilot_time = '' OR instr(co_pilot_time, ':') = 0
							THEN 0
							ELSE CAST(substr(co_pilot_time,1,instr(co_pilot_time,':')-1) AS INTEGER) * 60
								+ CAST(substr(co_pilot_time,instr(co_pilot_time,':')+1) AS INTEGER)
						END AS INTEGER
					) AS co_pilot_time_m,
					dual_time,
					CAST(
						CASE
							WHEN dual_time IS NULL OR dual_time = '' OR instr(dual_time, ':') = 0
							THEN 0
							ELSE CAST(substr(dual_time,1,instr(dual_time,':')-1) AS INTEGER) * 60
								+ CAST(substr(dual_time,instr(dual_time,':')+1) AS INTEGER)
						END AS INTEGER
					) AS dual_time_m,
					instructor_time,
					CAST(
						CASE
							WHEN instructor_time IS NULL OR instructor_time = '' OR instr(instructor_time, ':') = 0
							THEN 0
							ELSE CAST(substr(instructor_time,1,instr(instructor_time,':')-1) AS INTEGER) * 60
								+ CAST(substr(instructor_time,instr(instructor_time,':')+1) AS INTEGER)
						END AS INTEGER
					) AS instructor_time_m,
					sim_type,
					sim_time,
					CAST(
						CASE
							WHEN sim_time IS NULL OR sim_time = '' OR instr(sim_time, ':') = 0
							THEN 0
							ELSE CAST(substr(sim_time,1,instr(sim_time,':')-1) AS INTEGER) * 60
								+ CAST(substr(sim_time,instr(sim_time,':')+1) AS INTEGER)
						END AS INTEGER
					) AS sim_time_m,
					pic_name,
					remarks,
					IFNULL(distance, 0) distance,
					track,
					IFNULL(custom_fields, '{}') as custom_fields,
					CASE WHEN track IS NULL THEN 0 ELSE 1 END AS has_track,
					IFNULL(ac.cnt, 0) AS attachments_count,
					IFNULL(tags, '') AS tags,
					IFNULL(signature, '') AS signature
				FROM logbook
				LEFT JOIN (
					SELECT record_id, COUNT(*) AS cnt
					FROM attachments
					GROUP BY record_id
				) ac ON ac.record_id = logbook.uuid
			)
			SELECT
				*,
				IFNULL(LAG(uuid) OVER (ORDER BY m_date, departure_time), '') AS prev_uuid,
				IFNULL(LEAD(uuid) OVER (ORDER BY m_date, departure_time), '') AS next_uuid
			FROM base
			`,
		MySQL: `
			WITH base AS (
				SELECT
					l.uuid,
					ROW_NUMBER() OVER (ORDER BY CONCAT(SUBSTRING(l.date, 7, 4),SUBSTRING(l.date, 4, 2),SUBSTRING(l.date, 1, 2),departure_time)) AS rn,
					l.date,
					CASE
						WHEN l.date IS NULL OR l.date = ''
						THEN NULL
						ELSE STR_TO_DATE(l.date, '%d/%m/%Y')
					END AS date_iso,
					CONCAT(
						SUBSTRING(l.date, 7, 4),
						SUBSTRING(l.date, 4, 2),
						SUBSTRING(l.date, 1, 2)
					) AS m_date,
					l.departure_place,
					l.departure_time,
					l.arrival_place,
					l.arrival_time,
					CASE
						WHEN l.departure_time IS NULL OR l.departure_time = '' OR CHAR_LENGTH(l.departure_time) != 4
						THEN STR_TO_DATE(
							CONCAT(
								SUBSTRING(l.date, 7, 4), '-',
								SUBSTRING(l.date, 4, 2), '-',
								SUBSTRING(l.date, 1, 2), ' ',
								'00:00'
							),
							'%Y-%m-%d %H:%i'
						)
						ELSE STR_TO_DATE(
							CONCAT(
								SUBSTRING(l.date, 7, 4), '-',
								SUBSTRING(l.date, 4, 2), '-',
								SUBSTRING(l.date, 1, 2), ' ',
								SUBSTRING(l.departure_time, 1, 2), ':',
								SUBSTRING(l.departure_time, 3, 2)
							),
							'%Y-%m-%d %H:%i'
						)
					END AS departure_dt,
					CASE
						WHEN l.arrival_time IS NULL OR l.arrival_time = '' OR CHAR_LENGTH(l.arrival_time) != 4
						THEN STR_TO_DATE(
							CONCAT(
								SUBSTRING(l.date, 7, 4), '-',
								SUBSTRING(l.date, 4, 2), '-',
								SUBSTRING(l.date, 1, 2), ' ',
								'00:00'
							),
							'%Y-%m-%d %H:%i'
						)
						ELSE DATE_ADD(
							STR_TO_DATE(
								CONCAT(
									SUBSTRING(l.date, 7, 4), '-',
									SUBSTRING(l.date, 4, 2), '-',
									SUBSTRING(l.date, 1, 2), ' ',
									SUBSTRING(l.arrival_time, 1, 2), ':',
									SUBSTRING(l.arrival_time, 3, 2)
								),
								'%Y-%m-%d %H:%i'
							),
							INTERVAL
							CASE
								WHEN l.departure_time IS NOT NULL AND l.departure_time != '' AND l.arrival_time < l.departure_time
								THEN 1 ELSE 0
							END DAY
						)
					END AS arrival_dt,
					l.aircraft_model,
					l.reg_name,
					l.se_time,
					CAST(
						CASE
							WHEN l.se_time IS NULL OR l.se_time = '' OR LOCATE(':', l.se_time) = 0
							THEN 0
							ELSE CAST(SUBSTRING_INDEX(l.se_time, ':', 1) AS UNSIGNED) * 60
								+ CAST(SUBSTRING_INDEX(l.se_time, ':', -1) AS UNSIGNED)
						END AS UNSIGNED
					) AS se_time_m,
					l.me_time,
					CAST(
						CASE
							WHEN l.me_time IS NULL OR l.me_time = '' OR LOCATE(':', l.me_time) = 0
							THEN 0
							ELSE CAST(SUBSTRING_INDEX(l.me_time, ':', 1) AS UNSIGNED) * 60
								+ CAST(SUBSTRING_INDEX(l.me_time, ':', -1) AS UNSIGNED)
						END AS UNSIGNED
					) AS me_time_m,
					l.mcc_time,
					CAST(
						CASE
							WHEN l.mcc_time IS NULL OR l.mcc_time = '' OR LOCATE(':', l.mcc_time) = 0
							THEN 0
							ELSE CAST(SUBSTRING_INDEX(l.mcc_time, ':', 1) AS UNSIGNED) * 60
								+ CAST(SUBSTRING_INDEX(l.mcc_time, ':', -1) AS UNSIGNED)
						END AS UNSIGNED
					) AS mcc_time_m,
					l.total_time,
					CAST(
						CASE
							WHEN l.total_time IS NULL OR l.total_time = '' OR LOCATE(':', l.total_time) = 0
							THEN 0
							ELSE CAST(SUBSTRING_INDEX(l.total_time, ':', 1) AS UNSIGNED) * 60
								+ CAST(SUBSTRING_INDEX(l.total_time, ':', -1) AS UNSIGNED)
						END AS UNSIGNED
					) AS total_time_m,
					IF(l.day_landings = '', 0, l.day_landings) AS day_landings,
					IF(l.night_landings = '', 0, l.night_landings) AS night_landings,
					l.night_time,
					CAST(
						CASE
							WHEN l.night_time IS NULL OR l.night_time = '' OR LOCATE(':', l.night_time) = 0
							THEN 0
							ELSE CAST(SUBSTRING_INDEX(l.night_time, ':', 1) AS UNSIGNED) * 60
								+ CAST(SUBSTRING_INDEX(l.night_time, ':', -1) AS UNSIGNED)
						END AS UNSIGNED
					) AS night_time_m,
					l.ifr_time,
					CAST(
						CASE
							WHEN l.ifr_time IS NULL OR l.ifr_time = '' OR LOCATE(':', l.ifr_time) = 0
							THEN 0
							ELSE CAST(SUBSTRING_INDEX(l.ifr_time, ':', 1) AS UNSIGNED) * 60
								+ CAST(SUBSTRING_INDEX(l.ifr_time, ':', -1) AS UNSIGNED)
						END AS UNSIGNED
					) AS ifr_time_m,
					l.pic_time,
					CAST(
						CASE
							WHEN l.pic_time IS NULL OR l.pic_time = '' OR LOCATE(':', l.pic_time) = 0
							THEN 0
							ELSE CAST(SUBSTRING_INDEX(l.pic_time, ':', 1) AS UNSIGNED) * 60
								+ CAST(SUBSTRING_INDEX(l.pic_time, ':', -1) AS UNSIGNED)
						END AS UNSIGNED
					) AS pic_time_m,
					l.co_pilot_time,
					CAST(
						CASE
							WHEN l.co_pilot_time IS NULL OR l.co_pilot_time = '' OR LOCATE(':', l.co_pilot_time) = 0
							THEN 0
							ELSE CAST(SUBSTRING_INDEX(l.co_pilot_time, ':', 1) AS UNSIGNED) * 60
								+ CAST(SUBSTRING_INDEX(l.co_pilot_time, ':', -1) AS UNSIGNED)
						END AS UNSIGNED
					) AS co_pilot_time_m,
					l.dual_time,
					CAST(
						CASE
							WHEN l.dual_time IS NULL OR l.dual_time = '' OR LOCATE(':', l.dual_time) = 0
							THEN 0
							ELSE CAST(SUBSTRING_INDEX(l.dual_time, ':', 1) AS UNSIGNED) * 60
								+ CAST(SUBSTRING_INDEX(l.dual_time, ':', -1) AS UNSIGNED)
						END AS UNSIGNED
					) AS dual_time_m,
					l.instructor_time,
					CAST(
						CASE
							WHEN l.instructor_time IS NULL OR l.instructor_time = '' OR LOCATE(':', l.instructor_time) = 0
							THEN 0
							ELSE CAST(SUBSTRING_INDEX(l.instructor_time, ':', 1) AS UNSIGNED) * 60
								+ CAST(SUBSTRING_INDEX(l.instructor_time, ':', -1) AS UNSIGNED)
						END AS UNSIGNED
					) AS instructor_time_m,
					l.sim_type,
					l.sim_time,
					CAST(
						CASE
							WHEN l.sim_time IS NULL OR l.sim_time = '' OR LOCATE(':', l.sim_time) = 0
							THEN 0
							ELSE CAST(SUBSTRING_INDEX(l.sim_time, ':', 1) AS UNSIGNED) * 60
								+ CAST(SUBSTRING_INDEX(l.sim_time, ':', -1) AS UNSIGNED)
						END AS UNSIGNED
					) AS sim_time_m,
					l.pic_name,
					l.remarks,
					IFNULL(l.distance, 0) AS distance,
					l.track,
					IFNULL(l.custom_fields, '{}') AS custom_fields,
					CASE WHEN l.track IS NULL THEN 0 ELSE 1 END AS has_track,
					IFNULL(ac.cnt, 0) AS attachments_count,
					IFNULL(l.tags, '') AS tags,
					IFNULL(l.signature, '') AS signature
				FROM logbook l
				LEFT JOIN (
					SELECT record_id, COUNT(*) AS cnt 
					FROM attachments
					GROUP BY record_id
				) ac ON ac.record_id = l.uuid
			)
			SELECT
				*,
				IFNULL(LAG(uuid) OVER (ORDER BY date_iso, departure_dt), '') AS prev_uuid,
				IFNULL(LEAD(uuid) OVER (ORDER BY date_iso, departure_dt), '') AS next_uuid
			FROM base
	`,
	})

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
