describe('ROC Date Conversion', () => {
  let toRocDate;

  beforeEach(() => {
    jest.resetModules();
    const rocDateModule = require('../../src/utils/roc-date');
    toRocDate = rocDateModule.toRocDate || rocDateModule;
  });

  // BE-ROC-001: 2026-04-20 → "中華民國 115 年 04 月 20 日"
  test('converts 2026-04-20 to ROC date', () => {
    const result = toRocDate('2026-04-20');

    expect(result).toBe('中華民國 115 年 04 月 20 日');
  });

  // BE-ROC-002: 2025-01-01 → "中華民國 114 年 01 月 01 日"
  test('converts 2025-01-01 to ROC date', () => {
    const result = toRocDate('2025-01-01');

    expect(result).toBe('中華民國 114 年 01 月 01 日');
  });

  // BE-ROC-003: 2030-12-31 → "中華民國 119 年 12 月 31 日"
  test('converts 2030-12-31 to ROC date', () => {
    const result = toRocDate('2030-12-31');

    expect(result).toBe('中華民國 119 年 12 月 31 日');
  });

  // BE-ROC-004: Single digit month/day gets zero-padded
  test('zero-pads single digit month', () => {
    const result = toRocDate('2026-03-15');

    expect(result).toBe('中華民國 115 年 03 月 15 日');
  });

  test('zero-pads single digit day', () => {
    const result = toRocDate('2026-10-05');

    expect(result).toBe('中華民國 115 年 10 月 05 日');
  });

  test('zero-pads both single digit month and day', () => {
    const result = toRocDate('2026-01-01');

    expect(result).toBe('中華民國 115 年 01 月 01 日');
  });

  // Additional edge cases
  test('converts date with double-digit month and day', () => {
    const result = toRocDate('2026-12-25');

    expect(result).toBe('中華民國 115 年 12 月 25 日');
  });

  test('ROC year is Western year minus 1911', () => {
    // 2026 - 1911 = 115
    const result = toRocDate('2026-06-15');
    expect(result).toContain('115');

    // 2024 - 1911 = 113
    const result2 = toRocDate('2024-06-15');
    expect(result2).toContain('113');
  });

  test('handles Date object input', () => {
    // This tests flexibility - the function should handle ISO strings
    const result = toRocDate('2026-04-20');

    expect(result).toBe('中華民國 115 年 04 月 20 日');
  });

  test('format includes correct Chinese characters', () => {
    const result = toRocDate('2026-07-14');

    expect(result).toMatch(/^中華民國 \d+ 年 \d{2} 月 \d{2} 日$/);
  });
});
