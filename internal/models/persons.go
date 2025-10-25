package models

import (
	"fmt"
)

// GetPersonsDBRecordsCount returns the number of records in the persons table
func (m *DBModel) GetPersonsDBRecordsCount() (count int, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	err = m.DB.QueryRowContext(ctx, "SELECT COUNT(*) FROM persons").Scan(&count)
	return count, nil
}

// fetchPersons is a helper function to fetch persons based on a query and a scan function
func (m *DBModel) fetchPersons(query string, params ...any) (persons []Person, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	rows, err := m.DB.QueryContext(ctx, query, params...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	persons = []Person{}
	for rows.Next() {
		var person Person
		if err = rows.Scan(&person.UUID, &person.FirstName, &person.MiddleName, &person.LastName); err != nil {
			return persons, err
		}
		persons = append(persons, person)
	}

	return persons, nil
}

// GetPersons returns all persons
func (m *DBModel) GetPersons() (persons []Person, err error) {
	query := "SELECT uuid, first_name, middle_name, last_name FROM persons"
	return m.fetchPersons(query)
}

func (m *DBModel) GetPersonById(uuid string) (person Person, err error) {
	query := "SELECT uuid, first_name, middle_name, last_name FROM persons WHERE uuid = ?"
	persons, err := m.fetchPersons(query, uuid)
	return persons[0], err
}

func (m *DBModel) GetPersonsForLog(logUuid string) (persons []PersonForLog, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := "SELECT p.uuid, p.first_name, p.middle_name, p.last_name, ptl.role FROM person_to_log AS ptl INNER JOIN persons as p ON ptl.person_uuid = p.uuid WHERE ptl.log_uuid = ?"
	rows, err := m.DB.QueryContext(ctx, query, logUuid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var person PersonForLog
		if err = rows.Scan(&person.UUID, &person.FirstName, &person.MiddleName, &person.LastName, &person.Role); err != nil {
			return persons, err
		}
		persons = append(persons, person)
	}

	return persons, nil
}

// AddPerson adds new person
func (m *DBModel) AddPerson(person Person) error {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	// check if person already exists
	query := "SELECT first_name, middle_name, last_name FROM persons WHERE first_name = ? AND middle_name = ? AND last_name = ?"
	row := m.DB.QueryRowContext(ctx, query, person.FirstName, person.MiddleName, person.LastName)
	if err := row.Scan(&person.FirstName, &person.MiddleName, &person.LastName); err == nil {
		return fmt.Errorf("Person %s %s %s already exists", person.FirstName, person.MiddleName, person.LastName)
	}

	query = `INSERT INTO persons (uuid, first_name, middle_name, last_name)
		VALUES (?, ?, ?, ?)`
	_, err := m.DB.ExecContext(ctx, query,
		person.UUID, person.FirstName, person.MiddleName, person.LastName,
	)

	if err != nil {
		return err
	}

	return nil
}

// UpdatePerson updates person
func (m *DBModel) UpdatePerson(person Person) error {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := "UPDATE persons SET first_name = ?, middle_name = ?, last_name = ? WHERE uuid = ?"
	_, err := m.DB.ExecContext(ctx, query, person.FirstName, person.MiddleName, person.LastName, person.UUID)
	return err
}

// AddPersonToLog adds new person-to-log record
func (m *DBModel) AddPersonToLog(personToLog PersonToLog) error {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	// check if person-to-log already exists
	query := "SELECT person_uuid, log_uuid FROM person_to_log WHERE person_uuid = ? AND log_uuid = ?"
	row := m.DB.QueryRowContext(ctx, query, personToLog.PersonUUID, personToLog.LogUUID)
	if err := row.Scan(&personToLog.PersonUUID, &personToLog.LogUUID); err == nil {
		return fmt.Errorf("person-to-log record for person %s and log %s already exists", personToLog.PersonUUID, personToLog.LogUUID)
	}

	query = `INSERT INTO person_to_log (uuid, person_uuid, log_uuid, role)
		VALUES (?, ?, ?, ?)`
	_, err := m.DB.ExecContext(ctx, query,
		personToLog.UUID, personToLog.PersonUUID, personToLog.LogUUID, personToLog.Role,
	)

	if err != nil {
		return err
	}

	return nil
}

// UpdatePersonToLog updates person-to-log record
func (m *DBModel) UpdatePersonToLog(personToLog PersonToLog) error {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := "UPDATE person_to_log SET role = ? WHERE log_uuid = ? AND person_uuid = ?"
	_, err := m.DB.ExecContext(ctx, query, personToLog.Role, personToLog.LogUUID, personToLog.PersonUUID)
	return err
}

// UpdatePersonToLog updates person-to-log record
func (m *DBModel) DeletePersonToLog(personToLog PersonToLog) (err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := "DELETE FROM person_to_log WHERE log_uuid = ? AND person_uuid = ?"
	_, err = m.DB.ExecContext(ctx, query, personToLog.LogUUID, personToLog.PersonUUID)
	return err
}

func (m *DBModel) GetFlightRecordsForPerson(personUuid string) (records []FlightRecordForPerson, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := `SELECT lb.uuid, ptl.role, lb.date, lb.m_date, lb.departure_place, lb.arrival_place,
			lb.aircraft_model, lb.reg_name, lb.sim_type
		FROM person_to_log AS ptl
		INNER JOIN logbook_view AS lb ON ptl.log_uuid = lb.uuid
		WHERE ptl.person_uuid = ?
		ORDER BY lb.m_date DESC`
	rows, err := m.DB.QueryContext(ctx, query, personUuid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var record FlightRecordForPerson
		if err = rows.Scan(&record.LogUUID, &record.Role, &record.Date, &record.MDate, &record.Departure, &record.Arrival, &record.Aircraft.Model, &record.Aircraft.Reg, &record.SimType); err != nil {
			return records, err
		}
		records = append(records, record)
	}

	return records, nil
}

// UpdatePersonToLog updates person-to-log record
func (m *DBModel) DeletePerson(uuid string) (err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	// Delete all references
	query := "DELETE FROM person_to_log WHERE person_uuid = ?"
	_, err = m.DB.ExecContext(ctx, query, uuid)

	if err != nil {
		return fmt.Errorf("error deleting references for person %s", uuid)
	}

	query = "DELETE FROM persons WHERE uuid = ?"
	_, err = m.DB.ExecContext(ctx, query, uuid)
	return err
}
