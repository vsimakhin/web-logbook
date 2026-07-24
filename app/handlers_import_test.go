package main

import (
	"testing"
)

func TestParseName(t *testing.T) {
	tests := []struct {
		name       string
		fullName   string
		format     string
		wantFirst  string
		wantMiddle string
		wantLast   string
	}{
		// fn_mn_ln (default)
		{
			name:       "fn_mn_ln: 3 parts",
			fullName:   "John Fitzgerald Kennedy",
			format:     "fn_mn_ln",
			wantFirst:  "John",
			wantMiddle: "Fitzgerald",
			wantLast:   "Kennedy",
		},
		{
			name:       "fn_mn_ln: 4 parts",
			fullName:   "John Fitzgerald Cooper Kennedy",
			format:     "fn_mn_ln",
			wantFirst:  "John",
			wantMiddle: "Fitzgerald Cooper",
			wantLast:   "Kennedy",
		},
		{
			name:       "fn_mn_ln: 2 parts",
			fullName:   "John Kennedy",
			format:     "fn_mn_ln",
			wantFirst:  "John",
			wantMiddle: "",
			wantLast:   "Kennedy",
		},
		{
			name:       "fn_mn_ln: 1 part",
			fullName:   "Kennedy",
			format:     "fn_mn_ln",
			wantFirst:  "",
			wantMiddle: "",
			wantLast:   "Kennedy",
		},

		// ln_fn_md
		{
			name:       "ln_fn_md: 3 parts",
			fullName:   "Kennedy John Fitzgerald",
			format:     "ln_fn_md",
			wantFirst:  "John",
			wantMiddle: "Fitzgerald",
			wantLast:   "Kennedy",
		},
		{
			name:       "ln_fn_md: 4 parts",
			fullName:   "Kennedy John Fitzgerald Cooper",
			format:     "ln_fn_md",
			wantFirst:  "John",
			wantMiddle: "Fitzgerald Cooper",
			wantLast:   "Kennedy",
		},
		{
			name:       "ln_fn_md: 2 parts",
			fullName:   "Kennedy John",
			format:     "ln_fn_md",
			wantFirst:  "John",
			wantMiddle: "",
			wantLast:   "Kennedy",
		},
		{
			name:       "ln_fn_md: 1 part",
			fullName:   "Kennedy",
			format:     "ln_fn_md",
			wantFirst:  "",
			wantMiddle: "",
			wantLast:   "Kennedy",
		},

		// fn_ln_md
		{
			name:       "fn_ln_md: 3 parts",
			fullName:   "John Kennedy Fitzgerald",
			format:     "fn_ln_md",
			wantFirst:  "John",
			wantMiddle: "Fitzgerald",
			wantLast:   "Kennedy",
		},
		{
			name:       "fn_ln_md: 4 parts",
			fullName:   "John Kennedy Fitzgerald Cooper",
			format:     "fn_ln_md",
			wantFirst:  "John",
			wantMiddle: "Fitzgerald Cooper",
			wantLast:   "Kennedy",
		},
		{
			name:       "fn_ln_md: 2 parts",
			fullName:   "John Kennedy",
			format:     "fn_ln_md",
			wantFirst:  "John",
			wantMiddle: "",
			wantLast:   "Kennedy",
		},
		{
			name:       "fn_ln_md: 1 part",
			fullName:   "John",
			format:     "fn_ln_md",
			wantFirst:  "John",
			wantMiddle: "",
			wantLast:   "",
		},

		// Empty/Spaces
		{
			name:       "empty name",
			fullName:   "",
			format:     "fn_mn_ln",
			wantFirst:  "",
			wantMiddle: "",
			wantLast:   "",
		},
		{
			name:       "only spaces",
			fullName:   "   ",
			format:     "fn_mn_ln",
			wantFirst:  "",
			wantMiddle: "",
			wantLast:   "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotFirst, gotMiddle, gotLast := parseName(tt.fullName, tt.format)
			if gotFirst != tt.wantFirst || gotMiddle != tt.wantMiddle || gotLast != tt.wantLast {
				t.Errorf("parseName(%q, %q) = (%q, %q, %q); want (%q, %q, %q)",
					tt.fullName, tt.format, gotFirst, gotMiddle, gotLast, tt.wantFirst, tt.wantMiddle, tt.wantLast)
			}
		})
	}
}
