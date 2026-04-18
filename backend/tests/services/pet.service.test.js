describe('Pet Service', () => {
  let petService;
  let mockPetRepository;
  let mockOwnerRepository;

  beforeEach(() => {
    jest.resetModules();

    mockPetRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByOwnerId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    mockOwnerRepository = {
      findById: jest.fn(),
    };

    jest.doMock('../../src/repositories/pet.repository', () => mockPetRepository);
    jest.doMock('../../src/repositories/owner.repository', () => mockOwnerRepository);

    petService = require('../../src/services/pet.service');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const validPetData = {
    ownerId: 'owner_abc123',
    name: '小黑',
    species: '犬',
    breed: '柴犬',
    gender: '公',
    age: 3,
    isNeutered: true,
    personality: ['親人', '活潑'],
    physicalExamination: {
      weight: 10.5,
      heartRate: 'normal',
      temperature: 'normal',
    },
  };

  // BE-PS-001: Create pet generates ID starting with "pet_"
  describe('create', () => {
    test('generates ID starting with "pet_"', async () => {
      mockOwnerRepository.findById.mockResolvedValue({ id: 'owner_abc123', name: '王大明' });
      mockPetRepository.create.mockImplementation(async (data) => data);

      const result = await petService.create(validPetData);

      expect(result.id).toBeDefined();
      expect(result.id.startsWith('pet_')).toBe(true);
    });

    test('generated IDs are unique across multiple creates', async () => {
      mockOwnerRepository.findById.mockResolvedValue({ id: 'owner_abc123', name: '王大明' });
      mockPetRepository.create.mockImplementation(async (data) => data);

      const pet1 = await petService.create(validPetData);
      const pet2 = await petService.create(validPetData);
      const pet3 = await petService.create(validPetData);

      const ids = [pet1.id, pet2.id, pet3.id];
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });

    test('sets createdAt and updatedAt', async () => {
      mockOwnerRepository.findById.mockResolvedValue({ id: 'owner_abc123', name: '王大明' });
      mockPetRepository.create.mockImplementation(async (data) => data);

      const result = await petService.create(validPetData);

      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(new Date(result.createdAt).toISOString()).toBe(result.createdAt);
    });

    // BE-PS-002: ownerId doesn't exist → throws "查無此飼主"
    test('throws "查無此飼主" when ownerId does not exist', async () => {
      mockOwnerRepository.findById.mockResolvedValue(null);

      await expect(petService.create(validPetData)).rejects.toThrow('查無此飼主');
    });

    test('throws when ownerId is missing', async () => {
      const data = { ...validPetData };
      delete data.ownerId;

      await expect(petService.create(data)).rejects.toThrow();
    });

    // BE-PS-003: personality empty array → throws validation error
    test('throws validation error when personality is empty array', async () => {
      mockOwnerRepository.findById.mockResolvedValue({ id: 'owner_abc123', name: '王大明' });

      const data = { ...validPetData, personality: [] };

      await expect(petService.create(data)).rejects.toThrow(/personality|個性/i);
    });

    test('throws when personality is not an array', async () => {
      mockOwnerRepository.findById.mockResolvedValue({ id: 'owner_abc123', name: '王大明' });

      const data = { ...validPetData, personality: '活潑' };

      await expect(petService.create(data)).rejects.toThrow(/personality|個性/i);
    });

    test('throws when personality is missing', async () => {
      mockOwnerRepository.findById.mockResolvedValue({ id: 'owner_abc123', name: '王大明' });

      const data = { ...validPetData };
      delete data.personality;

      await expect(petService.create(data)).rejects.toThrow(/personality|個性/i);
    });

    // BE-PS-004: physicalExamination missing required fields → throws error
    test('throws when physicalExamination is missing', async () => {
      mockOwnerRepository.findById.mockResolvedValue({ id: 'owner_abc123', name: '王大明' });

      const data = { ...validPetData };
      delete data.physicalExamination;

      await expect(petService.create(data)).rejects.toThrow(/physicalExamination|健康檢查/i);
    });

    test('throws when physicalExamination is empty object', async () => {
      mockOwnerRepository.findById.mockResolvedValue({ id: 'owner_abc123', name: '王大明' });

      const data = { ...validPetData, physicalExamination: {} };

      await expect(petService.create(data)).rejects.toThrow(/physicalExamination|健康檢查/i);
    });

    // BE-PS-005: species must be "犬" or "貓"
    test('throws when species is not "犬" or "貓"', async () => {
      mockOwnerRepository.findById.mockResolvedValue({ id: 'owner_abc123', name: '王大明' });

      const data = { ...validPetData, species: '鳥' };

      await expect(petService.create(data)).rejects.toThrow(/species|物種/i);
    });

    test('accepts species "犬"', async () => {
      mockOwnerRepository.findById.mockResolvedValue({ id: 'owner_abc123', name: '王大明' });
      mockPetRepository.create.mockImplementation(async (data) => data);

      const data = { ...validPetData, species: '犬' };
      const result = await petService.create(data);

      expect(result.species).toBe('犬');
    });

    test('accepts species "貓"', async () => {
      mockOwnerRepository.findById.mockResolvedValue({ id: 'owner_abc123', name: '王大明' });
      mockPetRepository.create.mockImplementation(async (data) => data);

      const data = { ...validPetData, species: '貓' };
      const result = await petService.create(data);

      expect(result.species).toBe('貓');
    });

    test('throws when species is missing', async () => {
      mockOwnerRepository.findById.mockResolvedValue({ id: 'owner_abc123', name: '王大明' });

      const data = { ...validPetData };
      delete data.species;

      await expect(petService.create(data)).rejects.toThrow(/species|物種/i);
    });

    // gender must be "公" or "母"
    test('throws when gender is not "公" or "母"', async () => {
      mockOwnerRepository.findById.mockResolvedValue({ id: 'owner_abc123', name: '王大明' });

      const data = { ...validPetData, gender: '未知' };

      await expect(petService.create(data)).rejects.toThrow(/gender|性別/i);
    });

    test('accepts gender "公"', async () => {
      mockOwnerRepository.findById.mockResolvedValue({ id: 'owner_abc123', name: '王大明' });
      mockPetRepository.create.mockImplementation(async (data) => data);

      const result = await petService.create({ ...validPetData, gender: '公' });
      expect(result.gender).toBe('公');
    });

    test('accepts gender "母"', async () => {
      mockOwnerRepository.findById.mockResolvedValue({ id: 'owner_abc123', name: '王大明' });
      mockPetRepository.create.mockImplementation(async (data) => data);

      const result = await petService.create({ ...validPetData, gender: '母' });
      expect(result.gender).toBe('母');
    });

    test('throws when gender is missing', async () => {
      mockOwnerRepository.findById.mockResolvedValue({ id: 'owner_abc123', name: '王大明' });

      const data = { ...validPetData };
      delete data.gender;

      await expect(petService.create(data)).rejects.toThrow(/gender|性別/i);
    });

    // isNeutered must be boolean
    test('throws when isNeutered is not boolean', async () => {
      mockOwnerRepository.findById.mockResolvedValue({ id: 'owner_abc123', name: '王大明' });

      const data = { ...validPetData, isNeutered: 'yes' };

      await expect(petService.create(data)).rejects.toThrow(/isNeutered|結紮/i);
    });

    test('throws when isNeutered is missing', async () => {
      mockOwnerRepository.findById.mockResolvedValue({ id: 'owner_abc123', name: '王大明' });

      const data = { ...validPetData };
      delete data.isNeutered;

      await expect(petService.create(data)).rejects.toThrow(/isNeutered|結紮/i);
    });

    test('accepts isNeutered true', async () => {
      mockOwnerRepository.findById.mockResolvedValue({ id: 'owner_abc123', name: '王大明' });
      mockPetRepository.create.mockImplementation(async (data) => data);

      const result = await petService.create({ ...validPetData, isNeutered: true });
      expect(result.isNeutered).toBe(true);
    });

    test('accepts isNeutered false', async () => {
      mockOwnerRepository.findById.mockResolvedValue({ id: 'owner_abc123', name: '王大明' });
      mockPetRepository.create.mockImplementation(async (data) => data);

      const result = await petService.create({ ...validPetData, isNeutered: false });
      expect(result.isNeutered).toBe(false);
    });

    // breed is required
    test('throws when breed is missing', async () => {
      mockOwnerRepository.findById.mockResolvedValue({ id: 'owner_abc123', name: '王大明' });

      const data = { ...validPetData };
      delete data.breed;

      await expect(petService.create(data)).rejects.toThrow(/breed|品種/i);
    });

    test('throws when breed is empty string', async () => {
      mockOwnerRepository.findById.mockResolvedValue({ id: 'owner_abc123', name: '王大明' });

      const data = { ...validPetData, breed: '' };

      await expect(petService.create(data)).rejects.toThrow(/breed|品種/i);
    });

    // age is required
    test('throws when age is missing', async () => {
      mockOwnerRepository.findById.mockResolvedValue({ id: 'owner_abc123', name: '王大明' });

      const data = { ...validPetData };
      delete data.age;

      await expect(petService.create(data)).rejects.toThrow(/age|年齡/i);
    });

    // name is required
    test('throws when name is missing', async () => {
      mockOwnerRepository.findById.mockResolvedValue({ id: 'owner_abc123', name: '王大明' });

      const data = { ...validPetData };
      delete data.name;

      await expect(petService.create(data)).rejects.toThrow(/name|名字/i);
    });

    test('successfully creates pet with all valid fields', async () => {
      mockOwnerRepository.findById.mockResolvedValue({ id: 'owner_abc123', name: '王大明' });
      mockPetRepository.create.mockImplementation(async (data) => data);

      const result = await petService.create(validPetData);

      expect(result.name).toBe('小黑');
      expect(result.species).toBe('犬');
      expect(result.ownerId).toBe('owner_abc123');
    });
  });

  // findByOwnerId returns only that owner's pets
  describe('findByOwnerId', () => {
    test('returns pets for the specified owner', async () => {
      const ownerPets = [
        { id: 'pet_1', ownerId: 'owner_abc123', name: '小黑' },
        { id: 'pet_2', ownerId: 'owner_abc123', name: '咪咪' },
      ];
      mockPetRepository.findByOwnerId.mockResolvedValue(ownerPets);

      const result = await petService.findByOwnerId('owner_abc123');

      expect(result).toHaveLength(2);
      expect(result.every(p => p.ownerId === 'owner_abc123')).toBe(true);
      expect(mockPetRepository.findByOwnerId).toHaveBeenCalledWith('owner_abc123');
    });

    test('returns empty array when owner has no pets', async () => {
      mockPetRepository.findByOwnerId.mockResolvedValue([]);

      const result = await petService.findByOwnerId('owner_no_pets');

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    test('returns pet when found', async () => {
      const pet = { id: 'pet_1', name: '小黑' };
      mockPetRepository.findById.mockResolvedValue(pet);

      const result = await petService.getById('pet_1');

      expect(result).toEqual(pet);
    });

    test('returns null when pet not found', async () => {
      mockPetRepository.findById.mockResolvedValue(null);

      const result = await petService.getById('pet_nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    test('updates pet and returns updated data', async () => {
      const existingPet = { ...validPetData, id: 'pet_1', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };
      mockPetRepository.findById.mockResolvedValue(existingPet);
      mockPetRepository.update.mockImplementation(async (id, data) => ({ ...existingPet, ...data }));

      const result = await petService.update('pet_1', { name: '大黑' });

      expect(result.name).toBe('大黑');
      expect(result.updatedAt).toBeDefined();
    });

    test('returns null when pet not found', async () => {
      mockPetRepository.findById.mockResolvedValue(null);

      const result = await petService.update('pet_nonexistent', { name: '不存在' });

      expect(result).toBeNull();
    });
  });
});
