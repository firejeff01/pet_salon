const ownerRepository = require('../repositories/owner.repository');
const { nanoid } = require('nanoid');

const REQUIRED_FIELDS = [
  'name',
  'nationalId',
  'phone',
  'address',
  'emergencyContactName',
  'emergencyContactPhone',
  'emergencyContactRelationship',
];

function validateRequired(data, fields) {
  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      throw new Error(`${field} 為必填欄位`);
    }
  }
}

function validateStoredValueBalance(data) {
  if (data.storedValueBalance !== undefined && data.storedValueBalance < 0) {
    throw new Error('儲值餘額不得小於 0');
  }
}

async function create(data) {
  validateRequired(data, REQUIRED_FIELDS);
  validateStoredValueBalance(data);

  const now = new Date().toISOString();
  const ownerData = {
    id: `owner_${nanoid()}`,
    ...data,
    storedValueBalance: data.storedValueBalance || 0,
    isStoredValueCustomer: data.isStoredValueCustomer || false,
    note: data.note || '',
    preferredAnimalHospital: data.preferredAnimalHospital || '',
    preferredAnimalHospitalPhone: data.preferredAnimalHospitalPhone || '',
    preferredAnimalHospitalAddress: data.preferredAnimalHospitalAddress || '',
    createdAt: now,
    updatedAt: now,
  };

  return ownerRepository.create(ownerData);
}

async function update(id, data) {
  const existing = await ownerRepository.findById(id);
  if (!existing) return null;

  // Validate any required fields that are being updated to empty
  for (const field of REQUIRED_FIELDS) {
    if (data[field] !== undefined && (data[field] === null || data[field] === '')) {
      throw new Error(`${field} 為必填欄位`);
    }
  }

  validateStoredValueBalance(data);

  const now = new Date().toISOString();
  return ownerRepository.update(id, { ...data, updatedAt: now });
}

async function search(keyword) {
  if (!keyword) {
    return ownerRepository.findAll();
  }
  return ownerRepository.findByKeyword(keyword);
}

async function getById(id) {
  return ownerRepository.findById(id);
}

module.exports = { create, update, search, getById };
