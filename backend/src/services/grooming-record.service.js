const groomingRecordRepository = require('../repositories/grooming-record.repository');
const appointmentRepository = require('../repositories/appointment.repository');
const ownerRepository = require('../repositories/owner.repository');
const petRepository = require('../repositories/pet.repository');
const { calculate } = require('./stored-value.service');
const { nanoid } = require('nanoid');

const VALID_SERVICE_ITEMS = ['洗澡', '美容', '其他'];

function normalizeServices(services) {
  return services.map((svc) => ({
    item: svc.item || svc.type || '',
    price: svc.price,
  }));
}

function validateRecord(data) {
  if (!data.appointmentId) {
    throw new Error('appointmentId 為必填欄位');
  }

  if (!data.services || !Array.isArray(data.services) || data.services.length === 0) {
    throw new Error('services 為必填且不可為空陣列');
  }

  const normalized = normalizeServices(data.services);
  for (const svc of normalized) {
    if (!VALID_SERVICE_ITEMS.includes(svc.item)) {
      throw new Error(`服務項目必須為 ${VALID_SERVICE_ITEMS.join(', ')} 之一`);
    }
    if (svc.price === undefined || svc.price === null || svc.price < 0) {
      throw new Error('price 不得小於 0');
    }
  }

  // physicalExamination + personality are required, but we inherit from the pet
  // record when the client does not explicitly provide them (common in the
  // shop-facing grooming form, which only collects the new service).
}

async function create(data) {
  validateRecord(data);

  const appointment = await appointmentRepository.findById(data.appointmentId);
  if (!appointment) {
    throw new Error('查無此預約');
  }

  const owner = await ownerRepository.findById(appointment.ownerId);
  const pet = await petRepository.findById(appointment.petId);

  const services = normalizeServices(data.services);
  const totalCost = services.reduce((sum, svc) => sum + (Number(svc.price) || 0), 0);

  let storedValueDeduction = 0;
  let cashPayment = totalCost;

  if (owner && owner.isStoredValueCustomer && owner.storedValueBalance > 0) {
    const result = calculate(owner.storedValueBalance, totalCost);
    storedValueDeduction = result.deduction;
    cashPayment = result.cash;

    await ownerRepository.update(owner.id, {
      storedValueBalance: result.remaining,
      updatedAt: new Date().toISOString(),
    });
  }

  const physicalExamination = data.physicalExamination || (pet ? pet.physicalExamination : {
    eyes: '正常', ears: '正常', teeth: '正常', limbs: '正常', skin: '正常', fur: '正常',
  });
  const personality = data.personality && data.personality.length
    ? data.personality
    : (pet ? pet.personality : []);
  const medicalHistory = data.medicalHistory || (pet ? pet.medicalHistory : []);

  const now = new Date().toISOString();
  const recordData = {
    id: `rec_${nanoid()}`,
    appointmentId: data.appointmentId,
    serviceDate: appointment.date,
    serviceTime: appointment.time,
    services,
    totalCost,
    storedValueDeduction,
    cashPayment,
    physicalExamination,
    medicalHistory,
    personality,
    ownerNotes: data.ownerNotes || '',
    shopNotes: data.shopNotes || '',
    otherNotes: data.otherNotes || '',
    contractPaths: [],
    createdAt: now,
    updatedAt: now,
  };

  return groomingRecordRepository.create(recordData);
}

async function getByAppointmentId(appointmentId) {
  return groomingRecordRepository.findByAppointmentId(appointmentId);
}

async function getById(id) {
  return groomingRecordRepository.findById(id);
}

async function update(id, data) {
  const existing = await groomingRecordRepository.findById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  return groomingRecordRepository.update(id, { ...data, updatedAt: now });
}

module.exports = { create, getByAppointmentId, getById, update };
