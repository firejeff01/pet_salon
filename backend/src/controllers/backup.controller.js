const express = require('express');
const backupService = require('../services/backup.service');

const router = express.Router();

// POST /api/backup
router.post('/', async (req, res, next) => {
  try {
    const result = await backupService.backup();
    res.status(201).json({
      filename: result.backupPath.split(/[\\/]/).pop(),
      backupPath: result.backupPath,
      size: result.size,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/backup  → same as /list, for client convenience
router.get('/', async (req, res, next) => {
  try {
    const list = await backupService.listBackups();
    res.json(list.map((b) => ({
      filename: b.fileName,
      createdAt: b.timestamp,
      size: b.size,
    })));
  } catch (err) {
    next(err);
  }
});

// GET /api/backup/list  (legacy)
router.get('/list', async (req, res, next) => {
  try {
    const list = await backupService.listBackups();
    res.json(list);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
