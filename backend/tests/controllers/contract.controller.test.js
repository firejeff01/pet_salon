const request = require('supertest');

describe('Contract Controller', () => {
  let app;

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../../src/pdf-generator', () => ({
      generatePdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4\nmock%%EOF')),
      closeBrowser: jest.fn().mockResolvedValue(),
    }));
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
    isStoredValueCustomer: true,
    storedValueBalance: 5000,
  };

  const validPetPayload = {
    name: '小白',
    species: '犬',
    breed: '貴賓',
    gender: '公',
    age: 3,
    chipNumber: '900000000000001',
    isNeutered: false,
    personality: ['親人'],
    physicalExamination: { eyes: '正常', ears: '正常', teeth: '正常', limbs: '正常', skin: '正常', fur: '正常' },
  };

  async function createFullSetup() {
    const ownerRes = await request(app).post('/api/owners').send(validOwnerPayload);
    const petRes = await request(app)
      .post('/api/pets')
      .send({ ...validPetPayload, ownerId: ownerRes.body.id });
    const apptRes = await request(app).post('/api/appointments').send({
      ownerId: ownerRes.body.id,
      petId: petRes.body.id,
      date: '2026-04-20',
      time: '10:00',
    });
    const recordRes = await request(app).post('/api/grooming-records').send({
      appointmentId: apptRes.body.id,
      services: [{ item: '洗澡', price: 800 }],
      physicalExamination: {
        eyes: '正常', ears: '正常', teeth: '正常',
        limbs: '正常', skin: '正常', fur: '正常',
      },
      personality: ['親人'],
      medicalHistory: [],
      ownerNotes: '',
      shopNotes: '',
      otherNotes: '',
    });
    return {
      ownerId: ownerRes.body.id,
      petId: petRes.body.id,
      appointmentId: apptRes.body.id,
      recordId: recordRes.body.id,
    };
  }

  describe('POST /api/contracts/generate', () => {
    test('returns 201 with contractPath and version', async () => {
      const { recordId } = await createFullSetup();

      const res = await request(app)
        .post('/api/contracts/generate')
        .send({ recordId })
        .expect(201);

      expect(res.body).toHaveProperty('contractPath');
      expect(res.body).toHaveProperty('version');
      expect(res.body.version).toBe(1);
      expect(res.body.contractPath).toContain('契約');
    });

    test('returns 404 when recordId does not exist', async () => {
      const res = await request(app)
        .post('/api/contracts/generate')
        .send({ recordId: 'rec_nonexistent' })
        .expect(404);

      expect(res.body.error.code).toBe(404);
    });
  });

  describe('GET /api/contracts/:recordId', () => {
    test('returns 200 when contract exists', async () => {
      const { recordId } = await createFullSetup();

      // Generate contract first
      await request(app)
        .post('/api/contracts/generate')
        .send({ recordId });

      const res = await request(app)
        .get(`/api/contracts/${recordId}`)
        .expect(200);

      expect(res.body).toHaveProperty('contractPath');
    });
  });

  describe('GET /api/contracts/:recordId/versions', () => {
    test('returns 200 with versions array', async () => {
      const { recordId } = await createFullSetup();

      // Generate two contracts
      await request(app)
        .post('/api/contracts/generate')
        .send({ recordId });
      await request(app)
        .post('/api/contracts/generate')
        .send({ recordId });

      const res = await request(app)
        .get(`/api/contracts/${recordId}/versions`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });
  });

  describe('POST /api/contracts/:recordId/sign', () => {
    test('returns 200 with signature saved', async () => {
      const { recordId } = await createFullSetup();

      // Generate contract first
      await request(app)
        .post('/api/contracts/generate')
        .send({ recordId });

      const res = await request(app)
        .post(`/api/contracts/${recordId}/sign`)
        .send({ signatureImage: 'data:image/png;base64,iVBORw0KGgo=' })
        .expect(200);

      expect(res.body).toHaveProperty('signed', true);
    });

    test('returns 400 when signatureImage is missing', async () => {
      const { recordId } = await createFullSetup();

      await request(app)
        .post('/api/contracts/generate')
        .send({ recordId });

      const res = await request(app)
        .post(`/api/contracts/${recordId}/sign`)
        .send({})
        .expect(400);

      expect(res.body.error.code).toBe(400);
    });
  });
});
