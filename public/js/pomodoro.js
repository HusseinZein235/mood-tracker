document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const timerMinutes = document.getElementById('timerMinutes');
    const timerSeconds = document.getElementById('timerSeconds');
    const timerMode = document.getElementById('timerMode');
    const timerProgress = document.getElementById('timerProgress');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const sessionCircles = document.getElementById('sessionCircles');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const workTimeInput = document.getElementById('workTime');
    const shortBreakInput = document.getElementById('shortBreak');
    const longBreakInput = document.getElementById('longBreak');
    const alarmSound = document.getElementById('alarmSound');
    const notification = document.getElementById('notification');
    
    // Timer settings
    let settings = {
        workTime: 25,
        shortBreak: 5,
        longBreak: 15
    };
    
    // Timer state
    let timerState = {
        minutes: settings.workTime,
        seconds: 0,
        isRunning: false,
        mode: 'work', // 'work', 'shortBreak', 'longBreak'
        interval: null,
        totalTime: settings.workTime * 60,
        elapsedTime: 0,
        session: 1
    };
    
    // Update timer display
    const updateTimerDisplay = () => {
        timerMinutes.textContent = timerState.minutes.toString().padStart(2, '0');
        timerSeconds.textContent = timerState.seconds.toString().padStart(2, '0');
        
        // Update mode text
        if (timerState.mode === 'work') {
            timerMode.textContent = 'وقت العمل';
            document.body.classList.remove('break-mode');
        } else if (timerState.mode === 'shortBreak') {
            timerMode.textContent = 'استراحة قصيرة';
            document.body.classList.add('break-mode');
        } else {
            timerMode.textContent = 'استراحة طويلة';
            document.body.classList.add('break-mode');
        }
        
        // Update progress
        const progress = (timerState.elapsedTime / timerState.totalTime) * 360;
        timerProgress.style.transform = `rotate(${progress - 90}deg)`;
    };
    
    // Update session circles
    const updateSessionCircles = () => {
        const circles = sessionCircles.querySelectorAll('.session-circle');
        
        circles.forEach((circle, index) => {
            if (index < timerState.session) {
                circle.classList.add('active');
            } else {
                circle.classList.remove('active');
            }
        });
    };
    
    // Start timer
    const startTimer = () => {
        if (timerState.isRunning) return;
        
        timerState.isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        
        // Hide notification if visible
        hideNotification();
        
        timerState.interval = setInterval(() => {
            // Decrease time
            if (timerState.seconds === 0) {
                if (timerState.minutes === 0) {
                    // Timer finished
                    clearInterval(timerState.interval);
                    timerState.isRunning = false;
                    playAlarm();
                    showNotification();
                    return;
                }
                
                timerState.minutes--;
                timerState.seconds = 59;
            } else {
                timerState.seconds--;
            }
            
            // Update elapsed time
            timerState.elapsedTime++;
            
            // Update display
            updateTimerDisplay();
        }, 1000);
    };
    
    // Pause timer
    const pauseTimer = () => {
        if (!timerState.isRunning) return;
        
        timerState.isRunning = false;
        clearInterval(timerState.interval);
        
        startBtn.disabled = false;
        pauseBtn.disabled = true;
    };
    
    // Reset timer
    const resetTimer = () => {
        pauseTimer();
        
        // Hide notification if visible
        hideNotification();
        
        // Reset to work mode
        timerState.mode = 'work';
        timerState.minutes = settings.workTime;
        timerState.seconds = 0;
        timerState.elapsedTime = 0;
        timerState.totalTime = settings.workTime * 60;
        
        updateTimerDisplay();
    };
    
    // Play alarm sound
    const playAlarm = () => {
        try {
            alarmSound.currentTime = 0;
            alarmSound.play().catch(error => {
                console.error('Error playing alarm sound:', error);
                // Show notification even if sound fails
                showNotification();
            });
            
            // Request notification permission and show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
                showBrowserNotification();
            } else if ('Notification' in window && Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        showBrowserNotification();
                    }
                });
            }
        } catch (error) {
            console.error('Error playing alarm:', error);
        }
    };
    
    // Show browser notification
    const showBrowserNotification = () => {
        let title, body;
        
        if (timerState.mode === 'work') {
            title = 'انتهى وقت العمل!';
            body = 'حان وقت الاستراحة! خذ استراحة واسترخ.';
        } else {
            title = 'انتهت الاستراحة!';
            body = 'حان وقت العودة للعمل! استمر في التركيز.';
        }
        
        const notification = new Notification(title, {
            body: body,
            icon: '/img/logo.png'
        });
        
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    };
    
    // Show in-app notification
    const showNotification = () => {
        if (!notification) return;
        
        let message;
        
        if (timerState.mode === 'work') {
            message = 'انتهى وقت العمل! حان وقت الاستراحة!';
        } else {
            message = 'انتهت الاستراحة! حان وقت العودة للعمل!';
        }
        
        notification.textContent = message;
        notification.classList.add('show');
        
        // Add continue button to notification
        const continueBtn = document.createElement('button');
        continueBtn.className = 'btn btn-primary';
        continueBtn.textContent = 'استمرار';
        continueBtn.onclick = () => {
            advanceSession();
            hideNotification();
        };
        
        notification.appendChild(continueBtn);
    };
    
    // Hide notification
    const hideNotification = () => {
        if (!notification) return;
        
        notification.textContent = '';
        notification.classList.remove('show');
    };
    
    // Advance to next session
    const advanceSession = () => {
        if (timerState.mode === 'work') {
            // After work session
            if (timerState.session % 4 === 0) {
                // Every 4th session, take a long break
                timerState.mode = 'longBreak';
                timerState.minutes = settings.longBreak;
                timerState.totalTime = settings.longBreak * 60;
            } else {
                // Otherwise, take a short break
                timerState.mode = 'shortBreak';
                timerState.minutes = settings.shortBreak;
                timerState.totalTime = settings.shortBreak * 60;
            }
        } else {
            // After break session
            timerState.mode = 'work';
            timerState.minutes = settings.workTime;
            timerState.totalTime = settings.workTime * 60;
            
            // Increment session count after a break
            if (timerState.session < 4) {
                timerState.session++;
            } else {
                timerState.session = 1; // Reset after 4 sessions
            }
            
            updateSessionCircles();
        }
        
        timerState.seconds = 0;
        timerState.elapsedTime = 0;
        
        updateTimerDisplay();
        
        // Auto-start next session
        startTimer();
    };
    
    // Save settings
    const saveSettings = () => {
        const workTime = parseInt(workTimeInput.value);
        const shortBreak = parseInt(shortBreakInput.value);
        const longBreak = parseInt(longBreakInput.value);
        
        if (isNaN(workTime) || isNaN(shortBreak) || isNaN(longBreak)) {
            alert('الرجاء إدخال قيم صحيحة');
            return;
        }
        
        settings.workTime = workTime;
        settings.shortBreak = shortBreak;
        settings.longBreak = longBreak;
        
        // Reset timer with new settings
        resetTimer();
        
        alert('تم حفظ الإعدادات بنجاح');
    };
    
    // Event listeners
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    saveSettingsBtn.addEventListener('click', saveSettings);
    
    // Initialize
    updateTimerDisplay();
    updateSessionCircles();
    
    // Load settings from inputs
    workTimeInput.value = settings.workTime;
    shortBreakInput.value = settings.shortBreak;
    longBreakInput.value = settings.longBreak;
}); 