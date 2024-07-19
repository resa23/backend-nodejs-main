const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Token = require('../models/Token'); // Model for tracking tokens


exports.register = async (req, res) => {
  const { fullName, username, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({
      fullName,
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      data: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to register user', error: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Authentication failed: User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Authentication failed: Incorrect password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is not active, please contact administrator' });
    }

    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        username: user.username
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Check for existing token in the database
    let tokenRecord = await Token.findOne({ userId: user._id });
    if (tokenRecord) {
      tokenRecord.accessCount += 1;  // Increment access count each time user logs in
      tokenRecord.token = token;  // Update token in the record
    } else {
      // Create a new token record if it does not exist
      tokenRecord = new Token({
        userId: user._id,
        token: token,
        accessCount: 1
      });
    }
    await tokenRecord.save();

    // Send the token and user details in response
    res.json({
      status: 200,
      message: 'Login successful',
      data: {
        token: `${tokenRecord.accessCount}|${token}`,  // Prepend access count to token
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message
    });
  }
};
