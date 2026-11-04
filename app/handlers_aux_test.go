package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func writeCustomFile(t *testing.T, dir string, name string, content string) {
	t.Helper()
	if err := os.WriteFile(filepath.Join(dir, name), []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
}

func TestCustomAssetsTags(t *testing.T) {
	tests := []struct {
		name       string
		files      []string
		wantCSS    bool
		wantJS     bool
		wantNoTags bool
	}{
		{name: "no files", files: nil, wantNoTags: true},
		{name: "css only", files: []string{"custom.css"}, wantCSS: true},
		{name: "js only", files: []string{"custom.js"}, wantJS: true},
		{name: "css and js", files: []string{"custom.css", "custom.js"}, wantCSS: true, wantJS: true},
		{name: "other files are ignored", files: []string{"style.css", "app.js"}, wantNoTags: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dir := t.TempDir()
			for _, f := range tt.files {
				writeCustomFile(t, dir, f, "x")
			}

			got := customAssetsTags(dir)

			if tt.wantNoTags && got != "" {
				t.Errorf("expected no tags, got %q", got)
			}
			if has := strings.Contains(got, `<link rel="stylesheet" href="/custom.css?v=`); has != tt.wantCSS {
				t.Errorf("css tag: got %v, want %v (%q)", has, tt.wantCSS, got)
			}
			if has := strings.Contains(got, `<script defer src="/custom.js?v=`); has != tt.wantJS {
				t.Errorf("js tag: got %v, want %v (%q)", has, tt.wantJS, got)
			}
		})
	}
}

func TestCustomAssetsTagsMissingOrDirectory(t *testing.T) {
	if got := customAssetsTags(filepath.Join(t.TempDir(), "does-not-exist")); got != "" {
		t.Errorf("missing dir: expected no tags, got %q", got)
	}

	// a directory named custom.css is not a custom file
	dir := t.TempDir()
	if err := os.Mkdir(filepath.Join(dir, "custom.css"), 0o755); err != nil {
		t.Fatal(err)
	}
	if got := customAssetsTags(dir); got != "" {
		t.Errorf("directory named custom.css: expected no tags, got %q", got)
	}
}

func TestInjectIntoHead(t *testing.T) {
	tests := []struct {
		name string
		page string
		tags string
		want string
	}{
		{name: "injected before </head>", page: "<head><title>x</title></head><body></body>", tags: "<b>", want: "<head><title>x</title><b></head><body></body>"},
		{name: "only the first </head>", page: "</head></head>", tags: "<b>", want: "<b></head></head>"},
		{name: "empty tags", page: "<head></head>", tags: "", want: "<head></head>"},
		{name: "no </head>", page: "<body></body>", tags: "<b>", want: "<body></body>"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := string(injectIntoHead([]byte(tt.page), tt.tags)); got != tt.want {
				t.Errorf("got %q, want %q", got, tt.want)
			}
		})
	}
}

func TestHandlerCustomFile(t *testing.T) {
	dir := t.TempDir()
	writeCustomFile(t, dir, "custom.css", "body { color: red; }")

	app := &application{config: config{customDir: dir}}

	t.Run("existing file", func(t *testing.T) {
		rec := httptest.NewRecorder()
		app.HandlerCustomFile("custom.css")(rec, httptest.NewRequest(http.MethodGet, "/custom.css", nil))

		if rec.Code != http.StatusOK {
			t.Fatalf("status %d, want 200", rec.Code)
		}
		if body := rec.Body.String(); body != "body { color: red; }" {
			t.Errorf("unexpected body %q", body)
		}
		if ct := rec.Header().Get("Content-Type"); !strings.HasPrefix(ct, "text/css") {
			t.Errorf("content type %q, want text/css", ct)
		}
		if cc := rec.Header().Get("Cache-Control"); cc != "no-cache" {
			t.Errorf("cache control %q, want no-cache", cc)
		}
	})

	t.Run("missing file", func(t *testing.T) {
		rec := httptest.NewRecorder()
		app.HandlerCustomFile("custom.js")(rec, httptest.NewRequest(http.MethodGet, "/custom.js", nil))

		if rec.Code != http.StatusNotFound {
			t.Errorf("status %d, want 404", rec.Code)
		}
	})
}

func TestHandlerUICustomAssets(t *testing.T) {
	dir := t.TempDir()
	writeCustomFile(t, dir, "custom.css", "x")
	writeCustomFile(t, dir, "custom.js", "x")

	t.Run("disabled by default", func(t *testing.T) {
		app := &application{}
		rec := httptest.NewRecorder()
		app.HandlerUI().ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/", nil))

		if rec.Code != http.StatusOK {
			t.Fatalf("status %d, want 200", rec.Code)
		}
		if strings.Contains(rec.Body.String(), "custom.") {
			t.Error("custom tags found while -custom-dir is not set")
		}
	})

	t.Run("enabled", func(t *testing.T) {
		app := &application{config: config{customDir: dir}}

		// the root and an SPA route (rewritten to index.html) get the tags
		for _, path := range []string{"/", "/logbook/some-uuid"} {
			rec := httptest.NewRecorder()
			app.HandlerUI().ServeHTTP(rec, httptest.NewRequest(http.MethodGet, path, nil))

			if rec.Code != http.StatusOK {
				t.Fatalf("%s: status %d, want 200", path, rec.Code)
			}
			body := rec.Body.String()
			for _, want := range []string{`href="/custom.css?v=`, `src="/custom.js?v=`} {
				if !strings.Contains(body, want) {
					t.Errorf("%s: %q not found in the page", path, want)
				}
			}
			if cc := rec.Header().Get("Cache-Control"); cc != "no-cache" {
				t.Errorf("%s: cache control %q, want no-cache", path, cc)
			}
		}
	})
}
