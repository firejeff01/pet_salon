const request = require('supertest');

describe('Appointment Controller', () => {
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

  async function createOwnerAndPet() {
    const ownerRes = await request(app).post('/api/owners').send(validOwnerPayload);
    const petRes = await request(app)
      .post('/api/pets')
      .send({ ...validPetPayload, ownerId: ownerRes.body.id });
    return { ownerId: ownerRes.body.id, petId: petRes.body.id };
  }

  describe('POST /api/appointments', () => {
    test('returns 201 with status "已預約"', async () => {
      const { ownerId, petId } = await createOwnerAndPet();

      const res = await request(app)
        .post('/api/appointments')
        .send({
          ownerId,
          petId,
          date: '2026-04-20',
          time: '10:00',
          note: '第一次',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.id.startsWith('appt_')).toBe(true);
      expect(res.body.status).toBe('已預約');
      expect(res.body.ownerId).toBe(ownerId);
      expect(res.body.petId).toBe(petId);
    });

    test('returns 400 when ownerId is missing', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .send({
          petId: 'pet_123',
          date: '2026-04-20',
          time: '10:00',
        })
        .expect(400);

      expect(res.body.error.code).toBe(400);
    });

    test('returns 400 when petId is missing', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .send({
          ownerId: 'owner_123',
          date: '2026-04-20',
          time: '10:00',
        })
        .expect(400);

      expect(res.body.error.code).toBe(400);
    });

    test('returns 400 when date is missing', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .send({
          ownerId: 'owner_123',
          petId: 'pet_123',
          time: '10:00',
        })
        .expect(400);

      expect(res.body.error.code).toBe(400);
    });

    test('returns 400 when time is missing', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .send({
          ownerId: 'owner_123',
          petId: 'pet_123',
          date: '2026-04-20',
        })
        .expect(400);

      expect(res.body.error.code).toBe(400);
    });
  });

  describe('GET /api/appointments', () => {
    test('returns 200 with appointments filtered by date range', async () => {
      const { ownerId, petId } = await createOwnerAndPet();

      await request(app).post('/api/appointments').send({
        ownerId, petId, date: '2026-04-20', time: '10:00',
      });
      await request(app).post('/api/appointments').send({
        ownerId, petId, date: '2026-04-21', time: '14:00',
      });

      const res = await request(app)
        .get('/api/appointments?startDate=2026-04-20&endDate=2026-04-21')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    test('returns 200 with all appointments when no date filter', async () => {
      const res = await request(app)
        .get('/api/appointments')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/appointments/date/:date', () => {
    test('returns 200 with appointments sorted by time', async () => {
      const { ownerId, petId } = await createOwnerAndPet();

      await request(app).post('/api/appointments').send({
        ownerId, petId, date: '2026-04-20', time: '14:00',
      });
      await request(app).post('/api/appointments').send({
        ownerId, petId, date: '2026-04-20', time: '09:00',
      });
      await request(app).post('/api/appointments').send({
        ownerId, petId, date: '2026-04-20', time: '11:30',
      });

      const res = await request(app)
        .get('/api/appointments/date/2026-04-20')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(3);
      // Verify sorted by time
      for (let i = 1; i < res.body.length; i++) {
        expect(res.body[i].time >= res.body[i - 1].time).toBe(true);
      }
    });
  });

  describe('PUT /api/appointments/:id', () => {
    test('returns 200 with updated appointment', async () => {
      const { ownerId, petId } = await createOwnerAndPet();

      const createRes = await request(app).post('/api/appointments').send({
        ownerId, petId, date: '2026-04-20', time: '10:00',
      });

      const res = await request(app)
        .put(`/api/appointments/${createRes.body.id}`)
        .send({ note: '更新備註' })
        .expect(200);

      expect(res.body.note).toBe('更新備註');
    });

    test('returns 200 when cancelling with reason', async () => {
      const { ownerId, petId } = await createOwnerAndPet();

      const createRes = await request(app).post('/api/appointments').send({
        ownerId, petId, date: '2026-04-20', time: '10:00',
      });

      const res = await request(app)
        .put(`/api/appointments/${createRes.body.id}`)
        .send({ status: '已取消', cancelReason: '飼主請假' })
        .expect(200);

      expect(res.body.status).toBe('已取消');
      expect(res.body.cancelReason).toBe('飼主請假');
    });

    test('returns 400 when cancelling without reason', async () => {
      const { ownerId, petId } = await createOwnerAndPet();

      const createRes = await request(app).post('/api/appointments').send({
        ownerId, petId, date: '2026-04-20', time: '10:00',
      });

      const res = await request(app)
        .put(`/api/appointments/${createRes.body.id}`)
        .send({ status: '已取消' })
        .expect(400);

      expect(res.body.error.message).toContain('取消預約時必須填寫取消原因');
    });

    test('returns 404 when updating non-existent appointment', async () => {
      const res = await request(app)
        .put('/api/appointments/appt_nonexistent')
        .send({ note: '不存在' })
        .expect(404);

      expect(res.body.error.code).toBe(404);
    });
  });
});
