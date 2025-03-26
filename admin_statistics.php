<?php
session_start();
require_once 'includes/csv_handler.php';

// Check if user is admin
if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
    header('Location: index.html');
    exit;
}

// Get all users from CSV
function get_all_users() {
    $users = load_csv_data(USERS_CSV);
    if (empty($users)) return [];
    
    $header = array_shift($users);
    $result = [];
    
    foreach ($users as $user) {
        $result[] = array_combine($header, $user);
    }
    
    return $result;
}

// Get all mood records
function get_all_mood_records() {
    $records = load_csv_data(MOOD_RECORDS_CSV);
    if (empty($records)) return [];
    
    $header = array_shift($records);
    $result = [];
    
    foreach ($records as $record) {
        $result[] = array_combine($header, $record);
    }
    
    return $result;
}

// Get mood statistics for all users
function get_all_mood_statistics() {
    $records = get_all_mood_records();
    
    $moodStats = [
        'سعيد' => 0,
        'طبيعي' => 0,
        'حزين' => 0
    ];
    
    foreach ($records as $record) {
        if (isset($moodStats[$record['primary_mood']])) {
            $moodStats[$record['primary_mood']]++;
        }
    }
    
    // Calculate percentage
    $total = array_sum($moodStats);
    $percentages = [];
    
    if ($total > 0) {
        foreach ($moodStats as $mood => $count) {
            $percentages[$mood] = round(($count / $total) * 100);
        }
    }
    
    return [
        'counts' => $moodStats,
        'percentages' => $percentages,
        'total' => $total
    ];
}

// Get mood statistics by user
function get_user_mood_statistics() {
    $records = get_all_mood_records();
    $users = get_all_users();
    
    $userStats = [];
    
    // Initialize user stats
    foreach ($users as $user) {
        $userStats[$user['id']] = [
            'name' => $user['name'],
            'username' => $user['username'],
            'moods' => [
                'سعيد' => 0,
                'طبيعي' => 0,
                'حزين' => 0
            ],
            'total' => 0
        ];
    }
    
    // Count moods by user
    foreach ($records as $record) {
        $userId = $record['user_id'];
        $mood = $record['primary_mood'];
        
        if (isset($userStats[$userId]) && isset($userStats[$userId]['moods'][$mood])) {
            $userStats[$userId]['moods'][$mood]++;
            $userStats[$userId]['total']++;
        }
    }
    
    // Calculate percentages
    foreach ($userStats as $userId => $stats) {
        $userStats[$userId]['percentages'] = [];
        $total = $stats['total'];
        
        if ($total > 0) {
            foreach ($stats['moods'] as $mood => $count) {
                $userStats[$userId]['percentages'][$mood] = round(($count / $total) * 100);
            }
        }
    }
    
    return $userStats;
}

$allUsers = get_all_users();
$allMoodStats = get_all_mood_statistics();
$userMoodStats = get_user_mood_statistics();
?>

