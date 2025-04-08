import { config } from '../config.js';
import User from '../Models/userModel.js';
import jwt from 'jsonwebtoken';

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({ username, email, password });
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

export const addSeenQuestions = async (username, questionIds) => {
  try {

    const resolvedQuestionIds = await Promise.resolve(questionIds);

    if (!resolvedQuestionIds || !Array.isArray(resolvedQuestionIds)) {
      console.error('Invalid questionIds:', resolvedQuestionIds);
      return null;
    }

    const result = await User.findOneAndUpdate(
      { username: username },
      { $addToSet: { seenQuestions: { $each: resolvedQuestionIds } } },
      { new: true }
    );
    
    if (!result) {
      throw new Error(`User ${username} not found`);
    }
    
    console.log('Questions added to seen questions successfully');
    return result;
  } catch (error) {
    console.error('Error adding seen question:', error.message);
    throw error;
  }
};