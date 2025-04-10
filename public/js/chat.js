document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const chatMessagesEl = document.getElementById('chatMessages');
    const userMessageEl = document.getElementById('userMessage');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    
    // User data
    let userData = null;
    let moodData = null;
    // API key for OpenRouter - updated with new key
    const OPENROUTER_API_KEY = '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';
    
    // API Settings - using the model from the example
    const API_MODEL = 'google/gemma-3-1b-it:free'; 
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
    
    // Updated to use OpenRouter API
    async function sendMessageWithFallback(message) {
        addTypingIndicator();
        
        try {
            // Check API key
            if (!OPENROUTER_API_KEY) {
                throw new Error('No API key');
            }
            
            console.log('Sending request to OpenRouter API...');
            
            // Make API call using OpenRouter format
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "Mood Tracker Chat",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": API_MODEL,
                    "messages": [
                        {
                            "role": "user",
                            "content": message
                        }
                    ]
                })
            });
            
            // Process response
            const responseText = await response.text();
            removeTypingIndicator();
            
            console.log('API response status:', response.status);
            console.log('Full API response:', responseText);
            
            if (!response.ok) {
                console.error('API error:', response.status, response.statusText);
                // Parse error response if possible
                try {
                    const errorData = JSON.parse(responseText);
                    console.error('Detailed error:', errorData);
                    if (errorData.error && errorData.error.message) {
                        throw new Error(`API error: ${errorData.error.message}`);
                    }
                } catch (e) {
                    // If can't parse JSON or no detailed message
                    throw new Error(`API error: ${response.status}`);
                }
            }
            
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('Response parsed successfully:', data);
            } catch (e) {
                console.error('Failed to parse JSON response:', e);
                throw new Error('Invalid JSON response');
            }
            
            if (data.error) {
                console.error('API returned error:', data.error);
                throw new Error(data.error.message || 'API returned an error');
            }
            
            if (data.choices && data.choices.length > 0) {
                let reply = data.choices[0].message.content;
                
                // Clean up response
                reply = cleanupResponse(reply);
                addBotMessage(reply);
            } else {
                console.error('No choices in API response:', data);
                throw new Error('No response data from API');
            }
        } catch (error) {
            console.error('Error with OpenRouter API:', error);
            removeTypingIndicator();
            
            // Show more specific error message
            const errorMessage = error.message || 'حدث خطأ غير معروف';
            addBotMessage(`عذراً، حدث خطأ في الاتصال: ${errorMessage}. يرجى المحاولة مرة أخرى لاحقاً.`);
        }
    }
    
    // Clean up API response
    function cleanupResponse(text) {
        return text.replace(/\*+/g, '')
                  .replace(/\n+/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();
    }
    
    // Replace the entire getEnhancedBotResponse function with a simple error function
    function getEnhancedBotResponse(message) {
        return 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى لاحقاً.';
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