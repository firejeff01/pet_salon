const express = require('express');
const petService = require('../services/pet.service');

const router = express.Router();

// GET /api/owners/:ownerId/pets
router.get('/:ownerId/pets', async (req, res, next) => {
  try {
    const pets = await petService.findByOwnerId(req.params.ownerId);
    res.json(pets);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
