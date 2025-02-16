package main

import (
	"fmt"
)

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
