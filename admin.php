<?php
session_start();
require_once 'config.php';

// Check if user is logged in and is admin
if (!isset($_SESSION['user_id']) || !isset($_SESSION['is_admin']) || $_SESSION['is_admin'] != 1) {
    // Redirect to login page
    header('Location: index.html');
    exit;
}

// Function to get all users
function getAllUsers($pdo) {
    try {
        $stmt = $pdo->query("SELECT id, username, name, email, created_at FROM users WHERE username != 'admin'");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        return [];
    }
}

// Function to get mood statistics
function getMoodStats($pdo) {
    try {
        $stats = [
            'total' => 0,
            'happy' => 0,
            'normal' => 0,
            'unhappy' => 0,
            'recent' => []
        ];
        
        // Get total count
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM mood_records");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['total'] = $result['count'];
        
        // Get counts by mood
        $stmt = $pdo->query("SELECT primary_mood, COUNT(*) as count FROM mood_records GROUP BY primary_mood");
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($results as $row) {
            if (strtolower($row['primary_mood']) == 'سعيد' || strtolower($row['primary_mood']) == 'happy') {
                $stats['happy'] = $row['count'];
            } else if (strtolower($row['primary_mood']) == 'طبيعي' || strtolower($row['primary_mood']) == 'normal') {
                $stats['normal'] = $row['count'];
            } else if (strtolower($row['primary_mood']) == 'حزين' || strtolower($row['primary_mood']) == 'unhappy') {
                $stats['unhappy'] = $row['count'];
            }
        }
        
        // Get recent records
        $stmt = $pdo->query("SELECT m.*, u.username FROM mood_records m JOIN users u ON m.user_id = u.id ORDER BY m.created_at DESC LIMIT 10");
        $stats['recent'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return $stats;
    } catch (PDOException $e) {
        return ['error' => $e->getMessage()];
    }
}

// Get user records if user_id is provided
function getUserRecords($pdo, $userId) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM mood_records WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        return [];
    }
}

