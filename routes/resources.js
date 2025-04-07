const express = require('express');
const router = express.Router();
const { isAuth } = require('../middleware/auth');

// Get all resources
router.get('/', isAuth, async (req, res) => {
  try {
    // Placeholder data for resources
    const resources = [
      {
        _id: '1',
        title: 'تقنيات تنفس للاسترخاء',
        description: 'تعلم كيفية استخدام التنفس العميق للتخلص من التوتر والقلق والوصول لحالة من الاسترخاء العميق.',
        category: 'تأمل',
        type: 'video',
        url: 'https://www.youtube.com/embed/acUZdGd_3Gw'
      },
      {
        _id: '2',
        title: 'التأمل الذهني للمبتدئين',
        description: 'دليل خطوة بخطوة لممارسة التأمل الذهني وتقليل التوتر وزيادة الوعي بالذات والمحيط.',
        category: 'تأمل',
        type: 'article',
        url: '#'
      },
      {
        _id: '3',
        title: 'موسيقى استرخاء هادئة',
        description: 'موسيقى هادئة تساعد على الاسترخاء والتركيز أثناء العمل أو الدراسة.',
        category: 'موسيقى',
        type: 'audio',
        url: 'https://soundcloud.com/relaxdaily/relaxing-music-calm-studying'
      },
      {
        _id: '4',
        title: 'اليوغا للمبتدئين',
        description: 'تمارين يوغا بسيطة يمكن ممارستها في المنزل لتحسين المرونة والتوازن والاسترخاء.',
        category: 'تمارين',
        type: 'video',
        url: 'https://www.youtube.com/embed/j7rKKpwdXNE'
      },
      {
        _id: '5',
        title: 'التخلص من التوتر بسرعة',
        description: 'تقنيات سريعة يمكن استخدامها في أي مكان للتخلص من التوتر وتهدئة العقل خلال دقائق.',
        category: 'مقالات',
        type: 'article',
        url: '#'
      }
    ];
    
    return res.json(resources);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'خطأ في الخادم' });
  }
});

// Update resource views
router.post('/:id/view', isAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real app, you would update view count in database
    console.log(`Resource ${id} viewed`);
    
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'خطأ في الخادم' });
  }
});

module.exports = router; 