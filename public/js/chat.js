document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const chatMessagesEl = document.getElementById('chatMessages');
    const userMessageEl = document.getElementById('userMessage');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    
    // User data
    let userData = null;
    let moodData = null;
    const OPENROUTER_API_KEY = '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';
    
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
            
            // Add personalized greeting
            const greeting = getPersonalizedGreeting();
            addBotMessage(greeting);
        } catch (error) {
            console.error('Error initializing chat:', error);
            
            // Redirect to login if not authenticated
            window.location.href = '/login';
        }
    }
    
    // Get personalized greeting based on user mood
    function getPersonalizedGreeting() {
        const username = userData.name;
        
        if (!moodData) {
            return `مرحباً ${username}! كيف يمكنني مساعدتك اليوم؟`;
        }
        
        const mood = moodData.generalMood;
        const feeling = moodData.specificFeeling;
        
        switch (mood) {
            case 'happy':
                return `مرحباً ${username}! أرى أنك تشعر بـ${feeling}. ما الذي يجعل يومك جيدًا؟`;
            case 'neutral':
            case 'عادي':
                return `مرحباً ${username}! يبدو أنك تشعر بـ${feeling}. هل هناك شيء معين تريد التحدث عنه؟`;
            case 'sad':
                return `مرحباً ${username}. أرى أنك تشعر بـ${feeling}. أنا هنا للاستماع إليك إذا أردت التحدث عن ذلك.`;
            default:
                return `مرحباً ${username}! كيف يمكنني مساعدتك اليوم؟`;
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
        
        // Send to AI and get response
        sendMessageToAI(message);
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
    
    // Send message to AI
    async function sendMessageToAI(message) {
        // Show typing indicator
        addTypingIndicator();
        
        try {
            // Prepare context from mood data
            let contextMessage = '';
            if (moodData) {
                contextMessage = `حالة المزاج الحالية للمستخدم: ${getArabicMood(moodData.generalMood)}, الشعور المحدد: ${moodData.specificFeeling}`;
                if (moodData.cause) {
                    contextMessage += `, السبب: ${moodData.cause}`;
                }
            }
            
            // Prepare API request
            const systemPrompt = "أنت مساعد مفيد ومتعاطف يتحدث باللغة العربية لمستخدم في تطبيق تتبع المزاج. المستخدم اسمه " + 
                (userData.name || 'المستخدم') + ". " + 
                (contextMessage ? "معلومات عن حالة المستخدم المزاجية: " + contextMessage : "") + 
                " قدم نصائح داعمة وإيجابية، لكن لا تدعي أنك معالج نفسي. حافظ على ردود قصيرة ومفيدة تناسب المحادثة. استجب دائمًا باللغة العربية الفصحى البسيطة.";

            const messages = [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ];
            
            console.log('Sending to API with context:', contextMessage);
            
            // Call OpenRouter API
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Mood Tracker Assistant'
                },
                body: JSON.stringify({ 
                    model: 'openai/gpt-4o',
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 500
                })
            });
            
            // Remove typing indicator
            removeTypingIndicator();
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('OpenRouter API error:', errorData);
                throw new Error('فشل في الاتصال بالذكاء الاصطناعي');
            }
            
            const data = await response.json();
            
            if (data.choices && data.choices.length > 0) {
                const reply = data.choices[0].message.content;
                addBotMessage(reply);
            } else {
                throw new Error('لم يتم استلام رد من AI');
            }
        } catch (error) {
            console.error('Error with AI:', error);
            removeTypingIndicator();
            
            // Fallback to static responses if AI fails
            const staticResponse = getStaticBotResponse(message);
            addBotMessage(staticResponse);
        }
    }
    
    // Get static bot response as fallback
    function getStaticBotResponse(message) {
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
}); 