// Get user info if user_id is provided
function getUserInfo($pdo, $userId) {
    try {
        $stmt = $pdo->prepare("SELECT id, username, name, email, created_at FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        return null;
    }
}

// Handle view user records
$viewUser = null;
$userRecords = [];
if (isset($_GET['user_id'])) {
    $viewUser = getUserInfo($pdo, $_GET['user_id']);
    $userRecords = getUserRecords($pdo, $_GET['user_id']);
}

// Get all users and mood stats
$users = getAllUsers($pdo);
$moodStats = getMoodStats($pdo);
?>

<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>لوحة تحكم الإدارة - السعادة النفسية</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f7f9fc;
        }
        .navbar {
            background-color: #4a6fdc;
        }
        .navbar-brand {
            font-weight: bold;
            color: white !important;
        }
        .card {
            border: none;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            transition: all 0.3s;
        }
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }
        .stat-card {
            text-align: center;
            padding: 20px;
            border-bottom: 3px solid;
        }
        .stat-card.total { border-color: #4a6fdc; }
        .stat-card.happy { border-color: #28a745; }
        .stat-card.normal { border-color: #ffc107; }
        .stat-card.unhappy { border-color: #dc3545; }
        .stat-number {
            font-size: 2.5rem;
            font-weight: bold;
        }
        .table-container {
            border-radius: 10px;
            overflow: hidden;
        }
        .records-table th {
            background-color: #4a6fdc;
            color: white;
        }
        .mood-happy { color: #28a745; }
        .mood-normal { color: #ffc107; }
        .mood-unhappy { color: #dc3545; }
        .logout-btn {
            color: white;
            background-color: transparent;
            border: 1px solid white;
            transition: all 0.3s;
        }
        .logout-btn:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }
        .back-btn {
            cursor: pointer;
        }
    </style>
</head>
<body>
    <!-- Navbar -->
    <nav class="navbar navbar-dark mb-4">
        <div class="container">
            <span class="navbar-brand">
                <i class="bi bi-emoji-smile-fill me-2"></i>
                لوحة تحكم السعادة النفسية
            </span>
            <div class="d-flex">
                <form action="auth.php" method="post">
                    <input type="hidden" name="action" value="logout">
                    <button type="submit" class="btn btn-sm logout-btn">
                        <i class="bi bi-box-arrow-right me-1"></i>تسجيل الخروج
                    </button>
                </form>
            </div>
        </div>
    </nav>

    <div class="container">
        <?php if ($viewUser): ?>
            <!-- User Details View -->
            <div class="mb-3">
                <a href="admin.php" class="text-decoration-none back-btn">
                    <i class="bi bi-arrow-right-circle-fill"></i> العودة للوحة التحكم
                </a>
            </div>
            
            <div class="card mb-4">
                <div class="card-body">
                    <h4>معلومات المستخدم</h4>
                    <div class="row">
                        <div class="col-md-6">
                            <p><strong>اسم المستخدم:</strong> <?php echo htmlspecialchars($viewUser['username']); ?></p>
                            <p><strong>الاسم:</strong> <?php echo htmlspecialchars($viewUser['name']); ?></p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>البريد الإلكتروني:</strong> <?php echo htmlspecialchars($viewUser['email']); ?></p>
                            <p><strong>تاريخ التسجيل:</strong> <?php echo htmlspecialchars($viewUser['created_at']); ?></p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-body">
                    <h4>سجلات المشاعر</h4>
                    <?php if (count($userRecords) > 0): ?>
                        <div class="table-container">
                            <table class="table table-striped records-table">
                                <thead>
                                    <tr>
                                        <th>التاريخ</th>
                                        <th>المزاج الأساسي</th>
                                        <th>المزاج المحدد</th>
                                        <th>السبب</th>
                                        <th>النشاط</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($userRecords as $record): ?>
                                        <tr>
                                            <td><?php echo htmlspecialchars($record['created_at']); ?></td>
                                            <td class="<?php
                                                if (strtolower($record['primary_mood']) == 'سعيد' || strtolower($record['primary_mood']) == 'happy') echo 'mood-happy';
                                                else if (strtolower($record['primary_mood']) == 'طبيعي' || strtolower($record['primary_mood']) == 'normal') echo 'mood-normal';
                                                else if (strtolower($record['primary_mood']) == 'حزين' || strtolower($record['primary_mood']) == 'unhappy') echo 'mood-unhappy';
                                            ?>">
                                                <?php echo htmlspecialchars($record['primary_mood']); ?>
                                            </td>
                                            <td><?php echo htmlspecialchars($record['specific_mood']); ?></td>
                                            <td><?php echo htmlspecialchars($record['reason']); ?></td>
                                            <td><?php echo htmlspecialchars($record['activity']); ?></td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    <?php else: ?>
                        <div class="alert alert-info">لا توجد سجلات مشاعر لهذا المستخدم حتى الآن.</div>
                    <?php endif; ?>
                </div>
            </div>
        <?php else: ?>
            <!-- Dashboard View -->
            <h2 class="mb-4">نظرة عامة</h2>
            
            <!-- Stats Cards -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card stat-card total">
                        <h5>إجمالي السجلات</h5>
                        <div class="stat-number"><?php echo $moodStats['total']; ?></div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stat-card happy">
                        <h5>سعيد</h5>
                        <div class="stat-number mood-happy"><?php echo $moodStats['happy']; ?></div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stat-card normal">
                        <h5>طبيعي</h5>
                        <div class="stat-number mood-normal"><?php echo $moodStats['normal']; ?></div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stat-card unhappy">
                        <h5>حزين</h5>
                        <div class="stat-number mood-unhappy"><?php echo $moodStats['unhappy']; ?></div>
                    </div>
                </div>
            </div>
            
            <!-- Charts -->
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">توزيع المشاعر</h5>
                            <canvas id="moodChart" height="200"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">المستخدمين المسجلين</h5>
                            <div class="table-container">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>اسم المستخدم</th>
                                            <th>الاسم</th>
                                            <th>تاريخ التسجيل</th>
                                            <th>عرض</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php if (count($users) > 0): ?>
                                            <?php foreach ($users as $user): ?>
                                                <tr>
                                                    <td><?php echo htmlspecialchars($user['username']); ?></td>
                                                    <td><?php echo htmlspecialchars($user['name']); ?></td>
                                                    <td><?php echo htmlspecialchars($user['created_at']); ?></td>
                                                    <td>
                                                        <a href="admin.php?user_id=<?php echo $user['id']; ?>" class="btn btn-sm btn-primary">
                                                            <i class="bi bi-eye-fill"></i>
                                                        </a>
                                                    </td>
                                                </tr>
                                            <?php endforeach; ?>
                                        <?php else: ?>
                                            <tr>
                                                <td colspan="4" class="text-center">لا يوجد مستخدمين مسجلين</td>
                                            </tr>
                                        <?php endif; ?>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Recent Records -->
            <div class="card mb-4">
                <div class="card-body">
                    <h5 class="card-title">أحدث سجلات المشاعر</h5>
                    <?php if (count($moodStats['recent']) > 0): ?>
                        <div class="table-container">
                            <table class="table table-striped records-table">
                                <thead>
                                    <tr>
                                        <th>المستخدم</th>
                                        <th>التاريخ</th>
                                        <th>المزاج الأساسي</th>
                                        <th>المزاج المحدد</th>
                                        <th>السبب</th>
                                        <th>النشاط</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($moodStats['recent'] as $record): ?>
                                        <tr>
                                            <td>
                                                <a href="admin.php?user_id=<?php echo $record['user_id']; ?>">
                                                    <?php echo htmlspecialchars($record['username']); ?>
                                                </a>
                                            </td>
                                            <td><?php echo htmlspecialchars($record['created_at']); ?></td>
                                            <td class="<?php
                                                if (strtolower($record['primary_mood']) == 'سعيد' || strtolower($record['primary_mood']) == 'happy') echo 'mood-happy';
                                                else if (strtolower($record['primary_mood']) == 'طبيعي' || strtolower($record['primary_mood']) == 'normal') echo 'mood-normal';
                                                else if (strtolower($record['primary_mood']) == 'حزين' || strtolower($record['primary_mood']) == 'unhappy') echo 'mood-unhappy';
                                            ?>">
                                                <?php echo htmlspecialchars($record['primary_mood']); ?>
                                            </td>
                                            <td><?php echo htmlspecialchars($record['specific_mood']); ?></td>
                                            <td><?php echo htmlspecialchars($record['reason']); ?></td>
                                            <td><?php echo htmlspecialchars($record['activity']); ?></td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    <?php else: ?>
                        <div class="alert alert-info">لا توجد سجلات مشاعر حتى الآن.</div>
                    <?php endif; ?>
                </div>
            </div>
            
            <script>
                // Setup mood chart
                const moodData = {
                    labels: ['سعيد', 'طبيعي', 'حزين'],
                    datasets: [{
                        label: 'توزيع المشاعر',
                        data: [<?php echo $moodStats['happy']; ?>, <?php echo $moodStats['normal']; ?>, <?php echo $moodStats['unhappy']; ?>],
                        backgroundColor: [
                            'rgba(40, 167, 69, 0.7)',
                            'rgba(255, 193, 7, 0.7)',
                            'rgba(220, 53, 69, 0.7)'
                        ],
                        borderColor: [
                            'rgba(40, 167, 69, 1)',
                            'rgba(255, 193, 7, 1)',
                            'rgba(220, 53, 69, 1)'
                        ],
                        borderWidth: 1
                    }]
                };
                
                const moodConfig = {
                    type: 'pie',
                    data: moodData,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                };
                
                new Chart(
                    document.getElementById('moodChart'),
                    moodConfig
                );
            </script>
        <?php endif; ?>
    </div>
    
    <footer class="mt-5 py-3 text-center text-muted">
        <div class="container">
            <p>جميع الحقوق محفوظة &copy; <?php echo date('Y'); ?> - تطبيق السعادة النفسية</p>
        </div>
    </footer>
</body>
</html> 