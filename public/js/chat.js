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
        
        // Try server-side API first, fallback to client-side
        tryServerSideChat(message);
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
    
    // Try server-side chat API first
    async function tryServerSideChat(message) {
        addTypingIndicator();
        
        try {
            // Prepare context
            let context = '';
            if (moodData) {
                context = `المزاج: ${getArabicMood(moodData.generalMood)}, الشعور: ${moodData.specificFeeling}`;
                if (moodData.cause) {
                    context += `, السبب: ${moodData.cause}`;
                }
            }
            
            // Send to server API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    context: context
                })
            });
            
            removeTypingIndicator();
            
            if (response.ok) {
                const data = await response.json();
                addBotMessage(data.reply);
            } else {
                // Fallback to client-side API if server fails
                console.log('Server-side API failed, trying client-side...');
                sendMessageToAI(message);
            }
        } catch (error) {
            console.error('Error with server-side chat:', error);
            removeTypingIndicator();
            
            // Fallback to client-side API
            sendMessageToAI(message);
        }
    }
    
    // Send message to AI (client-side fallback)
    async function sendMessageToAI(message) {
        addTypingIndicator();
        
        console.log('Starting client-side API call to OpenRouter');
        
        try {
            // Create a more detailed system prompt with user's mood data
            let moodContext = '';
            if (moodData) {
                const arabicMood = getArabicMood(moodData.generalMood);
                moodContext = `الحالة المزاجية الحالية للمستخدم هي: ${arabicMood}، والشعور المحدد هو: ${moodData.specificFeeling}`;
                if (moodData.cause) {
                    moodContext += `، والسبب هو: ${moodData.cause}`;
                }
                console.log('Including mood context:', moodContext);
            }
            
            // Build system message with user data and mood context
            const systemContent = `أنت مساعد ذكي ومتعاطف يتحدث باللغة العربية لمستخدم في تطبيق تتبع المزاج. اسم المستخدم هو ${userData.name}. ${moodContext ? moodContext : ''} قدم إجابات داعمة ومفيدة تناسب حالة المستخدم المزاجية. اجعل الإجابات قصيرة وإيجابية.`;
            
            const messages = [
                {
                    role: "system",
                    content: systemContent
                },
                {
                    role: "user",
                    content: message
                }
            ];
            
            console.log('Sending request to OpenRouter API with mood context');
            
            // Simplified API request with minimal parameters - following official docs exactly
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "nvidia/llama-3.3-nemotron-super-49b-v1:free"
                },
                body: JSON.stringify({
                    "model": "nvidia/llama-3.3-nemotron-super-49b-v1:free",
                    "messages": messages
                })
            });
            
            console.log('Response status:', response.status);
            
            const responseText = await response.text();
            console.log('Raw API response:', responseText);
            
            removeTypingIndicator();
            
            if (!response.ok) {
                console.error('OpenRouter API error status:', response.status, response.statusText);
                console.error('Error details:', responseText);
                throw new Error(`فشل في الاتصال بالذكاء الاصطناعي (${response.status})`);
            }
            
            try {
                const data = JSON.parse(responseText);
                console.log('Parsed API response:', data);
                
                if (data.choices && data.choices.length > 0) {
                    const reply = data.choices[0].message.content;
                    console.log('Bot reply:', reply);
                    addBotMessage(reply);
                    
                    // Log successful interaction
                    console.log('Successful chat with mood context:', {
                        user_message: message,
                        mood_data: moodData,
                        response_id: data.id || 'unknown'
                    });
                } else {
                    console.error('No choices in response:', data);
                    throw new Error('لم يتم استلام رد من AI');
                }
            } catch (parseError) {
                console.error('Error parsing JSON response:', parseError);
                throw new Error('خطأ في تحليل استجابة AI');
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