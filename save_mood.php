<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once 'includes/csv_handler.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'يجب تسجيل الدخول أولاً']);
    exit;
}

// Check if request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'طريقة طلب غير صالحة']);
    exit;
}

// Get user inputs
$user_id = $_SESSION['user_id'];
$primary_mood = isset($_POST['primary_mood']) ? $_POST['primary_mood'] : null;
$specific_mood = isset($_POST['specific_mood']) ? $_POST['specific_mood'] : null;
$reason = isset($_POST['reason']) ? $_POST['reason'] : null;
$activity = isset($_POST['activity']) ? $_POST['activity'] : null;
$notes = isset($_POST['notes']) ? $_POST['notes'] : '';

// Validate inputs
if (!$primary_mood || !$specific_mood || !$reason || !$activity) {
    echo json_encode(['success' => false, 'message' => 'جميع الحقول مطلوبة']);
    exit;
}

// Translate mood values to Arabic if needed
$moodTranslation = [
    'happy' => 'سعيد',
    'normal' => 'طبيعي',
    'unhappy' => 'حزين'
];

// Use translated values if available
$primary_mood = isset($moodTranslation[$primary_mood]) ? $moodTranslation[$primary_mood] : $primary_mood;

try {
    // Save mood record using CSV handler
    $result = save_mood_record($user_id, $primary_mood, $specific_mood, $reason, $activity, $notes);
    echo json_encode($result);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'خطأ في حفظ البيانات: ' . $e->getMessage()]);
}
?>