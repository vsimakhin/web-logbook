package main

import (
	"net/http"
	"regexp"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"
)

// API routes used by the unofficial iOS client built on top of the web-logbook API:
// https://github.com/vsimakhin/web-logbook/issues/578
//
// The route list comes from the client author's comment on that issue.
// If a test here fails, an endpoint the client depends on was removed, renamed
// or lost its authentication. Either revert the change, or update this list AND
// notify the client author (benbox69) in #578 before releasing.
//
// Path parameters are written as {} because only their position matters, not their name.
// Response formats the client also relies on (not covered here):
//   - {"ok", "message", "data"} for logbook, licensing and aircraft writes
//   - a plain JSON string for /currency writes
//   - base64 documents inside JSON for attachments and licenses

type clientRoute struct {
	method string
	path   string
}

var iosClientRoutes = []clientRoute{
	// auth & server
	{http.MethodGet, "/api/auth-enabled"},
	{http.MethodPost, "/api/login"},
	{http.MethodGet, "/api/version"},
	{http.MethodGet, "/api/settings/list"},

	// logbook
	{http.MethodGet, "/api/logbook/data"},
	{http.MethodPost, "/api/logbook/new"},
	{http.MethodPut, "/api/logbook/{}"},
	{http.MethodDelete, "/api/logbook/{}"},
	{http.MethodPost, "/api/logbook/night"},
	{http.MethodGet, "/api/distance/{}/{}"},
	{http.MethodGet, "/api/airport/{}"},
	{http.MethodGet, "/api/person/persons-for-log/{}"},
	{http.MethodGet, "/api/custom-fields/list"},
	{http.MethodGet, "/api/attachment/list/{}"},
	{http.MethodGet, "/api/attachment/{}"},

	// licensing
	{http.MethodGet, "/api/licensing/list"},
	{http.MethodGet, "/api/licensing/{}"},
	{http.MethodPost, "/api/licensing/new"},
	{http.MethodPut, "/api/licensing/{}"},
	{http.MethodDelete, "/api/licensing/{}"},
	{http.MethodDelete, "/api/licensing/{}/attachment"},

	// currency
	{http.MethodGet, "/api/currency/list"},
	{http.MethodPost, "/api/currency/new"},
	{http.MethodPut, "/api/currency/{}"},
	{http.MethodDelete, "/api/currency/{}"},

	// aircraft
	{http.MethodGet, "/api/aircraft/list"},
	{http.MethodGet, "/api/aircraft/models-categories"},
	{http.MethodPut, "/api/aircraft/models-categories"},
	{http.MethodPut, "/api/aircraft/update"},
}

// the only route in the list that is allowed to be public
const publicClientRoute = http.MethodPost + " /api/login"

var routeParamRe = regexp.MustCompile(`\{[^}]*\}`)

// normalizeRoute replaces every {param} with {} and drops a trailing slash
func normalizeRoute(route string) string {
	route = routeParamRe.ReplaceAllString(route, "{}")
	if len(route) > 1 {
		route = strings.TrimSuffix(route, "/")
	}
	return route
}

// walkRoutes returns "METHOD /normalized/path" -> number of middlewares in front of the handler
func walkRoutes(t *testing.T) map[string]int {
	t.Helper()

	app := &application{}
	routes := map[string]int{}

	err := chi.Walk(app.routes(), func(method, route string, _ http.Handler, middlewares ...func(http.Handler) http.Handler) error {
		routes[method+" "+normalizeRoute(route)] = len(middlewares)
		return nil
	})
	if err != nil {
		t.Fatalf("cannot walk routes: %v", err)
	}

	return routes
}

// TestIOSClientRoutes checks that every endpoint used by the iOS client is still registered
func TestIOSClientRoutes(t *testing.T) {
	routes := walkRoutes(t)

	for _, c := range iosClientRoutes {
		key := c.method + " " + c.path
		t.Run(key, func(t *testing.T) {
			if _, ok := routes[key]; !ok {
				t.Errorf("%s is not registered: the iOS client (issue #578) depends on it, update the list and notify the client author", key)
			}
		})
	}
}

// TestIOSClientRoutesAuth checks that every route in the list except login stays behind the
// authentication middleware. chi.Walk does not expose middleware identity, so it compares the number of
// middlewares in front of each route with the public login route: the /api group adds app.Auth on top.
func TestIOSClientRoutesAuth(t *testing.T) {
	routes := walkRoutes(t)

	publicCount, ok := routes[publicClientRoute]
	if !ok {
		t.Fatalf("%s is not registered", publicClientRoute)
	}

	for _, c := range iosClientRoutes {
		key := c.method + " " + c.path
		if key == publicClientRoute {
			continue
		}

		count, ok := routes[key]
		if !ok {
			continue // reported by TestIOSClientRoutes
		}

		t.Run(key, func(t *testing.T) {
			if count <= publicCount {
				t.Errorf("%s has %d middlewares, login has %d: is it still behind app.Auth?", key, count, publicCount)
			}
		})
	}
}
