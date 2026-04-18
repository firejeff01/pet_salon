const express = require('express');
const ownerService = require('../services/owner.service');
const { AppError } = require('../middleware/error-handler');

const router = express.Router();

// GET /api/owners
router.get('/', async (req, res, next) => {
  try {
    const { keyword } = req.query;
    const owners = await ownerService.search(keyword);
    res.json(owners);
  } catch (err) {
    next(err);
  }
});

// GET /api/owners/:ownerId
router.get('/:ownerId', async (req, res, next) => {
  try {
    const owner = await ownerService.getById(req.params.ownerId);
    if (!owner) {
      throw new AppError('查無此飼主', 404);
    }
    res.json(owner);
  } catch (err) {
    next(err);
  }
});

// POST /api/owners
router.post('/', async (req, res, next) => {
  try {
    const owner = await ownerService.create(req.body);
    res.status(201).json(owner);
  } catch (err) {
    if (err.message && (err.message.includes('必填') || err.message.includes('不得小於'))) {
      err.statusCode = 400;
    }
    next(err);
  }
});

// PUT /api/owners/:ownerId
router.put('/:ownerId', async (req, res, next) => {
  try {
    const result = await ownerService.update(req.params.ownerId, req.body);
    if (!result) {
      throw new AppError('查無此飼主', 404);
    }
    res.json(result);
  } catch (err) {
    if (err.message && (err.message.includes('必填') || err.message.includes('不得小於'))) {
      err.statusCode = 400;
    }
    next(err);
  }
});

module.exports = router;
