const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Mood = require('../models/Mood');
const { isAuth, isAdmin } = require('../middleware/auth');

// Get all users
router.get('/users', isAdmin, async (req, res) => {
  try {
    console.log('Getting all users');
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ msg: 'خطأ في الخادم' });
  }
});

// Get user by ID with their mood data (admin only)
router.get('/users/:userId', isAuth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'المستخدم غير موجود' });
    }
    
    const moods = await Mood.find({ user: req.params.userId }).sort({ date: -1 });
    
    res.json({
      user,
      moods
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'خطأ في الخادم' });
  }
});

// Get all moods
router.get('/moods', isAdmin, async (req, res) => {
  try {
    console.log('Getting all moods');
    const moods = await Mood.find().populate('user', 'name username');
    res.json(moods);
  } catch (err) {
    console.error('Error fetching moods:', err);
    res.status(500).json({ msg: 'خطأ في الخادم' });
  }
});

// Get mood statistics (admin only)
router.get('/stats', isAuth, isAdmin, async (req, res) => {
  try {
    // Get count of each mood type
    const moodCounts = await Mood.aggregate([
      {
        $group: {
          _id: '$generalMood',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get count of each cause
    const causeCounts = await Mood.aggregate([
      {
        $group: {
          _id: '$cause',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get user with most mood entries
    const userEntries = await Mood.aggregate([
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Populate user data for the top users
    const populatedUsers = await User.populate(userEntries, {
      path: '_id',
      select: 'username name'
    });
    
    res.json({
      moodCounts,
      causeCounts,
      topUsers: populatedUsers
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'خطأ في الخادم' });
  }
});

// Delete user
router.delete('/users/:id', isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(`Attempting to delete user ${userId}`);
    
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ msg: 'المستخدم غير موجود' });
    }
    
    // Prevent deleting the admin user
    if (user.isAdmin) {
      return res.status(400).json({ msg: 'لا يمكن حذف المدير' });
    }
    
    // Delete user's moods
    await Mood.deleteMany({ user: userId });
    console.log(`Deleted moods for user ${userId}`);
    
    // Delete user
    await User.findByIdAndDelete(userId);
    console.log(`Deleted user ${userId}`);
    
    res.json({ msg: 'تم حذف المستخدم بنجاح' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ msg: 'خطأ في الخادم' });
  }
});

module.exports = router; 