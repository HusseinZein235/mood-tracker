document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const alertEl = document.getElementById('alert');
    const totalUsersEl = document.getElementById('totalUsers');
    const totalMoodsEl = document.getElementById('totalMoods');
    const avgMoodsPerUserEl = document.getElementById('avgMoodsPerUser');
    const usersTableBodyEl = document.getElementById('usersTableBody');
    const userSearchInputEl = document.getElementById('userSearchInput');
    const userDetailsEl = document.getElementById('userDetails');
    const closeUserDetailsBtn = document.getElementById('closeUserDetailsBtn');
    const deleteUserBtn = document.getElementById('deleteUserBtn');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const closeModalBtn = document.querySelector('.close-modal-btn');
    const moodDistributionStatsEl = document.getElementById('moodDistributionStats');
    const moodReasonsStatsEl = document.getElementById('moodReasonsStats');
    const timeRangeSelectEl = document.getElementById('timeRangeSelect');
    
    // Charts
    let moodEvolutionChart;
    
    // Data
    let users = [];
    let moods = [];
    let selectedUser = null;
    
    // Initialize
    init();
    
    // Initialize admin dashboard
    async function init() {
        try {
            // Check if user is authenticated and is admin
            const isAdmin = await checkAdminAuth();
            if (!isAdmin) {
                window.location.href = '/dashboard';
                return;
            }
            
            // Load data
            await Promise.all([
                loadUsers(),
                loadMoods(),
                loadStats()
            ]);
            
            // Setup event listeners
            setupEventListeners();
            
            // Update dashboard
            updateDashboard();
        } catch (error) {
            console.error('Initialization error:', error);
            showAlert('حدث خطأ أثناء تحميل البيانات', 'danger');
        }
    }
    
    // Check if user is authenticated and is admin
    async function checkAdminAuth() {
        try {
            const response = await fetch('/api/auth/me');
            
            if (!response.ok) {
                throw new Error('غير مصرح به');
            }
            
            const userData = await response.json();
            
            if (!userData.isAdmin) {
                showAlert('فقط المدراء يمكنهم الوصول إلى هذه الصفحة', 'danger');
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Admin auth check failed:', error);
            return false;
        }
    }
    
    // Load users data
    async function loadUsers() {
        const response = await fetch('/api/admin/users');
        if (!response.ok) throw new Error('فشل في تحميل بيانات المستخدمين');
        users = await response.json();
        console.log('Loaded users:', users.length);
    }
    
    // Load moods data
    async function loadMoods() {
        const response = await fetch('/api/admin/moods');
        if (!response.ok) throw new Error('فشل في تحميل بيانات المزاج');
        moods = await response.json();
        console.log('Loaded moods:', moods.length);
    }
    
    // Load statistics
    async function loadStats() {
        const response = await fetch('/api/admin/stats');
        if (!response.ok) throw new Error('فشل في تحميل الإحصائيات');
        const stats = await response.json();
        console.log('Loaded stats:', stats);
        return stats;
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // User search
        userSearchInputEl.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const filteredUsers = users.filter(user => 
                user.username.toLowerCase().includes(searchTerm) || 
                user.name.toLowerCase().includes(searchTerm)
            );
            renderUsersTable(filteredUsers);
        });
        
        // Close user details
        closeUserDetailsBtn.addEventListener('click', function() {
            userDetailsEl.style.display = 'none';
            selectedUser = null;
        });
        
        // Delete user button (shows confirmation modal)
        deleteUserBtn.addEventListener('click', function() {
            // Don't allow deleting admin users
            if (selectedUser && selectedUser.isAdmin) {
                showAlert('لا يمكن حذف حساب المدير', 'danger');
                return;
            }
            deleteConfirmModal.style.display = 'flex';
        });
        
        // Confirm delete user
        confirmDeleteBtn.addEventListener('click', function() {
            if (selectedUser) {
                deleteUser(selectedUser._id);
                deleteConfirmModal.style.display = 'none';
            }
        });
        
        // Cancel delete
        cancelDeleteBtn.addEventListener('click', function() {
            deleteConfirmModal.style.display = 'none';
        });
        
        // Close modal when clicking on X
        closeModalBtn.addEventListener('click', function() {
            deleteConfirmModal.style.display = 'none';
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target === deleteConfirmModal) {
                deleteConfirmModal.style.display = 'none';
            }
        });
        
        // Time range select for mood evolution chart
        timeRangeSelectEl.addEventListener('change', function() {
            renderMoodEvolutionChart(this.value);
        });
    }
    
    // Update dashboard with loaded data
    function updateDashboard() {
        // Update summary statistics
        totalUsersEl.textContent = users.length;
        totalMoodsEl.textContent = moods.length;
        
        const avgPerUser = users.length > 0 ? (moods.length / users.length).toFixed(1) : 0;
        avgMoodsPerUserEl.textContent = avgPerUser;
        
        // Render users table
        renderUsersTable(users);
        
        // Render statistics
        renderMoodDistributionStats();
        renderMoodReasonsStats();
        
        // Render mood evolution chart with default time range (30 days)
        renderMoodEvolutionChart(30);
    }
    
    // Render users table
    function renderUsersTable(usersToRender) {
        usersTableBodyEl.innerHTML = '';
        
        usersToRender.forEach(user => {
            const userMoods = moods.filter(mood => mood.user._id === user._id);
            const lastMood = userMoods.length > 0 ? 
                new Date(userMoods[0].date).toLocaleDateString('ar-SA') : 
                'لا يوجد';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.name}</td>
                <td>${userMoods.length}</td>
                <td>${lastMood}</td>
                <td>
                    <button class="btn btn-sm view-user-btn" data-id="${user._id}" title="عرض التفاصيل">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${!user.isAdmin ? `
                    <button class="btn btn-sm btn-danger delete-user-btn" data-id="${user._id}" title="حذف المستخدم">
                        <i class="fas fa-trash"></i>
                    </button>
                    ` : ''}
                </td>
            `;
            
            // Add event listener to view button
            row.querySelector('.view-user-btn').addEventListener('click', () => {
                showUserDetails(user._id);
            });
            
            // Add event listener to delete button if not admin
            if (!user.isAdmin) {
                const deleteBtn = row.querySelector('.delete-user-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent triggering view details
                        selectedUser = user; // Set selected user before confirming deletion
                        deleteConfirmModal.style.display = 'flex';
                    });
                }
            }
            
            usersTableBodyEl.appendChild(row);
        });
    }
    
    // Delete user
    async function deleteUser(userId) {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || 'فشل في حذف المستخدم');
            }
            
            // Reload data
            await Promise.all([
                loadUsers(),
                loadMoods()
            ]);
            
            // Update dashboard
            updateDashboard();
            
            // Hide user details panel if it was showing the deleted user
            if (selectedUser && selectedUser._id === userId) {
                userDetailsEl.style.display = 'none';
                selectedUser = null;
            }
            
            showAlert('تم حذف المستخدم بنجاح', 'success');
        } catch (error) {
            console.error('Error deleting user:', error);
            showAlert(error.message || 'حدث خطأ أثناء حذف المستخدم', 'danger');
        }
    }
    
    // Show user details
    async function showUserDetails(userId) {
        try {
            const response = await fetch(`/api/admin/users/${userId}`);
            if (!response.ok) throw new Error('فشل في تحميل بيانات المستخدم');
            const data = await response.json();
            
            selectedUser = data.user;
            const userMoods = data.moods;
            
            // Update user details section
            document.getElementById('selectedUserName').textContent = `تفاصيل المستخدم: ${selectedUser.name}`;
            document.getElementById('detailsUsername').textContent = selectedUser.username;
            document.getElementById('detailsName').textContent = selectedUser.name;
            document.getElementById('detailsEmail').textContent = selectedUser.email || 'غير متوفر';
            document.getElementById('detailsDescription').textContent = selectedUser.description || 'لا يوجد وصف';
            document.getElementById('detailsRecordCount').textContent = userMoods.length;
            
            // Format creation date
            const createdAt = new Date(selectedUser.createdAt).toLocaleDateString('ar-SA');
            document.getElementById('detailsCreatedAt').textContent = createdAt;
            
            // Hide delete button for admin users
            deleteUserBtn.style.display = selectedUser.isAdmin ? 'none' : 'inline-block';
            
            // Update user mood stats
            updateUserMoodStats(userMoods);
            
            // Render user moods table
            renderUserMoodsTable(userMoods);
            
            // Show the user details section
            userDetailsEl.style.display = 'block';
        } catch (error) {
            console.error('Error loading user details:', error);
            showAlert('حدث خطأ أثناء تحميل بيانات المستخدم', 'danger');
        }
    }
    
    // Update user mood statistics
    function updateUserMoodStats(userMoods) {
        if (userMoods.length === 0) {
            document.getElementById('userHappyPercent').textContent = '0%';
            document.getElementById('userNeutralPercent').textContent = '0%';
            document.getElementById('userSadPercent').textContent = '0%';
            return;
        }
        
        // Count moods by type
        const moodCounts = {
            happy: 0,
            neutral: 0,
            sad: 0
        };
        
        userMoods.forEach(mood => {
            if (moodCounts.hasOwnProperty(mood.generalMood)) {
                moodCounts[mood.generalMood]++;
            }
        });
        
        // Calculate percentages
        const happyPercent = Math.round((moodCounts.happy / userMoods.length) * 100);
        const neutralPercent = Math.round((moodCounts.neutral / userMoods.length) * 100);
        const sadPercent = Math.round((moodCounts.sad / userMoods.length) * 100);
        
        // Update DOM
        document.getElementById('userHappyPercent').textContent = `${happyPercent}%`;
        document.getElementById('userNeutralPercent').textContent = `${neutralPercent}%`;
        document.getElementById('userSadPercent').textContent = `${sadPercent}%`;
    }
    
    // Render user moods table
    function renderUserMoodsTable(userMoods) {
        const userMoodsTableBodyEl = document.getElementById('userMoodsTableBody');
        userMoodsTableBodyEl.innerHTML = '';
        
        userMoods.forEach(mood => {
            const row = document.createElement('tr');
            const date = new Date(mood.date).toLocaleDateString('ar-SA');
            row.innerHTML = `
                <td>${date}</td>
                <td>${getArabicMood(mood.generalMood)}</td>
                <td>${mood.specificFeeling}</td>
                <td>${mood.cause}</td>
            `;
            userMoodsTableBodyEl.appendChild(row);
        });
    }
    
    // Render mood distribution statistics
    function renderMoodDistributionStats() {
        if (moods.length === 0) {
            // Set default values if no moods exist
            const statItems = moodDistributionStatsEl.querySelectorAll('.stat-item .stat-value');
            statItems.forEach(item => item.textContent = '0%');
            return;
        }
        
        // Count moods by type
        const moodCounts = {
            happy: 0,
            neutral: 0,
            sad: 0
        };
        
        moods.forEach(mood => {
            if (moodCounts.hasOwnProperty(mood.generalMood)) {
                moodCounts[mood.generalMood]++;
            }
        });
        
        // Calculate percentages
        const happyPercent = Math.round((moodCounts.happy / moods.length) * 100);
        const neutralPercent = Math.round((moodCounts.neutral / moods.length) * 100);
        const sadPercent = Math.round((moodCounts.sad / moods.length) * 100);
        
        // Update DOM
        const statItems = moodDistributionStatsEl.querySelectorAll('.stat-item .stat-value');
        statItems[0].textContent = `${happyPercent}%`;
        statItems[1].textContent = `${neutralPercent}%`;
        statItems[2].textContent = `${sadPercent}%`;
    }
    
    // Render mood reasons statistics
    function renderMoodReasonsStats() {
        if (moods.length === 0) {
            moodReasonsStatsEl.innerHTML = '<div class="empty-stats">لا توجد بيانات متاحة</div>';
            return;
        }
        
        // Group moods by cause and general mood
        const reasonsByMood = {};
        
        moods.forEach(mood => {
            const cause = mood.cause;
            const generalMood = mood.generalMood;
            
            if (!reasonsByMood[cause]) {
                reasonsByMood[cause] = {
                    count: 0,
                    moods: {
                        happy: 0,
                        neutral: 0,
                        sad: 0
                    }
                };
            }
            
            reasonsByMood[cause].count++;
            reasonsByMood[cause].moods[generalMood]++;
        });
        
        // Calculate average mood score for each reason
        // Happy = 3, Neutral = 2, Sad = 1
        const reasonScores = [];
        
        for (const cause in reasonsByMood) {
            const data = reasonsByMood[cause];
            const totalScore = (data.moods.happy * 3) + (data.moods.neutral * 2) + (data.moods.sad * 1);
            const avgScore = totalScore / data.count;
            
            let moodCategory;
            if (avgScore >= 2.5) {
                moodCategory = 'happy';
            } else if (avgScore >= 1.5) {
                moodCategory = 'neutral';
            } else {
                moodCategory = 'sad';
            }
            
            reasonScores.push({
                cause,
                count: data.count,
                avgScore,
                moodCategory,
                percentages: {
                    happy: Math.round((data.moods.happy / data.count) * 100),
                    neutral: Math.round((data.moods.neutral / data.count) * 100),
                    sad: Math.round((data.moods.sad / data.count) * 100)
                }
            });
        }
        
        // Sort by frequency
        reasonScores.sort((a, b) => b.count - a.count);
        
        // Render top 10 causes
        const topReasons = reasonScores.slice(0, 10);
        moodReasonsStatsEl.innerHTML = '';
        
        topReasons.forEach(reason => {
            let iconClass, iconColor;
            
            switch(reason.moodCategory) {
                case 'happy':
                    iconClass = 'fa-smile';
                    iconColor = '#4CAF50';
                    break;
                case 'neutral':
                    iconClass = 'fa-meh';
                    iconColor = '#FFC107';
                    break;
                case 'sad':
                    iconClass = 'fa-frown';
                    iconColor = '#F44336';
                    break;
                default:
                    iconClass = 'fa-question';
                    iconColor = '#999';
            }
            
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';
            statItem.innerHTML = `
                <div class="stat-label">
                    <i class="fas ${iconClass}" style="color: ${iconColor};"></i>
                    <span>${reason.cause}</span>
                </div>
                <div class="stat-value">
                    <span title="سعيد: ${reason.percentages.happy}%, محايد: ${reason.percentages.neutral}%, حزين: ${reason.percentages.sad}%">
                        ${reason.avgScore.toFixed(1)}
                    </span>
                </div>
            `;
            
            moodReasonsStatsEl.appendChild(statItem);
        });
    }
    
    // Render mood evolution chart
    function renderMoodEvolutionChart(daysRange) {
        const ctx = document.getElementById('moodEvolutionChart').getContext('2d');
        
        if (moodEvolutionChart) {
            moodEvolutionChart.destroy();
        }
        
        if (moods.length === 0) {
            // No data to display
            return;
        }
        
        // Filter moods based on date range
        let filteredMoods = [...moods];
        
        if (daysRange !== 'all') {
            const days = parseInt(daysRange);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            filteredMoods = moods.filter(mood => new Date(mood.date) >= cutoffDate);
        }
        
        if (filteredMoods.length === 0) {
            // No data in selected range
            return;
        }
        
        // Group by date and calculate average mood score for each day
        const moodsByDate = {};
        
        filteredMoods.forEach(mood => {
            const date = new Date(mood.date);
            const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
            
            if (!moodsByDate[dateKey]) {
                moodsByDate[dateKey] = {
                    totalMoodValue: 0,
                    count: 0,
                    date: date
                };
            }
            
            // Convert mood to numeric value
            let moodValue = 0;
            switch(mood.generalMood) {
                case 'happy': moodValue = 3; break;
                case 'neutral': moodValue = 2; break;
                case 'sad': moodValue = 1; break;
            }
            
            moodsByDate[dateKey].totalMoodValue += moodValue;
            moodsByDate[dateKey].count++;
        });
        
        // Calculate average mood per day
        const averageMoodByDate = {};
        Object.keys(moodsByDate).forEach(date => {
            const { totalMoodValue, count } = moodsByDate[date];
            averageMoodByDate[date] = {
                value: totalMoodValue / count,
                date: moodsByDate[date].date
            };
        });
        
        // Sort dates
        const sortedDates = Object.keys(averageMoodByDate).sort((a, b) => {
            return averageMoodByDate[a].date - averageMoodByDate[b].date;
        });
        
        // Format dates for display
        const formattedDates = sortedDates.map(dateKey => {
            const date = averageMoodByDate[dateKey].date;
            return `${date.getDate()}/${date.getMonth() + 1}`;
        });
        
        // Get mood values in sorted order
        const moodValues = sortedDates.map(date => averageMoodByDate[date].value);
        
        // Create mood evolution chart
        moodEvolutionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: formattedDates,
                datasets: [
                    {
                        label: 'متوسط المزاج',
                        data: moodValues,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#3498db',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 0.8,
                        max: 3.2,
                        grid: {
                            color: 'rgba(200, 200, 200, 0.2)'
                        },
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                if (value === 1) return 'حزين';
                                if (value === 2) return 'محايد';
                                if (value === 3) return 'سعيد';
                                return '';
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(200, 200, 200, 0.2)'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                let moodLabel;
                                
                                if (value >= 2.5) {
                                    moodLabel = 'سعيد';
                                } else if (value >= 1.5) {
                                    moodLabel = 'محايد';
                                } else {
                                    moodLabel = 'حزين';
                                }
                                
                                return `متوسط المزاج: ${moodLabel} (${value.toFixed(2)})`;
                            }
                        }
                    },
                    legend: {
                        display: false
                    }
                }
            }
        });
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
    
    // Show alert
    function showAlert(message, type) {
        alertEl.textContent = message;
        alertEl.className = `alert alert-${type}`;
        alertEl.style.display = 'block';
        
        setTimeout(() => {
            alertEl.style.display = 'none';
        }, 3000);
    }
}); 