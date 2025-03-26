<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once 'includes/csv_handler.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'يجب تسجيل الدخول أولاً']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Get all mood records for the user
try {
    $records = get_mood_records($user_id);
    $statistics = get_mood_statistics($user_id);
    
    echo json_encode([
        'success' => true, 
        'records' => $records,
        'statistics' => $statistics
    ]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'خطأ في استرجاع البيانات: ' . $e->getMessage()]);
}
?>