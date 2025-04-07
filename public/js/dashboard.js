document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const welcomeMessage = document.getElementById('welcomeMessage');
    const adminFeature = document.getElementById('adminFeature');
    const alertBox = document.getElementById('alert');
    const moodCount = document.getElementById('moodCount');
    const lastMoodDate = document.getElementById('lastMoodDate');
    const currentMood = document.getElementById('currentMood');
    const recentMoodsTable = document.getElementById('recentMoodsTable');
    const moodChartCanvas = document.getElementById('moodChart');
    
    // Data
    let moodData = [];
    let moodChart = null;
    
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
            welcomeMessage.textContent = `مرحباً ${userData.name}`;
            
            // Show admin feature if user is admin
            if (userData.isAdmin) {
                adminFeature.style.display = 'block';
            }
            
            // Load mood data
            await loadMoodData();
        } catch (error) {
            console.error('Error loading user data:', error);
            showAlert('حدث خطأ أثناء تحميل بيانات المستخدم');
        }
    };
    
    // Load mood data
    const loadMoodData = async () => {
        try {
            const response = await fetch('/api/mood');
            
            if (!response.ok) {
                throw new Error('فشل تحميل بيانات المزاج');
            }
            
            moodData = await response.json();
            
            // Update UI with mood data
            updateMoodStats();
            renderRecentMoods();
            renderMoodChart();
        } catch (error) {
            console.error('Error loading mood data:', error);
            showAlert(error.message);
        }
    };
    
    // Update mood statistics
    const updateMoodStats = () => {
        // Set mood count
        moodCount.textContent = moodData.length;
        
        if (moodData.length === 0) {
            lastMoodDate.textContent = '-';
            currentMood.textContent = '-';
            return;
        }
        
        // Sort moods by date (newest first)
        const sortedMoods = [...moodData].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        // Set last mood date
        const latestMood = sortedMoods[0];
        const moodDate = new Date(latestMood.date);
        lastMoodDate.textContent = moodDate.toLocaleDateString('ar-EG');
        
        // Set current mood
        currentMood.textContent = latestMood.generalMood;
        
        // Add emoji based on mood
        let moodEmoji = '';
        switch (latestMood.generalMood) {
            case 'سعيد':
                moodEmoji = ' 😊';
                currentMood.style.color = '#28a745';
                break;
            case 'عادي':
                moodEmoji = ' 😐';
                currentMood.style.color = '#17a2b8';
                break;
            case 'حزين':
                moodEmoji = ' 😞';
                currentMood.style.color = '#dc3545';
                break;
        }
        
        currentMood.textContent += moodEmoji;
    };
    
    // Render recent moods table
    const renderRecentMoods = () => {
        // Clear table
        recentMoodsTable.innerHTML = '';
        
        if (moodData.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.className = 'empty-table';
            emptyRow.innerHTML = '<td colspan="4">لم تقم بتسجيل أي مزاج بعد</td>';
            recentMoodsTable.appendChild(emptyRow);
            return;
        }
        
        // Sort moods by date (newest first)
        const sortedMoods = [...moodData].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        // Show only 5 most recent moods
        const recentMoods = sortedMoods.slice(0, 5);
        
        // Create rows for each mood
        recentMoods.forEach(mood => {
            const moodDate = new Date(mood.date);
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${moodDate.toLocaleDateString('ar-EG')}</td>
                <td>${mood.generalMood}</td>
                <td>${mood.specificFeeling}</td>
                <td>${mood.cause}</td>
            `;
            
            recentMoodsTable.appendChild(row);
        });
    };
    
    // Render mood chart
    const renderMoodChart = () => {
        if (!moodChartCanvas || moodData.length === 0) return;
        
        // Sort moods by date (oldest first)
        const sortedMoods = [...moodData].sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });
        
        // Take only the last 7 moods for the chart
        const chartMoods = sortedMoods.slice(-7);
        
        // Prepare data for chart
        const labels = chartMoods.map(mood => {
            const date = new Date(mood.date);
            return date.toLocaleDateString('ar-EG');
        });
        
        const data = chartMoods.map(mood => {
            switch (mood.generalMood) {
                case 'سعيد': return 3;
                case 'عادي': return 2;
                case 'حزين': return 1;
                default: return 0;
            }
        });
        
        // Destroy existing chart if exists
        if (moodChart) {
            moodChart.destroy();
        }
        
        // Create new chart
        const ctx = moodChartCanvas.getContext('2d');
        moodChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'تطور المزاج',
                    data: data,
                    borderColor: '#5b86e5',
                    backgroundColor: 'rgba(91, 134, 229, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 0,
                        max: 4,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                switch (value) {
                                    case 3: return 'سعيد';
                                    case 2: return 'عادي';
                                    case 1: return 'حزين';
                                    default: return '';
                                }
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    };
    
    // Logout
    window.logout = async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.msg || 'خطأ في تسجيل الخروج');
            }
            
            // Redirect to login page
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
            showAlert(error.message);
        }
    };
    
    // Record new mood
    window.recordNewMood = () => {
        window.location.href = '/mood';
    };
    
    // Navigate to feature
    window.navigateTo = (feature) => {
        switch (feature) {
            case 'todo':
                window.location.href = '/todo';
                break;
            case 'relax':
                window.location.href = '/relax';
                break;
            case 'pomodoro':
                window.location.href = '/pomodoro';
                break;
            case 'breathing':
                window.location.href = '/breathing';
                break;
            case 'chat':
                window.location.href = '/chat';
                break;
            case 'admin':
                window.location.href = '/admin';
                break;
            default:
                break;
        }
    };
    
    // Initialize
    loadUserData();
}); 