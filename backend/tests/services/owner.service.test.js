describe('Owner Service', () => {
  let ownerService;
  let mockOwnerRepository;

  beforeEach(() => {
    jest.resetModules();

    mockOwnerRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByKeyword: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    jest.doMock('../../src/repositories/owner.repository', () => mockOwnerRepository);

    ownerService = require('../../src/services/owner.service');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const validOwnerData = {
    name: '王大明',
    nationalId: 'A123456789',
    phone: '0912345678',
    address: '台北市信義區松仁路100號',
    emergencyContactName: '王小明',
    emergencyContactPhone: '0922333444',
    emergencyContactRelationship: '兄弟',
  };

  // BE-OS-001: Create owner generates ID starting with "owner_"
  describe('create', () => {
    test('generates ID starting with "owner_"', async () => {
      mockOwnerRepository.create.mockImplementation(async (data) => data);

      const result = await ownerService.create(validOwnerData);

      expect(result.id).toBeDefined();
      expect(result.id.startsWith('owner_')).toBe(true);
    });

    test('generated IDs are unique across multiple creates', async () => {
      mockOwnerRepository.create.mockImplementation(async (data) => data);

      const result1 = await ownerService.create(validOwnerData);
      const result2 = await ownerService.create(validOwnerData);
      const result3 = await ownerService.create(validOwnerData);

      expect(result1.id).not.toBe(result2.id);
      expect(result2.id).not.toBe(result3.id);
      expect(result1.id).not.toBe(result3.id);
    });

    // BE-OS-002: Create owner sets createdAt/updatedAt as ISO 8601
    test('sets createdAt as ISO 8601 format', async () => {
      mockOwnerRepository.create.mockImplementation(async (data) => data);

      const result = await ownerService.create(validOwnerData);

      expect(result.createdAt).toBeDefined();
      // ISO 8601 format check
      const parsed = new Date(result.createdAt);
      expect(parsed.toISOString()).toBe(result.createdAt);
    });

    test('sets updatedAt as ISO 8601 format', async () => {
      mockOwnerRepository.create.mockImplementation(async (data) => data);

      const result = await ownerService.create(validOwnerData);

      expect(result.updatedAt).toBeDefined();
      const parsed = new Date(result.updatedAt);
      expect(parsed.toISOString()).toBe(result.updatedAt);
    });

    test('createdAt and updatedAt are the same on creation', async () => {
      mockOwnerRepository.create.mockImplementation(async (data) => data);

      const result = await ownerService.create(validOwnerData);

      expect(result.createdAt).toBe(result.updatedAt);
    });

    test('passes all owner data to repository', async () => {
      mockOwnerRepository.create.mockImplementation(async (data) => data);

      await ownerService.create(validOwnerData);

      expect(mockOwnerRepository.create).toHaveBeenCalledTimes(1);
      const passedData = mockOwnerRepository.create.mock.calls[0][0];
      expect(passedData.name).toBe('王大明');
      expect(passedData.nationalId).toBe('A123456789');
      expect(passedData.phone).toBe('0912345678');
    });

    test('defaults storedValueBalance to 0 if not provided', async () => {
      mockOwnerRepository.create.mockImplementation(async (data) => data);

      const result = await ownerService.create(validOwnerData);

      expect(result.storedValueBalance).toBe(0);
    });
  });

  // BE-OS-003: Update owner updates updatedAt
  describe('update', () => {
    test('updates updatedAt to current time', async () => {
      const existingOwner = {
        ...validOwnerData,
        id: 'owner_test1',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        storedValueBalance: 0,
      };

      mockOwnerRepository.findById.mockResolvedValue(existingOwner);
      mockOwnerRepository.update.mockImplementation(async (id, data) => ({
        ...existingOwner,
        ...data,
      }));

      const result = await ownerService.update('owner_test1', { name: '新名字' });

      expect(result.updatedAt).toBeDefined();
      const updatedTime = new Date(result.updatedAt);
      expect(updatedTime.getTime()).toBeGreaterThan(new Date('2026-01-01').getTime());
    });

    test('does not change createdAt on update', async () => {
      const existingOwner = {
        ...validOwnerData,
        id: 'owner_test1',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        storedValueBalance: 0,
      };

      mockOwnerRepository.findById.mockResolvedValue(existingOwner);
      mockOwnerRepository.update.mockImplementation(async (id, data) => ({
        ...existingOwner,
        ...data,
      }));

      const result = await ownerService.update('owner_test1', { name: '改名' });

      // createdAt should not be in the update data sent to repo
      const updateCall = mockOwnerRepository.update.mock.calls[0][1];
      expect(updateCall.createdAt).toBeUndefined();
    });
  });

  // BE-OS-004: Validates 7 required fields
  describe('validation - required fields', () => {
    const requiredFields = [
      'name',
      'nationalId',
      'phone',
      'address',
      'emergencyContactName',
      'emergencyContactPhone',
      'emergencyContactRelationship',
    ];

    // BE-OS-005: Each required field missing individually → throws error with field name
    test.each(requiredFields)(
      'throws error when %s is missing',
      async (field) => {
        const data = { ...validOwnerData };
        delete data[field];

        await expect(ownerService.create(data)).rejects.toThrow(field);
      }
    );

    test.each(requiredFields)(
      'throws error when %s is empty string',
      async (field) => {
        const data = { ...validOwnerData, [field]: '' };

        await expect(ownerService.create(data)).rejects.toThrow(field);
      }
    );

    test.each(requiredFields)(
      'throws error when %s is null',
      async (field) => {
        const data = { ...validOwnerData, [field]: null };

        await expect(ownerService.create(data)).rejects.toThrow(field);
      }
    );

    test('does not throw when all required fields are present', async () => {
      mockOwnerRepository.create.mockImplementation(async (data) => data);

      await expect(ownerService.create(validOwnerData)).resolves.toBeDefined();
    });
  });

  // BE-OS-006: storedValueBalance < 0 → throws "儲值餘額不得小於 0"
  describe('validation - storedValueBalance', () => {
    test('throws "儲值餘額不得小於 0" when balance is negative', async () => {
      const data = { ...validOwnerData, storedValueBalance: -100 };

      await expect(ownerService.create(data)).rejects.toThrow('儲值餘額不得小於 0');
    });

    test('throws on update when storedValueBalance is negative', async () => {
      const existingOwner = {
        ...validOwnerData,
        id: 'owner_test1',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        storedValueBalance: 5000,
      };
      mockOwnerRepository.findById.mockResolvedValue(existingOwner);

      await expect(
        ownerService.update('owner_test1', { storedValueBalance: -1 })
      ).rejects.toThrow('儲值餘額不得小於 0');
    });

    test('allows storedValueBalance of 0', async () => {
      mockOwnerRepository.create.mockImplementation(async (data) => data);
      const data = { ...validOwnerData, storedValueBalance: 0 };

      await expect(ownerService.create(data)).resolves.toBeDefined();
    });

    test('allows positive storedValueBalance', async () => {
      mockOwnerRepository.create.mockImplementation(async (data) => data);
      const data = { ...validOwnerData, storedValueBalance: 10000 };

      await expect(ownerService.create(data)).resolves.toBeDefined();
    });
  });

  // BE-OS-007: keyword search works by name or phone
  describe('search', () => {
    test('delegates keyword search to repository', async () => {
      const mockResults = [
        { id: 'owner_1', name: '王大明', phone: '0912345678' },
      ];
      mockOwnerRepository.findByKeyword.mockResolvedValue(mockResults);

      const result = await ownerService.search('王');

      expect(mockOwnerRepository.findByKeyword).toHaveBeenCalledWith('王');
      expect(result).toEqual(mockResults);
    });

    test('returns all owners when no keyword provided', async () => {
      const allOwners = [
        { id: 'owner_1', name: '王大明' },
        { id: 'owner_2', name: '李小華' },
      ];
      mockOwnerRepository.findAll.mockResolvedValue(allOwners);

      const result = await ownerService.search();

      expect(mockOwnerRepository.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    test('returns empty array when search has no matches', async () => {
      mockOwnerRepository.findByKeyword.mockResolvedValue([]);

      const result = await ownerService.search('不存在');

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    test('returns owner when found', async () => {
      const owner = { id: 'owner_test1', name: '王大明' };
      mockOwnerRepository.findById.mockResolvedValue(owner);

      const result = await ownerService.getById('owner_test1');

      expect(result).toEqual(owner);
    });

    test('returns null when owner not found', async () => {
      mockOwnerRepository.findById.mockResolvedValue(null);

      const result = await ownerService.getById('owner_nonexistent');

      expect(result).toBeNull();
    });
  });
});
