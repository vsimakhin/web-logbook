package main

import (
	"crypto/tls"
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

const version = "2.17.0"

type config struct {
	url  string
	port int
	env  string
	db   struct {
		dsn string
	}
	tls struct {
		enabled bool
		key     string
		crt     string
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
		TLSConfig: &tls.Config{
			NextProtos: []string{"h2", "http/1.1"},
		},
	}

	msg := fmt.Sprintf("Web Logbook v%s is ready on %s://%s:%d\n", version, "%s", app.config.url, app.config.port)
	if app.config.tls.enabled {
		app.infoLog.Printf(msg, "https")
		return srv.ListenAndServeTLS(app.config.tls.crt, app.config.tls.key)

	} else {
		app.infoLog.Printf(msg, "http")
		return srv.ListenAndServe()

	}
}

func main() {
	var cfg config
	var err error
	var isPrintVersion bool
	var disableAuth bool

	flag.StringVar(&cfg.url, "url", "localhost", "Server URL")
	flag.IntVar(&cfg.port, "port", 4000, "Server port")
	flag.StringVar(&cfg.env, "env", "prod", "Environment {dev|prod}")
	flag.StringVar(&cfg.db.dsn, "dsn", "web-logbook.sql", "SQLite file name")
	flag.BoolVar(&isPrintVersion, "version", false, "Prints current version")
	flag.BoolVar(&disableAuth, "disable-authentication", false, "Disable authentication (in case you forgot login credentials)")
	flag.BoolVar(&cfg.tls.enabled, "enable-https", false, "Enable TLS/HTTPS")
	flag.StringVar(&cfg.tls.key, "key", "certs/localhost-key.pem", "private key path")
	flag.StringVar(&cfg.tls.crt, "cert", "certs/localhost.pem", "certificate path")
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

	// check defaults
	err = app.db.CheckDefaultValues()
	if err != nil {
		app.errorLog.Printf("error checking default values - %s\n", err)
		// but probably let's continue to run the app...
	}

	// create distance cache ob background
	go app.db.CreateDistanceCache()
	app.isAuthEnabled = app.db.IsAuthEnabled()

	// check for the new version
	go app.checkNewVersion()

	// main app
	err = app.serve()
	if err == http.ErrServerClosed {
		app.infoLog.Println("Bye! :)")
	} else {
		app.errorLog.Fatalln(err)
	}
}
