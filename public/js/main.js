document.addEventListener('DOMContentLoaded', () => {
    // Common Elements
    const navToggle = document.getElementById('navToggle');
    const sidebar = document.getElementById('sidebar');
    const logoutBtn = document.getElementById('logoutBtn');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const userGreeting = document.getElementById('userGreeting');
    
    // Toggle sidebar on mobile
    if (navToggle && sidebar) {
        navToggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
            document.body.classList.toggle('sidebar-open');
        });
        
        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('show') && 
                !sidebar.contains(e.target) && 
                e.target !== navToggle) {
                sidebar.classList.remove('show');
                document.body.classList.remove('sidebar-open');
            }
        });
    }
    
    // Dark mode toggle
    if (darkModeToggle) {
        const setDarkMode = (isDark) => {
            if (isDark) {
                document.body.classList.add('dark-mode');
                darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
                localStorage.setItem('darkMode', 'true');
            } else {
                document.body.classList.remove('dark-mode');
                darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
                localStorage.setItem('darkMode', 'false');
            }
        };
        
        // Check saved preference
        const savedDarkMode = localStorage.getItem('darkMode') === 'true';
        setDarkMode(savedDarkMode);
        
        // Toggle dark mode
        darkModeToggle.addEventListener('click', () => {
            const isDarkMode = document.body.classList.contains('dark-mode');
            setDarkMode(!isDarkMode);
        });
    }
    
    // Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    window.location.href = '/';
                } else {
                    console.error('Logout failed');
                }
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    }
    
    // Load user data for greeting if on authenticated page
    const loadUserGreeting = async () => {
        if (userGreeting) {
            try {
                const response = await fetch('/api/auth/me');
                
                if (response.ok) {
                    const userData = await response.json();
                    
                    // Set greeting with user's name in Arabic
                    const now = new Date();
                    const hour = now.getHours();
                    
                    let greeting = '';
                    if (hour < 12) {
                        greeting = 'صباح الخير';
                    } else if (hour < 18) {
                        greeting = 'مساء الخير';
                    } else {
                        greeting = 'مساء الخير';
                    }
                    
                    userGreeting.textContent = `${greeting}، ${userData.name}`;
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        }
    };
    
    // Handle notifications
    const initializeNotifications = () => {
        const notificationBtn = document.getElementById('notificationBtn');
        const notificationDropdown = document.getElementById('notificationDropdown');
        const notificationsList = document.getElementById('notificationsList');
        const notificationBadge = document.getElementById('notificationBadge');
        
        if (notificationBtn && notificationDropdown) {
            // Toggle notifications dropdown
            notificationBtn.addEventListener('click', () => {
                notificationDropdown.classList.toggle('show');
                
                // Mark all as read when opening
                if (notificationDropdown.classList.contains('show')) {
                    markNotificationsAsRead();
                }
            });
            
            // Close notifications when clicking outside
            document.addEventListener('click', (e) => {
                if (notificationDropdown.classList.contains('show') && 
                    !notificationDropdown.contains(e.target) && 
                    e.target !== notificationBtn) {
                    notificationDropdown.classList.remove('show');
                }
            });
            
            // Fetch notifications
            const fetchNotifications = async () => {
                try {
                    const response = await fetch('/api/notifications');
                    
                    if (response.ok) {
                        const notifications = await response.json();
                        renderNotifications(notifications);
                    }
                } catch (error) {
                    console.error('Error fetching notifications:', error);
                }
            };
            
            // Render notifications
            const renderNotifications = (notifications) => {
                if (!notificationsList) return;
                
                notificationsList.innerHTML = '';
                
                if (notifications.length === 0) {
                    notificationsList.innerHTML = `
                        <div class="empty-notifications">
                            <i class="fas fa-bell-slash"></i>
                            <p>لا توجد إشعارات جديدة</p>
                        </div>
                    `;
                    
                    // Hide badge
                    if (notificationBadge) {
                        notificationBadge.style.display = 'none';
                    }
                    
                    return;
                }
                
                // Count unread notifications
                const unreadCount = notifications.filter(n => !n.read).length;
                
                // Update badge
                if (notificationBadge) {
                    if (unreadCount > 0) {
                        notificationBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                        notificationBadge.style.display = 'block';
                    } else {
                        notificationBadge.style.display = 'none';
                    }
                }
                
                // Create notification items
                notifications.forEach(notification => {
                    const item = document.createElement('li');
                    item.className = notification.read ? 'notification-item' : 'notification-item unread';
                    
                    // Format date
                    const date = new Date(notification.date);
                    const formattedDate = date.toLocaleDateString('ar-EG');
                    
                    item.innerHTML = `
                        <div class="notification-icon">
                            <i class="${notification.icon || 'fas fa-bell'}"></i>
                        </div>
                        <div class="notification-content">
                            <p>${notification.message}</p>
                            <span class="notification-time">${formattedDate}</span>
                        </div>
                    `;
                    
                    notificationsList.appendChild(item);
                });
            };
            
            // Mark all notifications as read
            const markNotificationsAsRead = async () => {
                try {
                    await fetch('/api/notifications/read-all', {
                        method: 'POST'
                    });
                    
                    // Update UI
                    if (notificationBadge) {
                        notificationBadge.style.display = 'none';
                    }
                    
                    // Remove unread class from all items
                    const unreadItems = notificationsList.querySelectorAll('.notification-item.unread');
                    unreadItems.forEach(item => {
                        item.classList.remove('unread');
                    });
                } catch (error) {
                    console.error('Error marking notifications as read:', error);
                }
            };
            
            // Initialize notifications
            fetchNotifications();
            
            // Poll for new notifications every minute
            setInterval(fetchNotifications, 60000);
        }
    };
    
    // Initialize functions
    loadUserGreeting();
    initializeNotifications();
}); 