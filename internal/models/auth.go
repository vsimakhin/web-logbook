package models

import (
	"errors"
	"sync"
	"time"

	"golang.org/x/crypto/bcrypt"
)

var authCache sync.Map

func (m *DBModel) GetSecretKey() (string, error) {
	id := "secretKey"
	if secretKey, ok := authCache.Load(id); ok {
		return secretKey.(string), nil
	}

	settings, err := m.GetSettings()
	if err != nil {
		return "", err
	}

	authCache.Store(id, settings.SecretKey)
	return settings.SecretKey, nil
}

func (m *DBModel) IsAuthEnabled() (bool, error) {
	id := "isAuthEnabled"
	if isAuthEnabled, ok := authCache.Load(id); ok {
		return isAuthEnabled.(bool), nil
	}

	settings, err := m.GetSettings()
	if err != nil {
		return false, err
	}

	authCache.Store(id, settings.AuthEnabled)
	return settings.AuthEnabled, nil
}

func (m *DBModel) VerifyToken(token string, username string) error {
	// checked cached token
	id := "token"
	if userToken, ok := authCache.Load(id); ok {
		if userToken == token {
			return nil
		}
	}

	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := "SELECT token FROM tokens WHERE username = ?"
	rows, err := m.DB.QueryContext(ctx, query, username)
	if err != nil {
		return errors.New("invalid token")
	}
	defer rows.Close()

	for rows.Next() {
		var userToken string
		if err = rows.Scan(&userToken); err != nil {
			return errors.New("invalid token")
		}

		if userToken == token {
			authCache.Store(id, token)
			return nil
		}
	}

	return errors.New("no valid token found")
}

// Authenticate checks the credentials
func (m *DBModel) Authenticate(login, password string) (string, error) {
	settings, err := m.GetSettings()
	if err != nil {
		return "", err
	}

	if settings.Login != login {
		return "", errors.New("invalid credentials")
	}

	err = bcrypt.CompareHashAndPassword([]byte(settings.Hash), []byte(password))
	if err == bcrypt.ErrMismatchedHashAndPassword {
		return "", errors.New("invalid credentials")
	} else if err != nil {
		return "", err
	}

	return settings.OwnerName, nil
}

func (m *DBModel) AddToken(token, username string) error {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := "INSERT INTO tokens (token, username, created_at) VALUES (?, ?, ?)"
	_, err := m.DB.ExecContext(ctx, query, token, username, time.Now().Format("2006-01-02 15:04:05"))
	if err != nil {
		return err
	}

	return nil
}

func (m *DBModel) DeleteToken(token string) error {
	ctx, cancel := m.ContextWithDefaultTimeout()
	defer cancel()

	query := "DELETE FROM tokens WHERE token = ?"
	_, err := m.DB.ExecContext(ctx, query, token)
	if err != nil {
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
