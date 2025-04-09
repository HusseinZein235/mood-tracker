document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const chatMessagesEl = document.getElementById('chatMessages');
    const userMessageEl = document.getElementById('userMessage');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    
    // User data
    let userData = null;
    let moodData = null;
    // API key - updated with the new key provided
    const OPENROUTER_API_KEY = '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';
    
    // API Settings - updated with the requested model name
    const API_MODEL = 'deepseek/deepseek-v3-base:free';
    const USE_LOCAL_FALLBACK = true;
    
    // Initialize chat
    initializeChat();
    
    // Event Listeners
    userMessageEl.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    sendMessageBtn.addEventListener('click', sendMessage);
    
    // Initialize chat
    async function initializeChat() {
        try {
            // Check authentication
            const userResponse = await fetch('/api/auth/me');
            if (!userResponse.ok) {
                throw new Error('غير مصرح به');
            }
            
            userData = await userResponse.json();
            console.log('User data loaded:', userData);
            
            // Get latest mood
            const moodResponse = await fetch('/api/mood/latest');
            if (moodResponse.ok) {
                moodData = await moodResponse.json();
                console.log('Latest mood data:', moodData);
            } else {
                console.log('No mood data available');
            }
            
            // Remove initial greeting as per user's request
        } catch (error) {
            console.error('Error initializing chat:', error);
            
            // Redirect to login if not authenticated
            window.location.href = '/login';
        }
    }
    
    // Send message function
    function sendMessage() {
        const message = userMessageEl.value.trim();
        if (!message) return;
        
        // Add user message to chat
        addUserMessage(message);
        
        // Clear input
        userMessageEl.value = '';
        
        // Direct to AI or fallback based on configuration
        if (USE_LOCAL_FALLBACK) {
            // Try API first, with quick fallback
            sendMessageWithFallback(message);
        } else {
            // Standard approach
            tryServerSideChat(message);
        }
    }
    
    // New combined approach for faster fallback
    async function sendMessageWithFallback(message) {
        addTypingIndicator();
        
        // Start a timer for fallback
        const fallbackTimer = setTimeout(() => {
            // If API hasn't responded in 3 seconds, show fallback
            console.log('API taking too long, showing fallback response');
            removeTypingIndicator();
            
            // Display fallback message
            const fallbackResponse = getEnhancedBotResponse(message);
            addBotMessage(fallbackResponse);
        }, 3000);
        
        try {
            // Check if API key is available
            if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.trim() === '') {
                console.error('No OpenRouter API key found');
                throw new Error('No API key');
            }
            
            // Prepare system message and user message
            const systemMessage = getSystemPrompt();
            
            // Try the API call - updated to match exact structure provided
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "deepseek moodtracker",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": API_MODEL,
                    "messages": [
                        {
                            "role": "system",
                            "content": systemMessage
                        },
                        {
                            "role": "user",
                            "content": message
                        }
                    ]
                })
            });
            
            // Clear the fallback timer
            clearTimeout(fallbackTimer);
            
            // Process response
            const responseText = await response.text();
            removeTypingIndicator();
            
            if (!response.ok) {
                console.error('API error:', response.status);
                throw new Error('API error');
            }
            
            const data = JSON.parse(responseText);
            if (data.choices && data.choices.length > 0) {
                let reply = data.choices[0].message.content;
                
                // Clean up response
                reply = cleanupResponse(reply);
                addBotMessage(reply);
            } else {
                throw new Error('No response from API');
            }
        } catch (error) {
            // Clear the fallback timer if still running
            clearTimeout(fallbackTimer);
            
            console.error('Error with OpenRouter API:', error);
            removeTypingIndicator();
            
            // Get context for better logged messages
            let context = '';
            if (moodData) {
                context = `المزاج: ${getArabicMood(moodData.generalMood)}, الشعور: ${moodData.specificFeeling}`;
                if (moodData.cause) {
                    context += `, السبب: ${moodData.cause}`;
                }
            }
            console.log('Context:', context);
            console.log('No OpenRouter API connection. Using fallback response.');
            
            // Use enhanced fallback responses
            const fallbackResponse = getEnhancedBotResponse(message);
            addBotMessage(fallbackResponse);
        }
    }
    
    // Get system prompt based on user data
    function getSystemPrompt() {
        let moodContext = '';
        if (moodData) {
            const arabicMood = getArabicMood(moodData.generalMood);
            moodContext = `الحالة المزاجية الحالية للمستخدم: ${arabicMood} والشعور: ${moodData.specificFeeling}`;
            if (moodData.cause) {
                moodContext += ` والسبب: ${moodData.cause}`;
            }
        }
        
        return `أنت مساعد ودود جدا باللغة العربية في تطبيق تتبع المزاج. اسم المستخدم ${userData?.name || 'المستخدم'}. ${moodContext} قدم إجابات بسيطة وقصيرة تناسب حالة المستخدم. تجنب الرموز والترقيم قدر الإمكان. الإجابة قصيرة ومباشرة.`;
    }
    
    // Clean up API response
    function cleanupResponse(text) {
        return text.replace(/\*+/g, '')
                  .replace(/\n+/g, ' ')
                  .replace(/\s+/g, ' ')
                  .replace(/[\.,:;!]+(\s|$)/g, '$1')
                  .trim();
    }
    
    // Add bot message to chat
    function addBotMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = '<i class="fas fa-robot"></i>';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = `<p>${message}</p>`;
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        
        chatMessagesEl.appendChild(messageDiv);
        scrollToBottom();
    }
    
    // Add user message to chat
    function addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = '<i class="fas fa-user"></i>';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = `<p>${message}</p>`;
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        
        chatMessagesEl.appendChild(messageDiv);
        scrollToBottom();
    }
    
    // Add typing indicator
    function addTypingIndicator() {
        const indicatorDiv = document.createElement('div');
        indicatorDiv.className = 'message bot-message typing-indicator';
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = '<i class="fas fa-robot"></i>';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
        
        indicatorDiv.appendChild(avatarDiv);
        indicatorDiv.appendChild(contentDiv);
        
        indicatorDiv.id = 'typingIndicator';
        chatMessagesEl.appendChild(indicatorDiv);
        scrollToBottom();
    }
    
    // Remove typing indicator
    function removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    // Scroll chat to bottom
    function scrollToBottom() {
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    }
    
    // Send suggestion function (called from HTML)
    window.sendSuggestion = function(suggestion) {
        userMessageEl.value = suggestion;
        sendMessage();
    };
    
    // Enhanced bot response with more comprehensive fallbacks
    function getEnhancedBotResponse(message) {
        // Convert to lowercase and remove diacritics for better matching
        const cleanMessage = message.toLowerCase()
            .replace(/[\u064B-\u0652]/g, ''); // Remove Arabic diacritics (tashkeel)
        
        // Check for keywords in the cleaned message
        if (containsAny(cleanMessage, ['سعيد', 'فرح', 'سعادة', 'مبسوط', 'فرحان'])) {
            return 'سعيد لسماع ذلك المشاعر الإيجابية مهمة لصحتنا';
        } 
        else if (containsAny(cleanMessage, ['حزين', 'حزن', 'تعيس', 'مكتئب', 'زعلان'])) {
            return 'أنا آسف لسماع ذلك من المهم التعبير عن مشاعرك';
        } 
        else if (containsAny(cleanMessage, ['قلق', 'توتر', 'خوف', 'خائف', 'متوتر'])) {
            return 'القلق شعور طبيعي حاول التنفس بعمق واتخاذ وقت للاسترخاء';
        } 
        else if (containsAny(cleanMessage, ['غاضب', 'غضب', 'عصبي', 'معصب'])) {
            return 'الغضب مشاعر طبيعية خذ وقتًا للتهدئة';
        } 
        else if (containsAny(cleanMessage, ['نوم', 'أرق', 'تعب', 'متعب', 'إجهاد'])) {
            return 'النوم الجيد مهم للصحة النفسية حاول الحفاظ على روتين نوم منتظم';
        } 
        else if (containsAny(cleanMessage, ['شكر', 'شكرا', 'ممنون'])) {
            return 'العفو أنا هنا للمساعدة';
        } 
        else if (containsAny(cleanMessage, ['مرحبا', 'اهلا', 'السلام', 'هاي', 'هلو'])) {
            return 'مرحباً كيف يمكنني مساعدتك اليوم';
        }
        else if (containsAny(cleanMessage, ['كيف', 'حال', 'أخبار'])) {
            return 'أنا بخير شكرا لسؤالك كيف حالك أنت';
        }
        else if (containsAny(cleanMessage, ['مزاج', 'شعور', 'احساس'])) {
            if (moodData) {
                const mood = getArabicMood(moodData.generalMood);
                return `مزاجك الحالي هو ${mood} وشعورك هو ${moodData.specificFeeling}`;
            } else {
                return 'يمكنك تسجيل مزاجك ومشاعرك في صفحة المزاج';
            }
        }
        else if (containsAny(cleanMessage, ['نصيحة', 'توصية', 'اقتراح'])) {
            return getRandomTip();
        }
        else if (containsAny(cleanMessage, ['ساعد', 'مساعدة'])) {
            return 'يمكنني مساعدتك في التحدث عن مشاعرك وتتبع مزاجك وتقديم النصائح';
        }
        else if (containsAny(cleanMessage, ['وقت', 'ساعة', 'تاريخ', 'يوم'])) {
            return getTimeResponse();
        }
        else if (containsAny(cleanMessage, ['طقس', 'جو', 'حرارة'])) {
            return 'عذرا لا يمكنني معرفة حالة الطقس حاليا';
        }
        else if (containsAny(cleanMessage, ['تذكير', 'تذكرني', 'ذكرني'])) {
            return 'يمكنك استخدام قائمة المهام لإضافة تذكير';
        }
        else if (containsAny(cleanMessage, ['مهام', 'واجبات', 'قائمة'])) {
            return 'يمكنك الوصول إلى قائمة المهام من خلال صفحة المهام';
        }
        else if (containsAny(cleanMessage, ['تنفس', 'استرخاء', 'تأمل'])) {
            return 'جرب تمارين التنفس في تطبيقنا للمساعدة في الاسترخاء';
        }
        else if (containsAny(cleanMessage, ['بوت', 'روبوت', 'انت من'])) {
            return 'أنا مساعد رقمي صمم لمساعدتك في تتبع مزاجك والاعتناء بصحتك النفسية';
        }
        else if (containsAny(cleanMessage, ['عن', 'تعرف'])) {
            if (userData) {
                return `أعرف أن اسمك ${userData.name} وأنا هنا لمساعدتك`;
            } else {
                return 'أنا هنا لمساعدتك في تتبع مزاجك ومشاعرك';
            }
        }
        else if (message.length < 5) {
            return 'هل يمكنك التوضيح أكثر';
        }
        else {
            return 'أفهم ما تقول يمكنني مساعدتك في تتبع مزاجك ومشاعرك';
        }
    }
    
    // Helper function to check if message contains any of the keywords
    function containsAny(text, keywords) {
        return keywords.some(keyword => text.includes(keyword));
    }
    
    // Get random wellness tip
    function getRandomTip() {
        const tips = [
            'حاول ممارسة التأمل لمدة 5 دقائق يوميا',
            'المشي في الهواء الطلق يساعد على تحسين المزاج',
            'شرب الماء بكمية كافية يؤثر إيجابيا على الصحة النفسية',
            'الاستماع إلى الموسيقى المفضلة يمكن أن يحسن مزاجك',
            'التواصل مع الأصدقاء يساعد في تخفيف التوتر',
            'النوم الجيد أساسي للصحة النفسية',
            'كتابة المشاعر تساعد في التعامل معها',
            'خذ استراحة قصيرة من الشاشات كل ساعة'
        ];
        return tips[Math.floor(Math.random() * tips.length)];
    }
    
    // Get time response
    function getTimeResponse() {
        const now = new Date();
        const hours = now.getHours();
        
        if (hours < 12) {
            return 'صباح الخير الوقت الآن صباحا';
        } else if (hours < 18) {
            return 'مساء الخير الوقت الآن بعد الظهر';
        } else {
            return 'مساء الخير الوقت الآن مساء';
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
}); 