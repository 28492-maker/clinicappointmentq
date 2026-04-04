import dbConnect from '../utils/dbConnect';
import User from '../server/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    const { name, email, password, role } = req.body;
    try {
      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ message: 'User already exists' });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = new User({ name, email, password: hashedPassword, role: role || 'patient' });
      await user.save();

      const token = jwt.sign(
        { id: user._id, role: user.role, email: user.email }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1d' }
      );

      // THE KEY FIX: Sending the email field back to the frontend
      res.status(200).json({ 
        token, 
        user: { 
          id: user._id, 
          name: user.name, 
          role: user.role, 
          email: user.email // This must match user.email in your MongoDB
        } 
      });
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}