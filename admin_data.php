<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => true, 'message' => 'طريقة الطلب غير مسموح بها']);
    exit;
}

if (!isset($_GET['admin_id']) || empty($_GET['admin_id'])) {
    http_response_code(400);
    echo json_encode(['error' => true, 'message' => 'معرف المسؤول مطلوب']);
    exit;
}

$adminId = $_GET['admin_id'];

try {
    // Verify admin status
    $stmt = $pdo->prepare("SELECT is_admin FROM users WHERE id = ? AND is_admin = 1");
    $stmt->execute([$adminId]);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(403);
        echo json_encode(['error' => true, 'message' => 'غير مصرح للوصول إلى لوحة التحكم']);
        exit;
    }
    
    // Get statistics
    $response = [
        'success' => true,
        'stats' => [
            'total_users' => getCount($pdo, "SELECT COUNT(*) FROM users"),
            'total_records' => getCount($pdo, "SELECT COUNT(*) FROM moods"),
            'total_chats' => getCount($pdo, "SELECT COUNT(*) FROM chat_history")
        ],
        'mood_distribution' => getMoodDistribution($pdo),
        'reason_distribution' => getReasonDistribution($pdo),
        'recent_users' => getRecentUsers($pdo)
    ];
    
    echo json_encode($response);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => true, 'message' => 'خطأ في استرجاع البيانات: ' . $e->getMessage()]);
}

// Helper functions
function getCount($pdo, $query) {
    $stmt = $pdo->query($query);
    return $stmt->fetchColumn();
}

function getMoodDistribution($pdo) {
    $stmt = $pdo->query("
        SELECT 
            primary_mood,
            COUNT(*) as count
        FROM moods 
        GROUP BY primary_mood
    ");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getReasonDistribution($pdo) {
    $stmt = $pdo->query("
        SELECT 
            reason,
            COUNT(*) as count
        FROM moods 
        GROUP BY reason
    ");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getRecentUsers($pdo) {
    $stmt = $pdo->query("
        SELECT 
            u.id,
            u.name,
            u.email,
            DATE_FORMAT(u.created_at, '%Y-%m-%d') as date,
            COUNT(m.id) as records
        FROM users u
        LEFT JOIN moods m ON u.id = m.user_id
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT 10
    ");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
?> 