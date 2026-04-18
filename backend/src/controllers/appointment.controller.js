const express = require('express');
const appointmentService = require('../services/appointment.service');
const { AppError } = require('../middleware/error-handler');

const router = express.Router();

// GET /api/appointments?date=YYYY-MM-DD | ?year=YYYY&month=M | ?startDate=&endDate=
router.get('/', async (req, res, next) => {
  try {
    const { date, year, month, startDate, endDate } = req.query;
    let appointments;
    if (date) {
      appointments = await appointmentService.getByDate(date);
    } else if (year && month) {
      appointments = await appointmentService.getByMonth(year, month);
    } else if (startDate && endDate) {
      appointments = await appointmentService.getByDateRange(startDate, endDate);
    } else {
      appointments = await appointmentService.getAll();
    }
    res.json(appointments);
  } catch (err) {
    next(err);
  }
});

// GET /api/appointments/date/:date
router.get('/date/:date', async (req, res, next) => {
  try {
    const appointments = await appointmentService.getByDate(req.params.date);
    res.json(appointments);
  } catch (err) {
    next(err);
  }
});

// GET /api/appointments/:id
router.get('/:id', async (req, res, next) => {
  try {
    const appointment = await appointmentService.getById(req.params.id);
    if (!appointment) {
      throw new AppError('查無此預約', 404);
    }
    res.json(appointment);
  } catch (err) {
    next(err);
  }
});

// POST /api/appointments
router.post('/', async (req, res, next) => {
  try {
    const appointment = await appointmentService.create(req.body);
    res.status(201).json(appointment);
  } catch (err) {
    if (err.message && (err.message.includes('必填') || err.message.includes('格式'))) {
      err.statusCode = 400;
    }
    next(err);
  }
});

// PUT /api/appointments/:id
router.put('/:id', async (req, res, next) => {
  try {
    const result = await appointmentService.update(req.params.id, req.body);
    if (!result) {
      throw new AppError('查無此預約', 404);
    }
    res.json(result);
  } catch (err) {
    if (err.message && (err.message.includes('取消') || err.message.includes('必填'))) {
      err.statusCode = 400;
    }
    next(err);
  }
});

// PUT /api/appointments/:id/cancel
router.put('/:id/cancel', async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      throw new AppError('取消預約時必須填寫取消原因', 400);
    }
    const result = await appointmentService.update(req.params.id, {
      status: '已取消',
      cancelReason: reason,
    });
    if (!result) {
      throw new AppError('查無此預約', 404);
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
