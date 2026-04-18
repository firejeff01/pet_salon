const fs = require('fs');
const path = require('path');
const groomingRecordRepository = require('../repositories/grooming-record.repository');
const appointmentRepository = require('../repositories/appointment.repository');
const ownerRepository = require('../repositories/owner.repository');
const petRepository = require('../repositories/pet.repository');
const { toRocDate } = require('../utils/roc-date');
const { getDataFilePath } = require('../utils/json-store');
const { generatePdf } = require('../pdf-generator');

const DEFAULT_HOSPITAL = {
  name: '安欣動物醫院',
  phone: '03-3367775',
  address: '桃園市桃園區中福街60號',
};

let contractsDir = path.join(path.dirname(getDataFilePath('dummy')), 'contracts');

function _setContractsDir(newDir) {
  contractsDir = newDir;
}

function getContractsDir() {
  return contractsDir;
}

async function prepareContractData(recordId) {
  const record = await groomingRecordRepository.findById(recordId);
  if (!record) {
    throw new Error('查無此美容紀錄');
  }

  const appointment = await appointmentRepository.findById(record.appointmentId);
  if (!appointment) {
    throw new Error('查無此預約');
  }

  const owner = await ownerRepository.findById(appointment.ownerId);
  if (!owner) {
    throw new Error('查無此飼主');
  }

  const pet = await petRepository.findById(appointment.petId);
  if (!pet) {
    throw new Error('查無此寵物');
  }

  let hospital;
  if (owner.preferredAnimalHospital && owner.preferredAnimalHospital.trim() !== '') {
    hospital = {
      name: owner.preferredAnimalHospital,
      phone: owner.preferredAnimalHospitalPhone || '',
      address: owner.preferredAnimalHospitalAddress || '',
    };
  } else {
    hospital = { ...DEFAULT_HOSPITAL };
  }

  const rocDate = toRocDate(record.serviceDate);

  return {
    owner,
    pet,
    record,
    appointment,
    hospital,
    rocDate,
  };
}

function sanitizeFilename(name) {
  return name.replace(/[/\\:*?"<>|]/g, '_');
}

function generateFilename(record, pet, owner, version) {
  const dateStr = record.serviceDate.replace(/-/g, '');
  const timeStr = record.serviceTime.replace(/:/g, '');
  const petName = sanitizeFilename(pet.name);
  const ownerName = sanitizeFilename(owner.name);

  const versionSuffix = version > 1 ? `_v${version}` : '';
  return `${dateStr}_${timeStr}_${petName}_${ownerName}_契約${versionSuffix}.pdf`;
}

function dateFolder(serviceDate) {
  // serviceDate is YYYY-MM-DD; fold to YYYYMMDD for a tidy per-day subfolder.
  return (serviceDate || '').replace(/-/g, '') || 'unknown';
}

async function writePdfSafely(data, filename) {
  const bytes = await generatePdf(data);
  const dayDir = path.join(contractsDir, dateFolder(data.record.serviceDate));
  if (!fs.existsSync(dayDir)) {
    fs.mkdirSync(dayDir, { recursive: true });
  }
  const fullPath = path.join(dayDir, filename);
  fs.writeFileSync(fullPath, bytes);
  return fullPath;
}

async function generateContract(recordId, generatedBy) {
  const data = await prepareContractData(recordId);
  const { record, pet, owner } = data;

  const existingPaths = record.contractPaths || [];
  const version = existingPaths.length + 1;

  const filename = generateFilename(record, pet, owner, version);
  const now = new Date().toISOString();

  // Write the PDF first — if this fails we must NOT record metadata
  // (otherwise the UI lies: "success" but no file on disk).
  let absolutePath;
  try {
    absolutePath = await writePdfSafely(data, filename);
  } catch (err) {
    const hint = `PDF 寫檔失敗：${err.message}. 預期路徑：${contractsDir}`;
    const wrapped = new Error(hint);
    wrapped.statusCode = 500;
    wrapped.cause = err;
    throw wrapped;
  }

  const relativePath = path.posix.join(dateFolder(record.serviceDate), filename);
  const newContractPath = {
    version,
    path: relativePath,
    generatedAt: now,
    generatedBy: generatedBy || 'system',
  };

  const updatedPaths = [...existingPaths, newContractPath];

  await groomingRecordRepository.update(recordId, {
    contractPaths: updatedPaths,
    updatedAt: now,
  });

  return {
    contractPath: filename,
    absolutePath,
    version,
    generatedAt: now,
    data,
  };
}

async function getContractInfo(recordId) {
  const record = await groomingRecordRepository.findById(recordId);
  if (!record || !record.contractPaths || record.contractPaths.length === 0) {
    return null;
  }

  const latest = record.contractPaths[record.contractPaths.length - 1];
  return {
    contractPath: latest.path,
    version: latest.version,
    generatedAt: latest.generatedAt,
  };
}

async function getVersions(recordId) {
  const record = await groomingRecordRepository.findById(recordId);
  if (!record) return [];
  return record.contractPaths || [];
}

async function getContractBytes(recordId, version) {
  const record = await groomingRecordRepository.findById(recordId);
  if (!record || !record.contractPaths || record.contractPaths.length === 0) {
    return null;
  }

  let entry;
  if (version) {
    entry = record.contractPaths.find((c) => c.version === Number(version));
  } else {
    entry = record.contractPaths[record.contractPaths.length - 1];
  }
  if (!entry) return null;

  // Support both new (date-subfolder) and legacy (flat) layouts so existing
  // records still resolve after upgrade.
  const candidates = [
    path.join(contractsDir, entry.path),
    path.join(contractsDir, path.basename(entry.path)),
  ];
  const filePath = candidates.find((p) => fs.existsSync(p));
  if (!filePath) return null;
  return { filename: path.basename(entry.path), bytes: fs.readFileSync(filePath) };
}

async function signContract(recordId, signatureImage) {
  const record = await groomingRecordRepository.findById(recordId);
  if (!record) {
    throw new Error('查無此美容紀錄');
  }

  const now = new Date().toISOString();
  await groomingRecordRepository.update(recordId, {
    signatureImage,
    signedAt: now,
    updatedAt: now,
  });

  return { signed: true, signedAt: now };
}

module.exports = {
  prepareContractData,
  generateContract,
  getContractInfo,
  getVersions,
  getContractBytes,
  signContract,
  _setContractsDir,
  getContractsDir,
};
