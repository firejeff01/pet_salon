const appointmentRepository = require('../repositories/appointment.repository');
const ownerRepository = require('../repositories/owner.repository');
const petRepository = require('../repositories/pet.repository');
const groomingRecordRepository = require('../repositories/grooming-record.repository');
const { nanoid } = require('nanoid');

const REQUIRED_FIELDS = ['ownerId', 'petId', 'date', 'time'];

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;

function validateRequired(data) {
  for (const field of REQUIRED_FIELDS) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      throw new Error(`${field} 為必填欄位`);
    }
  }

  if (!DATE_REGEX.test(data.date)) {
    throw new Error('date 格式必須為 YYYY-MM-DD');
  }

  if (!TIME_REGEX.test(data.time)) {
    throw new Error('time 格式必須為 HH:mm');
  }
}

async function enrichWithRelations(appointments) {
  if (!appointments || !appointments.length) return [];

  const ownerIds = [...new Set(appointments.map(a => a.ownerId))];
  const petIds = [...new Set(appointments.map(a => a.petId))];
  const [owners, pets] = await Promise.all([
    Promise.all(ownerIds.map(id => ownerRepository.findById(id))),
    Promise.all(petIds.map(id => petRepository.findById(id))),
  ]);
  const ownerMap = new Map(owners.filter(Boolean).map(o => [o.id, o]));
  const petMap = new Map(pets.filter(Boolean).map(p => [p.id, p]));

  // hasContract requires inspecting grooming records attached to appointment
  const records = await groomingRecordRepository.findAll();
  const apptHasContract = new Map();
  for (const r of records) {
    if (r && r.appointmentId && Array.isArray(r.contractPaths) && r.contractPaths.length) {
      apptHasContract.set(r.appointmentId, true);
    }
  }

  return appointments.map(a => {
    const owner = ownerMap.get(a.ownerId);
    const pet = petMap.get(a.petId);
    return {
      ...a,
      ownerName: owner ? owner.name : '',
      ownerPhone: owner ? owner.phone : '',
      petName: pet ? pet.name : '',
      owner: owner || null,
      pet: pet || null,
      hasContract: apptHasContract.get(a.id) === true,
    };
  });
}

async function enrichOne(appointment) {
  if (!appointment) return null;
  const [enriched] = await enrichWithRelations([appointment]);
  return enriched;
}

async function create(data) {
  validateRequired(data);

  const now = new Date().toISOString();
  const appointmentData = {
    id: `appt_${nanoid()}`,
    ...data,
    status: '已預約',
    cancelReason: data.cancelReason || '',
    note: data.note || '',
    createdAt: now,
    updatedAt: now,
  };

  return appointmentRepository.create(appointmentData);
}

async function update(id, data) {
  const existing = await appointmentRepository.findById(id);
  if (!existing) return null;

  // If cancelling, require cancelReason
  if (data.status === '已取消') {
    if (!data.cancelReason || data.cancelReason.trim() === '') {
      throw new Error('取消預約時必須填寫取消原因');
    }
  }

  const now = new Date().toISOString();
  return appointmentRepository.update(id, { ...data, updatedAt: now });
}

async function getByDateRange(startDate, endDate) {
  const raw = await appointmentRepository.findByDateRange(startDate, endDate);
  return enrichWithRelations(raw);
}

async function getByDate(date) {
  const raw = await appointmentRepository.findByDate(date);
  return enrichWithRelations(raw);
}

async function getByMonth(year, month) {
  const y = Number(year);
  const m = Number(month);
  if (!y || !m) return [];
  const start = `${y}-${String(m).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return getByDateRange(start, end);
}

async function getById(id) {
  const raw = await appointmentRepository.findById(id);
  return enrichOne(raw);
}

async function getAll() {
  const raw = await appointmentRepository.findAll();
  return enrichWithRelations(raw);
}

module.exports = {
  create, update,
  getByDateRange, getByDate, getByMonth,
  getById, getAll,
};
