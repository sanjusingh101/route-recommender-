const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc  Register a new user
// @route POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
  try {
    console.log('========== REGISTER REQUEST ==========');
    console.log('Request Body:', req.body);

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Name, email and password are all required');
    }

    console.log('Checking if user exists...');
    const existing = await User.findOne({ email });
    console.log('Existing user:', existing);

    if (existing) {
      res.status(400);
      throw new Error('A user with that email already exists');
    }

    console.log('Creating user...');
    const user = await User.create({ name, email, password });
    console.log('User created:', user);

    console.log('Generating token...');
    const token = generateToken(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    });

  } catch (error) {
    console.error('========== REGISTER ERROR ==========');
    console.error(error);
    console.error(error.stack);

    res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack,
    });
  }
});

// @desc  Login
// @route POST /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
  try {
    console.log('Login Request:', req.body);

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });

  } catch (error) {
    console.error('LOGIN ERROR:', error);
    throw error;
  }
});

// @desc  Get current user profile
// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// @desc  Update default preferences
// @route PUT /api/auth/preferences
const updatePreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  user.defaultPreferences = {
    ...user.defaultPreferences.toObject(),
    ...req.body,
  };

  await user.save();

  res.json(user.defaultPreferences);
});

// @desc Logout
const logoutUser = asyncHandler(async (req, res) => {
  res.json({ message: 'Logged out. Discard the token client-side.' });
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updatePreferences,
  logoutUser,
};