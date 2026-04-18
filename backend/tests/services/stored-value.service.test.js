describe('Stored Value Service', () => {
  let storedValueService;

  beforeEach(() => {
    jest.resetModules();
    storedValueService = require('../../src/services/stored-value.service');
  });

  // BE-SV-001: balance=5000, cost=500 → deduction=500, cash=0, remaining=4500
  test('fully covers cost from balance: 5000 - 500 = 4500 remaining', () => {
    const result = storedValueService.calculate(5000, 500);

    expect(result.deduction).toBe(500);
    expect(result.cash).toBe(0);
    expect(result.remaining).toBe(4500);
  });

  // BE-SV-002: balance=5000, cost=5000 → deduction=5000, cash=0, remaining=0
  test('exact balance matches cost: 5000 - 5000 = 0 remaining', () => {
    const result = storedValueService.calculate(5000, 5000);

    expect(result.deduction).toBe(5000);
    expect(result.cash).toBe(0);
    expect(result.remaining).toBe(0);
  });

  // BE-SV-003: balance=300, cost=800 → deduction=300, cash=500, remaining=0
  test('partial balance coverage: 300 balance, 800 cost → 300 deducted, 500 cash', () => {
    const result = storedValueService.calculate(300, 800);

    expect(result.deduction).toBe(300);
    expect(result.cash).toBe(500);
    expect(result.remaining).toBe(0);
  });

  // BE-SV-004: balance=0, cost=500 → deduction=0, cash=500, remaining=0
  test('zero balance: all paid in cash', () => {
    const result = storedValueService.calculate(0, 500);

    expect(result.deduction).toBe(0);
    expect(result.cash).toBe(500);
    expect(result.remaining).toBe(0);
  });

  // BE-SV-005: cost=0 → deduction=0, cash=0, remaining=balance
  test('zero cost: no deduction, balance unchanged', () => {
    const result = storedValueService.calculate(3000, 0);

    expect(result.deduction).toBe(0);
    expect(result.cash).toBe(0);
    expect(result.remaining).toBe(3000);
  });

  // BE-SV-006: balance=100, cost=100 → deduction=100, cash=0, remaining=0
  test('exact small amounts: 100 balance, 100 cost', () => {
    const result = storedValueService.calculate(100, 100);

    expect(result.deduction).toBe(100);
    expect(result.cash).toBe(0);
    expect(result.remaining).toBe(0);
  });

  // BE-SV-007: remaining is NEVER negative (property-based testing)
  describe('property-based: remaining is never negative', () => {
    test('remaining >= 0 for 100 random input pairs', () => {
      for (let i = 0; i < 100; i++) {
        const balance = Math.floor(Math.random() * 100000);
        const cost = Math.floor(Math.random() * 100000);

        const result = storedValueService.calculate(balance, cost);

        expect(result.remaining).toBeGreaterThanOrEqual(0);
        // Also verify the invariant: deduction + cash === cost
        expect(result.deduction + result.cash).toBe(cost);
        // And: remaining === balance - deduction
        expect(result.remaining).toBe(balance - result.deduction);
      }
    });

    test('deduction is never greater than balance', () => {
      for (let i = 0; i < 50; i++) {
        const balance = Math.floor(Math.random() * 10000);
        const cost = Math.floor(Math.random() * 20000);

        const result = storedValueService.calculate(balance, cost);

        expect(result.deduction).toBeLessThanOrEqual(balance);
      }
    });

    test('deduction is never greater than cost', () => {
      for (let i = 0; i < 50; i++) {
        const balance = Math.floor(Math.random() * 20000);
        const cost = Math.floor(Math.random() * 10000);

        const result = storedValueService.calculate(balance, cost);

        expect(result.deduction).toBeLessThanOrEqual(cost);
      }
    });

    test('cash is never negative', () => {
      for (let i = 0; i < 100; i++) {
        const balance = Math.floor(Math.random() * 100000);
        const cost = Math.floor(Math.random() * 100000);

        const result = storedValueService.calculate(balance, cost);

        expect(result.cash).toBeGreaterThanOrEqual(0);
      }
    });

    test('deduction is never negative', () => {
      for (let i = 0; i < 100; i++) {
        const balance = Math.floor(Math.random() * 100000);
        const cost = Math.floor(Math.random() * 100000);

        const result = storedValueService.calculate(balance, cost);

        expect(result.deduction).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // Edge cases
  describe('edge cases', () => {
    test('both balance and cost are 0', () => {
      const result = storedValueService.calculate(0, 0);

      expect(result.deduction).toBe(0);
      expect(result.cash).toBe(0);
      expect(result.remaining).toBe(0);
    });

    test('very large balance and small cost', () => {
      const result = storedValueService.calculate(999999, 1);

      expect(result.deduction).toBe(1);
      expect(result.cash).toBe(0);
      expect(result.remaining).toBe(999998);
    });

    test('very small balance and large cost', () => {
      const result = storedValueService.calculate(1, 999999);

      expect(result.deduction).toBe(1);
      expect(result.cash).toBe(999998);
      expect(result.remaining).toBe(0);
    });
  });
});
