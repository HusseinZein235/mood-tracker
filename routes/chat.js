const express = require('express');
const router = express.Router();
const { isAuth } = require('../middleware/auth');
const axios = require('axios');
require('dotenv').config();

// OpenRouter API key from environment variables
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';

// Handle chat requests
router.post('/', isAuth, async (req, res) => {
  const { message } = req.body;
  const userName = req.session.user.name || 'المستخدم';
  const mood = req.body.mood || null;

  if (!message) {
    return res.status(400).json({ error: 'الرسالة مطلوبة' });
  }

  try {
    console.log('Sending message to OpenRouter:', message);
    if (mood) {
      console.log('User mood context:', mood);
    }
    
    // Prepare context from mood data
    let contextMessage = '';
    if (mood) {
      contextMessage = `حالة المزاج الحالية للمستخدم: ${getArabicMood(mood.generalMood)}, الشعور المحدد: ${mood.specificFeeling}`;
      if (mood.cause) {
        contextMessage += `, السبب: ${mood.cause}`;
      }
    }
    
    // Prepare system message with context about the app and user
    const systemPrompt = "أنت مساعد مفيد ومتعاطف يتحدث باللغة العربية لمستخدم في تطبيق تتبع المزاج. المستخدم اسمه " + 
      userName + ". " + 
      (contextMessage ? "معلومات عن حالة المستخدم المزاجية: " + contextMessage : "") + 
      " قدم نصائح داعمة وإيجابية، لكن لا تدعي أنك معالج نفسي. حافظ على ردود قصيرة ومفيدة تناسب المحادثة. استجب دائمًا باللغة العربية الفصحى البسيطة.";

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    // Set a timeout for the API request
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 10000)
    );

    // Make the API request to OpenRouter
    const responsePromise = axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4o',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.APP_URL || 'https://moodtracker-app.onrender.com',
          'X-Title': 'Mood Tracker Assistant'
        }
      }
    );

    // Wait for the response or timeout
    const response = await Promise.race([responsePromise, timeoutPromise]);

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const botReply = response.data.choices[0].message.content;
      console.log('Received response from OpenRouter');
      res.json({ response: botReply });
    } else {
      throw new Error('لم يتم استلام رد صحيح من API');
    }
  } catch (error) {
    console.error('Error with OpenRouter API:', error.message);
    
    // Send a static fallback response
    res.json({ response: getStaticResponse(message) });
  }
});

// Function to generate static responses if API fails
function getStaticResponse(message) {
  message = message.toLowerCase();
  
  if (message.includes('سعيد') || message.includes('فرح') || message.includes('سعادة')) {
    return 'سعيد لسماع ذلك! المشاعر الإيجابية مهمة لصحتنا النفسية.';
  } else if (message.includes('حزين') || message.includes('حزن') || message.includes('تعيس')) {
    return 'أنا آسف لسماع ذلك. من المهم التعبير عن مشاعرك والتحدث مع شخص تثق به.';
  } else if (message.includes('قلق') || message.includes('توتر') || message.includes('خوف')) {
    return 'القلق شعور طبيعي. حاول التنفس بعمق واتخاذ وقت للاسترخاء.';
  } else if (message.includes('غاضب') || message.includes('غضب') || message.includes('عصبي')) {
    return 'الغضب مشاعر طبيعية. خذ وقتًا للتهدئة قبل اتخاذ أي قرار.';
  } else if (message.includes('نوم') || message.includes('أرق') || message.includes('تعب')) {
    return 'النوم الجيد مهم للصحة النفسية. حاول الحفاظ على روتين نوم منتظم.';
  } else if (message.includes('شكر') || message.includes('شكرا')) {
    return 'العفو! أنا هنا للمساعدة.';
  } else if (message.includes('مرحبا') || message.includes('اهلا') || message.includes('السلام عليكم')) {
    return 'مرحباً! كيف يمكنني مساعدتك اليوم؟';
  } else {
    return 'أنا آسف، لا يمكنني فهم طلبك تمامًا. هل يمكنك إعادة صياغته بطريقة أخرى؟';
  }
}

// Helper function to get Arabic mood name
function getArabicMood(mood) {
  switch(mood) {
    case 'happy': return 'سعيد';
    case 'neutral': return 'محايد';
    case 'sad': return 'حزين';
    default: return mood;
  }
}

module.exports = router; 