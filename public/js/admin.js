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
    
    // Charts
    let moodDistributionChart;
    let moodCausesChart;
    let userMoodProgressChart;
    let userRegistrationChart;
    
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
        
        // Render charts
        renderMoodDistributionChart();
        renderMoodCausesChart();
        renderUserRegistrationChart();
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
                    <button class="btn btn-sm view-user-btn" data-id="${user._id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            
            // Add event listener to view button
            row.querySelector('.view-user-btn').addEventListener('click', () => {
                showUserDetails(user._id);
            });
            
            usersTableBodyEl.appendChild(row);
        });
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
            document.getElementById('detailsDescription').textContent = selectedUser.description || 'لا يوجد وصف';
            document.getElementById('detailsRecordCount').textContent = userMoods.length;
            
            // Render user mood chart
            renderUserMoodChart(userMoods);
            
            // Render user moods table
            renderUserMoodsTable(userMoods);
            
            // Show the user details section
            userDetailsEl.style.display = 'block';
        } catch (error) {
            console.error('Error loading user details:', error);
            showAlert('حدث خطأ أثناء تحميل بيانات المستخدم', 'danger');
        }
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
    
    // Render mood distribution chart
    function renderMoodDistributionChart() {
        // Group moods by general mood
        const moodCounts = {
            'happy': 0,
            'neutral': 0,
            'sad': 0
        };
        
        moods.forEach(mood => {
            if (moodCounts.hasOwnProperty(mood.generalMood)) {
                moodCounts[mood.generalMood]++;
            }
        });
        
        // Create chart
        const ctx = document.getElementById('moodDistributionChart').getContext('2d');
        
        if (moodDistributionChart) {
            moodDistributionChart.destroy();
        }
        
        moodDistributionChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: [
                    'سعيد', 
                    'محايد', 
                    'حزين'
                ],
                datasets: [{
                    data: [
                        moodCounts.happy, 
                        moodCounts.neutral, 
                        moodCounts.sad
                    ],
                    backgroundColor: [
                        '#4CAF50',
                        '#FFC107', 
                        '#F44336'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Render mood causes chart
    function renderMoodCausesChart() {
        // Get top 5 causes
        const causeCounts = {};
        
        moods.forEach(mood => {
            if (!causeCounts[mood.cause]) {
                causeCounts[mood.cause] = 1;
            } else {
                causeCounts[mood.cause]++;
            }
        });
        
        // Sort and get top 5
        const sortedCauses = Object.entries(causeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        const labels = sortedCauses.map(item => item[0]);
        const data = sortedCauses.map(item => item[1]);
        
        // Create chart
        const ctx = document.getElementById('moodCausesChart').getContext('2d');
        
        if (moodCausesChart) {
            moodCausesChart.destroy();
        }
        
        moodCausesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'عدد المرات',
                    data: data,
                    backgroundColor: '#3498db'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }
    
    // Render user mood chart
    function renderUserMoodChart(userMoods) {
        // Sort moods by date
        const sortedMoods = [...userMoods].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Prepare data for chart
        const labels = sortedMoods.map(mood => new Date(mood.date).toLocaleDateString('ar-SA'));
        const data = sortedMoods.map(mood => {
            // Convert mood to number for chart
            switch(mood.generalMood) {
                case 'happy': return 3;
                case 'neutral': return 2;
                case 'sad': return 1;
                default: return 0;
            }
        });
        
        // Create chart
        const ctx = document.getElementById('userMoodProgressChart').getContext('2d');
        
        if (userMoodProgressChart) {
            userMoodProgressChart.destroy();
        }
        
        userMoodProgressChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'تطور المزاج',
                    data: data,
                    borderColor: '#3498db',
                    tension: 0.1,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        min: 0,
                        max: 4,
                        ticks: {
                            callback: function(value) {
                                switch(value) {
                                    case 1: return 'حزين';
                                    case 2: return 'محايد';
                                    case 3: return 'سعيد';
                                    default: return '';
                                }
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Render user registration over time chart
    function renderUserRegistrationChart() {
        // Sort users by creation date
        const sortedUsers = [...users].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        // Group users by month
        const usersByMonth = {};
        sortedUsers.forEach(user => {
            const date = new Date(user.createdAt);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
            
            if (!usersByMonth[monthYear]) {
                usersByMonth[monthYear] = 1;
            } else {
                usersByMonth[monthYear]++;
            }
        });
        
        // Prepare data for chart
        const months = Object.keys(usersByMonth);
        const userCounts = Object.values(usersByMonth);
        
        // Calculate cumulative user count
        const cumulativeUserCounts = [];
        let cumulativeCount = 0;
        
        userCounts.forEach(count => {
            cumulativeCount += count;
            cumulativeUserCounts.push(cumulativeCount);
        });
        
        // Create new chart container
        if (!document.getElementById('userRegistrationChart')) {
            const chartContainer = document.createElement('div');
            chartContainer.className = 'chart-container';
            chartContainer.innerHTML = `
                <h3>تطور عدد المستخدمين</h3>
                <canvas id="userRegistrationChart"></canvas>
            `;
            
            // Insert after the first chart container
            const firstChartContainer = document.querySelector('.chart-container');
            firstChartContainer.parentNode.insertBefore(chartContainer, firstChartContainer.nextSibling);
        }
        
        // Create chart
        const ctx = document.getElementById('userRegistrationChart').getContext('2d');
        
        if (userRegistrationChart) {
            userRegistrationChart.destroy();
        }
        
        userRegistrationChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'مستخدمين جدد',
                        data: userCounts,
                        backgroundColor: '#3498db',
                        borderColor: '#3498db',
                        type: 'bar'
                    },
                    {
                        label: 'إجمالي المستخدمين',
                        data: cumulativeUserCounts,
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        type: 'line',
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
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