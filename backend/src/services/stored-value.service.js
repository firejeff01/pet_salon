function calculate(balance, cost) {
  const deduction = Math.min(balance, cost);
  const cash = cost - deduction;
  const remaining = balance - deduction;
  return { deduction, cash, remaining };
}

module.exports = { calculate };
