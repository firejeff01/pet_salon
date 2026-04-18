const request = require('supertest');

describe('Backup Controller', () => {
  let app;

  beforeEach(() => {
    jest.resetModules();
    app = require('../../src/app');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/backup', () => {
    test('returns 201 with backupPath', async () => {
      const res = await request(app)
        .post('/api/backup')
        .expect(201);

      expect(res.body).toHaveProperty('backupPath');
      expect(res.body.backupPath).toContain('backup_');
    });
  });

  describe('GET /api/backup/list', () => {
    test('returns 200 with array', async () => {
      const res = await request(app)
        .get('/api/backup/list')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/backup', () => {
    test('returns 200 with array of {filename, createdAt}', async () => {
      const res = await request(app)
        .get('/api/backup')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
