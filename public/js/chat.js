document.addEventListener('DOMContentLoaded', function () {
    // Elements
    const chatMessages = document.querySelector('.chat-messages');
    const chatForm = document.querySelector('.chat-form');
    const chatInput = document.querySelector('.chat-input');
    const sendButton = document.querySelector('.send-button');
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
    
    // User data
    let userData = null;
    let moodData = null;
    
    // Initialize chat
    initializeChat();
    
    function initializeChat() {
        // Check authentication
        fetch('/api/auth/me')
            .then(res => {
                if (!res.ok) {
                    throw new Error('غير مصرح به');
                }
                return res.json();
            })
            .then(user => {
                userData = user;
                // Get latest mood
                return fetch('/api/mood/latest');
            })
            .then(res => {
                if (!res.ok) {
                    return null; // User might not have recorded a mood yet
                }
                return res.json();
            })
            .then(mood => {
                moodData = mood;
                // Add welcome message
                const greeting = getPersonalizedGreeting();
                addBotMessage(greeting);
            })
            .catch(err => {
                console.error('Error initializing chat:', err);
                window.location.href = '/login.html';
            });
    }
    
    function getPersonalizedGreeting() {
        const username = userData.name;
        
        if (!moodData) {
            return `مرحباً ${username}! كيف يمكنني مساعدتك اليوم؟`;
        }

        const mood = moodData.generalMood;
        const feeling = moodData.specificFeeling;
        
        if (mood === 'happy') {
            return `مرحباً ${username}! أنا سعيد لرؤيتك سعيداً اليوم. كيف يمكنني جعل يومك أفضل؟`;
        } else if (mood === 'sad') {
            return `مرحباً ${username}. أنا آسف لسماع أنك تشعر بالحزن. هل هناك شيء يمكنني فعله لمساعدتك؟`;
        } else {
            return `مرحباً ${username}! كيف يمكنني مساعدتك اليوم؟`;
        }
    }
    
    function addBotMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message bot-message';
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        scrollToBottom();
    }
    
    function addUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        scrollToBottom();
    }
    
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function showLoadingIndicator() {
        chatMessages.appendChild(loadingIndicator);
        scrollToBottom();
    }
    
    function hideLoadingIndicator() {
        if (loadingIndicator.parentNode === chatMessages) {
            chatMessages.removeChild(loadingIndicator);
        }
    }
    
    async function sendMessageToAI(message) {
        showLoadingIndicator();
        
        try {
            // Add mood context if available
            let contextMessage = '';
            if (moodData) {
                contextMessage = `User's current mood: ${moodData.generalMood}, feeling: ${moodData.specificFeeling}`;
                if (moodData.cause) {
                    contextMessage += `, cause: ${moodData.cause}`;
                }
            }
            
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    message: message,
                    context: contextMessage
                })
            });
            
            if (!response.ok) {
                throw new Error('فشل في الاتصال بالذكاء الاصطناعي');
            }
            
            const data = await response.json();
            hideLoadingIndicator();
            
            if (data.reply) {
                addBotMessage(data.reply);
            } else {
                throw new Error('لم يتم استلام رد');
            }
        } catch (error) {
            console.error('AI Response Error:', error);
            hideLoadingIndicator();
            
            // Fallback to static responses if AI fails
            const staticResponse = getStaticBotResponse(message);
            addBotMessage(staticResponse);
        }
    }
    
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
    
    // Event Listeners
    chatForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (message) {
            addUserMessage(message);
            chatInput.value = '';
            sendMessageToAI(message);
        }
    });

    sendButton.addEventListener('click', function () {
        const message = chatInput.value.trim();
        if (message) {
            addUserMessage(message);
            chatInput.value = '';
            sendMessageToAI(message);
        }
    });
}); 