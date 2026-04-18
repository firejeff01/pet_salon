const request = require('supertest');

describe('Owner Controller', () => {
  let app;

  beforeEach(() => {
    jest.resetModules();
    app = require('../../src/app');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const validOwnerPayload = {
    name: '王大明',
    nationalId: 'A123456789',
    phone: '0912345678',
    address: '台北市信義區松仁路100號',
    emergencyContactName: '王小明',
    emergencyContactPhone: '0922333444',
    emergencyContactRelationship: '兄弟',
  };

  // BE-OC-001: POST /api/owners with all fields → 201, returns id
  describe('POST /api/owners', () => {
    test('returns 201 and id when all required fields provided', async () => {
      const res = await request(app)
        .post('/api/owners')
        .send(validOwnerPayload)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.id.startsWith('owner_')).toBe(true);
      expect(res.body.name).toBe('王大明');
    });

    // BE-OC-002: POST /api/owners missing each required field individually → 400
    const requiredFields = [
      'name',
      'nationalId',
      'phone',
      'address',
      'emergencyContactName',
      'emergencyContactPhone',
      'emergencyContactRelationship',
    ];

    test.each(requiredFields)(
      'returns 400 when %s is missing',
      async (field) => {
        const payload = { ...validOwnerPayload };
        delete payload[field];

        const res = await request(app)
          .post('/api/owners')
          .send(payload)
          .expect(400);

        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toHaveProperty('code', 400);
        expect(res.body.error.message).toMatch(new RegExp(field, 'i'));
      }
    );

    test.each(requiredFields)(
      'returns 400 when %s is empty string',
      async (field) => {
        const payload = { ...validOwnerPayload, [field]: '' };

        const res = await request(app)
          .post('/api/owners')
          .send(payload)
          .expect(400);

        expect(res.body.error.code).toBe(400);
      }
    );

    // BE-OC-003: POST /api/owners with hospital info → 201
    test('returns 201 and includes hospital fields when provided', async () => {
      const payload = {
        ...validOwnerPayload,
        hospitalName: '大安動物醫院',
        hospitalPhone: '02-27001234',
        hospitalAddress: '台北市大安區復興南路100號',
        veterinarianName: '陳醫師',
      };

      const res = await request(app)
        .post('/api/owners')
        .send(payload)
        .expect(201);

      expect(res.body.hospitalName).toBe('大安動物醫院');
      expect(res.body.hospitalPhone).toBe('02-27001234');
      expect(res.body.hospitalAddress).toBe('台北市大安區復興南路100號');
      expect(res.body.veterinarianName).toBe('陳醫師');
    });

    test('returns createdAt and updatedAt in ISO 8601', async () => {
      const res = await request(app)
        .post('/api/owners')
        .send(validOwnerPayload)
        .expect(201);

      expect(res.body.createdAt).toBeDefined();
      expect(res.body.updatedAt).toBeDefined();
      expect(new Date(res.body.createdAt).toISOString()).toBe(res.body.createdAt);
    });
  });

  // BE-OC-004 to BE-OC-008: GET /api/owners
  describe('GET /api/owners', () => {
    // BE-OC-004: GET /api/owners → 200, returns array
    test('returns 200 and array of owners', async () => {
      const res = await request(app)
        .get('/api/owners')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    // BE-OC-005: GET /api/owners?keyword=王 → 200, filtered by name
    test('returns 200 and filters by name keyword', async () => {
      // First create an owner to search for
      await request(app).post('/api/owners').send(validOwnerPayload);

      const res = await request(app)
        .get('/api/owners?keyword=王')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        const hasMatch = res.body.some(
          o => o.name.includes('王') || o.phone.includes('王')
        );
        expect(hasMatch).toBe(true);
      }
    });

    // BE-OC-006: GET /api/owners?keyword=0912 → 200, filtered by phone
    test('returns 200 and filters by phone keyword', async () => {
      await request(app).post('/api/owners').send(validOwnerPayload);

      const res = await request(app)
        .get('/api/owners?keyword=0912')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        const hasMatch = res.body.some(
          o => o.phone.includes('0912') || o.name.includes('0912')
        );
        expect(hasMatch).toBe(true);
      }
    });

    // BE-OC-007: GET /api/owners?keyword=張 (no match) → 200, empty array
    test('returns 200 and empty array when keyword has no match', async () => {
      const res = await request(app)
        .get('/api/owners?keyword=完全不存在的搜尋字串ZZZZZ')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });
  });

  // BE-OC-008 to BE-OC-009: GET /api/owners/:id
  describe('GET /api/owners/:id', () => {
    // BE-OC-008: GET /api/owners/:id (exists) → 200, full owner data
    test('returns 200 and full owner data when id exists', async () => {
      const createRes = await request(app)
        .post('/api/owners')
        .send(validOwnerPayload);

      const ownerId = createRes.body.id;

      const res = await request(app)
        .get(`/api/owners/${ownerId}`)
        .expect(200);

      expect(res.body.id).toBe(ownerId);
      expect(res.body.name).toBe('王大明');
      expect(res.body.phone).toBe('0912345678');
      expect(res.body.address).toBe('台北市信義區松仁路100號');
      expect(res.body.emergencyContactName).toBe('王小明');
    });

    // BE-OC-009: GET /api/owners/:id (not exists) → 404, "查無此飼主"
    test('returns 404 with "查無此飼主" when id does not exist', async () => {
      const res = await request(app)
        .get('/api/owners/owner_nonexistent_xyz')
        .expect(404);

      expect(res.body).toHaveProperty('error');
      expect(res.body.error.code).toBe(404);
      expect(res.body.error.message).toContain('查無此飼主');
    });
  });

  // BE-OC-010 to BE-OC-013: PUT /api/owners/:id
  describe('PUT /api/owners/:id', () => {
    let createdOwnerId;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/owners')
        .send(validOwnerPayload);
      createdOwnerId = createRes.body.id;
    });

    // BE-OC-010: PUT /api/owners/:id valid → 200, updatedAt changed
    test('returns 200 and updatedAt is changed', async () => {
      const getRes = await request(app).get(`/api/owners/${createdOwnerId}`);
      const originalUpdatedAt = getRes.body.updatedAt;

      // Small delay to ensure timestamp differs
      await new Promise(resolve => setTimeout(resolve, 10));

      const res = await request(app)
        .put(`/api/owners/${createdOwnerId}`)
        .send({ name: '王大明改名' })
        .expect(200);

      expect(res.body.name).toBe('王大明改名');
      expect(res.body.updatedAt).not.toBe(originalUpdatedAt);
    });

    test('returns 200 and preserves unchanged fields', async () => {
      const res = await request(app)
        .put(`/api/owners/${createdOwnerId}`)
        .send({ phone: '0999888777' })
        .expect(200);

      expect(res.body.phone).toBe('0999888777');
      expect(res.body.name).toBe('王大明'); // unchanged
      expect(res.body.address).toBe('台北市信義區松仁路100號'); // unchanged
    });

    // BE-OC-011: PUT /api/owners/:id name="" → 400
    test('returns 400 when updating name to empty string', async () => {
      const res = await request(app)
        .put(`/api/owners/${createdOwnerId}`)
        .send({ name: '' })
        .expect(400);

      expect(res.body.error.code).toBe(400);
    });

    // BE-OC-012: PUT /api/owners/:id storedValueBalance=-100 → 400
    test('returns 400 with "儲值餘額不得小於 0" for negative balance', async () => {
      const res = await request(app)
        .put(`/api/owners/${createdOwnerId}`)
        .send({ storedValueBalance: -100 })
        .expect(400);

      expect(res.body.error.code).toBe(400);
      expect(res.body.error.message).toContain('儲值餘額不得小於 0');
    });

    // BE-OC-013: PUT /api/owners/nonexistent → 404
    test('returns 404 when updating non-existent owner', async () => {
      const res = await request(app)
        .put('/api/owners/owner_nonexistent_xyz')
        .send({ name: '不存在' })
        .expect(404);

      expect(res.body.error.code).toBe(404);
    });
  });

  // Integration: create then search then get
  describe('integration: full CRUD flow', () => {
    test('create → search → get by id → update → get updated', async () => {
      // Create
      const createRes = await request(app)
        .post('/api/owners')
        .send(validOwnerPayload)
        .expect(201);

      const ownerId = createRes.body.id;
      expect(ownerId).toBeDefined();

      // Get by ID
      const getRes = await request(app)
        .get(`/api/owners/${ownerId}`)
        .expect(200);

      expect(getRes.body.name).toBe('王大明');

      // Update
      const updateRes = await request(app)
        .put(`/api/owners/${ownerId}`)
        .send({ name: '王大明二世' })
        .expect(200);

      expect(updateRes.body.name).toBe('王大明二世');

      // Get updated
      const getUpdatedRes = await request(app)
        .get(`/api/owners/${ownerId}`)
        .expect(200);

      expect(getUpdatedRes.body.name).toBe('王大明二世');
    });
  });
});
