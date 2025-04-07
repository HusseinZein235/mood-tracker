const express = require('express');
const router = express.Router();
const Mood = require('../models/Mood');
const { isAuth } = require('../middleware/auth');

// Create mood entry
router.post('/', isAuth, async (req, res) => {
  try {
    const { generalMood, specificFeeling, cause } = req.body;
    
    const newMood = new Mood({
      user: req.session.user.id,
      generalMood,
      specificFeeling,
      cause
    });
    
    const mood = await newMood.save();
    res.status(201).json(mood);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'خطأ في الخادم' });
  }
});

// Get user's mood history
router.get('/history', isAuth, async (req, res) => {
  try {
    const moods = await Mood.find({ user: req.session.user.id })
      .sort({ date: -1 });
    
    res.json(moods);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'خطأ في الخادم' });
  }
});

// Get user's latest mood
router.get('/latest', isAuth, async (req, res) => {
  try {
    const mood = await Mood.findOne({ user: req.session.user.id })
      .sort({ date: -1 });
    
    if (!mood) {
      return res.status(404).json({ msg: 'لم يتم العثور على بيانات للمزاج' });
    }
    
    res.json(mood);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'خطأ في الخادم' });
  }
});

// Get all user's moods
router.get('/', isAuth, async (req, res) => {
  try {
    const moods = await Mood.find({ user: req.session.user.id })
      .sort({ date: -1 });
    
    res.json(moods);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'خطأ في الخادم' });
  }
});

module.exports = router; 