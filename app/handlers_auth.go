package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type LoginAttempts struct {
	failedAttempts int
	nextAttempt    int64
}
type LoginResponse struct {
	Token string `json:"token"`
	Name  string `json:"username"`
}
type contextKey string

const userContextKey contextKey = "user"
const tokenContextKey contextKey = "token"
const authContextKey contextKey = "auth"

var loginAttempts = make(map[string]LoginAttempts)

func (app *application) createToken(username string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256,
		jwt.MapClaims{
			"username": username,
			"exp":      time.Now().Add(time.Hour * 24).Unix(),
		})

	secretKey, err := app.db.GetSecretKey()
	if err != nil {
		return "", err
	}

	tokenString, err := token.SignedString([]byte(secretKey))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func (app *application) verifyToken(tokenString string) error {
	secretKey, err := app.db.GetSecretKey()
	if err != nil {
		return err
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return []byte(secretKey), nil
	})
	if err != nil {
		return err
	}

	if !token.Valid {
		return fmt.Errorf("invalid token")
	}

	// check if the token has expired
	if claims, ok := token.Claims.(jwt.MapClaims); ok {
		if exp, ok := claims["exp"].(float64); ok {
			if time.Now().Unix() > int64(exp) {
				return fmt.Errorf("token has expired")
			}
		} else {
			return fmt.Errorf("exp claim is missing in token")
		}
	} else {
		return fmt.Errorf("invalid token claims")
	}

	return nil
}

func (app *application) extractUsernameFromToken(tokenString string) (string, error) {
	secretKey, err := app.db.GetSecretKey()
	if err != nil {
		return "", err
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secretKey), nil
	})

	if err != nil {
		return "", err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userID, ok := claims["username"].(string)
		if !ok {
			return "", errors.New("username not found in token")
		}
		return userID, nil
	}

	return "", errors.New("invalid token")
}

func (app *application) Auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// check if auth is enabled
		isAuthEnabled, err := app.db.IsAuthEnabled()
		if err != nil {
			app.handleError(w, err)
			return
		}
		if !isAuthEnabled {
			ctx := context.WithValue(r.Context(), authContextKey, false)
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		// ok, auth is enabled
		tokenString := r.Header.Get("Authorization")
		if tokenString == "" {
			http.Error(w, "Missing authorization header", http.StatusUnauthorized)
			return
		}
		tokenString = tokenString[len("Bearer "):]

		err = app.verifyToken(tokenString)
		if err != nil {
			app.errorLog.Println(err)
			app.writeErrorResponse(w, http.StatusUnauthorized, err.Error())
			return
		}

		userID, err := app.extractUsernameFromToken(tokenString)
		if err != nil {
			app.errorLog.Println(err)
			app.writeErrorResponse(w, http.StatusUnauthorized, err.Error())
			return
		}

		// check if the token is in the database
		err = app.db.VerifyToken(tokenString, userID)
		if err != nil {
			app.errorLog.Println(err)
			app.writeErrorResponse(w, http.StatusUnauthorized, err.Error())
			return
		}

		ctx := context.WithValue(r.Context(), userContextKey, userID)
		ctx = context.WithValue(ctx, tokenContextKey, tokenString)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// HandlerLogin logs the user in
func (app *application) HandlerLogin(w http.ResponseWriter, r *http.Request) {
	// check if ip already in the loginAttempts
	ip := strings.Split(r.RemoteAddr, ":")[0]
	if _, ok := loginAttempts[ip]; !ok {
		loginAttempts[ip] = LoginAttempts{0, time.Now().Unix()}
	}

	if loginAttempts[ip].failedAttempts >= 5 {
		if time.Now().Unix() < loginAttempts[ip].nextAttempt {
			app.warningLog.Printf("There were to many failed login attempts from %s, declining requests", ip)
			app.writeErrorResponse(w, http.StatusForbidden, "Too many failed login attempts")
			return
		}
	}

	var credentials struct {
		Login    string `json:"login"`
		Password string `json:"password"`
	}

	err := json.NewDecoder(r.Body).Decode(&credentials)
	if err != nil {
		app.handleError(w, err)
		return
	}

	username, err := app.db.Authenticate(credentials.Login, credentials.Password)
	if err != nil {
		loginAttempts[ip] = LoginAttempts{
			loginAttempts[ip].failedAttempts + 1,
			time.Now().Unix() + int64(loginAttempts[ip].failedAttempts*10),
		}

		app.warningLog.Println(err)
		app.writeErrorResponse(w, http.StatusForbidden, err.Error())
		return
	}

	// reset failed attempts
	loginAttempts[ip] = LoginAttempts{0, time.Now().Unix()}

	// set token
	token, err := app.createToken(credentials.Login)
	if err != nil {
		app.handleError(w, err)
	}

	if err = app.db.AddToken(token, credentials.Login); err != nil {
		app.handleError(w, err)
	}

	response := LoginResponse{
		Token: token,
		Name:  username,
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// Logout logs the user out
func (app *application) HandlerLogout(w http.ResponseWriter, r *http.Request) {
	// get current token from context and delete it from the database
	token := r.Context().Value(tokenContextKey).(string)
	if err := app.db.DeleteToken(token); err != nil {
		app.handleError(w, err)
	}

	http.Redirect(w, r, "/signin", http.StatusSeeOther)
}
