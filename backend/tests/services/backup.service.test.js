const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Backup Service', () => {
  let backupService;
  let tmpDir;
  let backupDir;

  beforeEach(() => {
    jest.resetModules();

    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'backup-test-data-'));
    backupDir = fs.mkdtempSync(path.join(os.tmpdir(), 'backup-test-output-'));

    // Create some test JSON files
    fs.writeFileSync(path.join(tmpDir, 'owners.json'), JSON.stringify({ data: [{ id: 'owner_1' }] }));
    fs.writeFileSync(path.join(tmpDir, 'pets.json'), JSON.stringify({ data: [{ id: 'pet_1' }] }));
    fs.writeFileSync(path.join(tmpDir, 'appointments.json'), JSON.stringify({ data: [] }));

    jest.doMock('../../src/utils/json-store', () => {
      const actual = jest.requireActual('../../src/utils/json-store');
      return {
        ...actual,
        getDataFilePath: (filename) => path.join(tmpDir, filename),
      };
    });

    backupService = require('../../src/services/backup.service');
    // Override data and backup dirs
    backupService._setDirs(tmpDir, backupDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(backupDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  describe('backup', () => {
    test('creates zip file with timestamp in name', async () => {
      const result = await backupService.backup();

      expect(result).toHaveProperty('backupPath');
      expect(result.backupPath).toMatch(/backup_\d{8}_\d{6}\.zip$/);
      expect(fs.existsSync(result.backupPath)).toBe(true);
    });

    test('backup includes all JSON files', async () => {
      const result = await backupService.backup();

      expect(fs.existsSync(result.backupPath)).toBe(true);
      // The zip file should be non-empty
      const stats = fs.statSync(result.backupPath);
      expect(stats.size).toBeGreaterThan(0);
    });
  });

  describe('listBackups', () => {
    test('returns array with fileName, timestamp, size', async () => {
      await backupService.backup();

      const list = await backupService.listBackups();

      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list[0]).toHaveProperty('fileName');
      expect(list[0]).toHaveProperty('timestamp');
      expect(list[0]).toHaveProperty('size');
    });

    test('returns empty array when no backups exist', async () => {
      const list = await backupService.listBackups();
      expect(list).toEqual([]);
    });
  });
});
