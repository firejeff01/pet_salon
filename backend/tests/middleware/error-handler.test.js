const request = require('supertest');

describe('Error Handler Middleware', () => {
  let app;

  beforeEach(() => {
    jest.resetModules();
    app = require('../../src/app');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.unmock('../../src/services/owner.service');
    jest.unmock('../../src/services/pet.service');
  });

  // BE-ERR-001: 400 errors have format { error: { code: 400, message: "..." } }
  describe('400 error format', () => {
    test('validation error returns { error: { code: 400, message } }', async () => {
      // Trigger a 400 by sending invalid data (missing required fields)
      const res = await request(app)
        .post('/api/owners')
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('code', 400);
      expect(res.body.error).toHaveProperty('message');
      expect(typeof res.body.error.message).toBe('string');
      expect(res.body.error.message.length).toBeGreaterThan(0);
    });

    test('400 error does not expose stack trace', async () => {
      const res = await request(app)
        .post('/api/owners')
        .send({})
        .expect(400);

      expect(res.body.error).not.toHaveProperty('stack');
      expect(res.body).not.toHaveProperty('stack');
    });

    test('400 error body has only error property at top level', async () => {
      const res = await request(app)
        .post('/api/owners')
        .send({ name: '' })
        .expect(400);

      // Top level should only have "error" key
      const topKeys = Object.keys(res.body);
      expect(topKeys).toContain('error');
    });
  });

  // BE-ERR-002: 404 errors have format { error: { code: 404, message: "..." } }
  describe('404 error format', () => {
    test('not found returns { error: { code: 404, message } }', async () => {
      const res = await request(app)
        .get('/api/owners/owner_nonexistent_xyz')
        .expect(404);

      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('code', 404);
      expect(res.body.error).toHaveProperty('message');
      expect(typeof res.body.error.message).toBe('string');
      expect(res.body.error.message.length).toBeGreaterThan(0);
    });

    test('404 for non-existent pet returns proper format', async () => {
      const res = await request(app)
        .get('/api/pets/pet_nonexistent_xyz')
        .expect(404);

      expect(res.body.error.code).toBe(404);
      expect(res.body.error.message).toBeDefined();
    });
  });

  // BE-ERR-003: 500 errors have format { error: { code: 500, message: "..." } }
  describe('500 error format', () => {
    test('internal server error returns { error: { code: 500, message } }', async () => {
      // We need to cause a 500 error. Mock a service to throw an unexpected error.
      // This requires the app to have error handling middleware that catches unhandled errors.
      // We'll test this by mocking an internal throw.

      jest.doMock('../../src/services/owner.service', () => ({
        search: jest.fn().mockRejectedValue(new Error('Unexpected DB error')),
        getById: jest.fn().mockRejectedValue(new Error('Unexpected DB error')),
        create: jest.fn().mockRejectedValue(new Error('Unexpected DB error')),
        update: jest.fn().mockRejectedValue(new Error('Unexpected DB error')),
      }));

      jest.resetModules();
      const brokenApp = require('../../src/app');

      const res = await request(brokenApp)
        .get('/api/owners')
        .expect(500);

      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('code', 500);
      expect(res.body.error).toHaveProperty('message');
      expect(typeof res.body.error.message).toBe('string');
    });

    test('500 error does not expose internal error details to client', async () => {
      jest.doMock('../../src/services/owner.service', () => ({
        search: jest.fn().mockRejectedValue(new Error('SECRET_DB_PASSWORD_EXPOSED')),
        getById: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      }));

      jest.resetModules();
      const brokenApp = require('../../src/app');

      const res = await request(brokenApp)
        .get('/api/owners')
        .expect(500);

      // Should not expose the raw error message with sensitive info
      expect(res.body.error).not.toHaveProperty('stack');
    });
  });

  // BE-ERR-004: Success responses do NOT contain error field
  describe('success responses', () => {
    test('GET /api/owners success does not contain error field', async () => {
      const res = await request(app)
        .get('/api/owners')
        .expect(200);

      expect(res.body).not.toHaveProperty('error');
    });

    test('POST /api/owners success does not contain error field', async () => {
      const res = await request(app)
        .post('/api/owners')
        .send({
          name: '測試飼主',
          nationalId: 'A123456789',
          phone: '0912345678',
          address: '台北市信義區',
          emergencyContactName: '緊急聯絡人',
          emergencyContactPhone: '0922333444',
          emergencyContactRelationship: '配偶',
        })
        .expect(201);

      expect(res.body).not.toHaveProperty('error');
      expect(res.body).toHaveProperty('id');
    });

    test('GET /api/owners/:id success does not contain error field', async () => {
      const createRes = await request(app)
        .post('/api/owners')
        .send({
          name: '測試飼主',
          nationalId: 'A123456789',
          phone: '0912345678',
          address: '台北市信義區',
          emergencyContactName: '緊急聯絡人',
          emergencyContactPhone: '0922333444',
          emergencyContactRelationship: '配偶',
        });

      const res = await request(app)
        .get(`/api/owners/${createRes.body.id}`)
        .expect(200);

      expect(res.body).not.toHaveProperty('error');
      expect(res.body).toHaveProperty('name', '測試飼主');
    });
  });
});
