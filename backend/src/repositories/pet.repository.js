const { readJsonFile, writeJsonFile, getDataFilePath } = require('../utils/json-store');
const { nanoid } = require('nanoid');

const FILENAME = 'pets.json';

function getFilePath() {
  return getDataFilePath(FILENAME);
}

async function readPets() {
  const data = await readJsonFile(getFilePath());
  return data.data || [];
}

async function writePets(pets) {
  await writeJsonFile(getFilePath(), { data: pets });
}

async function findAll() {
  return readPets();
}

async function findById(id) {
  if (!id) return null;
  const pets = await readPets();
  return pets.find(p => p.id === id) || null;
}

async function findByOwnerId(ownerId) {
  const pets = await readPets();
  return pets.filter(p => p.ownerId === ownerId);
}

async function create(petData) {
  const pets = await readPets();
  const newPet = {
    id: `pet_${nanoid()}`,
    ...petData,
  };
  pets.push(newPet);
  await writePets(pets);
  return newPet;
}

async function update(id, updateData) {
  const pets = await readPets();
  const index = pets.findIndex(p => p.id === id);
  if (index === -1) return null;
  pets[index] = { ...pets[index], ...updateData };
  await writePets(pets);
  return pets[index];
}

module.exports = { findAll, findById, findByOwnerId, create, update };
