document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const resourceCategoryButtons = document.querySelectorAll('.resource-category');
    const resourceContainer = document.getElementById('resourceContainer');
    const resourceDetail = document.getElementById('resourceDetail');
    const resourceDetailTitle = document.getElementById('resourceDetailTitle');
    const resourceDetailContent = document.getElementById('resourceDetailContent');
    const resourceDetailVideo = document.getElementById('resourceDetailVideo');
    const resourceDetailAudio = document.getElementById('resourceDetailAudio');
    const resourceDetailImage = document.getElementById('resourceDetailImage');
    const backButton = document.getElementById('backToResources');
    const alertBox = document.getElementById('alert');
    
    // Data
    let resources = [];
    let currentCategory = 'all';
    
    // Show alert
    const showAlert = (message, type = 'error') => {
        alertBox.textContent = message;
        alertBox.className = `alert alert-${type} show`;
        
        setTimeout(() => {
            alertBox.classList.remove('show');
        }, 3000);
    };
    
    // Check auth
    const checkAuth = async () => {
        try {
            const response = await fetch('/api/auth/me');
            
            if (!response.ok) {
                window.location.href = '/';
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Auth check error:', error);
            window.location.href = '/';
            return false;
        }
    };
    
    // Load resources
    const loadResources = async () => {
        try {
            const response = await fetch('/api/resources');
            
            if (!response.ok) {
                throw new Error('فشل تحميل الموارد');
            }
            
            resources = await response.json();
            
            // Render resources
            renderResources();
        } catch (error) {
            console.error('Error loading resources:', error);
            showAlert(error.message);
        }
    };
    
    // Render resources
    const renderResources = () => {
        resourceContainer.innerHTML = '';
        
        // Filter resources by category if not 'all'
        const filteredResources = currentCategory === 'all'
            ? resources
            : resources.filter(resource => resource.category === currentCategory);
        
        // If no resources found
        if (filteredResources.length === 0) {
            resourceContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-info-circle"></i>
                    <p>لا توجد موارد في هذه الفئة حالياً</p>
                </div>
            `;
            return;
        }
        
        // Create resource cards
        filteredResources.forEach(resource => {
            const card = document.createElement('div');
            card.className = 'resource-card';
            
            // Determine icon based on resource type
            let typeIcon = '';
            switch (resource.type) {
                case 'video':
                    typeIcon = 'fas fa-video';
                    break;
                case 'audio':
                    typeIcon = 'fas fa-headphones';
                    break;
                case 'article':
                    typeIcon = 'fas fa-file-alt';
                    break;
                case 'image':
                    typeIcon = 'fas fa-image';
                    break;
                default:
                    typeIcon = 'fas fa-file';
            }
            
            card.innerHTML = `
                <div class="resource-icon">
                    <i class="${typeIcon}"></i>
                </div>
                <h3>${resource.title}</h3>
                <p>${resource.description.substring(0, 100)}${resource.description.length > 100 ? '...' : ''}</p>
                <button class="btn btn-primary view-resource" data-id="${resource._id}">عرض المورد</button>
            `;
            
            // Add event listener to view button
            const viewBtn = card.querySelector('.view-resource');
            viewBtn.addEventListener('click', () => {
                viewResource(resource._id);
            });
            
            resourceContainer.appendChild(card);
        });
    };
    
    // View resource
    const viewResource = (resourceId) => {
        // Find resource by id
        const resource = resources.find(r => r._id === resourceId);
        
        if (!resource) {
            showAlert('لم يتم العثور على المورد');
            return;
        }
        
        // Update resource detail
        resourceDetailTitle.textContent = resource.title;
        resourceDetailContent.textContent = resource.description;
        
        // Hide all media elements first
        resourceDetailVideo.style.display = 'none';
        resourceDetailAudio.style.display = 'none';
        resourceDetailImage.style.display = 'none';
        
        // Show appropriate media element based on resource type
        switch (resource.type) {
            case 'video':
                resourceDetailVideo.src = resource.url;
                resourceDetailVideo.style.display = 'block';
                break;
            case 'audio':
                resourceDetailAudio.src = resource.url;
                resourceDetailAudio.style.display = 'block';
                break;
            case 'image':
                resourceDetailImage.src = resource.url;
                resourceDetailImage.style.display = 'block';
                break;
            default:
                // For articles or other types, we don't need to show media
        }
        
        // Show resource detail and hide resource container
        resourceContainer.style.display = 'none';
        resourceDetail.style.display = 'block';
        
        // Update view count
        updateResourceViews(resourceId);
    };
    
    // Update resource views
    const updateResourceViews = async (resourceId) => {
        try {
            await fetch(`/api/resources/${resourceId}/view`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Error updating resource views:', error);
        }
    };
    
    // Filter resources by category
    const filterByCategory = (category) => {
        currentCategory = category;
        
        // Update active category button
        resourceCategoryButtons.forEach(button => {
            if (button.dataset.category === category) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        // Render filtered resources
        renderResources();
    };
    
    // Event listeners
    resourceCategoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterByCategory(button.dataset.category);
        });
    });
    
    backButton.addEventListener('click', () => {
        // Hide resource detail and show resource container
        resourceDetail.style.display = 'none';
        resourceContainer.style.display = 'grid';
        
        // Stop media playback if any
        resourceDetailVideo.pause();
        resourceDetailAudio.pause();
    });
    
    // Initialize
    const init = async () => {
        const isAuthenticated = await checkAuth();
        if (isAuthenticated) {
            loadResources();
        }
    };
    
    init();
}); 