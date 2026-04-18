const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Appointment Repository', () => {
  let tmpDir;
  let appointmentRepository;
  const APPOINTMENTS_FILE = 'appointments.json';

  const sampleAppointments = {
    data: [
      {
        id: 'appt_001',
        ownerId: 'owner_abc123',
        petId: 'pet_abc123',
        date: '2026-04-20',
        time: '10:00',
        status: '已預約',
        note: '第一次來',
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      },
      {
        id: 'appt_002',
        ownerId: 'owner_abc123',
        petId: 'pet_abc123',
        date: '2026-04-20',
        time: '14:00',
        status: '已預約',
        note: '',
        createdAt: '2026-04-02T00:00:00.000Z',
        updatedAt: '2026-04-02T00:00:00.000Z',
      },
      {
        id: 'appt_003',
        ownerId: 'owner_def456',
        petId: 'pet_def456',
        date: '2026-04-21',
        time: '09:00',
        status: '已完成',
        note: '',
        createdAt: '2026-04-03T00:00:00.000Z',
        updatedAt: '2026-04-03T00:00:00.000Z',
      },
      {
        id: 'appt_004',
        ownerId: 'owner_def456',
        petId: 'pet_def456',
        date: '2026-04-20',
        time: '08:30',
        status: '已預約',
        note: '',
        createdAt: '2026-04-04T00:00:00.000Z',
        updatedAt: '2026-04-04T00:00:00.000Z',
      },
    ],
  };

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'appt-repo-test-'));
    const filePath = path.join(tmpDir, APPOINTMENTS_FILE);
    fs.writeFileSync(filePath, JSON.stringify(sampleAppointments, null, 2), 'utf-8');

    jest.resetModules();
    jest.doMock('../../src/utils/json-store', () => {
      const actual = jest.requireActual('../../src/utils/json-store');
      return {
        ...actual,
        getDataFilePath: (filename) => path.join(tmpDir, filename),
      };
    });

    appointmentRepository = require('../../src/repositories/appointment.repository');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  describe('findAll', () => {
    test('returns all appointments', async () => {
      const result = await appointmentRepository.findAll();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(4);
    });

    test('returns empty array when no appointments exist', async () => {
      const filePath = path.join(tmpDir, APPOINTMENTS_FILE);
      fs.writeFileSync(filePath, JSON.stringify({ data: [] }), 'utf-8');

      const result = await appointmentRepository.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findByDateRange', () => {
    test('returns appointments within date range', async () => {
      const result = await appointmentRepository.findByDateRange('2026-04-20', '2026-04-20');
      expect(result).toHaveLength(3);
    });

    test('returns appointments across multiple dates', async () => {
      const result = await appointmentRepository.findByDateRange('2026-04-20', '2026-04-21');
      expect(result).toHaveLength(4);
    });

    test('returns empty array when no appointments in range', async () => {
      const result = await appointmentRepository.findByDateRange('2026-05-01', '2026-05-31');
      expect(result).toEqual([]);
    });
  });

  describe('findByDate', () => {
    test('returns appointments for a specific date sorted by time ASC', async () => {
      const result = await appointmentRepository.findByDate('2026-04-20');
      expect(result).toHaveLength(3);
      expect(result[0].time).toBe('08:30');
      expect(result[1].time).toBe('10:00');
      expect(result[2].time).toBe('14:00');
    });

    test('returns empty array when no appointments on date', async () => {
      const result = await appointmentRepository.findByDate('2026-05-01');
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    test('returns appointment when id exists', async () => {
      const result = await appointmentRepository.findById('appt_001');
      expect(result).not.toBeNull();
      expect(result.id).toBe('appt_001');
      expect(result.ownerId).toBe('owner_abc123');
    });

    test('returns null when id does not exist', async () => {
      const result = await appointmentRepository.findById('appt_nonexistent');
      expect(result).toBeNull();
    });

    test('returns null for undefined id', async () => {
      const result = await appointmentRepository.findById(undefined);
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    test('creates new appointment and returns it', async () => {
      const newAppt = {
        id: 'appt_new',
        ownerId: 'owner_abc123',
        petId: 'pet_abc123',
        date: '2026-04-25',
        time: '11:00',
        status: '已預約',
        note: '新預約',
      };

      const result = await appointmentRepository.create(newAppt);
      expect(result.id).toBe('appt_new');
      expect(result.date).toBe('2026-04-25');
    });

    test('persists created appointment to JSON file', async () => {
      const newAppt = {
        id: 'appt_persist',
        ownerId: 'owner_abc123',
        petId: 'pet_abc123',
        date: '2026-04-26',
        time: '15:00',
        status: '已預約',
      };

      await appointmentRepository.create(newAppt);
      const all = await appointmentRepository.findAll();
      expect(all).toHaveLength(5);
      expect(all.some(a => a.id === 'appt_persist')).toBe(true);
    });
  });

  describe('update', () => {
    test('updates specific appointment fields', async () => {
      const result = await appointmentRepository.update('appt_001', { note: '已更新備註' });
      expect(result).not.toBeNull();
      expect(result.note).toBe('已更新備註');
      expect(result.ownerId).toBe('owner_abc123');
    });

    test('returns null when updating non-existent id', async () => {
      const result = await appointmentRepository.update('appt_nonexistent', { note: '不存在' });
      expect(result).toBeNull();
    });

    test('persists updates to JSON file', async () => {
      await appointmentRepository.update('appt_001', { status: '已取消' });
      const found = await appointmentRepository.findById('appt_001');
      expect(found.status).toBe('已取消');
    });
  });
});
