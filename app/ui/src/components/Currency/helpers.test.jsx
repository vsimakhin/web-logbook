import { describe, it, expect } from 'vitest';
import {
  parseSubMetrics,
  getFlightMetricValue,
  evaluateCurrency,
  formatCurrencyValue,
  getStatusBarColor,
} from './helpers';

describe('Currency helpers', () => {
  describe('parseSubMetrics', () => {
    it('returns empty array for empty inputs', () => {
      expect(parseSubMetrics(null)).toEqual([]);
      expect(parseSubMetrics(undefined)).toEqual([]);
      expect(parseSubMetrics('')).toEqual([]);
      expect(parseSubMetrics('invalid json')).toEqual([]);
    });

    it('returns array as is if already array', () => {
      const arr = [{ metric: 'time.pic_time', target_value: 100 }];
      expect(parseSubMetrics(arr)).toEqual(arr);
    });

    it('parses valid JSON string', () => {
      const sub = [{ id: '1', metric: 'time.pic_time', comparison: '>=', target_value: 100 }];
      expect(parseSubMetrics(JSON.stringify(sub))).toEqual(sub);
    });
  });

  describe('getFlightMetricValue', () => {
    const flight = {
      time: {
        total_time: '2:30',
        pic_time: '2:30',
        cc_time: '2:30',
      },
      landings: {
        day: 2,
        night: 1,
      },
    };

    it('extracts time metrics in hours', () => {
      expect(getFlightMetricValue(flight, 'time.total_time')).toBe(2.5);
      expect(getFlightMetricValue(flight, 'time.pic_time')).toBe(2.5);
      expect(getFlightMetricValue(flight, 'time.cc_time')).toBe(2.5);
    });

    it('extracts combined landings', () => {
      expect(getFlightMetricValue(flight, 'landings.all')).toBe(3);
      expect(getFlightMetricValue(flight, 'landings.day')).toBe(2);
      expect(getFlightMetricValue(flight, 'landings.night')).toBe(1);
    });

    it('returns 0 for missing fields or nil flight', () => {
      expect(getFlightMetricValue(null, 'time.pic_time')).toBe(0);
      expect(getFlightMetricValue(flight, 'time.ifr_time')).toBe(0);
    });
  });

  describe('evaluateCurrency with sub-metrics', () => {
    const flights = [
      {
        date: '10/05/2026',
        aircraft: { reg_name: 'N12345' },
        time: {
          total_time: '100:00',
          pic_time: '60:00',
          cc_time: '100:00',
        },
      },
      {
        date: '15/05/2026',
        aircraft: { reg_name: 'N12345' },
        time: {
          total_time: '100:00',
          pic_time: '40:00',
          cc_time: '100:00',
        },
      },
      {
        // Local flight: XC is 0, but PIC is 50h
        date: '20/05/2026',
        aircraft: { reg_name: 'N12345' },
        time: {
          total_time: '50:00',
          pic_time: '50:00',
          cc_time: '0:00',
        },
      },
    ];

    it('evaluates single metric currency correctly', () => {
      const rule = {
        metric: 'time.cc_time',
        comparison: '>=',
        target_value: 200,
        time_frame: { unit: 'all_time' },
        filters: '',
      };
      const result = evaluateCurrency(flights, rule, []);
      expect(result.current).toBe(200);
      expect(result.meetsRequirement).toBe(true);
      expect(result.subResults).toEqual([]);
    });

    it('evaluates sub-metric tied to main metric (excludes local flight PIC)', () => {
      const rule = {
        metric: 'time.cc_time',
        comparison: '>=',
        target_value: 200,
        time_frame: { unit: 'all_time' },
        filters: '',
        sub_metrics: JSON.stringify([
          {
            id: 'sub_pic',
            metric: 'time.pic_time',
            comparison: '>=',
            target_value: 100,
          },
        ]),
      };

      const result = evaluateCurrency(flights, rule, []);
      expect(result.current).toBe(200); // 100 + 100
      expect(result.mainMeets).toBe(true);
      expect(result.subResults.length).toBe(1);
      // Sub PIC should be 60 + 40 = 100 (excluding 50 from local flight where cc_time was 0)
      expect(result.subResults[0].current).toBe(100);
      expect(result.subResults[0].meetsRequirement).toBe(true);
      expect(result.meetsRequirement).toBe(true);
    });

    it('fails overall requirement when sub-metric target is not met', () => {
      const rule = {
        metric: 'time.cc_time',
        comparison: '>=',
        target_value: 200,
        time_frame: { unit: 'all_time' },
        filters: '',
        sub_metrics: JSON.stringify([
          {
            id: 'sub_pic',
            metric: 'time.pic_time',
            comparison: '>=',
            target_value: 120, // Requires 120h XC PIC, but only 100h available
          },
        ]),
      };

      const result = evaluateCurrency(flights, rule, []);
      expect(result.current).toBe(200);
      expect(result.mainMeets).toBe(true);
      expect(result.subResults[0].current).toBe(100);
      expect(result.subResults[0].meetsRequirement).toBe(false);
      expect(result.meetsRequirement).toBe(false);
    });
  });

  describe('getStatusBarColor', () => {
    it('returns success when meetsRequirement is true', () => {
      expect(getStatusBarColor(true, 100, '>=')).toBe('success');
      expect(getStatusBarColor(true, 50, '>=')).toBe('success');
    });

    it('returns warning or error when meetsRequirement is false', () => {
      expect(getStatusBarColor(false, 80, '>=')).toBe('warning');
      expect(getStatusBarColor(false, 50, '>=')).toBe('error');
    });
  });

  describe('formatCurrencyValue', () => {
    it('formats time values to HH:MM', () => {
      expect(formatCurrencyValue(2.5, 'time.pic_time')).toBe('02:30');
      expect(formatCurrencyValue(200, 'time.cc_time')).toBe('200:00');
    });

    it('formats landings as integer', () => {
      expect(formatCurrencyValue(3, 'landings.all')).toBe(3);
    });
  });
});
