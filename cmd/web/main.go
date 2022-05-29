package main

import (
	"flag"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/alexedwards/scs/v2"
	"github.com/vsimakhin/web-logbook/internal/driver"
	"github.com/vsimakhin/web-logbook/internal/models"
)

const version = "2.0.0"

type config struct {
	port int
	env  string
	db   struct {
		dsn string
	}
}

type application struct {
	config        config
	infoLog       *log.Logger
	errorLog      *log.Logger
	templateCache map[string]*template.Template
	version       string
	db            models.DBModel
	session       *scs.SessionManager
	isAuthEnabled bool
}

func (app *application) serve() error {
	srv := &http.Server{
		Addr:     fmt.Sprintf(":%d", app.config.port),
		Handler:  http.Handler(app.routes()),
		ErrorLog: app.errorLog,
	}

	app.infoLog.Printf("Web Logbook is ready on http://localhost:%d\n", app.config.port)

	return srv.ListenAndServe()
}

func main() {
	var cfg config
	var err error
	var isPrintVersion bool
	var disableAuth bool

	flag.IntVar(&cfg.port, "port", 4000, "Server port")
	flag.StringVar(&cfg.env, "env", "prod", "Environment {dev|prod}")
	flag.StringVar(&cfg.db.dsn, "dsn", "web-logbook.sql", "SQLite file name")
	flag.BoolVar(&isPrintVersion, "version", false, "Prints current version")
	flag.BoolVar(&disableAuth, "disable-authentication", false, "Disable authentication (in case you forgot login credentials)")
	flag.Parse()

	if isPrintVersion {
		fmt.Printf("Web-logbook Version %s\n", version)
		os.Exit(0)
	}

	infoLog := log.New(os.Stdout, "INFO\t", log.Ldate|log.Ltime)
	errorLog := log.New(os.Stdout, "ERROR\t", log.Ldate|log.Ltime|log.Lshortfile)

	tc := make(map[string]*template.Template)

	conn, err := driver.OpenDB(cfg.db.dsn)
	if err != nil {
		errorLog.Fatalln(err)
	}
	defer conn.Close()

	// set up session
	session = scs.New()
	session.Lifetime = 12 * time.Hour

	app := &application{
		config:        cfg,
		infoLog:       infoLog,
		errorLog:      errorLog,
		templateCache: tc,
		version:       version,
		db:            models.DBModel{DB: conn},
		session:       session,
	}

	if disableAuth {
		err := app.db.DisableAuthorization()
		if err != nil {
			app.errorLog.Panicln(err)
		}
		fmt.Println("authentication has been disabled")
		os.Exit(0)
	}

	go app.db.CreateDistanceCache()
	app.isAuthEnabled = app.db.IsAuthEnabled()

	err = app.serve()
	if err != nil {
		app.errorLog.Fatalln(err)
	}
}
