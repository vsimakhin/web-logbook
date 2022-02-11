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

func TestLogbookows(t *testing.T) {
	assert.Equal(t, logbookRows, 23)
}

func TestLogbookHeaders(t *testing.T) {
	assert.Equal(t, len(header1), 12)
	assert.Equal(t, len(header2), 13)
	assert.Equal(t, len(header3), 23)
}

func TestFillLine(t *testing.T) {
	assert.Equal(t, false, fillLine(0))
	assert.Equal(t, false, fillLine(1))
	assert.Equal(t, true, fillLine(2))
}
