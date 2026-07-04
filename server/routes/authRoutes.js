const express = require('express');
const { registerUser, loginUser, getMe, updatePreferences, logoutUser } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getMe);
router.put('/preferences', protect, updatePreferences);

module.exports = router;
