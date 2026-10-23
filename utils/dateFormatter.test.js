const assert = require('node:assert');
const { describe, it } = require('node:test');
const { formatDate, formatDateTime } = require('./dateFormatter');

describe('dateFormatter', () => {
  describe('formatDate()', () => {
    it('returns "-" when dateVal is missing or falsy', () => {
      assert.strictEqual(formatDate(), '-');
      assert.strictEqual(formatDate(null), '-');
      assert.strictEqual(formatDate(undefined), '-');
      assert.strictEqual(formatDate(''), '-');
      assert.strictEqual(formatDate(false), '-');
      assert.strictEqual(formatDate(0), '-');
    });

    it('returns "-" for specific string representations of missing values', () => {
      assert.strictEqual(formatDate('-'), '-');
      assert.strictEqual(formatDate('null'), '-');
      assert.strictEqual(formatDate('undefined'), '-');
      // testing with surrounding spaces
      assert.strictEqual(formatDate(' - '), '-');
      assert.strictEqual(formatDate(' null '), '-');
      assert.strictEqual(formatDate(' undefined '), '-');
      assert.strictEqual(formatDate('   '), '-'); // string with only spaces
    });

    it('returns the same string if already in DD/MM/YYYY format', () => {
      assert.strictEqual(formatDate('15/08/2023'), '15/08/2023');
    });

    it('returns pure date if in DD/MM/YYYY HH:mm format without includeTime', () => {
      assert.strictEqual(formatDate('15/08/2023 14:30'), '15/08/2023');
    });

    it('returns full string if in DD/MM/YYYY HH:mm format with includeTime', () => {
      assert.strictEqual(formatDate('15/08/2023 14:30', true), '15/08/2023 14:30');
    });

    it('converts YYYY-MM-DD format to DD/MM/YYYY', () => {
      assert.strictEqual(formatDate('2023-08-15'), '15/08/2023');
    });

    it('handles standard Date object correctly', () => {
      // Create a specific date object (Month is 0-indexed)
      const date = new Date(2023, 7, 15);
      assert.strictEqual(formatDate(date), '15/08/2023');
    });

    it('handles standard Date object correctly with includeTime', () => {
      const date = new Date(2023, 7, 15, 14, 30);
      assert.strictEqual(formatDate(date, true), '15/08/2023 14:30');
    });

    it('handles string with invalid date but YYYY-MM-DD format', () => {
      // Date parser fails, but regex matches
      assert.strictEqual(formatDate('2023-08-15Tsomething'), '15/08/2023');
    });

    it('returns original string if it is an invalid date and does not match fallback format', () => {
      assert.strictEqual(formatDate('not-a-date'), 'not-a-date');
    });
  });

  describe('formatDateTime()', () => {
    it('returns formatted date and time for a Date object', () => {
      const date = new Date(2023, 7, 15, 14, 30);
      assert.strictEqual(formatDateTime(date), '15/08/2023 14:30');
    });

    it('returns "-" for falsy values', () => {
       assert.strictEqual(formatDateTime(null), '-');
    });
  });
});
