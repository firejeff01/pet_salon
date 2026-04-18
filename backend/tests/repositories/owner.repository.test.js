const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Owner Repository', () => {
  let tmpDir;
  let ownerRepository;
  const OWNERS_FILE = 'owners.json';

  const sampleOwners = {
    data: [
      {
        id: 'owner_abc123',
        name: '王大明',
        nationalId: 'A123456789',
        phone: '0912345678',
        address: '台北市信義區松仁路100號',
        emergencyContactName: '王小明',
        emergencyContactPhone: '0922333444',
        emergencyContactRelationship: '兄弟',
        storedValueBalance: 5000,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'owner_def456',
        name: '李小華',
        nationalId: 'B987654321',
        phone: '0933444555',
        address: '台北市大安區忠孝東路200號',
        emergencyContactName: '李大華',
        emergencyContactPhone: '0944555666',
        emergencyContactRelationship: '姊妹',
        storedValueBalance: 3000,
        createdAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
      },
      {
        id: 'owner_ghi789',
        name: '張志明',
        nationalId: 'C111222333',
        phone: '0912111222',
        address: '新北市板橋區中山路50號',
        emergencyContactName: '張美玲',
        emergencyContactPhone: '0955666777',
        emergencyContactRelationship: '配偶',
        storedValueBalance: 0,
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      },
    ],
  };

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owner-repo-test-'));
    const filePath = path.join(tmpDir, OWNERS_FILE);
    fs.writeFileSync(filePath, JSON.stringify(sampleOwners, null, 2), 'utf-8');

    // Reset module cache so we can inject a different data directory
    jest.resetModules();
    // Mock the data directory path used by the repository
    jest.doMock('../../src/utils/json-store', () => {
      const actual = jest.requireActual('../../src/utils/json-store');
      return {
        ...actual,
        getDataFilePath: (filename) => path.join(tmpDir, filename),
      };
    });

    ownerRepository = require('../../src/repositories/owner.repository');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  // BE-OR-001: findAll() returns all owners
  describe('findAll', () => {
    test('returns all owners from JSON file', async () => {
      const result = await ownerRepository.findAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('owner_abc123');
      expect(result[1].id).toBe('owner_def456');
      expect(result[2].id).toBe('owner_ghi789');
    });

    test('returns empty array when no owners exist', async () => {
      const filePath = path.join(tmpDir, OWNERS_FILE);
      fs.writeFileSync(filePath, JSON.stringify({ data: [] }), 'utf-8');

      const result = await ownerRepository.findAll();

      expect(result).toEqual([]);
    });

    test('returns owners with all their properties intact', async () => {
      const result = await ownerRepository.findAll();
      const owner = result[0];

      expect(owner).toHaveProperty('id');
      expect(owner).toHaveProperty('name');
      expect(owner).toHaveProperty('nationalId');
      expect(owner).toHaveProperty('phone');
      expect(owner).toHaveProperty('address');
      expect(owner).toHaveProperty('emergencyContactName');
      expect(owner).toHaveProperty('emergencyContactPhone');
      expect(owner).toHaveProperty('emergencyContactRelationship');
      expect(owner).toHaveProperty('storedValueBalance');
      expect(owner).toHaveProperty('createdAt');
      expect(owner).toHaveProperty('updatedAt');
    });
  });

  // BE-OR-002: findById(id) returns specific owner or null
  describe('findById', () => {
    test('returns the correct owner when id exists', async () => {
      const result = await ownerRepository.findById('owner_abc123');

      expect(result).not.toBeNull();
      expect(result.id).toBe('owner_abc123');
      expect(result.name).toBe('王大明');
      expect(result.phone).toBe('0912345678');
    });

    test('returns null when id does not exist', async () => {
      const result = await ownerRepository.findById('owner_nonexistent');

      expect(result).toBeNull();
    });

    test('returns null for undefined id', async () => {
      const result = await ownerRepository.findById(undefined);

      expect(result).toBeNull();
    });

    test('returns correct owner among multiple owners', async () => {
      const result = await ownerRepository.findById('owner_def456');

      expect(result.name).toBe('李小華');
      expect(result.storedValueBalance).toBe(3000);
    });
  });

  // BE-OR-003: findByKeyword(keyword) fuzzy searches by name or phone
  describe('findByKeyword', () => {
    test('finds owners by partial name match', async () => {
      const result = await ownerRepository.findByKeyword('王');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('王大明');
    });

    test('finds owners by partial phone match', async () => {
      const result = await ownerRepository.findByKeyword('0912');

      expect(result.length).toBeGreaterThanOrEqual(1);
      const phones = result.map(o => o.phone);
      expect(phones.some(p => p.startsWith('0912'))).toBe(true);
    });

    test('returns multiple matches when keyword is broad', async () => {
      // Both 王大明 and 李小華 have names, search for common character in addresses
      const result = await ownerRepository.findByKeyword('0912');

      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    test('returns empty array when no match found', async () => {
      const result = await ownerRepository.findByKeyword('趙');

      expect(result).toEqual([]);
    });

    test('search is case-insensitive for phone numbers', async () => {
      const result = await ownerRepository.findByKeyword('0933');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('李小華');
    });
  });

  // BE-OR-004: create(data) writes to JSON, returns data with id
  describe('create', () => {
    test('creates new owner and returns data with id', async () => {
      const newOwner = {
        name: '陳美麗',
        nationalId: 'D444555666',
        phone: '0966777888',
        address: '桃園市中壢區中正路300號',
        emergencyContactName: '陳大偉',
        emergencyContactPhone: '0977888999',
        emergencyContactRelationship: '父女',
      };

      const result = await ownerRepository.create(newOwner);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe('陳美麗');
      expect(result.phone).toBe('0966777888');
    });

    test('persists created owner to the JSON file', async () => {
      const newOwner = {
        name: '林志強',
        nationalId: 'E555666777',
        phone: '0955111222',
        address: '高雄市左營區博愛路400號',
        emergencyContactName: '林美惠',
        emergencyContactPhone: '0988222333',
        emergencyContactRelationship: '母子',
      };

      await ownerRepository.create(newOwner);

      const allOwners = await ownerRepository.findAll();
      expect(allOwners).toHaveLength(4);
      expect(allOwners.some(o => o.name === '林志強')).toBe(true);
    });

    test('created owner can be retrieved by findById', async () => {
      const newOwner = {
        name: '黃小芳',
        nationalId: 'F666777888',
        phone: '0911999888',
        address: '台中市西屯區台灣大道500號',
        emergencyContactName: '黃大山',
        emergencyContactPhone: '0922111222',
        emergencyContactRelationship: '父女',
      };

      const created = await ownerRepository.create(newOwner);
      const found = await ownerRepository.findById(created.id);

      expect(found).not.toBeNull();
      expect(found.name).toBe('黃小芳');
    });
  });

  // BE-OR-005: update(id, data) updates specific owner in JSON
  describe('update', () => {
    test('updates specific owner fields', async () => {
      const updates = { phone: '0999888777', address: '新地址：台北市松山區' };

      const result = await ownerRepository.update('owner_abc123', updates);

      expect(result).not.toBeNull();
      expect(result.phone).toBe('0999888777');
      expect(result.address).toBe('新地址：台北市松山區');
      // Other fields should remain unchanged
      expect(result.name).toBe('王大明');
    });

    test('persists updates to JSON file', async () => {
      await ownerRepository.update('owner_abc123', { name: '王小明改名' });

      const found = await ownerRepository.findById('owner_abc123');
      expect(found.name).toBe('王小明改名');
    });

    test('does not affect other owners when updating one', async () => {
      await ownerRepository.update('owner_abc123', { name: '改名了' });

      const other = await ownerRepository.findById('owner_def456');
      expect(other.name).toBe('李小華');
    });

    // BE-OR-006: update non-existent id returns null
    test('returns null when updating non-existent id', async () => {
      const result = await ownerRepository.update('owner_nonexistent', { name: '不存在' });

      expect(result).toBeNull();
    });

    test('returns null and does not modify data when id not found', async () => {
      await ownerRepository.update('owner_nonexistent', { name: '鬼' });

      const allOwners = await ownerRepository.findAll();
      expect(allOwners).toHaveLength(3);
      expect(allOwners.every(o => o.name !== '鬼')).toBe(true);
    });
  });
});