<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إحصائيات المستخدمين - moodtracker</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.rtl.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: 'Tajawal', sans-serif;
            background-color: #f8f9fa;
        }
        .card {
            margin-bottom: 20px;
            border-radius: 15px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .card-header {
            background-color: #4a6da7;
            color: white;
            border-radius: 15px 15px 0 0 !important;
            padding: 15px 20px;
        }
        .chart-container {
            position: relative;
            height: 300px;
            margin: 20px auto;
        }
        .user-icon {
            font-size: 2rem;
            color: #4a6da7;
            margin-bottom: 10px;
        }
        .stat-card {
            text-align: center;
            padding: 20px;
            transition: transform 0.3s;
        }
        .stat-card:hover {
            transform: translateY(-5px);
        }
        .mood-happy {
            color: #28a745;
        }
        .mood-normal {
            color: #17a2b8;
        }
        .mood-sad {
            color: #dc3545;
        }
        .navbar-brand {
            font-weight: bold;
            font-size: 24px;
        }
        .navbar {
            background-color: #4a6da7 !important;
        }
        .navbar-light .navbar-nav .nav-link {
            color: white;
        }
    </style>
</head>
<body>
    <!-- Navigation Bar -->
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container">
            <a class="navbar-brand text-white" href="index.html">moodtracker</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <a class="nav-link text-white" href="index.html">الرئيسية</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link text-white" href="admin_dashboard.php">لوحة التحكم</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link text-white active" href="admin_statistics.php">الإحصائيات</a>
                    </li>
                </ul>
                <div class="d-flex">
                    <a href="#" onclick="logout()" class="btn btn-outline-light">تسجيل الخروج</a>
                </div>
            </div>
        </div>
    </nav>

    <div class="container mt-5">
        <h1 class="mb-4 text-center">إحصائيات المستخدمين</h1>
        
        <!-- Dashboard Summary Cards -->
        <div class="row mb-4">
            <div class="col-md-4">
                <div class="card stat-card">
                    <div class="user-icon">
                        <i class="bi bi-people-fill"></i>
                    </div>
                    <h3><?php echo count($allUsers); ?></h3>
                    <p class="text-muted">إجمالي المستخدمين</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card stat-card">
                    <div class="user-icon">
                        <i class="bi bi-journal-text"></i>
                    </div>
                    <h3><?php echo $allMoodStats['total']; ?></h3>
                    <p class="text-muted">إجمالي سجلات المشاعر</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card stat-card">
                    <div class="user-icon">
                        <i class="bi bi-emoji-smile-fill mood-happy"></i>
                    </div>
                    <h3><?php echo $allMoodStats['percentages']['سعيد'] ?? 0; ?>%</h3>
                    <p class="text-muted">نسبة المشاعر الإيجابية</p>
                </div>
            </div>
        </div>
        
        <!-- Overall Mood Statistics Chart -->
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">إحصائيات المشاعر الكلية</h5>
            </div>
            <div class="card-body">
                <div class="chart-container">
                    <canvas id="overallMoodChart"></canvas>
                </div>
            </div>
        </div>
        
        <!-- User-specific Statistics -->
        <h2 class="mt-5 mb-4">إحصائيات حسب المستخدم</h2>
        
        <div class="row">
            <?php foreach ($userMoodStats as $userId => $stats): ?>
            <?php if ($stats['total'] > 0): ?>
            <div class="col-md-6">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0"><?php echo htmlspecialchars($stats['name']); ?> (<?php echo htmlspecialchars($stats['username']); ?>)</h5>
                    </div>
                    <div class="card-body">
                        <div class="chart-container" style="height: 250px;">
                            <canvas id="userChart_<?php echo $userId; ?>"></canvas>
                        </div>
                        <div class="row mt-3 text-center">
                            <div class="col-4">
                                <i class="bi bi-emoji-smile-fill mood-happy fs-3"></i>
                                <h5><?php echo $stats['percentages']['سعيد'] ?? 0; ?>%</h5>
                                <p class="text-muted">سعيد</p>
                            </div>
                            <div class="col-4">
                                <i class="bi bi-emoji-neutral-fill mood-normal fs-3"></i>
                                <h5><?php echo $stats['percentages']['طبيعي'] ?? 0; ?>%</h5>
                                <p class="text-muted">طبيعي</p>
                            </div>
                            <div class="col-4">
                                <i class="bi bi-emoji-frown-fill mood-sad fs-3"></i>
                                <h5><?php echo $stats['percentages']['حزين'] ?? 0; ?>%</h5>
                                <p class="text-muted">حزين</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <?php endif; ?>
            <?php endforeach; ?>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Chart.js configuration for the overall mood chart
        const overallCtx = document.getElementById('overallMoodChart').getContext('2d');
        const overallMoodChart = new Chart(overallCtx, {
            type: 'pie',
            data: {
                labels: ['سعيد', 'طبيعي', 'حزين'],
                datasets: [{
                    data: [
                        <?php echo $allMoodStats['counts']['سعيد'] ?? 0; ?>,
                        <?php echo $allMoodStats['counts']['طبيعي'] ?? 0; ?>,
                        <?php echo $allMoodStats['counts']['حزين'] ?? 0; ?>
                    ],
                    backgroundColor: [
                        '#28a745',
                        '#17a2b8',
                        '#dc3545'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });

        // Individual user charts
        <?php foreach ($userMoodStats as $userId => $stats): ?>
        <?php if ($stats['total'] > 0): ?>
        const userCtx_<?php echo $userId; ?> = document.getElementById('userChart_<?php echo $userId; ?>').getContext('2d');
        const userChart_<?php echo $userId; ?> = new Chart(userCtx_<?php echo $userId; ?>, {
            type: 'doughnut',
            data: {
                labels: ['سعيد', 'طبيعي', 'حزين'],
                datasets: [{
                    data: [
                        <?php echo $stats['moods']['سعيد'] ?? 0; ?>,
                        <?php echo $stats['moods']['طبيعي'] ?? 0; ?>,
                        <?php echo $stats['moods']['حزين'] ?? 0; ?>
                    ],
                    backgroundColor: [
                        '#28a745',
                        '#17a2b8',
                        '#dc3545'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        <?php endif; ?>
        <?php endforeach; ?>

        // Logout function
        function logout() {
            fetch('auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'action=logout'
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    window.location.href = 'index.html';
                }
            });
        }
    </script>
</body>
</html>
