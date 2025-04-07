document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const alertBox = document.getElementById('alert');
    
    // Show tab
    window.showTab = (tabId) => {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(tabId).classList.add('active');
        
        // Add active class to clicked button
        document.querySelector(`.tab-btn[onclick="showTab('${tabId}')"]`).classList.add('active');
    };
    
    // Show alert
    const showAlert = (message, type = 'error') => {
        alertBox.textContent = message;
        alertBox.className = `alert alert-${type} show`;
        
        setTimeout(() => {
            alertBox.classList.remove('show');
        }, 3000);
    };
    
    // Check if user is already logged in
    const checkAuth = async () => {
        try {
            const response = await fetch('/api/auth/me');
            if (response.ok) {
                // User is logged in, redirect to mood page
                window.location.href = '/mood';
            }
        } catch (error) {
            console.error('Auth check error:', error);
        }
    };
    
    // Login form submit
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            if (!username || !password) {
                return showAlert('الرجاء إدخال اسم المستخدم وكلمة المرور');
            }
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.msg || 'خطأ في تسجيل الدخول');
                }
                
                // Redirect to mood page
                window.location.href = '/mood';
            } catch (error) {
                showAlert(error.message);
            }
        });
    }
    
    // Register form submit
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('regUsername').value.trim();
            const name = document.getElementById('regName').value.trim();
            const description = document.getElementById('regDescription').value.trim();
            const password = document.getElementById('regPassword').value;
            const passwordConfirm = document.getElementById('regPasswordConfirm').value;
            
            if (!username || !name || !password) {
                return showAlert('الرجاء إدخال جميع الحقول المطلوبة');
            }
            
            if (password !== passwordConfirm) {
                return showAlert('كلمات المرور غير متطابقة');
            }
            
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, name, description, password })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.msg || 'خطأ في إنشاء الحساب');
                }
                
                showAlert('تم إنشاء الحساب بنجاح!', 'success');
                
                // Redirect to mood page after a delay
                setTimeout(() => {
                    window.location.href = '/mood';
                }, 1500);
            } catch (error) {
                showAlert(error.message);
            }
        });
    }
    
    // Check authentication on page load
    checkAuth();
}); 