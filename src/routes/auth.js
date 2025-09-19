// backend/src/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// minimal validation helper
function validUsername(username) {
  return typeof username === 'string' && username.trim().length >= 3 && username.trim().length <= 30;
}
function validPassword(p) {
  return typeof p === 'string' && p.length >= 6;
}

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!validUsername(username) || !validPassword(password)) {
      return res.status(400).json({ error: 'Invalid username or password (password min 6 chars, username 3-30 chars)' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: 'Username already exists' });

    const hash = await bcrypt.hash(password, 12);
    const newUser = new User({
      username: username.trim(),
      passwordHash: hash,
      role: 'editor' // default to editor for public registration
    });

    await newUser.save();
    res.json({ ok: true, message: 'User registered successfully' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!validUsername(username) || !validPassword(password)) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });

    res.json({ token, role: user.role, message: 'Login successful' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;
