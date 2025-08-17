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
