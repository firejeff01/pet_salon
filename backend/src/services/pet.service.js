const petRepository = require('../repositories/pet.repository');
const ownerRepository = require('../repositories/owner.repository');
const { nanoid } = require('nanoid');

const VALID_SPECIES = ['犬', '貓'];
const VALID_GENDER = ['公', '母'];

async function validatePetData(data) {
  // ownerId required and must exist
  if (!data.ownerId) {
    throw new Error('ownerId 為必填欄位');
  }
  const owner = await ownerRepository.findById(data.ownerId);
  if (!owner) {
    throw new Error('查無此飼主');
  }

  // name required
  if (!data.name || data.name === '') {
    throw new Error('name 為必填欄位');
  }

  // species must be 犬 or 貓
  if (!data.species || !VALID_SPECIES.includes(data.species)) {
    throw new Error('species 必須為「犬」或「貓」');
  }

  // breed required
  if (!data.breed || data.breed === '') {
    throw new Error('breed 為必填欄位');
  }

  // gender must be 公 or 母
  if (!data.gender || !VALID_GENDER.includes(data.gender)) {
    throw new Error('gender 必須為「公」或「母」');
  }

  // age required
  if (data.age === undefined || data.age === null || data.age === '') {
    throw new Error('age 為必填欄位');
  }

  // isNeutered must be boolean
  if (data.isNeutered === undefined || data.isNeutered === null || typeof data.isNeutered !== 'boolean') {
    throw new Error('isNeutered 必須為布林值');
  }

  // personality must be non-empty array
  if (!data.personality || !Array.isArray(data.personality) || data.personality.length === 0) {
    throw new Error('personality 為必填欄位，且不得為空陣列');
  }

  // physicalExamination required and must have content
  if (!data.physicalExamination || typeof data.physicalExamination !== 'object' || Object.keys(data.physicalExamination).length === 0) {
    throw new Error('physicalExamination 為必填欄位');
  }
}

async function create(data) {
  await validatePetData(data);

  const now = new Date().toISOString();
  const petData = {
    id: `pet_${nanoid()}`,
    ...data,
    chipNumber: data.chipNumber || '',
    unregisteredIdMethod: data.unregisteredIdMethod || '',
    medicalHistory: data.medicalHistory || [],
    medicalHistoryOther: data.medicalHistoryOther || '',
    note: data.note || '',
    createdAt: now,
    updatedAt: now,
  };

  return petRepository.create(petData);
}

async function update(id, data) {
  const existing = await petRepository.findById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  return petRepository.update(id, { ...data, updatedAt: now });
}

async function getById(id) {
  return petRepository.findById(id);
}

async function findByOwnerId(ownerId) {
  return petRepository.findByOwnerId(ownerId);
}

module.exports = { create, update, getById, findByOwnerId };
