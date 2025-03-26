// Enhanced Navbar and UI Improvements

// Add this code to your main JavaScript to implement the enhanced navbar with dropdowns
document.addEventListener('DOMContentLoaded', function() {
    // Create the enhanced navbar once user is logged in
    function createEnhancedNavbar() {
        // Only proceed if the user is logged in
        if (!userData.id) return;
        
        const navbar = document.getElementById('navbar');
        
        // Clear existing navbar content
        const navbarContainer = navbar.querySelector('.container');
        
        // Create enhanced navbar HTML
        const navbarHTML = `
            <div class="flex justify-between items-center w-full">
                <a href="#" class="text-2xl font-bold text-blue-600">السعادة النفسية</a>
                
                <div class="hidden md:flex space-x-1 space-x-reverse">
                    <div class="relative group">
                        <button class="px-4 py-2 rounded-lg hover:bg-blue-100 transition font-medium flex items-center">
                            <span>التتبع اليومي</span>
                            <i class="fas fa-chevron-down mr-2 text-sm"></i>
                        </button>
                        <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10 hidden group-hover:block">
                            <a href="#" onclick="goToSection('mood-section')" class="block px-4 py-2 hover:bg-blue-100">تسجيل مشاعري اليوم</a>
                            <a href="#" onclick="loadUserHistory()" class="block px-4 py-2 hover:bg-blue-100">سجل مشاعري السابقة</a>
                        </div>
                    </div>
                    
                    <div class="relative group">
                        <button class="px-4 py-2 rounded-lg hover:bg-blue-100 transition font-medium flex items-center">
                            <span>أنشطة الرفاهية</span>
                            <i class="fas fa-chevron-down mr-2 text-sm"></i>
                        </button>
                        <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10 hidden group-hover:block">
                            <a href="#" onclick="goToSection('relax-content-section')" class="block px-4 py-2 hover:bg-blue-100">الاسترخاء</a>
                            <a href="#" onclick="goToSection('pomodoro-content-section')" class="block px-4 py-2 hover:bg-blue-100">تقنية بومودورو</a>
                            <a href="#" onclick="goToSection('todo-section')" class="block px-4 py-2 hover:bg-blue-100">قائمة المهام</a>
                        </div>
                    </div>
                    
                    <a href="#" onclick="goToSection('chat-section')" class="px-4 py-2 rounded-lg hover:bg-blue-100 transition font-medium">المساعد الذكي</a>
                    
                    ${userData.is_admin ? 
                        `<div class="relative group">
                            <button class="px-4 py-2 rounded-lg hover:bg-blue-100 transition font-medium flex items-center">
                                <span>لوحة الإدارة</span>
                                <i class="fas fa-chevron-down mr-2 text-sm"></i>
                            </button>
                            <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10 hidden group-hover:block">
                                <a href="#" onclick="goToSection('admin-dashboard-section')" class="block px-4 py-2 hover:bg-blue-100">لوحة التحكم</a>
                                <a href="admin_statistics.php" class="block px-4 py-2 hover:bg-blue-100">إحصائيات المستخدمين</a>
                            </div>
                        </div>` 
                        : ''
                    }
                </div>
                
                <div class="flex items-center space-x-4 space-x-reverse">
                    <div class="hidden md:block">
                        <span class="text-gray-700">مرحباً، <span class="font-semibold text-blue-600">${userData.name}</span></span>
                    </div>
                    <button id="logout-btn" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition">تسجيل الخروج</button>
                    
                    <!-- Mobile menu button -->
                    <button id="mobile-menu-btn" class="md:hidden">
                        <i class="fas fa-bars text-blue-600 text-2xl"></i>
                    </button>
                </div>
            </div>
            
            <!-- Mobile menu -->
            <div id="mobile-menu" class="hidden md:hidden w-full mt-4">
                <div class="flex flex-col space-y-2">
                    <div class="py-2 border-b">
                        <span class="font-semibold text-blue-600">التتبع اليومي</span>
                        <div class="mt-2 flex flex-col space-y-2 pr-4">
                            <a href="#" onclick="goToSection('mood-section')" class="block py-1">تسجيل مشاعري اليوم</a>
                            <a href="#" onclick="loadUserHistory()" class="block py-1">سجل مشاعري السابقة</a>
                        </div>
                    </div>
                    
                    <div class="py-2 border-b">
                        <span class="font-semibold text-blue-600">أنشطة الرفاهية</span>
                        <div class="mt-2 flex flex-col space-y-2 pr-4">
                            <a href="#" onclick="goToSection('relax-content-section')" class="block py-1">الاسترخاء</a>
                            <a href="#" onclick="goToSection('pomodoro-content-section')" class="block py-1">تقنية بومودورو</a>
                            <a href="#" onclick="goToSection('todo-section')" class="block py-1">قائمة المهام</a>
                        </div>
                    </div>
                    
                    <a href="#" onclick="goToSection('chat-section')" class="py-2 border-b">المساعد الذكي</a>
                    
                    ${userData.is_admin ? 
                        `<div class="py-2 border-b">
                            <span class="font-semibold text-blue-600">لوحة الإدارة</span>
                            <div class="mt-2 flex flex-col space-y-2 pr-4">
                                <a href="#" onclick="goToSection('admin-dashboard-section')" class="block py-1">لوحة التحكم</a>
                                <a href="admin_statistics.php" class="block py-1">إحصائيات المستخدمين</a>
                            </div>
                        </div>` 
                        : ''
                    }
                </div>
            </div>
        `;
        
        // Update the navbar
        navbarContainer.innerHTML = navbarHTML;
        
        // Add event listener for mobile menu toggle
        document.getElementById('mobile-menu-btn').addEventListener('click', function() {
            const mobileMenu = document.getElementById('mobile-menu');
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // Add personalized welcome messages to each section
    function addPersonalizedMessages() {
        // Only proceed if user is logged in
        if (!userData.id) return;
        
        // Add personalized welcome to mood tracking section
        const moodSection = document.getElementById('mood-section');
        if (moodSection) {
            const heading = moodSection.querySelector('h2');
            if (heading) {
                heading.textContent = `مرحباً ${userData.name}، كيف تشعر اليوم؟`;
            }
        }
        
        // Add personalized welcome to specific mood section
        const specificMoodSection = document.getElementById('specific-mood-section');
        if (specificMoodSection) {
            const heading = specificMoodSection.querySelector('h2');
            if (heading) {
                heading.textContent = `${userData.name}، ما هو شعورك المحدد؟`;
            }
        }
        
        // Add personalized welcome to reason section
        const reasonSection = document.getElementById('reason-section');
        if (reasonSection) {
            const heading = reasonSection.querySelector('h2');
            if (heading) {
                heading.textContent = `${userData.name}، ما هو سبب شعورك؟`;
            }
        }
        
        // Add personalized welcome to activity section
        const activitySection = document.getElementById('activity-section');
        if (activitySection) {
            const heading = activitySection.querySelector('h2');
            if (heading) {
                heading.textContent = `${userData.name}، نحن هنا لمساعدتك!`;
            }
        }
    }
    
    // Add back buttons to activity content sections
    function addBackButtons() {
        // Add back button to relaxation section
        const relaxSection = document.getElementById('relax-content-section');
        if (relaxSection) {
            const container = relaxSection.querySelector('.container');
            if (container) {
                const backButton = document.createElement('button');
                backButton.className = 'bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow transition mb-4';
                backButton.innerHTML = '<i class="fas fa-arrow-right ml-2"></i>العودة';
                backButton.onclick = function() {
                    goToSection('home-section');
                };
                container.insertBefore(backButton, container.firstChild);
            }
        }
        
        // Add back button to pomodoro section
        const pomodoroSection = document.getElementById('pomodoro-content-section');
        if (pomodoroSection) {
            const container = pomodoroSection.querySelector('.container');
            if (container) {
                const backButton = document.createElement('button');
                backButton.className = 'bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow transition mb-4';
                backButton.innerHTML = '<i class="fas fa-arrow-right ml-2"></i>العودة';
                backButton.onclick = function() {
                    goToSection('home-section');
                };
                container.insertBefore(backButton, container.firstChild);
            }
        }
        
        // Add back button to todo section
        const todoSection = document.getElementById('todo-section');
        if (todoSection) {
            const container = todoSection.querySelector('.container');
            if (container) {
                const backButton = document.createElement('button');
                backButton.className = 'bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow transition mb-4';
                backButton.innerHTML = '<i class="fas fa-arrow-right ml-2"></i>العودة';
                backButton.onclick = function() {
                    goToSection('home-section');
                };
                container.insertBefore(backButton, container.firstChild);
            }
        }
        
        // Add back button to chat section
        const chatSection = document.getElementById('chat-section');
        if (chatSection) {
            const container = chatSection.querySelector('.container');
            if (container) {
                const backButton = document.createElement('button');
                backButton.className = 'bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow transition mb-4';
                backButton.innerHTML = '<i class="fas fa-arrow-right ml-2"></i>العودة';
                backButton.onclick = function() {
                    goToSection('home-section');
                };
                container.insertBefore(backButton, container.firstChild);
            }
        }
    }
    
    // Extend the loginSuccess function to add our enhancements
    const originalLoginSuccess = window.loginSuccess;
    window.loginSuccess = function() {
        // Call the original function
        if (originalLoginSuccess) {
            originalLoginSuccess();
        }
        
        // Add our enhancements
        createEnhancedNavbar();
        addPersonalizedMessages();
        addBackButtons();
    };
    
    // Also hook into checkSession to ensure our enhancements are applied when session exists
    const originalCheckSession = window.checkSession;
    window.checkSession = function() {
        // Call the original function first to update userData
        if (originalCheckSession) {
            const result = originalCheckSession();
            
            // After checkSession completes and if user is logged in
            if (userData.id) {
                setTimeout(function() {
                    createEnhancedNavbar();
                    addPersonalizedMessages();
                    addBackButtons();
                }, 100); // Small delay to ensure DOM is updated
            }
            
            return result;
        }
    };
});
