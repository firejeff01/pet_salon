const request = require('supertest');

describe('Grooming Record Controller', () => {
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

  const validRecordPayload = {
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
    return {
      ownerId: ownerRes.body.id,
      petId: petRes.body.id,
      appointmentId: apptRes.body.id,
    };
  }

  describe('POST /api/grooming-records', () => {
    test('returns 201 with storedValueDeduction calculated', async () => {
      const { appointmentId } = await createFullSetup();

      const res = await request(app)
        .post('/api/grooming-records')
        .send({ ...validRecordPayload, appointmentId })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.id.startsWith('rec_')).toBe(true);
      expect(res.body.appointmentId).toBe(appointmentId);
      // total = 800 + 500 = 1300, balance = 5000
      expect(res.body.storedValueDeduction).toBe(1300);
      expect(res.body.cashPayment).toBe(0);
    });

    test('returns 400 when appointmentId is missing', async () => {
      const res = await request(app)
        .post('/api/grooming-records')
        .send(validRecordPayload)
        .expect(400);

      expect(res.body.error.code).toBe(400);
    });

    test('returns 400 when service item is invalid', async () => {
      const { appointmentId } = await createFullSetup();

      const res = await request(app)
        .post('/api/grooming-records')
        .send({
          ...validRecordPayload,
          appointmentId,
          services: [{ item: '按摩', price: 500 }],
        })
        .expect(400);

      expect(res.body.error.code).toBe(400);
    });
  });

  describe('GET /api/grooming-records/:appointmentId', () => {
    test('returns 200 with grooming record', async () => {
      const { appointmentId } = await createFullSetup();

      await request(app)
        .post('/api/grooming-records')
        .send({ ...validRecordPayload, appointmentId });

      const res = await request(app)
        .get(`/api/grooming-records/${appointmentId}`)
        .expect(200);

      expect(res.body.appointmentId).toBe(appointmentId);
    });

    test('returns 404 when no record for appointmentId', async () => {
      const res = await request(app)
        .get('/api/grooming-records/appt_nonexistent')
        .expect(404);

      expect(res.body.error.code).toBe(404);
    });
  });

  describe('PUT /api/grooming-records/:recordId', () => {
    test('returns 200 with updated record', async () => {
      const { appointmentId } = await createFullSetup();

      const createRes = await request(app)
        .post('/api/grooming-records')
        .send({ ...validRecordPayload, appointmentId });

      const res = await request(app)
        .put(`/api/grooming-records/${createRes.body.id}`)
        .send({ shopNotes: '表現良好' })
        .expect(200);

      expect(res.body.shopNotes).toBe('表現良好');
    });
  });
});
