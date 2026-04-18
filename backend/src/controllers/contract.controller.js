const express = require('express');
const contractService = require('../services/contract.service');
const { AppError } = require('../middleware/error-handler');

const router = express.Router();

// POST /api/contracts/generate
router.post('/generate', async (req, res, next) => {
  try {
    const { recordId, generatedBy } = req.body;
    const result = await contractService.generateContract(recordId, generatedBy);
    res.status(201).json({
      contractPath: result.contractPath,
      version: result.version,
      generatedAt: result.generatedAt,
    });
  } catch (err) {
    if (err.message && err.message.includes('查無')) {
      err.statusCode = 404;
    }
    next(err);
  }
});

// GET /api/contracts/:recordId
router.get('/:recordId', async (req, res, next) => {
  try {
    const info = await contractService.getContractInfo(req.params.recordId);
    if (!info) {
      throw new AppError('查無合約資料', 404);
    }
    res.json(info);
  } catch (err) {
    next(err);
  }
});

// GET /api/contracts/:recordId/download  (optional ?version=N)
router.get('/:recordId/download', async (req, res, next) => {
  try {
    const result = await contractService.getContractBytes(req.params.recordId, req.query.version);
    if (!result) {
      throw new AppError('查無合約檔案', 404);
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(result.filename)}`
    );
    res.send(result.bytes);
  } catch (err) {
    next(err);
  }
});

// GET /api/contracts/:recordId/versions
router.get('/:recordId/versions', async (req, res, next) => {
  try {
    const versions = await contractService.getVersions(req.params.recordId);
    res.json(versions);
  } catch (err) {
    next(err);
  }
});

// POST /api/contracts/:recordId/sign
router.post('/:recordId/sign', async (req, res, next) => {
  try {
    const { signatureImage } = req.body;
    if (!signatureImage) {
      throw new AppError('簽名圖片為必填', 400);
    }
    const result = await contractService.signContract(req.params.recordId, signatureImage);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
