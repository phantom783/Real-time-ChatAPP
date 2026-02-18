const User = require('../models/User');
const jwt = require('jsonwebtoken');

async function signUpHandler(req, res) {
  try {
    console.log('[userController] sign-up payload:', req.body);

    let { username, name, email, password } = req.body;
    username = (username || name || '').toString().trim();

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields required' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or username already exists' });
    }

    const newUser = new User({ username, email, password, onlineStatus: false });
    console.log('[userController] About to save user:', { username, email });
    
    await newUser.save();
    
    console.log('[userController] User saved successfully:', newUser._id);

    res.json({ message: 'Sign-up successful', userId: newUser._id });
  } catch (err) {
    console.error('[userController] sign-up error:', err.message);
    console.error('[userController] full error:', err);
    res.status(500).json({ message: err.message });
  }
}

async function loginHandler(req, res) {
  try {
    console.log('[userController] login payload:', req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`[userController] User not found for email: ${email}`);
      return res.status(400).json({ message: 'User not found' });
    }

    console.log(`[userController] User found: ${user._id}, comparing password...`);
    const isMatch = await user.comparePassword(password);
    console.log(`[userController] Password match result: ${isMatch}`);
    
    if (!isMatch) {
      console.log(`[userController] Password mismatch for user ${user._id}`);
      return res.status(400).json({ message: 'Invalid credentials - password mismatch' });
    }

    // Update online status
    user.onlineStatus = true;
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '24h'
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        onlineStatus: user.onlineStatus
      }
    });
  } catch (err) {
    console.error('[userController] login error:', err);
    res.status(500).json({ message: err.message });
  }
}

module.exports = { signUpHandler, loginHandler };