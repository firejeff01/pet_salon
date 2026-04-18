const { readJsonFile, writeJsonFile, getDataFilePath } = require('../utils/json-store');
const { nanoid } = require('nanoid');

const FILENAME = 'owners.json';

function getFilePath() {
  return getDataFilePath(FILENAME);
}

async function readOwners() {
  const data = await readJsonFile(getFilePath());
  return data.data || [];
}

async function writeOwners(owners) {
  await writeJsonFile(getFilePath(), { data: owners });
}

async function findAll() {
  return readOwners();
}

async function findById(id) {
  if (!id) return null;
  const owners = await readOwners();
  return owners.find(o => o.id === id) || null;
}

async function findByKeyword(keyword) {
  if (!keyword) return findAll();
  const owners = await readOwners();
  const kw = keyword.toLowerCase();
  return owners.filter(o =>
    (o.name && o.name.toLowerCase().includes(kw)) ||
    (o.phone && o.phone.toLowerCase().includes(kw))
  );
}

async function create(ownerData) {
  const owners = await readOwners();
  const newOwner = {
    id: `owner_${nanoid()}`,
    ...ownerData,
  };
  owners.push(newOwner);
  await writeOwners(owners);
  return newOwner;
}

async function update(id, updateData) {
  const owners = await readOwners();
  const index = owners.findIndex(o => o.id === id);
  if (index === -1) return null;
  owners[index] = { ...owners[index], ...updateData };
  await writeOwners(owners);
  return owners[index];
}

module.exports = { findAll, findById, findByKeyword, create, update };
