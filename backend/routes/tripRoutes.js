const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createTripSchema, updateTripSchema, regenerateDaySchema } = require('../validators/tripValidator');

// Enforce authentication on all trip operations
router.use(auth);

router.get('/', tripController.getTrips);
router.get('/:id', tripController.getTripById);
router.post('/', validate(createTripSchema), tripController.generateNewTrip);
router.put('/:id', validate(updateTripSchema), tripController.updateTrip);
router.delete('/:id', tripController.deleteTrip);
router.post('/:id/regenerate-day', validate(regenerateDaySchema), tripController.regenerateDay);

module.exports = router;
