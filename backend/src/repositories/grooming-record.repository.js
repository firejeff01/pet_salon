const { readJsonFile, writeJsonFile, getDataFilePath } = require('../utils/json-store');

const FILENAME = 'grooming-records.json';

function getFilePath() {
  return getDataFilePath(FILENAME);
}

async function readRecords() {
  const data = await readJsonFile(getFilePath());
  return data.data || [];
}

async function writeRecords(records) {
  await writeJsonFile(getFilePath(), { data: records });
}

async function findAll() {
  return readRecords();
}

async function findByAppointmentId(appointmentId) {
  if (!appointmentId) return null;
  const records = await readRecords();
  return records.find(r => r.appointmentId === appointmentId) || null;
}

async function findById(id) {
  if (!id) return null;
  const records = await readRecords();
  return records.find(r => r.id === id) || null;
}

async function create(recordData) {
  const records = await readRecords();
  records.push(recordData);
  await writeRecords(records);
  return recordData;
}

async function update(id, updateData) {
  const records = await readRecords();
  const index = records.findIndex(r => r.id === id);
  if (index === -1) return null;
  records[index] = { ...records[index], ...updateData };
  await writeRecords(records);
  return records[index];
}

module.exports = { findAll, findByAppointmentId, findById, create, update };
