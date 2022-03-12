package main

import (
	"html/template"
	"log"
	"os"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/alexedwards/scs/v2"
	"github.com/vsimakhin/web-logbook/internal/models"
)

func initTestApp() *application {
	cfg := config{
		port: 4000,
		env:  "prod",
	}

	infoLog := log.New(os.Stdout, "INFO\t", log.Ldate|log.Ltime)
	errorLog := log.New(os.Stdout, "ERROR\t", log.Ldate|log.Ltime|log.Lshortfile)

	tc := make(map[string]*template.Template)

	db, mock, err := sqlmock.New()
	if err != nil {
		errorLog.Panicf("an error '%s' was not expected when opening a stub database connection", err)
	}

	// init mock from models package
	models.InitMock(mock)

	// set up session
	session = scs.New()
	session.Lifetime = 12 * time.Hour

	app := &application{
		config:        cfg,
		infoLog:       infoLog,
		errorLog:      errorLog,
		templateCache: tc,
		version:       version,
		db:            models.DBModel{DB: db},
		session:       session,
		isAuthEnabled: false,
	}

	return app
}
