document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const breathingAnimation = document.getElementById('breathingAnimation');
    const breathingCircle = breathingAnimation.querySelector('.breathing-circle');
    const breathingText = document.getElementById('breathingText');
    const breathingCount = document.getElementById('breathingCount');
    const startBreathingBtn = document.getElementById('startBreathingBtn');
    const stopBreathingBtn = document.getElementById('stopBreathingBtn');
    const saveBreathingSettingsBtn = document.getElementById('saveBreathingSettingsBtn');
    const breathingCyclesInput = document.getElementById('breathingCycles');
    const breathingTypeSelect = document.getElementById('breathingType');
    const breathSound = document.getElementById('breathSound');
    
    // Breathing settings
    let settings = {
        cycles: 3,
        type: '4-7-8'
    };
    
    // Breathing state
    let breathingState = {
        isActive: false,
        currentCycle: 1,
        currentPhase: 'prepare', // 'prepare', 'inhale', 'hold', 'exhale'
        interval: null,
        count: 0
    };
    
    // Breathing patterns
    const breathingPatterns = {
        '4-7-8': {
            inhale: 4,
            hold: 7,
            exhale: 8,
            name: 'تمرين 4-7-8'
        },
        '4-4-4': {
            inhale: 4,
            hold: 4,
            exhale: 4,
            name: 'تمرين 4-4-4 (مربع التنفس)'
        },
        '5-2': {
            inhale: 5,
            hold: 0,
            exhale: 5,
            name: 'تمرين 5-2 (تنفس مهدئ)'
        }
    };
    
    // Current pattern
    let currentPattern = breathingPatterns[settings.type];
    
    // Start breathing exercise
    const startBreathing = () => {
        if (breathingState.isActive) return;
        
        // Reset state
        breathingState.isActive = true;
        breathingState.currentCycle = 1;
        breathingState.currentPhase = 'prepare';
        breathingState.count = 3; // 3 second countdown
        
        // Update UI
        startBreathingBtn.disabled = true;
        stopBreathingBtn.disabled = false;
        breathingText.textContent = 'استعد';
        breathingCount.textContent = breathingState.count;
        
        // Start interval
        breathingState.interval = setInterval(updateBreathing, 1000);
    };
    
    // Stop breathing exercise
    const stopBreathing = () => {
        if (!breathingState.isActive) return;
        
        // Reset state
        breathingState.isActive = false;
        clearInterval(breathingState.interval);
        
        // Update UI
        startBreathingBtn.disabled = false;
        stopBreathingBtn.disabled = true;
        breathingText.textContent = 'استعد';
        breathingCount.textContent = '';
        breathingCircle.style.transform = 'scale(1)';
    };
    
    // Update breathing animation and state
    const updateBreathing = () => {
        // Decrease count
        breathingState.count--;
        
        // Handle phase transition
        if (breathingState.count < 0) {
            advancePhase();
        } else {
            // Update count display
            breathingCount.textContent = breathingState.count;
        }
    };
    
    // Advance to next phase
    const advancePhase = () => {
        switch (breathingState.currentPhase) {
            case 'prepare':
                // Move to inhale
                breathingState.currentPhase = 'inhale';
                breathingState.count = currentPattern.inhale;
                breathingText.textContent = 'شهيق';
                breathingCount.textContent = breathingState.count;
                breathingCircle.style.transform = 'scale(1)';
                breathingCircle.style.animation = 'breatheIn 4s ease forwards';
                playBreathSound();
                break;
                
            case 'inhale':
                // If hold is 0, skip to exhale
                if (currentPattern.hold === 0) {
                    breathingState.currentPhase = 'exhale';
                    breathingState.count = currentPattern.exhale;
                    breathingText.textContent = 'زفير';
                    breathingCount.textContent = breathingState.count;
                    breathingCircle.style.animation = 'breatheOut 5s ease forwards';
                    playBreathSound();
                } else {
                    // Move to hold
                    breathingState.currentPhase = 'hold';
                    breathingState.count = currentPattern.hold;
                    breathingText.textContent = 'احبس النفس';
                    breathingCount.textContent = breathingState.count;
                    breathingCircle.style.animation = 'none';
                    breathingCircle.style.transform = 'scale(1.3)';
                }
                break;
                
            case 'hold':
                // Move to exhale
                breathingState.currentPhase = 'exhale';
                breathingState.count = currentPattern.exhale;
                breathingText.textContent = 'زفير';
                breathingCount.textContent = breathingState.count;
                breathingCircle.style.animation = 'breatheOut 5s ease forwards';
                playBreathSound();
                break;
                
            case 'exhale':
                // Check if cycle is complete
                if (breathingState.currentCycle >= settings.cycles) {
                    // Exercise complete
                    stopBreathing();
                    alert('تم إكمال تمرين التنفس بنجاح!');
                } else {
                    // Move to next cycle
                    breathingState.currentCycle++;
                    breathingState.currentPhase = 'inhale';
                    breathingState.count = currentPattern.inhale;
                    breathingText.textContent = 'شهيق';
                    breathingCount.textContent = breathingState.count;
                    breathingCircle.style.animation = 'breatheIn 4s ease forwards';
                    playBreathSound();
                }
                break;
        }
    };
    
    // Play breath sound
    const playBreathSound = () => {
        breathSound.play();
    };
    
    // Save breathing settings
    const saveBreathingSettings = () => {
        // Get and validate cycles
        const cycles = parseInt(breathingCyclesInput.value);
        if (isNaN(cycles) || cycles < 1 || cycles > 10) {
            alert('الرجاء إدخال عدد صحيح للدورات بين 1 و 10');
            return;
        }
        
        // Get and validate type
        const type = breathingTypeSelect.value;
        if (!breathingPatterns[type]) {
            alert('الرجاء اختيار نوع تمرين صحيح');
            return;
        }
        
        // Save settings
        settings.cycles = cycles;
        settings.type = type;
        currentPattern = breathingPatterns[type];
        
        alert('تم حفظ الإعدادات بنجاح');
    };
    
    // Event listeners
    startBreathingBtn.addEventListener('click', startBreathing);
    stopBreathingBtn.addEventListener('click', stopBreathing);
    saveBreathingSettingsBtn.addEventListener('click', saveBreathingSettings);
    
    // Initialize
    breathingCyclesInput.value = settings.cycles;
    breathingTypeSelect.value = settings.type;
}); 