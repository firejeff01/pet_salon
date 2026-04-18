function toRocDate(dateStr) {
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const rocYear = year - 1911;
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `中華民國 ${rocYear} 年 ${mm} 月 ${dd} 日`;
}

module.exports = { toRocDate };
