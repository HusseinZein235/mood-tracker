document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const welcomeMessage = document.getElementById('welcomeMessage');
    const alertBox = document.getElementById('alert');
    const specificFeelingsContainer = document.getElementById('specificFeelings');
    const summaryMood = document.getElementById('summaryMood');
    const summaryFeeling = document.getElementById('summaryFeeling');
    const summaryCause = document.getElementById('summaryCause');
    
    // Mood tracking data
    let moodData = {
        generalMood: '',
        specificFeeling: '',
        cause: ''
    };
    
    // Step management
    let currentStep = 1;
    
    // Specific feelings based on mood
    const specificFeelings = {
        'سعيد': [
            'متفائل', 'متحمس', 'ممتن', 'مستمتع', 'فخور', 'مرتاح', 'سعيد'
        ],
        'عادي': [
            'هادئ', 'محايد', 'مستقر', 'متقبل', 'غير مبالٍ', 'متأمل'
        ],
        'حزين': [
            'قلق', 'حزين', 'متوتر', 'مضغوط', 'متعب', 'محبط', 'وحيد', 'خائف'
        ]
    };
    
    // Show alert
    const showAlert = (message, type = 'error') => {
        alertBox.textContent = message;
        alertBox.className = `alert alert-${type} show`;
        
        setTimeout(() => {
            alertBox.classList.remove('show');
        }, 3000);
    };
    
    // Load user data
    const loadUserData = async () => {
        try {
            const response = await fetch('/api/auth/me');
            
            if (!response.ok) {
                // Redirect to login if not authenticated
                window.location.href = '/';
                return;
            }
            
            const userData = await response.json();
            welcomeMessage.textContent = `مرحباً ${userData.name}، أريد التحقق من مزاجك اليوم`;
        } catch (error) {
            console.error('Error loading user data:', error);
            showAlert('حدث خطأ أثناء تحميل بيانات المستخدم');
        }
    };
    
    // Navigate to specific step
    const goToStep = (step) => {
        // Hide all steps
        document.querySelectorAll('.mood-step').forEach(s => {
            s.classList.remove('active');
        });
        
        // Show the current step
        document.getElementById(`step${step}`).classList.add('active');
        currentStep = step;
    };
    
    // Go to previous step
    window.prevStep = () => {
        if (currentStep > 1) {
            goToStep(currentStep - 1);
        }
    };
    
    // Select general mood
    window.selectMood = (mood) => {
        // Update selected mood
        moodData.generalMood = mood;
        
        // Clear previous selection
        document.querySelectorAll('.mood-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Mark selected option
        document.querySelector(`.mood-option[data-mood="${mood}"]`).classList.add('selected');
        
        // Generate specific feelings for this mood
        generateSpecificFeelings(mood);
        
        // Go to next step
        setTimeout(() => {
            goToStep(2);
        }, 300);
    };
    
    // Generate specific feelings
    const generateSpecificFeelings = (mood) => {
        const feelings = specificFeelings[mood];
        specificFeelingsContainer.innerHTML = '';
        
        feelings.forEach(feeling => {
            const feelingOption = document.createElement('div');
            feelingOption.className = 'feeling-option';
            feelingOption.dataset.feeling = feeling;
            feelingOption.textContent = feeling;
            feelingOption.addEventListener('click', () => {
                selectFeeling(feeling);
            });
            
            specificFeelingsContainer.appendChild(feelingOption);
        });
    };
    
    // Select specific feeling
    const selectFeeling = (feeling) => {
        // Update selected feeling
        moodData.specificFeeling = feeling;
        
        // Clear previous selection
        document.querySelectorAll('.feeling-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Mark selected option
        document.querySelector(`.feeling-option[data-feeling="${feeling}"]`).classList.add('selected');
        
        // Go to next step
        setTimeout(() => {
            goToStep(3);
        }, 300);
    };
    
    // Select cause
    window.selectCause = (cause) => {
        // Update selected cause
        moodData.cause = cause;
        
        // Clear previous selection
        document.querySelectorAll('.cause-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Mark selected option
        document.querySelector(`.cause-option[data-cause="${cause}"]`).classList.add('selected');
        
        // Update summary
        summaryMood.textContent = moodData.generalMood;
        summaryFeeling.textContent = moodData.specificFeeling;
        summaryCause.textContent = moodData.cause;
        
        // Go to next step
        setTimeout(() => {
            goToStep(4);
        }, 300);
    };
    
    // Save mood data
    window.saveMood = async () => {
        try {
            const response = await fetch('/api/mood', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(moodData)
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.msg || 'خطأ في حفظ بيانات المزاج');
            }
            
            showAlert('تم حفظ مزاجك بنجاح!', 'success');
            
            // Redirect to dashboard after a delay
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
        } catch (error) {
            console.error('Error saving mood:', error);
            showAlert(error.message);
        }
    };
    
    // Initialize
    loadUserData();
}); 