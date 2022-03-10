package main

import (
	"encoding/json"
	"net/http"

	"github.com/vsimakhin/web-logbook/internal/models"
)

// Auth checks for user authentication status
func (app *application) Auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

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
	if app.config.env == "dev" {
		app.infoLog.Println(APILogin)
	}

	if err := app.renderTemplate(w, r, "login", &templateData{}); err != nil {
		app.errorLog.Print(err)
	}
}

// LoginPagePost handles the authentication
func (app *application) HandlerLoginPost(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println(APILogin)
	}

	err := app.session.RenewToken(r.Context())
	if err != nil {
		app.errorLog.Panicln(err)
	}

	var user struct {
		Login    string `json:"login"`
		Password string `json:"password"`
	}
	var response models.JSONResponse

	err = json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		app.errorLog.Panicln(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	err = app.db.Authenticate(user.Login, user.Password)
	if err != nil {
		app.errorLog.Println(err)
		response.OK = false
		response.Message = err.Error()

		err = app.writeJSON(w, http.StatusForbidden, response)
		if err != nil {
			app.errorLog.Println(err)
			return
		}
	} else {

		app.session.Put(r.Context(), "token", app.session.Token(r.Context()))
		response.OK = true
		response.RedirectURL = "/logbook"
		err = app.writeJSON(w, http.StatusOK, response)
		if err != nil {
			app.errorLog.Println(err)
			return
		}
	}
}

// Logout logs the user out
func (app *application) HandlerLogout(w http.ResponseWriter, r *http.Request) {
	if app.config.env == "dev" {
		app.infoLog.Println(APILogout)
	}

	err := app.session.Destroy(r.Context())
	if err != nil {
		app.errorLog.Panicln(err)
	}
	err = app.session.RenewToken(r.Context())
	if err != nil {
		app.errorLog.Panicln(err)
	}

	http.Redirect(w, r, "/login", http.StatusSeeOther)
}
