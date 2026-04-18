const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Grooming Record Repository', () => {
  let tmpDir;
  let groomingRecordRepository;
  const RECORDS_FILE = 'grooming-records.json';

  const sampleRecords = {
    data: [
      {
        id: 'rec_001',
        appointmentId: 'appt_001',
        serviceDate: '2026-04-20',
        serviceTime: '10:00',
        services: [{ item: '洗澡', price: 800 }],
        storedValueDeduction: 0,
        cashPayment: 800,
        physicalExamination: { eyes: '正常', ears: '正常', teeth: '正常', limbs: '正常', skin: '正常', fur: '正常' },
        personality: ['親人'],
        createdAt: '2026-04-20T10:00:00.000Z',
        updatedAt: '2026-04-20T10:00:00.000Z',
      },
      {
        id: 'rec_002',
        appointmentId: 'appt_002',
        serviceDate: '2026-04-21',
        serviceTime: '14:00',
        services: [{ item: '美容', price: 1500 }],
        storedValueDeduction: 1500,
        cashPayment: 0,
        physicalExamination: { eyes: '正常', ears: '正常', teeth: '正常', limbs: '正常', skin: '正常', fur: '正常' },
        personality: ['怕生'],
        createdAt: '2026-04-21T14:00:00.000Z',
        updatedAt: '2026-04-21T14:00:00.000Z',
      },
    ],
  };

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grooming-repo-test-'));
    const filePath = path.join(tmpDir, RECORDS_FILE);
    fs.writeFileSync(filePath, JSON.stringify(sampleRecords, null, 2), 'utf-8');

    jest.resetModules();
    jest.doMock('../../src/utils/json-store', () => {
      const actual = jest.requireActual('../../src/utils/json-store');
      return {
        ...actual,
        getDataFilePath: (filename) => path.join(tmpDir, filename),
      };
    });

    groomingRecordRepository = require('../../src/repositories/grooming-record.repository');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  describe('findByAppointmentId', () => {
    test('returns record for a given appointmentId', async () => {
      const result = await groomingRecordRepository.findByAppointmentId('appt_001');
      expect(result).not.toBeNull();
      expect(result.appointmentId).toBe('appt_001');
    });

    test('returns null when appointmentId not found', async () => {
      const result = await groomingRecordRepository.findByAppointmentId('appt_nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    test('returns record when id exists', async () => {
      const result = await groomingRecordRepository.findById('rec_001');
      expect(result).not.toBeNull();
      expect(result.id).toBe('rec_001');
    });

    test('returns null when id not found', async () => {
      const result = await groomingRecordRepository.findById('rec_nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    test('creates new record and returns it', async () => {
      const newRecord = {
        id: 'rec_new',
        appointmentId: 'appt_003',
        serviceDate: '2026-04-22',
        serviceTime: '09:00',
        services: [{ item: '洗澡', price: 600 }],
        storedValueDeduction: 0,
        cashPayment: 600,
        physicalExamination: { eyes: '正常', ears: '正常', teeth: '正常', limbs: '正常', skin: '正常', fur: '正常' },
        personality: ['活潑'],
      };

      const result = await groomingRecordRepository.create(newRecord);
      expect(result.id).toBe('rec_new');
      expect(result.appointmentId).toBe('appt_003');
    });

    test('persists created record to JSON file', async () => {
      const newRecord = {
        id: 'rec_persist',
        appointmentId: 'appt_004',
        serviceDate: '2026-04-23',
        serviceTime: '11:00',
        services: [{ item: '美容', price: 1200 }],
      };

      await groomingRecordRepository.create(newRecord);
      const found = await groomingRecordRepository.findById('rec_persist');
      expect(found).not.toBeNull();
    });
  });

  describe('update', () => {
    test('updates record fields', async () => {
      const result = await groomingRecordRepository.update('rec_001', { cashPayment: 900 });
      expect(result).not.toBeNull();
      expect(result.cashPayment).toBe(900);
      expect(result.appointmentId).toBe('appt_001');
    });

    test('returns null when updating non-existent record', async () => {
      const result = await groomingRecordRepository.update('rec_nonexistent', { cashPayment: 0 });
      expect(result).toBeNull();
    });

    test('persists updates to JSON file', async () => {
      await groomingRecordRepository.update('rec_001', { cashPayment: 1000 });
      const found = await groomingRecordRepository.findById('rec_001');
      expect(found.cashPayment).toBe(1000);
    });
  });
});
