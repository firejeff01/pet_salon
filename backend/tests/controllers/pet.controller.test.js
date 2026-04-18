const request = require('supertest');

describe('Pet Controller', () => {
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

  const validPetPayload = {
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

  // Helper to create an owner first
  async function createOwner() {
    const res = await request(app)
      .post('/api/owners')
      .send(validOwnerPayload);
    return res.body.id;
  }

  // BE-PC-001: POST /api/pets with all fields → 201
  describe('POST /api/pets', () => {
    test('returns 201 when all fields provided with valid ownerId', async () => {
      const ownerId = await createOwner();

      const res = await request(app)
        .post('/api/pets')
        .send({ ...validPetPayload, ownerId })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.id.startsWith('pet_')).toBe(true);
      expect(res.body.name).toBe('小黑');
      expect(res.body.species).toBe('犬');
      expect(res.body.ownerId).toBe(ownerId);
    });

    test('returns createdAt and updatedAt in response', async () => {
      const ownerId = await createOwner();

      const res = await request(app)
        .post('/api/pets')
        .send({ ...validPetPayload, ownerId })
        .expect(201);

      expect(res.body.createdAt).toBeDefined();
      expect(res.body.updatedAt).toBeDefined();
    });

    // BE-PC-002: POST /api/pets missing ownerId → 400
    test('returns 400 when ownerId is missing', async () => {
      const res = await request(app)
        .post('/api/pets')
        .send(validPetPayload)
        .expect(400);

      expect(res.body).toHaveProperty('error');
      expect(res.body.error.code).toBe(400);
    });

    // BE-PC-003: POST /api/pets with non-existent ownerId → 404
    test('returns 404 when ownerId does not exist', async () => {
      const res = await request(app)
        .post('/api/pets')
        .send({ ...validPetPayload, ownerId: 'owner_nonexistent_xyz' })
        .expect(404);

      expect(res.body.error.code).toBe(404);
      expect(res.body.error.message).toContain('查無此飼主');
    });

    // BE-PC-004: POST /api/pets with empty personality → 400
    test('returns 400 when personality is empty array', async () => {
      const ownerId = await createOwner();

      const res = await request(app)
        .post('/api/pets')
        .send({ ...validPetPayload, ownerId, personality: [] })
        .expect(400);

      expect(res.body.error.code).toBe(400);
    });

    // BE-PC-005: POST /api/pets missing physicalExamination → 400
    test('returns 400 when physicalExamination is missing', async () => {
      const ownerId = await createOwner();
      const payload = { ...validPetPayload, ownerId };
      delete payload.physicalExamination;

      const res = await request(app)
        .post('/api/pets')
        .send(payload)
        .expect(400);

      expect(res.body.error.code).toBe(400);
    });

    test('returns 400 when species is invalid', async () => {
      const ownerId = await createOwner();

      const res = await request(app)
        .post('/api/pets')
        .send({ ...validPetPayload, ownerId, species: '鳥' })
        .expect(400);

      expect(res.body.error.code).toBe(400);
    });

    test('returns 400 when gender is invalid', async () => {
      const ownerId = await createOwner();

      const res = await request(app)
        .post('/api/pets')
        .send({ ...validPetPayload, ownerId, gender: '未知' })
        .expect(400);

      expect(res.body.error.code).toBe(400);
    });

    test('returns 400 when breed is missing', async () => {
      const ownerId = await createOwner();
      const payload = { ...validPetPayload, ownerId };
      delete payload.breed;

      const res = await request(app)
        .post('/api/pets')
        .send(payload)
        .expect(400);

      expect(res.body.error.code).toBe(400);
    });
  });

  // BE-PC-006: GET /api/pets/:id → 200
  describe('GET /api/pets/:id', () => {
    test('returns 200 and pet data when pet exists', async () => {
      const ownerId = await createOwner();
      const createRes = await request(app)
        .post('/api/pets')
        .send({ ...validPetPayload, ownerId });

      const petId = createRes.body.id;

      const res = await request(app)
        .get(`/api/pets/${petId}`)
        .expect(200);

      expect(res.body.id).toBe(petId);
      expect(res.body.name).toBe('小黑');
      expect(res.body.species).toBe('犬');
      expect(res.body.personality).toEqual(['親人', '活潑']);
    });

    test('returns 404 when pet does not exist', async () => {
      const res = await request(app)
        .get('/api/pets/pet_nonexistent_xyz')
        .expect(404);

      expect(res.body.error.code).toBe(404);
    });
  });

  // BE-PC-007: GET /api/owners/:ownerId/pets → 200, array
  describe('GET /api/owners/:ownerId/pets', () => {
    test('returns 200 and array of pets for the owner', async () => {
      const ownerId = await createOwner();

      // Create two pets for this owner
      await request(app)
        .post('/api/pets')
        .send({ ...validPetPayload, ownerId, name: '小黑' });

      await request(app)
        .post('/api/pets')
        .send({
          ...validPetPayload,
          ownerId,
          name: '咪咪',
          species: '貓',
          breed: '波斯貓',
          gender: '母',
        });

      const res = await request(app)
        .get(`/api/owners/${ownerId}/pets`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
      expect(res.body.every(p => p.ownerId === ownerId)).toBe(true);
    });

    test('returns 200 and empty array when owner has no pets', async () => {
      const ownerId = await createOwner();

      const res = await request(app)
        .get(`/api/owners/${ownerId}/pets`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });
  });

  // BE-PC-008: PUT /api/pets/:id → 200
  describe('PUT /api/pets/:id', () => {
    test('returns 200 and updated pet data', async () => {
      const ownerId = await createOwner();
      const createRes = await request(app)
        .post('/api/pets')
        .send({ ...validPetPayload, ownerId });

      const petId = createRes.body.id;

      const res = await request(app)
        .put(`/api/pets/${petId}`)
        .send({ name: '大黑', age: 4 })
        .expect(200);

      expect(res.body.name).toBe('大黑');
      expect(res.body.age).toBe(4);
      expect(res.body.species).toBe('犬'); // unchanged
    });

    test('returns updated updatedAt timestamp', async () => {
      const ownerId = await createOwner();
      const createRes = await request(app)
        .post('/api/pets')
        .send({ ...validPetPayload, ownerId });

      const petId = createRes.body.id;
      const originalUpdatedAt = createRes.body.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      const res = await request(app)
        .put(`/api/pets/${petId}`)
        .send({ name: '改名了' })
        .expect(200);

      expect(res.body.updatedAt).not.toBe(originalUpdatedAt);
    });

    // BE-PC-009: PUT /api/pets/nonexistent → 404
    test('returns 404 when pet does not exist', async () => {
      const res = await request(app)
        .put('/api/pets/pet_nonexistent_xyz')
        .send({ name: '不存在' })
        .expect(404);

      expect(res.body.error.code).toBe(404);
    });
  });

  // Integration flow
  describe('integration: create owner → create pet → get pet → update pet', () => {
    test('full CRUD flow works end to end', async () => {
      // Create owner
      const ownerRes = await request(app)
        .post('/api/owners')
        .send(validOwnerPayload)
        .expect(201);
      const ownerId = ownerRes.body.id;

      // Create pet
      const petRes = await request(app)
        .post('/api/pets')
        .send({ ...validPetPayload, ownerId })
        .expect(201);
      const petId = petRes.body.id;

      // Get pet
      const getRes = await request(app)
        .get(`/api/pets/${petId}`)
        .expect(200);
      expect(getRes.body.name).toBe('小黑');

      // Update pet
      const updateRes = await request(app)
        .put(`/api/pets/${petId}`)
        .send({ name: '小黑二世', age: 4 })
        .expect(200);
      expect(updateRes.body.name).toBe('小黑二世');

      // Verify update persisted
      const verifyRes = await request(app)
        .get(`/api/pets/${petId}`)
        .expect(200);
      expect(verifyRes.body.name).toBe('小黑二世');
      expect(verifyRes.body.age).toBe(4);

      // Get owner's pets
      const ownerPetsRes = await request(app)
        .get(`/api/owners/${ownerId}/pets`)
        .expect(200);
      expect(ownerPetsRes.body).toHaveLength(1);
      expect(ownerPetsRes.body[0].name).toBe('小黑二世');
    });
  });
});
