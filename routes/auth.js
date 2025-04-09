const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isAuth } = require('../middleware/auth');

// Register User
router.post('/register', async (req, res) => {
  try {
    const { username, name, description, password, email } = req.body;

    // Validation
    if (!username || !name || !password) {
      return res.status(400).json({ msg: 'الرجاء إدخال جميع الحقون المطلوبة' });
    }

    // Check if user already exists
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: 'المستخدم موجود بالفعل' });
    }

    // Auto-generate email if not provided
    const userEmail = email || `${username}@gmail.com`;

    // Create new user
    user = new User({
      username,
      name,
      description: description || '',
      password,
      email: userEmail
    });

    await user.save();

    // Create session
    req.session.user = {
      id: user._id.toString(),
      username: user.username,
      name: user.name,
      isAdmin: user.isAdmin
    };
    
    // Save session
    req.session.save(err => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ msg: 'خطأ في حفظ الجلسة' });
      }
      
      res.status(201).json({
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          isAdmin: user.isAdmin
        }
      });
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ msg: 'خطأ في الخادم' });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ msg: 'الرجاء إدخال اسم المستخدم وكلمة المرور' });
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: 'بيانات الاعتماد غير صحيحة' });
    }

    // Validate password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'بيانات الاعتماد غير صحيحة' });
    }

    // Create session
    req.session.user = {
      id: user._id.toString(),
      username: user.username,
      name: user.name,
      isAdmin: user.isAdmin
    };
    
    // Save session
    req.session.save(err => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ msg: 'خطأ في حفظ الجلسة' });
      }
      
      res.json({
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          isAdmin: user.isAdmin
        }
      });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'خطأ في الخادم' });
  }
});

// Get Current User
router.get('/me', async (req, res) => {
  try {
    console.log('Session in /me:', req.session);
    
    if (!req.session || !req.session.user) {
      console.log('No valid session found in /me');
      return res.status(401).json({ msg: 'لم يتم تسجيل الدخول' });
    }
    
    const userId = req.session.user.id;
    console.log('User ID from session:', userId);
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      console.log(`User with ID ${userId} not found in database`);
      // Clear invalid session
      req.session.destroy((err) => {
        if (err) console.error('Error destroying session:', err);
      });
      return res.status(401).json({ msg: 'المستخدم غير موجود' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Error in /me route:', err);
    res.status(500).json({ msg: 'خطأ في الخادم' });
  }
});

// Logout User
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ msg: 'خطأ في تسجيل الخروج' });
    }
    res.clearCookie('connect.sid');
    res.json({ msg: 'تم تسجيل الخروج بنجاح' });
  });
});

module.exports = router; 