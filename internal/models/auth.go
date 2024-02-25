package models

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
)

// Authenticate checks the credentials
func (m *DBModel) Authenticate(login, password string) error {
	settings, err := m.GetSettings()
	if err != nil {
		return err
	}

	if settings.Login != login {
		return errors.New("invalid credentials")
	}

	err = bcrypt.CompareHashAndPassword([]byte(settings.Hash), []byte(password))
	if err == bcrypt.ErrMismatchedHashAndPassword {
		return errors.New("invalid credentials")
	} else if err != nil {
		return err
	}

	return nil
}

// DisableAuthorization reset the auth flag in the settings
func (m *DBModel) DisableAuthorization() error {
	settings, err := m.GetSettings()
	if err != nil {
		return err
	}

	settings.AuthEnabled = false

	err = m.UpdateSettings(settings)
	if err != nil {
		return err
	}

	return nil
}
