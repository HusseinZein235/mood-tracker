<?php
/**
 * Session management functions using CSV files
 */

/**
 * Check if user is logged in
 * 
 * @return bool Whether user is logged in
 */
function is_logged_in() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

/**
 * Check if current user is admin
 * 
 * @return bool Whether current user is admin
 */
function is_admin() {
    return is_logged_in() && isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true;
}

/**
 * Verify user session against CSV data
 * 
 * @return bool Whether session is valid
 */
function verify_session() {
    if (!is_logged_in()) {
        return false;
    }
    
    try {
        $user = get_user_by_id($_SESSION['user_id']);
        
        // If user doesn't exist, invalidate session
        if (!$user) {
            session_unset();
            session_destroy();
            return false;
        }
        
        // Update session data in case user data has changed
        $_SESSION['username'] = $user['username'];
        $_SESSION['name'] = $user['name'];
        $_SESSION['is_admin'] = (bool)$user['is_admin'];
        $_SESSION['description'] = $user['description'] ?? '';
        
        return true;
    } catch (Exception $e) {
        error_log("Session verification error: " . $e->getMessage());
        // On error, rely on session data
        return true;
    }
}

/**
 * Require user to be logged in
 * Redirects to login page if not logged in
 */
function require_login() {
    if (!is_logged_in()) {
        header('Location: index.html');
        exit;
    }
}

/**
 * Require user to be admin
 * Redirects to login page if not admin
 */
function require_admin() {
    if (!is_admin()) {
        header('Location: index.html');
        exit;
    }
}
?>