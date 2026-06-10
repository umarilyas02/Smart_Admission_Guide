import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (userId, email) => {
  return jwt.sign({ userId, email }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return null;
  }
};
