const fs = require('fs');
const path = require('path');
const os = require('os');

const { readJsonFile, writeJsonFile } = require('../../src/utils/json-store');

describe('JSON Store Utility', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'json-store-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // BE-RP-001: Read existing JSON file → returns parsed object
  describe('readJsonFile', () => {
    test('reads existing JSON file and returns parsed object', async () => {
      const filePath = path.join(tmpDir, 'data.json');
      const data = { owners: [{ id: 'owner_1', name: '王大明' }] };
      fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');

      const result = await readJsonFile(filePath);

      expect(result).toEqual(data);
      expect(result.owners).toHaveLength(1);
      expect(result.owners[0].name).toBe('王大明');
    });

    // BE-RP-002: Read non-existent file → auto-creates empty data file
    test('auto-creates file with empty structure when file does not exist', async () => {
      const filePath = path.join(tmpDir, 'nonexistent.json');

      expect(fs.existsSync(filePath)).toBe(false);

      const result = await readJsonFile(filePath);

      expect(fs.existsSync(filePath)).toBe(true);
      expect(result).toEqual({ data: [] });

      // Verify file was actually written with proper structure
      const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(fileContent).toEqual({ data: [] });
    });

    // BE-RP-003: Read malformed JSON → throws clear error, does NOT overwrite original
    test('throws clear error on malformed JSON and does NOT overwrite the file', async () => {
      const filePath = path.join(tmpDir, 'malformed.json');
      const malformedContent = '{ "owners": [{ broken json';
      fs.writeFileSync(filePath, malformedContent, 'utf-8');

      await expect(readJsonFile(filePath)).rejects.toThrow();

      // Verify original file is NOT overwritten
      const afterContent = fs.readFileSync(filePath, 'utf-8');
      expect(afterContent).toBe(malformedContent);
    });

    test('malformed JSON error message is descriptive', async () => {
      const filePath = path.join(tmpDir, 'malformed2.json');
      fs.writeFileSync(filePath, '{ not valid }', 'utf-8');

      await expect(readJsonFile(filePath)).rejects.toThrow(/JSON|parse|malformed/i);
    });

    // BE-RP-005: UTF-8 Chinese read → no garbled characters
    test('reads UTF-8 Chinese characters without garbling', async () => {
      const filePath = path.join(tmpDir, 'chinese.json');
      const data = {
        owners: [
          { name: '王大明', address: '台北市信義區松仁路100號' },
          { name: '李小華', phone: '0912345678' },
        ],
      };
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

      const result = await readJsonFile(filePath);

      expect(result.owners[0].name).toBe('王大明');
      expect(result.owners[0].address).toBe('台北市信義區松仁路100號');
      expect(result.owners[1].name).toBe('李小華');
    });
  });

  describe('writeJsonFile', () => {
    // BE-RP-004: Write JSON file → file content matches written data
    test('writes data that matches when read back', async () => {
      const filePath = path.join(tmpDir, 'write-test.json');
      const data = {
        owners: [
          { id: 'owner_abc', name: '張三', phone: '0911222333' },
          { id: 'owner_def', name: '李四', phone: '0922333444' },
        ],
      };

      await writeJsonFile(filePath, data);

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(fileContent);
      expect(parsed).toEqual(data);
    });

    test('overwrites existing file completely', async () => {
      const filePath = path.join(tmpDir, 'overwrite.json');
      const oldData = { owners: [{ id: 'owner_1' }] };
      const newData = { owners: [{ id: 'owner_2' }, { id: 'owner_3' }] };

      await writeJsonFile(filePath, oldData);
      await writeJsonFile(filePath, newData);

      const result = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(result).toEqual(newData);
      expect(result.owners).toHaveLength(2);
    });

    // BE-RP-005: UTF-8 Chinese write → no garbled characters
    test('writes UTF-8 Chinese characters without garbling', async () => {
      const filePath = path.join(tmpDir, 'chinese-write.json');
      const data = {
        pets: [
          { name: '小黑', species: '犬', breed: '柴犬' },
          { name: '咪咪', species: '貓', breed: '波斯貓' },
        ],
      };

      await writeJsonFile(filePath, data);

      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      expect(parsed.pets[0].name).toBe('小黑');
      expect(parsed.pets[0].species).toBe('犬');
      expect(parsed.pets[0].breed).toBe('柴犬');
      expect(parsed.pets[1].name).toBe('咪咪');
      expect(parsed.pets[1].breed).toBe('波斯貓');
    });

    // BE-RP-006: Write uses temp file then rename (atomic write)
    test('uses atomic write strategy (temp file + rename)', async () => {
      const filePath = path.join(tmpDir, 'atomic.json');
      const data = { owners: [{ id: 'owner_1', name: '測試' }] };

      // Spy on fs.rename or fs.renameSync to verify atomic write
      const originalRename = fs.renameSync;
      const originalRenameAsync = fs.promises.rename;
      let renameWasCalled = false;

      // Check for either sync or async rename being called with a temp file
      const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation((...args) => {
        renameWasCalled = true;
        return originalRename.apply(fs, args);
      });

      const renameAsyncSpy = jest.spyOn(fs.promises, 'rename').mockImplementation((...args) => {
        renameWasCalled = true;
        return originalRenameAsync.apply(fs.promises, args);
      });

      await writeJsonFile(filePath, data);

      expect(renameWasCalled).toBe(true);

      // Verify the final file is correct
      const result = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(result).toEqual(data);

      renameSpy.mockRestore();
      renameAsyncSpy.mockRestore();
    });

    // BE-RP-007: No temp files left behind after successful write
    test('does not leave temp files behind after write', async () => {
      const filePath = path.join(tmpDir, 'clean.json');
      const data = { test: true };

      await writeJsonFile(filePath, data);

      const files = fs.readdirSync(tmpDir);
      const tempFiles = files.filter(f => f.includes('.tmp') || f.includes('.temp'));
      expect(tempFiles).toHaveLength(0);
    });
  });
});
