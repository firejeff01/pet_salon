const express = require('express');
const groomingRecordService = require('../services/grooming-record.service');
const { AppError } = require('../middleware/error-handler');

const router = express.Router();

// POST /api/grooming-records
router.post('/', async (req, res, next) => {
  try {
    const record = await groomingRecordService.create(req.body);
    res.status(201).json(record);
  } catch (err) {
    if (err.message && (
      err.message.includes('必填') ||
      err.message.includes('不可為空') ||
      err.message.includes('必須為') ||
      err.message.includes('不得小於')
    )) {
      err.statusCode = 400;
    }
    if (err.message && err.message.includes('查無此預約')) {
      err.statusCode = 400;
    }
    next(err);
  }
});

// GET /api/grooming-records/:appointmentId
router.get('/:appointmentId', async (req, res, next) => {
  try {
    const record = await groomingRecordService.getByAppointmentId(req.params.appointmentId);
    if (!record) {
      throw new AppError('查無此美容紀錄', 404);
    }
    res.json(record);
  } catch (err) {
    next(err);
  }
});

// PUT /api/grooming-records/:recordId
router.put('/:recordId', async (req, res, next) => {
  try {
    const result = await groomingRecordService.update(req.params.recordId, req.body);
    if (!result) {
      throw new AppError('查無此美容紀錄', 404);
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
