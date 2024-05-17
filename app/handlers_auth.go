package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/vsimakhin/web-logbook/internal/models"
)

// Auth checks for user authentication status
func (app *application) Auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", strings.Join(r.Header["Origin"], ","))
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if app.isAuthEnabled {
			if !app.session.Exists(r.Context(), "token") {
				http.Redirect(w, r, "/login", http.StatusSeeOther)
				return
			}
		}

		next.ServeHTTP(w, r)
	})
}

// LoginPage displays the login page
func (app *application) HandlerLogin(w http.ResponseWriter, r *http.Request) {
	if err := app.renderTemplate(w, r, "login", &templateData{}); err != nil {
		app.errorLog.Print(err)
	}
}

type LoginAttempts struct {
	failedAttempts int
	nextAttempt    int64
}

var loginAttempts = make(map[string]LoginAttempts)

// LoginPagePost handles the authentication
func (app *application) HandlerLoginPost(w http.ResponseWriter, r *http.Request) {
	var response models.JSONResponse

	w.Header().Set("Access-Control-Allow-Origin", strings.Join(r.Header["Origin"], ","))
	w.Header().Set("Access-Control-Allow-Credentials", "true")

	// check if ip already in the loginAttempts
	ip := strings.Split(r.RemoteAddr, ":")[0]
	if _, ok := loginAttempts[ip]; !ok {
		loginAttempts[ip] = LoginAttempts{0, time.Now().Unix()}
	}

	if loginAttempts[ip].failedAttempts >= 5 {
		if time.Now().Unix() < loginAttempts[ip].nextAttempt {
			app.warningLog.Printf("There were to many failed login attempts from %s, declining requests", ip)

			response.OK = false
			response.Message = "Too many failed login attempts"
			app.writeJSON(w, http.StatusForbidden, response)
			return
		}
	}

	err := app.session.RenewToken(r.Context())
	if err != nil {
		app.errorLog.Println(fmt.Errorf("cannot renew auth token - %s", err))
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	var user struct {
		Login    string `json:"login"`
		Password string `json:"password"`
	}

	err = json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		app.errorLog.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = app.db.Authenticate(user.Login, user.Password)
	if err != nil {
		loginAttempts[ip] = LoginAttempts{
			loginAttempts[ip].failedAttempts + 1,
			time.Now().Unix() + int64(loginAttempts[ip].failedAttempts*10),
		}

		app.warningLog.Println(err)
		response.OK = false
		response.Message = err.Error()

		app.writeJSON(w, http.StatusForbidden, response)
	} else {
		// reset failed attempts
		loginAttempts[ip] = LoginAttempts{0, time.Now().Unix()}

		app.session.Put(r.Context(), "token", app.session.Token(r.Context()))
		response.OK = true
		response.RedirectURL = "/logbook"
		app.writeJSON(w, http.StatusOK, response)
	}
}

// Logout logs the user out
func (app *application) HandlerLogout(w http.ResponseWriter, r *http.Request) {

	err := app.session.Destroy(r.Context())
	if err != nil {
		app.errorLog.Println(fmt.Errorf("cannot destroy the user session - %s", err))
	}
	err = app.session.RenewToken(r.Context())
	if err != nil {
		app.errorLog.Println(fmt.Errorf("cannot renew the auth token - %s", err))
	}

	http.Redirect(w, r, "/login", http.StatusSeeOther)
}
