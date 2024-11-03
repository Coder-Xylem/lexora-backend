const express = require('express');
const { register, login, checkLexusIdAvailability } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/check-lexus-id/:lexusId', checkLexusIdAvailability);

module.exports = router;