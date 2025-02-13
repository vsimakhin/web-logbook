package main

import (
	"embed"
	"fmt"
	"html/template"
	"net/http"
)

type templateData struct {
	Data        map[string]interface{}
	API         map[string]string
	AuthEnabled bool
	Version     string
	NewVersion  bool
	License     struct {
		Expired int
		Warning int
	}
}

var functions = template.FuncMap{
	"formatLandings": formatLandings,
	"formatNumber":   formatNumber,
}

//go:embed templates
var templateFS embed.FS

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

// addDefaultData adds default values/consts to all templates
func (app *application) addDefaultData(td *templateData, req *http.Request) *templateData {
	td.API = apiMap
	td.Version = app.version
	td.NewVersion = app.isNewVersion

	if td.Data == nil {
		td.Data = make(map[string]interface{})
	}

	settings, err := app.db.GetSettings()
	if err != nil {
		app.errorLog.Println(err)
		return td
	}

	td.Data["settings"] = settings

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
		app.errorLog.Println(err)
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
		partials = append(partials, "templates/base.gohtml")
		partials = append(partials, templateToRender)
		t, err = template.New(fmt.Sprintf("%s.page.gohtml", page)).Funcs(functions).ParseFS(templateFS, partials...)
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
