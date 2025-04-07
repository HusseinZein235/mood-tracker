document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const todoInput = document.getElementById('todoInput');
    const addTodoBtn = document.getElementById('addTodoBtn');
    const todoList = document.getElementById('todoList');
    const todoCount = document.getElementById('todoCount');
    const clearCompletedBtn = document.getElementById('clearCompletedBtn');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const alertBox = document.getElementById('alert');
    
    // Current filter
    let currentFilter = 'all';
    
    // Show alert
    const showAlert = (message, type = 'error') => {
        alertBox.textContent = message;
        alertBox.className = `alert alert-${type} show`;
        
        setTimeout(() => {
            alertBox.classList.remove('show');
        }, 3000);
    };
    
    // Check authentication
    const checkAuth = async () => {
        try {
            const response = await fetch('/api/auth/me');
            
            if (!response.ok) {
                // Redirect to login if not authenticated
                window.location.href = '/';
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Auth check error:', error);
            return false;
        }
    };
    
    // Load todos
    const loadTodos = async () => {
        try {
            const response = await fetch('/api/todo');
            
            if (!response.ok) {
                throw new Error('فشل تحميل المهام');
            }
            
            const todos = await response.json();
            renderTodos(todos);
        } catch (error) {
            console.error('Error loading todos:', error);
            showAlert(error.message);
        }
    };
    
    // Render todos
    const renderTodos = (todos) => {
        // Clear list
        todoList.innerHTML = '';
        
        // Filter todos based on current filter
        const filteredTodos = filterTodos(todos, currentFilter);
        
        if (filteredTodos.length === 0) {
            todoList.innerHTML = '<div class="empty-list">لا توجد مهام</div>';
        } else {
            // Create todo items
            filteredTodos.forEach(todo => {
                const todoItem = document.createElement('div');
                todoItem.className = `todo-item ${todo.completed ? 'completed' : ''}`;
                todoItem.dataset.id = todo._id;
                
                todoItem.innerHTML = `
                    <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                    <span class="todo-text">${todo.text}</span>
                    <button class="todo-delete"><i class="fas fa-trash"></i></button>
                `;
                
                // Add event listeners
                const checkbox = todoItem.querySelector('.todo-checkbox');
                checkbox.addEventListener('change', () => {
                    toggleTodo(todo._id);
                });
                
                const deleteBtn = todoItem.querySelector('.todo-delete');
                deleteBtn.addEventListener('click', () => {
                    deleteTodo(todo._id);
                });
                
                todoList.appendChild(todoItem);
            });
        }
        
        // Update counter
        const activeTodos = todos.filter(todo => !todo.completed);
        todoCount.textContent = `${activeTodos.length} مهام متبقية`;
    };
    
    // Filter todos
    const filterTodos = (todos, filter) => {
        switch (filter) {
            case 'active':
                return todos.filter(todo => !todo.completed);
            case 'completed':
                return todos.filter(todo => todo.completed);
            default:
                return todos;
        }
    };
    
    // Add todo
    const addTodo = async () => {
        const text = todoInput.value.trim();
        
        if (!text) {
            return showAlert('الرجاء إدخال نص المهمة');
        }
        
        try {
            const response = await fetch('/api/todo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.msg || 'خطأ في إضافة المهمة');
            }
            
            // Clear input
            todoInput.value = '';
            
            // Reload todos
            loadTodos();
            
            showAlert('تمت إضافة المهمة بنجاح', 'success');
        } catch (error) {
            console.error('Error adding todo:', error);
            showAlert(error.message);
        }
    };
    
    // Toggle todo completion
    const toggleTodo = async (id) => {
        try {
            const response = await fetch(`/api/todo/${id}`, {
                method: 'PUT'
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.msg || 'خطأ في تحديث المهمة');
            }
            
            // Reload todos
            loadTodos();
        } catch (error) {
            console.error('Error toggling todo:', error);
            showAlert(error.message);
        }
    };
    
    // Delete todo
    const deleteTodo = async (id) => {
        try {
            const response = await fetch(`/api/todo/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.msg || 'خطأ في حذف المهمة');
            }
            
            // Reload todos
            loadTodos();
            
            showAlert('تم حذف المهمة بنجاح', 'success');
        } catch (error) {
            console.error('Error deleting todo:', error);
            showAlert(error.message);
        }
    };
    
    // Clear completed todos
    const clearCompleted = () => {
        const completedItems = document.querySelectorAll('.todo-item.completed');
        
        if (completedItems.length === 0) {
            return showAlert('لا توجد مهام مكتملة');
        }
        
        const promises = Array.from(completedItems).map(item => {
            const id = item.dataset.id;
            return fetch(`/api/todo/${id}`, {
                method: 'DELETE'
            });
        });
        
        Promise.all(promises)
            .then(() => {
                loadTodos();
                showAlert('تم حذف المهام المكتملة', 'success');
            })
            .catch(error => {
                console.error('Error clearing completed:', error);
                showAlert('حدث خطأ أثناء حذف المهام المكتملة');
            });
    };
    
    // Event listeners
    addTodoBtn.addEventListener('click', addTodo);
    
    todoInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });
    
    clearCompletedBtn.addEventListener('click', clearCompleted);
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Update filter
            currentFilter = btn.dataset.filter;
            
            // Reload todos
            loadTodos();
        });
    });
    
    // Initialize
    const init = async () => {
        const isAuthenticated = await checkAuth();
        if (isAuthenticated) {
            loadTodos();
        }
    };
    
    init();
}); 