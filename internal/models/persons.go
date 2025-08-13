package models

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
