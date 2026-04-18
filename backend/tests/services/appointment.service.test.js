describe('Appointment Service', () => {
  let appointmentService;
  let mockAppointmentRepository;
  let mockOwnerRepository;
  let mockPetRepository;
  let mockGroomingRecordRepository;

  beforeEach(() => {
    jest.resetModules();

    mockAppointmentRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByDateRange: jest.fn(),
      findByDate: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    mockOwnerRepository = { findById: jest.fn().mockResolvedValue(null) };
    mockPetRepository = { findById: jest.fn().mockResolvedValue(null) };
    mockGroomingRecordRepository = { findAll: jest.fn().mockResolvedValue([]) };

    jest.doMock('../../src/repositories/appointment.repository', () => mockAppointmentRepository);
    jest.doMock('../../src/repositories/owner.repository', () => mockOwnerRepository);
    jest.doMock('../../src/repositories/pet.repository', () => mockPetRepository);
    jest.doMock('../../src/repositories/grooming-record.repository', () => mockGroomingRecordRepository);

    appointmentService = require('../../src/services/appointment.service');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const validAppointmentData = {
    ownerId: 'owner_abc123',
    petId: 'pet_abc123',
    date: '2026-04-20',
    time: '10:00',
    note: '第一次美容',
  };

  describe('create', () => {
    test('generates ID with "appt_" prefix', async () => {
      mockAppointmentRepository.create.mockImplementation(async (data) => data);

      const result = await appointmentService.create(validAppointmentData);
      expect(result.id).toBeDefined();
      expect(result.id.startsWith('appt_')).toBe(true);
    });

    test('sets createdAt and updatedAt as ISO 8601', async () => {
      mockAppointmentRepository.create.mockImplementation(async (data) => data);

      const result = await appointmentService.create(validAppointmentData);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(new Date(result.createdAt).toISOString()).toBe(result.createdAt);
      expect(result.createdAt).toBe(result.updatedAt);
    });

    test('defaults status to "已預約"', async () => {
      mockAppointmentRepository.create.mockImplementation(async (data) => data);

      const result = await appointmentService.create(validAppointmentData);
      expect(result.status).toBe('已預約');
    });

    test('generated IDs are unique', async () => {
      mockAppointmentRepository.create.mockImplementation(async (data) => data);

      const r1 = await appointmentService.create(validAppointmentData);
      const r2 = await appointmentService.create(validAppointmentData);
      expect(r1.id).not.toBe(r2.id);
    });
  });

  describe('validation - required fields', () => {
    test('throws when ownerId is missing', async () => {
      const data = { ...validAppointmentData };
      delete data.ownerId;
      await expect(appointmentService.create(data)).rejects.toThrow('ownerId');
    });

    test('throws when petId is missing', async () => {
      const data = { ...validAppointmentData };
      delete data.petId;
      await expect(appointmentService.create(data)).rejects.toThrow('petId');
    });

    test('throws when date is missing', async () => {
      const data = { ...validAppointmentData };
      delete data.date;
      await expect(appointmentService.create(data)).rejects.toThrow('date');
    });

    test('throws when time is missing', async () => {
      const data = { ...validAppointmentData };
      delete data.time;
      await expect(appointmentService.create(data)).rejects.toThrow('time');
    });

    test('throws when ownerId is empty string', async () => {
      const data = { ...validAppointmentData, ownerId: '' };
      await expect(appointmentService.create(data)).rejects.toThrow('ownerId');
    });

    test('throws when date format is invalid (not YYYY-MM-DD)', async () => {
      const data = { ...validAppointmentData, date: '04/20/2026' };
      await expect(appointmentService.create(data)).rejects.toThrow('date');
    });

    test('throws when time format is invalid (not HH:mm)', async () => {
      const data = { ...validAppointmentData, time: '10am' };
      await expect(appointmentService.create(data)).rejects.toThrow('time');
    });
  });

  describe('cancel', () => {
    test('sets status to "已取消" with cancelReason', async () => {
      const existing = {
        id: 'appt_001',
        ...validAppointmentData,
        status: '已預約',
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      };
      mockAppointmentRepository.findById.mockResolvedValue(existing);
      mockAppointmentRepository.update.mockImplementation(async (id, data) => ({
        ...existing,
        ...data,
      }));

      const result = await appointmentService.update('appt_001', {
        status: '已取消',
        cancelReason: '飼主臨時有事',
      });

      expect(result.status).toBe('已取消');
      expect(result.cancelReason).toBe('飼主臨時有事');
    });

    test('throws "取消預約時必須填寫取消原因" when cancel without reason', async () => {
      const existing = {
        id: 'appt_001',
        ...validAppointmentData,
        status: '已預約',
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      };
      mockAppointmentRepository.findById.mockResolvedValue(existing);

      await expect(
        appointmentService.update('appt_001', { status: '已取消' })
      ).rejects.toThrow('取消預約時必須填寫取消原因');
    });

    test('throws when cancel reason is empty string', async () => {
      const existing = {
        id: 'appt_001',
        ...validAppointmentData,
        status: '已預約',
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      };
      mockAppointmentRepository.findById.mockResolvedValue(existing);

      await expect(
        appointmentService.update('appt_001', { status: '已取消', cancelReason: '' })
      ).rejects.toThrow('取消預約時必須填寫取消原因');
    });
  });

  describe('update', () => {
    test('updates updatedAt timestamp', async () => {
      const existing = {
        id: 'appt_001',
        ...validAppointmentData,
        status: '已預約',
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      };
      mockAppointmentRepository.findById.mockResolvedValue(existing);
      mockAppointmentRepository.update.mockImplementation(async (id, data) => ({
        ...existing,
        ...data,
      }));

      const result = await appointmentService.update('appt_001', { note: '更新備註' });
      expect(result.updatedAt).toBeDefined();
      expect(new Date(result.updatedAt).getTime()).toBeGreaterThan(new Date('2026-04-01').getTime());
    });

    test('returns null when appointment not found', async () => {
      mockAppointmentRepository.findById.mockResolvedValue(null);

      const result = await appointmentService.update('appt_nonexistent', { note: 'x' });
      expect(result).toBeNull();
    });
  });

  describe('query', () => {
    test('getByDateRange delegates to repository', async () => {
      const mockResults = [{ id: 'appt_001', date: '2026-04-20', ownerId: 'owner_1', petId: 'pet_1' }];
      mockAppointmentRepository.findByDateRange.mockResolvedValue(mockResults);

      const result = await appointmentService.getByDateRange('2026-04-20', '2026-04-21');
      expect(mockAppointmentRepository.findByDateRange).toHaveBeenCalledWith('2026-04-20', '2026-04-21');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({ id: 'appt_001', date: '2026-04-20' }));
    });

    test('getByDate delegates to repository', async () => {
      const mockResults = [
        { id: 'appt_002', time: '14:00', ownerId: 'owner_1', petId: 'pet_1' },
        { id: 'appt_001', time: '10:00', ownerId: 'owner_1', petId: 'pet_1' },
      ];
      mockAppointmentRepository.findByDate.mockResolvedValue(mockResults);

      const result = await appointmentService.getByDate('2026-04-20');
      expect(mockAppointmentRepository.findByDate).toHaveBeenCalledWith('2026-04-20');
      expect(result).toHaveLength(2);
    });

    test('getById delegates to repository', async () => {
      const appt = { id: 'appt_001', ownerId: 'owner_abc123', petId: 'pet_1' };
      mockAppointmentRepository.findById.mockResolvedValue(appt);

      const result = await appointmentService.getById('appt_001');
      expect(result).toEqual(expect.objectContaining(appt));
    });

    test('getByDate enriches with owner name / pet name / hasContract', async () => {
      mockAppointmentRepository.findByDate.mockResolvedValue([
        { id: 'appt_1', date: '2026-04-20', time: '10:00', ownerId: 'owner_1', petId: 'pet_1' },
      ]);
      mockOwnerRepository.findById.mockResolvedValue({ id: 'owner_1', name: '王小明', phone: '0912' });
      mockPetRepository.findById.mockResolvedValue({ id: 'pet_1', name: '小白' });
      mockGroomingRecordRepository.findAll.mockResolvedValue([
        { appointmentId: 'appt_1', contractPaths: [{ version: 1 }] },
      ]);

      const result = await appointmentService.getByDate('2026-04-20');
      expect(result[0].ownerName).toBe('王小明');
      expect(result[0].ownerPhone).toBe('0912');
      expect(result[0].petName).toBe('小白');
      expect(result[0].hasContract).toBe(true);
    });

    test('getByMonth converts to date range', async () => {
      mockAppointmentRepository.findByDateRange.mockResolvedValue([]);
      await appointmentService.getByMonth(2026, 4);
      expect(mockAppointmentRepository.findByDateRange).toHaveBeenCalledWith('2026-04-01', '2026-04-30');
    });
  });
});
