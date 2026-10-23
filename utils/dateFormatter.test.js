const { formatDate, formatDateTime } = require('./dateFormatter');

describe('dateFormatter', () => {
  describe('formatDate', () => {
    it('should return "-" for falsy values and specific strings', () => {
      expect(formatDate(null)).toBe('-');
      expect(formatDate(undefined)).toBe('-');
      expect(formatDate('')).toBe('-');
      expect(formatDate('-')).toBe('-');
      expect(formatDate('null')).toBe('-');
      expect(formatDate('undefined')).toBe('-');
      expect(formatDate(false)).toBe('-');
    });

    it('should return the string if already formatted as DD/MM/YYYY', () => {
      expect(formatDate('25/12/2023')).toBe('25/12/2023');
      expect(formatDate('01/01/2000')).toBe('01/01/2000');
    });

    it('should handle strings formatted as DD/MM/YYYY HH:mm', () => {
      expect(formatDate('25/12/2023 15:30')).toBe('25/12/2023');
      expect(formatDate('25/12/2023 15:30', true)).toBe('25/12/2023 15:30');
    });

    it('should handle pure YYYY-MM-DD format', () => {
      expect(formatDate('2023-12-25')).toBe('25/12/2023');
    });

    it('should handle standard Date objects', () => {
      const date = new Date('2023-12-25T00:00:00.000Z');
      expect(formatDate(date)).toBe('25/12/2023');
    });

    it('should handle timestamp numbers', () => {
      const date = new Date('2023-12-25T00:00:00.000Z');
      expect(formatDate(date.getTime())).toBe('25/12/2023');
    });

    it('should handle ISO strings', () => {
      expect(formatDate('2023-12-25T15:30:00.000Z')).toBe('25/12/2023');
      expect(formatDate('2023-12-25T15:30:00.000Z', true)).toMatch(/^25\/12\/2023 \d{2}:\d{2}$/);
    });

    it('should handle invalid date strings containing YYYY-MM-DD pattern', () => {
      expect(formatDate('2023-12-25 something invalid')).toBe('25/12/2023');
    });

    it('should return original string for completely unparseable and unmatching strings', () => {
      expect(formatDate('invalid date format')).toBe('invalid date format');
    });
  });

  describe('formatDateTime', () => {
    it('should call formatDate with includeTime = true', () => {
      const date = new Date('2023-12-25T15:30:00');
      // The exact output depends on local timezone, so we match the pattern
      expect(formatDateTime(date)).toMatch(/^25\/12\/2023 \d{2}:\d{2}$/);
      // Depending on node timezone it might be interpreted differently
      // Let's rely on fixed cases that don't depend on new Date() parsing string without T
      const fixedDate = new Date(2023, 11, 25, 15, 30); // local time
      expect(formatDateTime(fixedDate)).toBe('25/12/2023 15:30');
    });

    it('should return "-" for falsy values', () => {
      expect(formatDateTime(null)).toBe('-');
    });
  });
});
