const fs = require('fs');
const path = require('path');
const express = require('express');
const { errorHandler } = require('./middleware/error-handler');
const { getDataFilePath } = require('./utils/json-store');
const contractService = require('./services/contract.service');

const ownerController = require('./controllers/owner.controller');
const petController = require('./controllers/pet.controller');
const ownerPetsController = require('./controllers/owner-pets.controller');
const appointmentController = require('./controllers/appointment.controller');
const groomingRecordController = require('./controllers/grooming-record.controller');
const contractController = require('./controllers/contract.controller');
const backupController = require('./controllers/backup.controller');

const app = express();

app.use(express.json());

// Diagnostics — lets users verify where data is being written
app.get('/api/_debug/paths', (req, res) => {
  const dataDir = path.dirname(getDataFilePath('dummy'));
  const contractsDir = contractService.getContractsDir();

  const check = (p) => {
    try {
      if (!fs.existsSync(p)) return { exists: false, writable: null };
      fs.accessSync(p, fs.constants.W_OK);
      return { exists: true, writable: true };
    } catch {
      return { exists: true, writable: false };
    }
  };

  res.json({
    dataDir: { path: dataDir, ...check(dataDir) },
    contractsDir: { path: contractsDir, ...check(contractsDir) },
    env: {
      PET_SALON_DATA_DIR: process.env.PET_SALON_DATA_DIR || null,
      NODE_ENV: process.env.NODE_ENV || null,
    },
  });
});

// Routes
app.use('/api/owners', ownerController);
app.use('/api/owners', ownerPetsController);
app.use('/api/pets', petController);
app.use('/api/appointments', appointmentController);
app.use('/api/grooming-records', groomingRecordController);
app.use('/api/contracts', contractController);
app.use('/api/backup', backupController);

// Error handler
app.use(errorHandler);

module.exports = app;
