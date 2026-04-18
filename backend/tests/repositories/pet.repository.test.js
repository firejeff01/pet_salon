const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Pet Repository', () => {
  let tmpDir;
  let petRepository;
  const PETS_FILE = 'pets.json';

  const samplePets = {
    data: [
      {
        id: 'pet_aaa111',
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
        createdAt: '2026-01-15T00:00:00.000Z',
        updatedAt: '2026-01-15T00:00:00.000Z',
      },
      {
        id: 'pet_bbb222',
        ownerId: 'owner_abc123',
        name: '咪咪',
        species: '貓',
        breed: '波斯貓',
        gender: '母',
        age: 2,
        isNeutered: false,
        personality: ['怕生', '安靜'],
        physicalExamination: {
          weight: 4.2,
          heartRate: 'normal',
          temperature: 'normal',
        },
        createdAt: '2026-02-10T00:00:00.000Z',
        updatedAt: '2026-02-10T00:00:00.000Z',
      },
      {
        id: 'pet_ccc333',
        ownerId: 'owner_def456',
        name: '毛毛',
        species: '犬',
        breed: '貴賓犬',
        gender: '母',
        age: 5,
        isNeutered: true,
        personality: ['溫馴'],
        physicalExamination: {
          weight: 6.0,
          heartRate: 'normal',
          temperature: 'normal',
        },
        createdAt: '2026-03-05T00:00:00.000Z',
        updatedAt: '2026-03-05T00:00:00.000Z',
      },
    ],
  };

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pet-repo-test-'));
    const filePath = path.join(tmpDir, PETS_FILE);
    fs.writeFileSync(filePath, JSON.stringify(samplePets, null, 2), 'utf-8');

    jest.resetModules();
    jest.doMock('../../src/utils/json-store', () => {
      const actual = jest.requireActual('../../src/utils/json-store');
      return {
        ...actual,
        getDataFilePath: (filename) => path.join(tmpDir, filename),
      };
    });

    petRepository = require('../../src/repositories/pet.repository');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  // BE-PR-001: findByOwnerId(ownerId) returns pets for that owner
  describe('findByOwnerId', () => {
    test('returns all pets belonging to the specified owner', async () => {
      const result = await petRepository.findByOwnerId('owner_abc123');

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result.every(p => p.ownerId === 'owner_abc123')).toBe(true);
    });

    test('returns only pets for the specified owner, not others', async () => {
      const result = await petRepository.findByOwnerId('owner_def456');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('毛毛');
      expect(result[0].ownerId).toBe('owner_def456');
    });

    test('returns empty array when owner has no pets', async () => {
      const result = await petRepository.findByOwnerId('owner_no_pets');

      expect(result).toEqual([]);
    });

    test('returned pets have all expected fields', async () => {
      const result = await petRepository.findByOwnerId('owner_abc123');
      const pet = result[0];

      expect(pet).toHaveProperty('id');
      expect(pet).toHaveProperty('ownerId');
      expect(pet).toHaveProperty('name');
      expect(pet).toHaveProperty('species');
      expect(pet).toHaveProperty('breed');
      expect(pet).toHaveProperty('gender');
      expect(pet).toHaveProperty('age');
      expect(pet).toHaveProperty('isNeutered');
      expect(pet).toHaveProperty('personality');
      expect(pet).toHaveProperty('physicalExamination');
    });
  });

  // BE-PR-002: findById(petId) returns pet or null
  describe('findById', () => {
    test('returns the correct pet when id exists', async () => {
      const result = await petRepository.findById('pet_aaa111');

      expect(result).not.toBeNull();
      expect(result.id).toBe('pet_aaa111');
      expect(result.name).toBe('小黑');
      expect(result.species).toBe('犬');
    });

    test('returns null when pet id does not exist', async () => {
      const result = await petRepository.findById('pet_nonexistent');

      expect(result).toBeNull();
    });

    test('returns pet with Chinese characters intact', async () => {
      const result = await petRepository.findById('pet_bbb222');

      expect(result.name).toBe('咪咪');
      expect(result.breed).toBe('波斯貓');
      expect(result.personality).toContain('怕生');
    });
  });

  // BE-PR-003: create(data) writes to JSON
  describe('create', () => {
    test('creates new pet and returns data with id', async () => {
      const newPet = {
        ownerId: 'owner_abc123',
        name: '小白',
        species: '犬',
        breed: '馬爾濟斯',
        gender: '公',
        age: 1,
        isNeutered: false,
        personality: ['活潑', '黏人'],
        physicalExamination: {
          weight: 3.0,
          heartRate: 'normal',
          temperature: 'normal',
        },
      };

      const result = await petRepository.create(newPet);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe('小白');
      expect(result.ownerId).toBe('owner_abc123');
    });

    test('persists created pet to the JSON file', async () => {
      const newPet = {
        ownerId: 'owner_def456',
        name: '球球',
        species: '貓',
        breed: '英國短毛貓',
        gender: '母',
        age: 4,
        isNeutered: true,
        personality: ['獨立'],
        physicalExamination: { weight: 5.0, heartRate: 'normal', temperature: 'normal' },
      };

      await petRepository.create(newPet);

      const ownerPets = await petRepository.findByOwnerId('owner_def456');
      expect(ownerPets).toHaveLength(2);
      expect(ownerPets.some(p => p.name === '球球')).toBe(true);
    });

    test('created pet can be retrieved by findById', async () => {
      const newPet = {
        ownerId: 'owner_abc123',
        name: '花花',
        species: '貓',
        breed: '米克斯',
        gender: '母',
        age: 2,
        isNeutered: true,
        personality: ['溫馴', '親人'],
        physicalExamination: { weight: 3.5, heartRate: 'normal', temperature: 'normal' },
      };

      const created = await petRepository.create(newPet);
      const found = await petRepository.findById(created.id);

      expect(found).not.toBeNull();
      expect(found.name).toBe('花花');
      expect(found.breed).toBe('米克斯');
    });

    test('multiple creates generate unique ids', async () => {
      const basePet = {
        ownerId: 'owner_abc123',
        species: '犬',
        breed: '柴犬',
        gender: '公',
        age: 1,
        isNeutered: false,
        personality: ['活潑'],
        physicalExamination: { weight: 5.0, heartRate: 'normal', temperature: 'normal' },
      };

      const pet1 = await petRepository.create({ ...basePet, name: '一號' });
      const pet2 = await petRepository.create({ ...basePet, name: '二號' });
      const pet3 = await petRepository.create({ ...basePet, name: '三號' });

      expect(pet1.id).not.toBe(pet2.id);
      expect(pet2.id).not.toBe(pet3.id);
      expect(pet1.id).not.toBe(pet3.id);
    });
  });

  // BE-PR-004: update(id, data) updates pet
  describe('update', () => {
    test('updates specific pet fields', async () => {
      const result = await petRepository.update('pet_aaa111', {
        name: '小黑改名大黑',
        age: 4,
      });

      expect(result).not.toBeNull();
      expect(result.name).toBe('小黑改名大黑');
      expect(result.age).toBe(4);
      // Unchanged fields remain
      expect(result.species).toBe('犬');
      expect(result.breed).toBe('柴犬');
    });

    test('persists updates to JSON file', async () => {
      await petRepository.update('pet_bbb222', { isNeutered: true });

      const found = await petRepository.findById('pet_bbb222');
      expect(found.isNeutered).toBe(true);
    });

    test('returns null when updating non-existent pet', async () => {
      const result = await petRepository.update('pet_nonexistent', { name: '不存在' });

      expect(result).toBeNull();
    });

    test('does not affect other pets when updating one', async () => {
      await petRepository.update('pet_aaa111', { name: '改名了' });

      const other = await petRepository.findById('pet_bbb222');
      expect(other.name).toBe('咪咪');
    });

    test('can update personality array', async () => {
      await petRepository.update('pet_ccc333', {
        personality: ['溫馴', '愛撒嬌', '會握手'],
      });

      const found = await petRepository.findById('pet_ccc333');
      expect(found.personality).toEqual(['溫馴', '愛撒嬌', '會握手']);
    });
  });
});
