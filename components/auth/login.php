<?php
/**
 * Login functionality using CSV files
 */

/**
 * Authenticate a user with username and password
 * 
 * @param string $username Username
 * @param string $password Password
 * @return array Response with status and message
 */
function login_user($username, $password) {
    try {
        // Find user by username
        $user = get_user_by_username($username);
        
        // Check if user exists
        if (!$user) {
            return [
                'status' => 'error',
                'message' => 'اسم المستخدم أو كلمة المرور غير صحيحة'
            ];
        }
        
        // Verify password
        if (!password_verify($password, $user['password'])) {
            return [
                'status' => 'error',
                'message' => 'اسم المستخدم أو كلمة المرور غير صحيحة'
            ];
        }
        
        // Set session data for the authenticated user
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['name'] = $user['name'];
        $_SESSION['is_admin'] = (bool)$user['is_admin'];
        $_SESSION['description'] = $user['description'] ?? '';
        
        return [
            'status' => 'success',
            'message' => 'تم تسجيل الدخول بنجاح',
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'name' => $user['name'],
                'description' => $user['description'] ?? '',
                'is_admin' => (bool)$user['is_admin']
            ]
        ];
    } catch (Exception $e) {
        error_log("Login error: " . $e->getMessage());
        return [
            'status' => 'error',
            'message' => 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.'
        ];
    }
}
?>