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
func (m *DBModel) fetchPersons(query string) (persons []Person, err error) {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	rows, err := m.DB.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

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
		return fmt.Errorf("Person-to-log record for person %s and log %s already exists", personToLog.PersonUUID, personToLog.LogUUID)
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
