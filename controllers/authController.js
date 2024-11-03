const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
exports.register = async (req, res) => {
  const { email, lexusId, password } = req.body;

  // Check if lexusId or email already exists
  const existingUser = await User.findOne({ lexusId });
  const existingEmail = await User.findOne({ email });

  if (existingUser) {
    return res.status(400).json({ error: 'Lexus ID is already in use' });
  }
  if (existingEmail) {
    return res.status(400).json({ error: 'Email is already in use' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ lexusId, email, password: hashedPassword });

  try {
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login
exports.login = async (req, res) => {
  const { lexusId, password } = req.body;
  try {
    const user = await User.findOne({ lexusId });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id, lexusId: user.lexusId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
    res.json({ token, lexusId }); // Send Lexus ID along with the token
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: 'Login failed' });
  }
};


// Check if Lexus ID is available
exports.checkLexusIdAvailability = async (req, res) => {
  const { lexusId } = req.params;
  try {
    const user = await User.findOne({ lexusId });
    if (user) {
      return res.json({ available: false, message: 'Lexus ID is already taken' });
    }
    res.json({ available: true, message: 'Lexus ID is available' });
  } catch (error) {
    res.status(500).json({ error: 'Error checking Lexus ID' });
  }
};