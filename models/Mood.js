const mongoose = require('mongoose');

const MoodSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generalMood: {
    type: String,
    enum: ['سعيد', 'عادي', 'حزين'],
    required: true
  },
  specificFeeling: {
    type: String,
    required: true
  },
  cause: {
    type: String,
    enum: ['عائلة', 'أصدقاء', 'مدرسة/جامعة', 'صحة'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Mood', MoodSchema); 