document.addEventListener('DOMContentLoaded', function() {
    const welcomeMessage = document.getElementById('welcomeMessage');
    const userCount = document.getElementById('userCount');
    const moodCount = document.getElementById('moodCount');
    const usersList = document.getElementById('usersList');
    const alertBox = document.getElementById('alertBox');
    const alertMessage = document.getElementById('alertMessage');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    // Show loading spinner
    loadingSpinner.style.display = 'block';
    
    // Check authentication and admin status
    checkAdminAuth()
        .then(isAdmin => {
            if (isAdmin) {
                loadDashboardData();
            } else {
                window.location.href = '/dashboard.html';
            }
        })
        .catch(error => {
            console.error('Authentication error:', error);
            window.location.href = '/login.html';
        })
        .finally(() => {
            loadingSpinner.style.display = 'none';
        });
    
    // Verify user is authenticated and is an admin
    async function checkAdminAuth() {
        try {
            console.log('Checking admin authentication...');
            const response = await fetch('/api/auth/me');
            
            if (!response.ok) {
                console.log('Not authenticated');
                throw new Error('غير مصرح به');
            }
            
            const userData = await response.json();
            console.log('User data:', userData);
            
            if (!userData.isAdmin) {
                console.log('Not an admin');
                showAlert('فقط المدراء يمكنهم الوصول إلى هذه الصفحة', 'danger');
                return false;
            }
            
            welcomeMessage.textContent = `مرحباً ${userData.name}`;
            return true;
        } catch (error) {
            console.error('Admin auth check failed:', error);
            return false;
        }
    }
    
    // Load dashboard data
    async function loadDashboardData() {
        try {
            // Get users count
            const usersResponse = await fetch('/api/admin/users');
            if (!usersResponse.ok) throw new Error('فشل في تحميل بيانات المستخدمين');
            const users = await usersResponse.json();
            
            // Get moods count
            const moodsResponse = await fetch('/api/admin/moods');
            if (!moodsResponse.ok) throw new Error('فشل في تحميل بيانات المزاج');
            const moods = await moodsResponse.json();
            
            // Update dashboard metrics
            userCount.textContent = users.length;
            moodCount.textContent = moods.length;
            
            // Clear existing user list
            usersList.innerHTML = '';
            
            // Populate users list
            users.forEach(user => {
                const userItem = document.createElement('div');
                userItem.className = 'user-item';
                
                userItem.innerHTML = `
                    <div class="user-info">
                        <h3>${user.name} (${user.username})</h3>
                        <p>${user.isAdmin ? 'مدير' : 'مستخدم عادي'}</p>
                    </div>
                    <div class="user-actions">
                        <button class="btn delete-user-btn" data-id="${user._id}">حذف</button>
                    </div>
                `;
                
                usersList.appendChild(userItem);
            });
            
            // Add event listeners to delete buttons
            document.querySelectorAll('.delete-user-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const userId = this.getAttribute('data-id');
                    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
                        deleteUser(userId);
                    }
                });
            });
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showAlert('حدث خطأ أثناء تحميل البيانات', 'danger');
        }
    }
    
    // Delete user
    async function deleteUser(userId) {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('فشل في حذف المستخدم');
            }
            
            showAlert('تم حذف المستخدم بنجاح', 'success');
            loadDashboardData(); // Reload data
        } catch (error) {
            console.error('Error deleting user:', error);
            showAlert('حدث خطأ أثناء حذف المستخدم', 'danger');
        }
    }
    
    // Show alert message
    function showAlert(message, type) {
        alertMessage.textContent = message;
        alertBox.className = `alert alert-${type}`;
        alertBox.style.display = 'block';
        
        // Hide after 3 seconds
        setTimeout(() => {
            alertBox.style.display = 'none';
        }, 3000);
    }
    
    // Add event listener for logout button
    document.getElementById('logoutBtn').addEventListener('click', async function() {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST'
            });
            
            if (response.ok) {
                window.location.href = '/login.html';
            } else {
                showAlert('فشل تسجيل الخروج', 'danger');
            }
        } catch (error) {
            console.error('Logout error:', error);
            showAlert('حدث خطأ أثناء تسجيل الخروج', 'danger');
        }
    });
    
    // Add event listener for dashboard button
    document.getElementById('dashboardBtn').addEventListener('click', function() {
        window.location.href = '/dashboard.html';
    });
}); 