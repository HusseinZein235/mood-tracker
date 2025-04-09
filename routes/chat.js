const express = require('express');
const router = express.Router();
const { isAuth } = require('../middleware/auth');
const axios = require('axios');
require('dotenv').config();

// OpenAI API key from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Handle chat requests
router.post('/', isAuth, async (req, res) => {
  const { message, context } = req.body;
  const userName = req.session.user.name || 'المستخدم';

  if (!message) {
    return res.status(400).json({ error: 'الرسالة مطلوبة' });
  }

  try {
    console.log('Sending message to OpenAI:', message);
    console.log('Context:', context);
    
    if (!OPENAI_API_KEY) {
      console.log('No OpenAI API key found. Using fallback response.');
      return res.json({ reply: getStaticResponse(message) });
    }

    // Prepare system message with context about the app and user
    let systemPrompt = `أنت مساعد للذكاء الاصطناعي باللغة العربية لتطبيق تتبع المزاج. 
    دورك هو مساعدة المستخدم في تحسين حالته المزاجية وتقديم الدعم والنصائح. 
    يجب أن تكون إجاباتك دائمًا باللغة العربية وأن تكون لطيفة ومفيدة وداعمة.`;
    
    // Add context if available
    if (context) {
      systemPrompt += ` معلومات عن المستخدم: ${context}`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    // Set a timeout for the API request
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 10000)
    );

    // Make the API request
    const responsePromise = axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
      }
    );

    // Wait for the response or timeout
    const response = await Promise.race([responsePromise, timeoutPromise]);

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const botReply = response.data.choices[0].message.content;
      console.log('Received response from OpenAI');
      res.json({ reply: botReply });
    } else {
      throw new Error('لم يتم استلام رد صحيح من API');
    }
  } catch (error) {
    console.error('Error with OpenAI API:', error.message);
    
    // Send a static fallback response
    res.json({ reply: getStaticResponse(message) });
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

module.exports = router; 