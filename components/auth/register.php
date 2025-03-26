<?php
/**
 * Registration functionality using CSV files
 */

/**
 * Register a new user
 * 
 * @param string $username Username
 * @param string $name Full name
 * @param string $password Password
 * @param string $email Email
 * @param string $description User description
 * @return array Response with status and message
 */
function register_user($username, $name, $password, $email, $description = '') {
    try {
        // Validate required fields
        if (empty($username) || empty($name) || empty($password)) {
            return [
                'status' => 'error',
                'message' => 'جميع الحقول المطلوبة يجب ملؤها'
            ];
        }
        
        // Validate email format if provided
        if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return [
                'status' => 'error',
                'message' => 'صيغة البريد الإلكتروني غير صحيحة'
            ];
        }
        
        // Validate username format (alphanumeric only)
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
            return [
                'status' => 'error',
                'message' => 'اسم المستخدم يجب أن يحتوي على أحرف وأرقام فقط'
            ];
        }
        
        // Validate password strength (min 8 characters)
        if (strlen($password) < 8) {
            return [
                'status' => 'error',
                'message' => 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
            ];
        }
        
        // Check if username exists
        if (get_user_by_username($username)) {
            return [
                'status' => 'error',
                'message' => 'اسم المستخدم مستخدم بالفعل'
            ];
        }
        
        // Check if email exists (if provided)
        if (!empty($email) && get_user_by_email($email)) {
            return [
                'status' => 'error',
                'message' => 'البريد الإلكتروني مستخدم بالفعل'
            ];
        }
        
        // Create new user
        $result = create_user($username, $name, $password, $email, $description);
        
        if ($result['status'] === 'success') {
            // Set session data for the new user
            $_SESSION['user_id'] = $result['user']['id'];
            $_SESSION['username'] = $result['user']['username'];
            $_SESSION['name'] = $result['user']['name'];
            $_SESSION['is_admin'] = $result['user']['is_admin'];
            $_SESSION['description'] = $result['user']['description'];
        }
        
        return $result;
    } catch (Exception $e) {
        error_log("Registration error: " . $e->getMessage());
        return [
            'status' => 'error',
            'message' => 'حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.'
        ];
    }
}
?>