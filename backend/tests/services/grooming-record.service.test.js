describe('Grooming Record Service', () => {
  let groomingRecordService;
  let mockGroomingRecordRepository;
  let mockAppointmentRepository;
  let mockOwnerRepository;
  let mockPetRepository;

  beforeEach(() => {
    jest.resetModules();

    mockGroomingRecordRepository = {
      findByAppointmentId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn().mockImplementation(async (data) => data),
      update: jest.fn(),
    };

    mockAppointmentRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    mockOwnerRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    mockPetRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'pet_1',
        physicalExamination: { eyes: '正常', ears: '正常', teeth: '正常', limbs: '正常', skin: '正常', fur: '正常' },
        personality: ['親人'],
        medicalHistory: [],
      }),
    };

    jest.doMock('../../src/repositories/grooming-record.repository', () => mockGroomingRecordRepository);
    jest.doMock('../../src/repositories/appointment.repository', () => mockAppointmentRepository);
    jest.doMock('../../src/repositories/owner.repository', () => mockOwnerRepository);
    jest.doMock('../../src/repositories/pet.repository', () => mockPetRepository);

    groomingRecordService = require('../../src/services/grooming-record.service');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const validRecordData = {
    appointmentId: 'appt_001',
    services: [
      { item: '洗澡', price: 800 },
      { item: '美容', price: 500 },
    ],
    physicalExamination: {
      eyes: '正常',
      ears: '正常',
      teeth: '正常',
      limbs: '正常',
      skin: '正常',
      fur: '正常',
    },
    personality: ['親人', '活潑'],
    medicalHistory: [],
    ownerNotes: '',
    shopNotes: '',
    otherNotes: '',
  };

  const mockAppointment = {
    id: 'appt_001',
    ownerId: 'owner_abc123',
    petId: 'pet_abc123',
    date: '2026-04-20',
    time: '10:00',
    status: '已預約',
  };

  const mockOwner = {
    id: 'owner_abc123',
    name: '王大明',
    isStoredValueCustomer: false,
    storedValueBalance: 0,
  };

  describe('create', () => {
    test('generates ID with "rec_" prefix', async () => {
      mockAppointmentRepository.findById.mockResolvedValue(mockAppointment);
      mockOwnerRepository.findById.mockResolvedValue(mockOwner);
      mockGroomingRecordRepository.create.mockImplementation(async (data) => data);
      mockOwnerRepository.update.mockResolvedValue(mockOwner);

      const result = await groomingRecordService.create(validRecordData);
      expect(result.id).toBeDefined();
      expect(result.id.startsWith('rec_')).toBe(true);
    });

    test('sets createdAt and updatedAt', async () => {
      mockAppointmentRepository.findById.mockResolvedValue(mockAppointment);
      mockOwnerRepository.findById.mockResolvedValue(mockOwner);
      mockGroomingRecordRepository.create.mockImplementation(async (data) => data);
      mockOwnerRepository.update.mockResolvedValue(mockOwner);

      const result = await groomingRecordService.create(validRecordData);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(new Date(result.createdAt).toISOString()).toBe(result.createdAt);
    });

    test('sets serviceDate and serviceTime from appointment', async () => {
      mockAppointmentRepository.findById.mockResolvedValue(mockAppointment);
      mockOwnerRepository.findById.mockResolvedValue(mockOwner);
      mockGroomingRecordRepository.create.mockImplementation(async (data) => data);
      mockOwnerRepository.update.mockResolvedValue(mockOwner);

      const result = await groomingRecordService.create(validRecordData);
      expect(result.serviceDate).toBe('2026-04-20');
      expect(result.serviceTime).toBe('10:00');
    });
  });

  describe('validation', () => {
    test('throws when appointmentId is missing', async () => {
      const data = { ...validRecordData };
      delete data.appointmentId;
      await expect(groomingRecordService.create(data)).rejects.toThrow('appointmentId');
    });

    test('throws when appointmentId does not exist', async () => {
      mockAppointmentRepository.findById.mockResolvedValue(null);
      await expect(groomingRecordService.create(validRecordData)).rejects.toThrow();
    });

    test('throws when services is missing', async () => {
      mockAppointmentRepository.findById.mockResolvedValue(mockAppointment);
      const data = { ...validRecordData };
      delete data.services;
      await expect(groomingRecordService.create(data)).rejects.toThrow('services');
    });

    test('throws when services is empty array', async () => {
      mockAppointmentRepository.findById.mockResolvedValue(mockAppointment);
      const data = { ...validRecordData, services: [] };
      await expect(groomingRecordService.create(data)).rejects.toThrow('services');
    });

    test('throws when service item is invalid', async () => {
      mockAppointmentRepository.findById.mockResolvedValue(mockAppointment);
      const data = {
        ...validRecordData,
        services: [{ item: '按摩', price: 500 }],
      };
      await expect(groomingRecordService.create(data)).rejects.toThrow();
    });

    test('allows valid service items: 洗澡, 美容, 其他', async () => {
      mockAppointmentRepository.findById.mockResolvedValue(mockAppointment);
      mockOwnerRepository.findById.mockResolvedValue(mockOwner);
      mockGroomingRecordRepository.create.mockImplementation(async (data) => data);
      mockOwnerRepository.update.mockResolvedValue(mockOwner);

      const data = {
        ...validRecordData,
        services: [
          { item: '洗澡', price: 800 },
          { item: '美容', price: 500 },
          { item: '其他', price: 200 },
        ],
      };
      const result = await groomingRecordService.create(data);
      expect(result.services).toHaveLength(3);
    });

    test('throws when service price is negative', async () => {
      mockAppointmentRepository.findById.mockResolvedValue(mockAppointment);
      const data = {
        ...validRecordData,
        services: [{ item: '洗澡', price: -100 }],
      };
      await expect(groomingRecordService.create(data)).rejects.toThrow('price');
    });

    test('allows service price of 0', async () => {
      mockAppointmentRepository.findById.mockResolvedValue(mockAppointment);
      mockOwnerRepository.findById.mockResolvedValue(mockOwner);
      mockGroomingRecordRepository.create.mockImplementation(async (data) => data);
      mockOwnerRepository.update.mockResolvedValue(mockOwner);

      const data = {
        ...validRecordData,
        services: [{ item: '洗澡', price: 0 }],
      };
      const result = await groomingRecordService.create(data);
      expect(result.services[0].price).toBe(0);
    });

    test('inherits physicalExamination from pet when missing', async () => {
      mockAppointmentRepository.findById.mockResolvedValue(mockAppointment);
      const data = { ...validRecordData };
      delete data.physicalExamination;
      const result = await groomingRecordService.create(data);
      expect(result.physicalExamination).toBeDefined();
    });

    test('inherits personality from pet when missing', async () => {
      mockAppointmentRepository.findById.mockResolvedValue(mockAppointment);
      const data = { ...validRecordData };
      delete data.personality;
      const result = await groomingRecordService.create(data);
      expect(Array.isArray(result.personality)).toBe(true);
    });

    test('accepts service.type as alias for service.item', async () => {
      mockAppointmentRepository.findById.mockResolvedValue(mockAppointment);
      const data = {
        ...validRecordData,
        services: [{ type: '洗澡', price: 500 }],
      };
      const result = await groomingRecordService.create(data);
      expect(result.services[0].item).toBe('洗澡');
    });
  });

  describe('stored value calculation', () => {
    test('stored-value customer with enough balance: full deduction', async () => {
      const storedOwner = {
        ...mockOwner,
        isStoredValueCustomer: true,
        storedValueBalance: 5000,
      };
      mockAppointmentRepository.findById.mockResolvedValue(mockAppointment);
      mockOwnerRepository.findById.mockResolvedValue(storedOwner);
      mockGroomingRecordRepository.create.mockImplementation(async (data) => data);
      mockOwnerRepository.update.mockResolvedValue({
        ...storedOwner,
        storedValueBalance: 3700,
      });

      const result = await groomingRecordService.create(validRecordData);

      // total = 800 + 500 = 1300
      expect(result.storedValueDeduction).toBe(1300);
      expect(result.cashPayment).toBe(0);
      // Verify owner balance was updated
      expect(mockOwnerRepository.update).toHaveBeenCalledWith(
        'owner_abc123',
        expect.objectContaining({ storedValueBalance: 3700 })
      );
    });

    test('stored-value customer with partial balance: partial deduction', async () => {
      const storedOwner = {
        ...mockOwner,
        isStoredValueCustomer: true,
        storedValueBalance: 300,
      };
      mockAppointmentRepository.findById.mockResolvedValue(mockAppointment);
      mockOwnerRepository.findById.mockResolvedValue(storedOwner);
      mockGroomingRecordRepository.create.mockImplementation(async (data) => data);
      mockOwnerRepository.update.mockResolvedValue({
        ...storedOwner,
        storedValueBalance: 0,
      });

      // total = 800 + 500 = 1300, balance = 300
      const result = await groomingRecordService.create(validRecordData);

      expect(result.storedValueDeduction).toBe(300);
      expect(result.cashPayment).toBe(1000);
      expect(mockOwnerRepository.update).toHaveBeenCalledWith(
        'owner_abc123',
        expect.objectContaining({ storedValueBalance: 0 })
      );
    });

    test('non-stored-value customer: no deduction, full cash', async () => {
      mockAppointmentRepository.findById.mockResolvedValue(mockAppointment);
      mockOwnerRepository.findById.mockResolvedValue(mockOwner);
      mockGroomingRecordRepository.create.mockImplementation(async (data) => data);
      mockOwnerRepository.update.mockResolvedValue(mockOwner);

      const result = await groomingRecordService.create(validRecordData);

      // total = 800 + 500 = 1300
      expect(result.storedValueDeduction).toBe(0);
      expect(result.cashPayment).toBe(1300);
    });

    test('owner storedValueBalance is actually updated after creating record', async () => {
      const storedOwner = {
        ...mockOwner,
        isStoredValueCustomer: true,
        storedValueBalance: 5000,
      };
      mockAppointmentRepository.findById.mockResolvedValue(mockAppointment);
      mockOwnerRepository.findById.mockResolvedValue(storedOwner);
      mockGroomingRecordRepository.create.mockImplementation(async (data) => data);
      mockOwnerRepository.update.mockResolvedValue({
        ...storedOwner,
        storedValueBalance: 3700,
      });

      await groomingRecordService.create(validRecordData);

      // Verify owner.update was called with new balance
      expect(mockOwnerRepository.update).toHaveBeenCalled();
      const updateCall = mockOwnerRepository.update.mock.calls[0];
      expect(updateCall[0]).toBe('owner_abc123');
      expect(updateCall[1].storedValueBalance).toBe(3700);
    });
  });

  describe('getByAppointmentId', () => {
    test('returns record when found', async () => {
      const record = { id: 'rec_001', appointmentId: 'appt_001' };
      mockGroomingRecordRepository.findByAppointmentId.mockResolvedValue(record);

      const result = await groomingRecordService.getByAppointmentId('appt_001');
      expect(result).toEqual(record);
    });

    test('returns null when not found', async () => {
      mockGroomingRecordRepository.findByAppointmentId.mockResolvedValue(null);

      const result = await groomingRecordService.getByAppointmentId('appt_nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    test('updates record and sets updatedAt', async () => {
      const existing = {
        id: 'rec_001',
        appointmentId: 'appt_001',
        services: [{ item: '洗澡', price: 800 }],
        createdAt: '2026-04-20T10:00:00.000Z',
        updatedAt: '2026-04-20T10:00:00.000Z',
      };
      mockGroomingRecordRepository.findById.mockResolvedValue(existing);
      mockGroomingRecordRepository.update.mockImplementation(async (id, data) => ({
        ...existing,
        ...data,
      }));

      const result = await groomingRecordService.update('rec_001', { shopNotes: '表現良好' });
      expect(result.shopNotes).toBe('表現良好');
      expect(result.updatedAt).not.toBe('2026-04-20T10:00:00.000Z');
    });

    test('returns null when record not found', async () => {
      mockGroomingRecordRepository.findById.mockResolvedValue(null);

      const result = await groomingRecordService.update('rec_nonexistent', { shopNotes: 'x' });
      expect(result).toBeNull();
    });
  });
});
