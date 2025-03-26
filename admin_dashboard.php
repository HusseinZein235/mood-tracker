<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once 'config.php';

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || !$_SESSION['is_admin']) {
    http_response_code(403);
    echo json_encode(['error' => true, 'message' => 'غير مصرح بالوصول']);
    exit;
}

$action = isset($_GET['action']) ? $_GET['action'] : '';
$response = ['success' => false, 'message' => 'إجراء غير صالح'];

switch ($action) {
    case 'get_users':
        try {
            $stmt = $pdo->prepare("
                SELECT 
                    u.id,
                    u.username,
                    u.name,
                    u.email,
                    u.created_at,
                    COUNT(m.id) as mood_count
                FROM users u
                LEFT JOIN moods m ON u.id = m.user_id
                WHERE u.is_admin = 0
                GROUP BY u.id
                ORDER BY u.created_at DESC
            ");
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $response = ['success' => true, 'users' => $users];
        } catch(PDOException $e) {
            $response = ['error' => true, 'message' => 'خطأ في استرجاع البيانات: ' . $e->getMessage()];
        }
        break;
        
    case 'get_user_moods':
        $userId = isset($_GET['user_id']) ? $_GET['user_id'] : '';
        
        if (empty($userId)) {
            $response = ['error' => true, 'message' => 'معرف المستخدم مطلوب'];
            break;
        }
        
        try {
            // Get user info
            $stmt = $pdo->prepare("SELECT username, name FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                $response = ['error' => true, 'message' => 'المستخدم غير موجود'];
                break;
            }
            
            // Get user moods
            $stmt = $pdo->prepare("
                SELECT 
                    id,
                    primary_mood,
                    specific_mood,
                    reason,
                    activity,
                    DATE_FORMAT(created_at, '%Y-%m-%d') as date
                FROM moods 
                WHERE user_id = ? 
                ORDER BY created_at DESC
            ");
            $stmt->execute([$userId]);
            $moods = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $response = [
                'success' => true, 
                'user' => $user,
                'moods' => $moods
            ];
        } catch(PDOException $e) {
            $response = ['error' => true, 'message' => 'خطأ في استرجاع البيانات: ' . $e->getMessage()];
        }
        break;
        
    case 'get_stats':
        try {
            // Get total users
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM users WHERE is_admin = 0");
            $stmt->execute();
            $totalUsers = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            // Get total moods
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM moods");
            $stmt->execute();
            $totalMoods = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            // Get mood distribution
            $stmt = $pdo->prepare("
                SELECT 
                    primary_mood, 
                    COUNT(*) as count,
                    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM moods), 2) as percentage
                FROM moods
                GROUP BY primary_mood
            ");
            $stmt->execute();
            $moodDistribution = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get activity distribution
            $stmt = $pdo->prepare("
                SELECT 
                    activity, 
                    COUNT(*) as count,
                    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM moods), 2) as percentage
                FROM moods
                GROUP BY activity
            ");
            $stmt->execute();
            $activityDistribution = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get mood trends (last 30 days)
            $stmt = $pdo->prepare("
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m-%d') as date,
                    primary_mood,
                    COUNT(*) as count
                FROM moods
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d'), primary_mood
                ORDER BY date
            ");
            $stmt->execute();
            $moodTrends = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get recent users
            $stmt = $pdo->prepare("
                SELECT 
                    u.id,
                    u.username,
                    u.name,
                    u.created_at,
                    COUNT(m.id) as mood_count
                FROM users u
                LEFT JOIN moods m ON u.id = m.user_id
                WHERE u.is_admin = 0
                GROUP BY u.id
                ORDER BY u.created_at DESC
                LIMIT 5
            ");
            $stmt->execute();
            $recentUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $response = [
                'success' => true, 
                'stats' => [
                    'total_users' => $totalUsers,
                    'total_moods' => $totalMoods,
                    'mood_distribution' => $moodDistribution,
                    'activity_distribution' => $activityDistribution,
                    'mood_trends' => $moodTrends,
                    'recent_users' => $recentUsers
                ]
            ];
        } catch(PDOException $e) {
            $response = ['error' => true, 'message' => 'خطأ في استرجاع البيانات: ' . $e->getMessage()];
        }
        break;
        
    case 'get_user_mood_trends':
        $userId = isset($_GET['user_id']) ? $_GET['user_id'] : '';
        
        if (empty($userId)) {
            $response = ['error' => true, 'message' => 'معرف المستخدم مطلوب'];
            break;
        }
        
        try {
            // Get user mood trends (all time)
            $stmt = $pdo->prepare("
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m-%d') as date,
                    primary_mood,
                    specific_mood
                FROM moods
                WHERE user_id = ?
                ORDER BY created_at
            ");
            $stmt->execute([$userId]);
            $userMoodTrends = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $response = [
                'success' => true, 
                'trends' => $userMoodTrends
            ];
        } catch(PDOException $e) {
            $response = ['error' => true, 'message' => 'خطأ في استرجاع البيانات: ' . $e->getMessage()];
        }
        break;
}

echo json_encode($response);
?> 