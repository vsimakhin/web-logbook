package main

import (
	"embed"
	"fmt"
	"html/template"
	"net/http"
	"strings"
)

type templateData struct {
	Data map[string]interface{}
	API  string
}

var functions = template.FuncMap{
	"formatRemarks":  formatRemarks,
	"formatLandings": formatLandings,
	"formatNumber":   formatNumber,
}

//go:embed templates
var templateFS embed.FS

// formatRemarks cuts the remark field if it's too long
func formatRemarks(remarks string) string {
	if len(remarks) > 13 {
		return fmt.Sprintf("%.10s...", remarks)
	} else {
		return remarks
	}
}

func formatLandings(landing int) string {
	if landing == 0 {
		return ""
	} else {
		return fmt.Sprintf("%d", landing)
	}
}

func formatNumber(n int) string {
	s := fmt.Sprintf("%d", n)

	if n >= 1000 {
		s = s[:len(s)-3] + " " + s[len(s)-3:]
	}
	if n >= 1000000 {
		s = s[:len(s)-7] + " " + s[len(s)-7:]
	}
	if n >= 1000000000 {
		s = s[:len(s)-11] + " " + s[len(s)-11:]
	}

	return s
}

func (app *application) addDefaultData(td *templateData, req *http.Request) *templateData {
	td.API = fmt.Sprintf("http://localhost:%d", app.config.port)

	return td
}

func (app *application) renderTemplate(w http.ResponseWriter, req *http.Request, page string, td *templateData, partials ...string) error {
	var t *template.Template
	var err error
	templateToRender := fmt.Sprintf("templates/%s.page.gohtml", page)

	_, templateInMap := app.templateCache[templateToRender]

	if app.config.env == "prod" && templateInMap {
		t = app.templateCache[templateToRender]
	} else {
		t, err = app.parseTemplate(page, templateToRender, partials)
		if err != nil {
			app.errorLog.Println(err)
			return err
		}
	}

	if td == nil {
		td = &templateData{}
	}

	td = app.addDefaultData(td, req)

	err = t.Execute(w, td)
	if err != nil {
		app.errorLog.Panicln(err)
		return err
	}

	return nil
}

func (app *application) parseTemplate(page string, templateToRender string, partials []string) (t *template.Template, err error) {

	if len(partials) > 0 {
		for i, x := range partials {
			partials[i] = fmt.Sprintf("templates/%s.partials.gohtml", x)
		}
	}

	if len(partials) > 0 {
		t, err = template.New(fmt.Sprintf("%s.page.gohtml", page)).Funcs(functions).ParseFS(templateFS, "templates/base.gohtml", strings.Join(partials, ","), templateToRender)
	} else {
		t, err = template.New(fmt.Sprintf("%s.page.gohtml", page)).Funcs(functions).ParseFS(templateFS, "templates/base.gohtml", templateToRender)
	}

	if err != nil {
		app.errorLog.Println(err)
		return nil, err
	}

	app.templateCache[templateToRender] = t

	return t, nil
}
