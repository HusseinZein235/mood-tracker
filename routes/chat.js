const express = require('express');
const router = express.Router();
const { isAuth } = require('../middleware/auth');
const axios = require('axios');
const Mood = require('../models/Mood');
require('dotenv').config();

// OpenRouter API key from environment variables or use fallback
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';

// Helper function to get Arabic mood name
function getArabicMood(mood) {
  switch(mood) {
    case 'happy': return 'سعيد';
    case 'neutral': return 'محايد';
    case 'sad': return 'حزين';
    default: return mood;
  }
}

// Handle chat requests
router.post('/', isAuth, async (req, res) => {
  const { message, context } = req.body;
  const user = req.session.user;
  const userName = user.name || 'المستخدم';
  const userId = user._id;

  if (!message) {
    return res.status(400).json({ error: 'الرسالة مطلوبة' });
  }

  try {
    console.log('Sending message to OpenRouter:', message);
    console.log('Context from request:', context);
    
    // Get latest mood data from database
    let moodData;
    try {
      moodData = await Mood.findOne({ user: userId }).sort({ date: -1 });
      console.log('Retrieved latest mood from database:', moodData);
    } catch (dbError) {
      console.error('Error retrieving mood data:', dbError);
    }
    
    // Build mood context string
    let moodContext = '';
    if (moodData) {
      const arabicMood = getArabicMood(moodData.generalMood);
      moodContext = `الحالة المزاجية الحالية للمستخدم هي: ${arabicMood}، والشعور المحدد هو: ${moodData.specificFeeling}`;
      if (moodData.cause) {
        moodContext += `، والسبب هو: ${moodData.cause}`;
      }
      console.log('Including mood context:', moodContext);
    } else if (context) {
      // Use context from request if no mood data from DB
      moodContext = context;
    }
    
    // Build a more detailed system message with user data and mood
    const systemContent = `أنت مساعد ذكي ومتعاطف يتحدث باللغة العربية لمستخدم في تطبيق تتبع المزاج. اسم المستخدم هو ${userName}. ${moodContext} قدم إجابات داعمة ومفيدة تناسب حالة المستخدم المزاجية. اجعل الإجابات قصيرة وإيجابية.`;
    
    // Build messages with system and user content
    const messages = [
      { 
        role: 'system', 
        content: systemContent
      },
      { 
        role: 'user', 
        content: message 
      }
    ];

    console.log('Using detailed messages for API call:', JSON.stringify(messages));

    // Set a timeout for the API request
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 20000)
    );

    console.log('About to send request to OpenRouter with mood context');

    // Prepare the data payload - simplified to essential parameters
    const requestData = {
      "model": "nvidia/llama-3.3-nemotron-super-49b-v1:free",
      "messages": messages
    };

    // Make the API request
    const responsePromise = axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      requestData,
      {
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_URL || 'http://localhost:3000',
          "X-Title": "nvidia/llama-3.3-nemotron-super-49b-v1:free"
        }
      }
    );

    try {
      // Wait for the response or timeout
      console.log('Waiting for API response...');
      const response = await Promise.race([responsePromise, timeoutPromise]);
      
      console.log('OpenRouter API response received');
      console.log('Status:', response.status);
      console.log('Response data:', JSON.stringify(response.data));
      
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const botReply = response.data.choices[0].message.content;
        console.log('Bot reply content:', botReply);
        
        // Log successful interaction with mood context
        console.log('Successful chat with mood context:', {
          user_id: userId,
          message: message,
          mood_data: moodData ? {
            generalMood: moodData.generalMood,
            specificFeeling: moodData.specificFeeling
          } : null,
          response_id: response.data.id || 'unknown'
        });
        
        res.json({ 
          reply: botReply,
          id: response.data.id || 'unknown',
          model: response.data.model || 'unknown'
        });
      } else {
        console.error('Invalid or empty response format:', JSON.stringify(response.data));
        throw new Error('No valid response from API');
      }
    } catch (apiError) {
      console.error('API request failed:', apiError.message);
      
      if (apiError.response) {
        console.error('Status:', apiError.response.status);
        console.error('Status text:', apiError.response.statusText);
        console.error('Data:', JSON.stringify(apiError.response.data));
      } else if (apiError.request) {
        console.error('No response received from API');
        console.error('Request:', apiError.request);
      } else {
        console.error('Error setting up request:', apiError.message);
      }
      
      console.error('Request config:', JSON.stringify(apiError.config));
      throw new Error(`API error: ${apiError.message}`);
    }
  } catch (error) {
    console.error('Error with OpenRouter API:', error.message);
    
    // Send a static fallback response
    res.json({ 
      reply: getStaticResponse(message),
      error: error.message,
      fallback: true
    });
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