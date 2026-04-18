describe('Contract Service', () => {
  let contractService;
  let mockGroomingRecordRepository;
  let mockAppointmentRepository;
  let mockOwnerRepository;
  let mockPetRepository;

  beforeEach(() => {
    jest.resetModules();

    mockGroomingRecordRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    mockAppointmentRepository = {
      findById: jest.fn(),
    };

    mockOwnerRepository = {
      findById: jest.fn(),
    };

    mockPetRepository = {
      findById: jest.fn(),
    };

    jest.doMock('../../src/repositories/grooming-record.repository', () => mockGroomingRecordRepository);
    jest.doMock('../../src/repositories/appointment.repository', () => mockAppointmentRepository);
    jest.doMock('../../src/repositories/owner.repository', () => mockOwnerRepository);
    jest.doMock('../../src/repositories/pet.repository', () => mockPetRepository);
    jest.doMock('../../src/pdf-generator', () => ({
      generatePdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4\nmock%%EOF')),
      closeBrowser: jest.fn().mockResolvedValue(),
    }));

    contractService = require('../../src/services/contract.service');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockRecord = {
    id: 'rec_001',
    appointmentId: 'appt_001',
    serviceDate: '2026-04-20',
    serviceTime: '10:00',
    services: [{ item: '洗澡', price: 800 }, { item: '美容', price: 500 }],
    storedValueDeduction: 1300,
    cashPayment: 0,
    physicalExamination: {
      eyes: '正常',
      ears: '正常',
      teeth: '正常',
      limbs: '正常',
      skin: '正常',
      fur: '正常',
    },
    medicalHistory: ['曾骨折'],
    personality: ['親人', '活潑'],
    ownerNotes: '注意腳',
    shopNotes: '',
    otherNotes: '',
    contractPaths: [],
    createdAt: '2026-04-20T10:00:00.000Z',
    updatedAt: '2026-04-20T10:00:00.000Z',
  };

  const mockAppointment = {
    id: 'appt_001',
    ownerId: 'owner_abc123',
    petId: 'pet_abc123',
    date: '2026-04-20',
    time: '10:00',
  };

  const mockOwner = {
    id: 'owner_abc123',
    name: '王大明',
    nationalId: 'A123456789',
    phone: '0912345678',
    address: '台北市信義區松仁路100號',
    emergencyContactName: '王小明',
    emergencyContactPhone: '0922333444',
    emergencyContactRelationship: '兄弟',
    isStoredValueCustomer: true,
    storedValueBalance: 3700,
    preferredAnimalHospital: '大安動物醫院',
    preferredAnimalHospitalPhone: '02-27001234',
    preferredAnimalHospitalAddress: '台北市大安區復興南路100號',
  };

  const mockPet = {
    id: 'pet_abc123',
    name: '小白',
    species: '狗',
    breed: '貴賓',
    gender: '公',
    age: 3,
    chipNumber: '900000000000001',
    isNeutered: true,
  };

  function setupMocks() {
    mockGroomingRecordRepository.findById.mockResolvedValue({ ...mockRecord });
    mockAppointmentRepository.findById.mockResolvedValue(mockAppointment);
    mockOwnerRepository.findById.mockResolvedValue(mockOwner);
    mockPetRepository.findById.mockResolvedValue(mockPet);
    mockGroomingRecordRepository.update.mockImplementation(async (id, data) => ({
      ...mockRecord,
      ...data,
    }));
  }

  describe('prepareContractData', () => {
    test('gathers owner + pet + grooming data', async () => {
      setupMocks();

      const data = await contractService.prepareContractData('rec_001');

      expect(data.owner.name).toBe('王大明');
      expect(data.pet.name).toBe('小白');
      expect(data.record.id).toBe('rec_001');
    });

    test('throws when record not found', async () => {
      mockGroomingRecordRepository.findById.mockResolvedValue(null);

      await expect(contractService.prepareContractData('rec_nonexistent')).rejects.toThrow();
    });

    test('page 1 data includes pet and owner info', async () => {
      setupMocks();

      const data = await contractService.prepareContractData('rec_001');

      // Pet info
      expect(data.pet.name).toBe('小白');
      expect(data.pet.species).toBe('狗');
      expect(data.pet.breed).toBe('貴賓');
      expect(data.pet.gender).toBe('公');
      expect(data.pet.age).toBe(3);
      expect(data.pet.chipNumber).toBe('900000000000001');

      // Owner info
      expect(data.owner.name).toBe('王大明');
      expect(data.owner.nationalId).toBe('A123456789');
      expect(data.owner.phone).toBe('0912345678');
      expect(data.owner.address).toBe('台北市信義區松仁路100號');
      expect(data.owner.emergencyContactName).toBe('王小明');
    });

    test('page 3 data includes ROC date', async () => {
      setupMocks();

      const data = await contractService.prepareContractData('rec_001');

      // 2026 - 1911 = 115
      expect(data.rocDate).toContain('115');
      expect(data.rocDate).toContain('中華民國');
    });

    test('page 4 data includes personality, physical exam, services', async () => {
      setupMocks();

      const data = await contractService.prepareContractData('rec_001');

      expect(data.record.personality).toEqual(['親人', '活潑']);
      expect(data.record.physicalExamination.eyes).toBe('正常');
      expect(data.record.services).toHaveLength(2);
      expect(data.record.medicalHistory).toEqual(['曾骨折']);
    });

    test('hospital logic: uses owner preferred hospital when present', async () => {
      setupMocks();

      const data = await contractService.prepareContractData('rec_001');

      expect(data.hospital.name).toBe('大安動物醫院');
      expect(data.hospital.phone).toBe('02-27001234');
      expect(data.hospital.address).toBe('台北市大安區復興南路100號');
    });

    test('hospital logic: uses default hospital when owner has none', async () => {
      setupMocks();
      mockOwnerRepository.findById.mockResolvedValue({
        ...mockOwner,
        preferredAnimalHospital: '',
        preferredAnimalHospitalPhone: '',
        preferredAnimalHospitalAddress: '',
      });

      const data = await contractService.prepareContractData('rec_001');

      expect(data.hospital.name).toBe('安欣動物醫院');
      expect(data.hospital.phone).toBe('03-3367775');
      expect(data.hospital.address).toBe('桃園市桃園區中福街60號');
    });

    test('includes neutered status and stored value info', async () => {
      setupMocks();

      const data = await contractService.prepareContractData('rec_001');

      expect(data.pet.isNeutered).toBe(true);
      expect(data.owner.isStoredValueCustomer).toBe(true);
      expect(data.record.storedValueDeduction).toBe(1300);
    });
  });

  describe('version management', () => {
    test('first time generates version 1', async () => {
      setupMocks();

      const result = await contractService.generateContract('rec_001', 'admin');

      expect(result.version).toBe(1);
    });

    test('second time generates version 2', async () => {
      setupMocks();
      // Record already has one contractPath
      mockGroomingRecordRepository.findById.mockResolvedValue({
        ...mockRecord,
        contractPaths: [
          { version: 1, path: 'old.pdf', generatedAt: '2026-04-20T10:00:00.000Z', generatedBy: 'admin' },
        ],
      });

      const result = await contractService.generateContract('rec_001', 'admin');

      expect(result.version).toBe(2);
    });

    test('records generatedAt and generatedBy in contractPaths', async () => {
      setupMocks();

      const result = await contractService.generateContract('rec_001', 'admin');

      expect(mockGroomingRecordRepository.update).toHaveBeenCalled();
      const updateCall = mockGroomingRecordRepository.update.mock.calls[0];
      const contractPaths = updateCall[1].contractPaths;
      expect(contractPaths).toHaveLength(1);
      expect(contractPaths[0].generatedBy).toBe('admin');
      expect(contractPaths[0].generatedAt).toBeDefined();
      expect(contractPaths[0].version).toBe(1);
    });
  });

  describe('filename generation', () => {
    test('format: YYYYMMDD_HHmm_petName_ownerName_契約.pdf', async () => {
      setupMocks();

      const result = await contractService.generateContract('rec_001', 'admin');

      // Should match pattern like 20260420_1000_小白_王大明_契約.pdf (date from serviceDate)
      expect(result.contractPath).toMatch(/^\d{8}_\d{4}_小白_王大明_契約\.pdf$/);
    });

    test('version 2: includes _v2 suffix', async () => {
      setupMocks();
      mockGroomingRecordRepository.findById.mockResolvedValue({
        ...mockRecord,
        contractPaths: [
          { version: 1, path: '20260420_1000_小白_王大明_契約.pdf', generatedAt: '2026-04-20T10:00:00.000Z', generatedBy: 'admin' },
        ],
      });

      const result = await contractService.generateContract('rec_001', 'admin');

      expect(result.contractPath).toMatch(/_契約_v2\.pdf$/);
    });

    test('special characters in names replaced with _', async () => {
      setupMocks();
      mockPetRepository.findById.mockResolvedValue({
        ...mockPet,
        name: '小白/黑',
      });
      mockOwnerRepository.findById.mockResolvedValue({
        ...mockOwner,
        name: '王\\大明',
      });

      const result = await contractService.generateContract('rec_001', 'admin');

      expect(result.contractPath).not.toContain('/');
      expect(result.contractPath).not.toContain('\\');
    });
  });

  describe('error handling', () => {
    test('throws when record not found', async () => {
      mockGroomingRecordRepository.findById.mockResolvedValue(null);

      await expect(contractService.generateContract('rec_nonexistent', 'admin')).rejects.toThrow();
    });
  });
});
