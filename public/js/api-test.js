// OpenRouter API Test Script
console.log('Starting OpenRouter API Test');

// API Key
const API_KEY = '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';

// Test the API
async function testOpenRouterAPI() {
    console.log('Testing OpenRouter API with mood context...');
    
    try {
        // Example mood data
        const moodData = {
            generalMood: 'عادي', 
            specificFeeling: 'متقبل',
            cause: 'مدرسة/جامعة'
        };
        
        // Create context string based on mood
        const moodContext = `الحالة المزاجية الحالية للمستخدم هي: ${moodData.generalMood}، والشعور المحدد هو: ${moodData.specificFeeling}، والسبب هو: ${moodData.cause}`;
        
        // Build system message with user data and mood context
        const systemContent = `أنت مساعد ذكي ومتعاطف يتحدث باللغة العربية لمستخدم في تطبيق تتبع المزاج. اسم المستخدم هو أحمد. ${moodContext} قدم إجابات داعمة ومفيدة تناسب حالة المستخدم المزاجية. اجعل الإجابات قصيرة وإيجابية.`;
        
        const messages = [
            {
                role: "system",
                content: systemContent
            },
            {
                role: "user",
                content: "ماذا تنصحني أن أفعل لتحسين مزاجي؟"
            }
        ];
        
        console.log('Sending request to OpenRouter API...');
        document.getElementById('status').textContent = 'جاري الإرسال...';
        
        // Make API request following the exact format from documentation
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
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
        document.getElementById('status').textContent = `الحالة: ${response.status}`;
        
        const responseText = await response.text();
        console.log('Raw API response:', responseText);
        
        try {
            const data = JSON.parse(responseText);
            console.log('Parsed API response:', data);
            
            if (data.choices && data.choices.length > 0) {
                const reply = data.choices[0].message.content;
                console.log('Bot reply:', reply);
                document.getElementById('result').textContent = reply;
                document.getElementById('result').className = 'success';
                document.getElementById('status').textContent = 'تم بنجاح!';
            } else {
                document.getElementById('result').textContent = 'لا توجد إجابة من الذكاء الاصطناعي';
                document.getElementById('result').className = 'error';
                document.getElementById('status').textContent = 'فشل: لا توجد إجابة';
            }
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            document.getElementById('result').textContent = 'خطأ في تحليل الاستجابة: ' + parseError.message;
            document.getElementById('result').className = 'error';
            document.getElementById('status').textContent = 'فشل: خطأ في التحليل';
        }
    } catch (error) {
        console.error('API request failed:', error);
        document.getElementById('result').textContent = 'فشل الاختبار: ' + error.message;
        document.getElementById('result').className = 'error';
        document.getElementById('status').textContent = 'فشل: ' + error.message;
    }
}

// Run test when button is clicked
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('testButton').addEventListener('click', testOpenRouterAPI);
}); 