package pdfexport

import (
	"math"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLogbookWidthHeaders(t *testing.T) {
	float64EqualityThreshold := 1e-4

	sum := func(w []float64) (width float64) {
		result := 0.0
		for _, v := range w {
			result += v
		}

		return result
	}

	formats := [2]string{PDFA4, PDFA5}

	for _, i := range formats {
		var l Logbook
		l.init(i)

		w1_sum := sum(w1)
		w2_sum := sum(w2)
		w3_sum := sum(w3)
		w4_sum := sum(w4)

		if math.Abs(w1_sum-w2_sum) >= float64EqualityThreshold {
			t.Fatalf("Sum of the elements of w1 (%f), w2 (%f), w3 (%f), w4 (%f) variables should be equal\n", w1_sum, w2_sum, w3_sum, w4_sum)
		}

		if math.Abs(w2_sum-w3_sum) >= float64EqualityThreshold {
			t.Fatalf("Sum of the elements of w1 (%f), w2 (%f), w3 (%f), w4 (%f) variables should be equal\n", w1_sum, w2_sum, w3_sum, w4_sum)
		}

		if math.Abs(w3_sum-w4_sum) >= float64EqualityThreshold {
			t.Fatalf("Sum of the elements of w1 (%f), w2 (%f), w3 (%f), w4 (%f) variables should be equal\n", w1_sum, w2_sum, w3_sum, w4_sum)
		}
	}
}

func TestLogbookHeaders(t *testing.T) {
	assert.Equal(t, 12, len(header1))
	assert.Equal(t, 13, len(header2))
	assert.Equal(t, 23, len(header3))
}

func TestFillLine(t *testing.T) {
	assert.Equal(t, false, isFillLine(1, 3))
	assert.Equal(t, false, isFillLine(2, 3))
	assert.Equal(t, true, isFillLine(3, 3))
}
