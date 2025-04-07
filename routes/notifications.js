const express = require('express');
const router = express.Router();
const { isAuth } = require('../middleware/auth');

// Get all notifications
router.get('/', isAuth, async (req, res) => {
  try {
    // Placeholder data for notifications
    const notifications = [
      {
        _id: '1',
        message: 'مرحباً بك في تطبيق متتبع المزاج! ابدأ بتسجيل مزاجك اليومي.',
        icon: 'fas fa-smile',
        date: new Date(),
        read: false
      },
      {
        _id: '2',
        message: 'لقد مر أسبوع على استخدامك للتطبيق. شكراً لثقتك!',
        icon: 'fas fa-medal',
        date: new Date(Date.now() - 86400000), // Yesterday
        read: false
      },
      {
        _id: '3',
        message: 'جرب ميزة تمارين التنفس الجديدة للاسترخاء.',
        icon: 'fas fa-lungs',
        date: new Date(Date.now() - 172800000), // 2 days ago
        read: true
      }
    ];
    
    return res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'خطأ في الخادم' });
  }
});

// Mark all notifications as read
router.post('/read-all', isAuth, async (req, res) => {
  try {
    // In a real app, you would update notifications in database
    console.log('All notifications marked as read');
    
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'خطأ في الخادم' });
  }
});

module.exports = router; 