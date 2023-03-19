package main

import (
	"flag"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/alexedwards/scs/v2"
	"github.com/vsimakhin/web-logbook/internal/driver"
	"github.com/vsimakhin/web-logbook/internal/models"
)

const version = "2.16.0"

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
	warningLog    *log.Logger
	templateCache map[string]*template.Template
	version       string
	db            models.DBModel
	session       *scs.SessionManager
	isAuthEnabled bool
	isNewVersion  bool
}

func (app *application) serve() error {
	srv := &http.Server{
		Addr:     fmt.Sprintf(":%d", app.config.port),
		Handler:  http.Handler(app.routes()),
		ErrorLog: app.errorLog,
	}

	app.infoLog.Printf("Web Logbook %s is ready on http://localhost:%d\n", version, app.config.port)

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

	// create multilog writer
	logf, err := os.OpenFile("weblogbook-output.log", os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0666)
	if err != nil {
		fmt.Printf("error opening file: %v\n", err)
	}
	defer logf.Close()
	multilog := io.MultiWriter(logf, os.Stdout)

	infoLog := log.New(multilog, "INFO\t", log.Ldate|log.Ltime)
	errorLog := log.New(multilog, "ERROR\t", log.Ldate|log.Ltime|log.Lshortfile)
	warningLog := log.New(multilog, "WARNING\t", log.Ldate|log.Ltime)

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
		warningLog:    warningLog,
		templateCache: tc,
		version:       version,
		db:            models.DBModel{DB: conn},
		session:       session,
	}

	if disableAuth {
		err := app.db.DisableAuthorization()
		if err != nil {
			app.errorLog.Println(err)
		}
		app.warningLog.Println("authentication has been disabled")
		os.Exit(0)
	}

	go app.db.CreateDistanceCache()
	app.isAuthEnabled = app.db.IsAuthEnabled()

	go app.checkNewVersion()

	err = app.serve()
	if err != nil {
		app.errorLog.Fatalln(err)
	}
}
