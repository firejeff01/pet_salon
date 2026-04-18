const express = require('express');
const petService = require('../services/pet.service');
const { AppError } = require('../middleware/error-handler');

const router = express.Router();

// GET /api/pets
router.get('/', async (req, res, next) => {
  try {
    const petRepository = require('../repositories/pet.repository');
    const pets = await petRepository.findAll();
    res.json(pets);
  } catch (err) {
    next(err);
  }
});

// GET /api/pets/:petId
router.get('/:petId', async (req, res, next) => {
  try {
    const pet = await petService.getById(req.params.petId);
    if (!pet) {
      throw new AppError('查無此寵物', 404);
    }
    res.json(pet);
  } catch (err) {
    next(err);
  }
});

// POST /api/pets
router.post('/', async (req, res, next) => {
  try {
    const pet = await petService.create(req.body);
    res.status(201).json(pet);
  } catch (err) {
    if (err.message && err.message.includes('查無此飼主')) {
      err.statusCode = 404;
    } else if (err.message && (err.message.includes('必填') || err.message.includes('必須'))) {
      err.statusCode = 400;
    }
    next(err);
  }
});

// PUT /api/pets/:petId
router.put('/:petId', async (req, res, next) => {
  try {
    const result = await petService.update(req.params.petId, req.body);
    if (!result) {
      throw new AppError('查無此寵物', 404);
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
