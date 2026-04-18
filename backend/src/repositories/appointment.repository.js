const { readJsonFile, writeJsonFile, getDataFilePath } = require('../utils/json-store');

const FILENAME = 'appointments.json';

function getFilePath() {
  return getDataFilePath(FILENAME);
}

async function readAppointments() {
  const data = await readJsonFile(getFilePath());
  return data.data || [];
}

async function writeAppointments(appointments) {
  await writeJsonFile(getFilePath(), { data: appointments });
}

async function findAll() {
  return readAppointments();
}

async function findById(id) {
  if (!id) return null;
  const appointments = await readAppointments();
  return appointments.find(a => a.id === id) || null;
}

async function findByDateRange(start, end) {
  const appointments = await readAppointments();
  return appointments.filter(a => a.date >= start && a.date <= end);
}

async function findByDate(date) {
  const appointments = await readAppointments();
  return appointments
    .filter(a => a.date === date)
    .sort((a, b) => a.time.localeCompare(b.time));
}

async function create(appointmentData) {
  const appointments = await readAppointments();
  appointments.push(appointmentData);
  await writeAppointments(appointments);
  return appointmentData;
}

async function update(id, updateData) {
  const appointments = await readAppointments();
  const index = appointments.findIndex(a => a.id === id);
  if (index === -1) return null;
  appointments[index] = { ...appointments[index], ...updateData };
  await writeAppointments(appointments);
  return appointments[index];
}

module.exports = { findAll, findById, findByDateRange, findByDate, create, update };
