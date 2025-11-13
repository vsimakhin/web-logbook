package main

import (
	"crypto/tls"
	"database/sql"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/vsimakhin/web-logbook/internal/driver"
	"github.com/vsimakhin/web-logbook/internal/models"
)

const (
	version = "3.17.0"

	infoLogPrefix    = "INFO\t"
	errorLogPrefix   = "ERROR\t"
	warningLogPrefix = "WARNING\t"
)

type config struct {
	url  string
	port int
	env  string
	db   struct {
		engine string
		dsn    string
	}
	tls struct {
		enabled bool
		key     string
		crt     string
	}
}

type application struct {
	config               config
	infoLog              *log.Logger
	errorLog             *log.Logger
	warningLog           *log.Logger
	version              string
	db                   models.DBModel
	timeFieldsAutoFormat byte
}

func (app *application) serve() error {

	srv := &http.Server{
		Addr:     fmt.Sprintf("%s:%d", app.config.url, app.config.port),
		Handler:  http.Handler(app.routes()),
		ErrorLog: app.errorLog,
		TLSConfig: &tls.Config{
			NextProtos: []string{"h2", "http/1.1"},
		},
	}

	url := app.config.url
	if url == "" {
		url = "localhost"
	}
	msg := fmt.Sprintf("Web Logbook v%s is ready on %s://%s:%d\n", version, "%s", url, app.config.port)
	if app.config.tls.enabled {
		app.infoLog.Printf(msg, "https")
		return srv.ListenAndServeTLS(app.config.tls.crt, app.config.tls.key)

	} else {
		app.infoLog.Printf(msg, "http")
		return srv.ListenAndServe()

	}
}

func parseFlags() (config, bool, bool) {
	var cfg config
	var isPrintVersion bool
	var disableAuth bool

	flag.StringVar(&cfg.url, "url", "", "Server URL (default empty - the app will listen on all network interfaces)")
	flag.IntVar(&cfg.port, "port", 4000, "Server port")
	flag.StringVar(&cfg.env, "env", "prod", "Environment {dev|prod}")
	flag.StringVar(&cfg.db.engine, "engine", "sqlite", "Database engine {sqlite|mysql}")
	flag.StringVar(&cfg.db.dsn, "dsn", "web-logbook.sql", "Data source name {sqlite: file path|mysql: user:password@protocol(address)/dbname?param=value}")
	flag.BoolVar(&isPrintVersion, "version", false, "Prints current version")
	flag.BoolVar(&disableAuth, "disable-authentication", false, "Disable authentication (in case you forgot login credentials)")
	flag.BoolVar(&cfg.tls.enabled, "enable-https", false, "Enable TLS/HTTPS")
	flag.StringVar(&cfg.tls.key, "key", "certs/localhost-key.pem", "private key path")
	flag.StringVar(&cfg.tls.crt, "cert", "certs/localhost.pem", "certificate path")
	flag.Parse()

	return cfg, isPrintVersion, disableAuth
}

func setupLogger() (*os.File, *log.Logger, *log.Logger, *log.Logger, error) {
	logf, err := os.OpenFile("weblogbook-output.log", os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0666)
	if err != nil {
		return nil, nil, nil, nil, fmt.Errorf("error opening file: %v", err)
	}
	multilog := io.MultiWriter(logf, os.Stdout)

	infoLog := log.New(multilog, infoLogPrefix, log.Ldate|log.Ltime)
	errorLog := log.New(multilog, errorLogPrefix, log.Ldate|log.Ltime|log.Lshortfile)
	warningLog := log.New(multilog, warningLogPrefix, log.Ldate|log.Ltime)

	return logf, infoLog, errorLog, warningLog, nil
}

func createDBConnection(engine string, dsn string) (*sql.DB, error) {
	conn, err := driver.OpenDB(engine, dsn)
	if err != nil {
		return nil, err
	}
	return conn, nil
}

func main() {
	var err error

	cfg, isPrintVersion, disableAuth := parseFlags()

	if isPrintVersion {
		fmt.Printf("Web-logbook Version %s\n", version)
		os.Exit(0)
	}

	// configure logging
	logf, infoLog, errorLog, warningLog, err := setupLogger()
	if err != nil {
		fmt.Printf("Failed to setup logger: %v\n", err)
		os.Exit(1)
	}
	defer logf.Close()

	// create db connection
	conn, err := createDBConnection(cfg.db.engine, cfg.db.dsn)
	if err != nil {
		errorLog.Fatalln(err)
	}
	defer conn.Close()

	app := &application{
		config:     cfg,
		infoLog:    infoLog,
		errorLog:   errorLog,
		warningLog: warningLog,
		version:    version,
		db:         models.DBModel{DB: conn},
	}

	// check if we need to disable authentication
	if disableAuth {
		err := app.db.DisableAuthorization()
		if err != nil {
			app.errorLog.Println(err)
		}
		app.warningLog.Println("authentication has been disabled")
		os.Exit(0)
	}

	// check defaults
	err = app.db.CheckDefaultValues()
	if err != nil {
		app.errorLog.Printf("error checking default values - %s\n", err)
		// but probably let's continue to run the app...
	}

	// check airport db
	count, err := app.db.GetAirportDBRecordsCount()
	if err != nil {
		app.errorLog.Printf("error checking airport db - %s\n", err)
		return
	}
	if count == 0 {
		app.infoLog.Println("no records in the airport db, updating...")
		airports, err := app.downloadAirportDB("")
		if err != nil {
			app.errorLog.Printf("error downloading airport db - %s\n", err)
			return
		}
		app.infoLog.Printf("downloaded %d records\n", len(airports))

		err = app.db.UpdateAirportDB(airports, false)
		if err != nil {
			app.errorLog.Printf("error updating airport db - %s\n", err)
			return
		}
		app.infoLog.Println("airport db has been updated")
	}

	// check settings
	settings, err := app.db.GetSettings()
	if err != nil {
		app.errorLog.Printf("cannot load settings - %s\n", err)
		return
	}
	app.timeFieldsAutoFormat = settings.TimeFieldsAutoFormat

	// create distance cache on background
	go app.db.CreateDistanceCache()

	// calculate distance for the records that don't have it
	// this is needed for the first run or if some records were imported
	app.db.UpdateFlightRecordsDistance()

	// main app
	err = app.serve()
	if err == http.ErrServerClosed {
		app.infoLog.Println("Bye! :)")
	} else {
		app.errorLog.Fatalln(err)
	}
}
