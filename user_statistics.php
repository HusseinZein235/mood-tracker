<?php
session_start();
require_once 'includes/csv_handler.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: index.html');
    exit;
}

$userId = $_SESSION['user_id'];
$userData = get_user_by_id($userId);
$moodStats = get_mood_statistics($userId);
$moodRecords = get_mood_records($userId);
?>

<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إحصائيات المشاعر - moodtracker</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="css/enhanced-style.css">
    <style>
        body {
            font-family: 'Tajawal', sans-serif;
            background-color: #f7fafc;
        }
    </style>
</head>
<body>
    <!-- Navigation Bar -->
    <nav class="bg-white shadow-md py-3 px-4 md:px-8">
        <div class="container mx-auto flex justify-between items-center">
            <a href="index.html" class="text-2xl font-bold text-blue-600">moodtracker</a>
            
            <div class="hidden md:flex space-x-4 space-x-reverse">
                <a href="index.html" class="px-3 py-2 rounded hover:bg-blue-100 transition">الرئيسية</a>
                <a href="user_statistics.php" class="px-3 py-2 rounded bg-blue-100 font-medium">إحصائياتي</a>
            </div>
            
            <div class="flex items-center">
                <span class="hidden md:inline-block mr-4">مرحباً، <?php echo htmlspecialchars($userData['name']); ?></span>
                <button onclick="logout()" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition">تسجيل الخروج</button>
            </div>
        </div>
    </nav>

    <div class="container mx-auto px-4 py-8">
        <div class="mb-4">
            <button onclick="window.location.href='index.html'" class="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow transition">
                <i class="fas fa-arrow-right ml-2"></i>العودة للرئيسية
            </button>
        </div>

        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-blue-600">إحصائيات المشاعر الخاصة بك</h1>
            <p class="text-gray-600 mt-2">تعرف على نمط مشاعرك وتطور حالتك المزاجية</p>
        </div>

        <div class="stats-container">
            <div class="stats-card">
                <div class="stats-card-icon mood-happy">
                    <i class="fas fa-smile"></i>
                </div>
                <h3 class="text-xl font-bold"><?php echo $moodStats['percentages']['سعيد'] ?? 0; ?>%</h3>
                <p class="text-gray-600">مشاعر سعيدة</p>
            </div>
            
            <div class="stats-card">
                <div class="stats-card-icon mood-normal">
                    <i class="fas fa-meh"></i>
                </div>
                <h3 class="text-xl font-bold"><?php echo $moodStats['percentages']['طبيعي'] ?? 0; ?>%</h3>
                <p class="text-gray-600">مشاعر طبيعية</p>
            </div>
            
            <div class="stats-card">
                <div class="stats-card-icon mood-sad">
                    <i class="fas fa-frown"></i>
                </div>
                <h3 class="text-xl font-bold"><?php echo $moodStats['percentages']['حزين'] ?? 0; ?>%</h3>
                <p class="text-gray-600">مشاعر حزينة</p>
            </div>
            
            <div class="stats-card">
                <div class="stats-card-icon text-blue-600">
                    <i class="fas fa-chart-line"></i>
                </div>
                <h3 class="text-xl font-bold"><?php echo $moodStats['total']; ?></h3>
                <p class="text-gray-600">إجمالي السجلات</p>
            </div>
        </div>

        <?php if ($moodStats['total'] > 0): ?>
        <div class="chart-container">
            <h3 class="text-xl font-bold">توزيع المشاعر</h3>
            <div style="height: 300px;">
                <canvas id="moodDistributionChart"></canvas>
            </div>
        </div>
        
        <?php if (count($moodRecords) > 1): ?>
        <div class="chart-container">
            <h3 class="text-xl font-bold">تطور المشاعر مع الوقت</h3>
            <div style="height: 300px;">
                <canvas id="moodTrendChart"></canvas>
            </div>
        </div>
        <?php endif; ?>
        <?php endif; ?>

        <div class="bg-white rounded-lg shadow-md p-6 mt-8">
            <h3 class="text-xl font-bold text-blue-600 mb-4">سجل المشاعر</h3>
            
            <?php if (empty($moodRecords)): ?>
            <p class="text-gray-600 text-center py-8">لا توجد سجلات مشاعر حتى الآن</p>
            <?php else: ?>
            <div class="overflow-x-auto">
                <table class="w-full border-collapse">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="py-3 px-4 text-right">التاريخ</th>
                            <th class="py-3 px-4 text-right">المشاعر</th>
                            <th class="py-3 px-4 text-right">المشاعر المحددة</th>
                            <th class="py-3 px-4 text-right">السبب</th>
                            <th class="py-3 px-4 text-right">النشاط</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($moodRecords as $record): ?>
                        <tr class="border-b hover:bg-gray-50">
                            <td class="py-3 px-4"><?php echo htmlspecialchars($record['created_at']); ?></td>
                            <td class="py-3 px-4">
                                <?php 
                                $moodClass = '';
                                $moodIcon = '';
                                
                                if ($record['primary_mood'] === 'سعيد') {
                                    $moodClass = 'text-green-600';
                                    $moodIcon = 'smile';
                                } elseif ($record['primary_mood'] === 'طبيعي') {
                                    $moodClass = 'text-blue-600';
                                    $moodIcon = 'meh';
                                } elseif ($record['primary_mood'] === 'حزين') {
                                    $moodClass = 'text-red-600';
                                    $moodIcon = 'frown';
                                }
                                ?>
                                <span class="<?php echo $moodClass; ?>">
                                    <i class="fas fa-<?php echo $moodIcon; ?> mr-1"></i>
                                    <?php echo htmlspecialchars($record['primary_mood']); ?>
                                </span>
                            </td>
                            <td class="py-3 px-4"><?php echo htmlspecialchars($record['specific_mood']); ?></td>
                            <td class="py-3 px-4"><?php echo htmlspecialchars($record['reason']); ?></td>
                            <td class="py-3 px-4"><?php echo htmlspecialchars($record['activity']); ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>
        </div>
    </div>

    <script>
        <?php if ($moodStats['total'] > 0): ?>
        // Mood distribution chart
        const moodCtx = document.getElementById('moodDistributionChart').getContext('2d');
        const moodDistributionChart = new Chart(moodCtx, {
            type: 'doughnut',
            data: {
                labels: ['سعيد', 'طبيعي', 'حزين'],
                datasets: [{
                    data: [
                        <?php echo $moodStats['counts']['سعيد'] ?? 0; ?>,
                        <?php echo $moodStats['counts']['طبيعي'] ?? 0; ?>,
                        <?php echo $moodStats['counts']['حزين'] ?? 0; ?>
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
                        position: 'right',
                        labels: {
                            font: {
                                family: 'Tajawal'
                            }
                        }
                    }
                }
            }
        });
        
        <?php if (count($moodRecords) > 1): ?>
        // Mood trend chart
        const trendCtx = document.getElementById('moodTrendChart').getContext('2d');
        
        // Prepare data for trend chart
        const dates = [];
        const moodValues = [];
        
        <?php 
        // Sort records by date ascending
        usort($moodRecords, function($a, $b) {
            return strtotime($a['created_at']) - strtotime($b['created_at']);
        });
        
        // Get the most recent 10 records
        $recentRecords = array_slice($moodRecords, -10);
        
        foreach ($recentRecords as $record) {
            $date = date('d/m', strtotime($record['created_at']));
            $moodValue = 0;
            
            if ($record['primary_mood'] === 'سعيد') {
                $moodValue = 3;
            } elseif ($record['primary_mood'] === 'طبيعي') {
                $moodValue = 2;
            } elseif ($record['primary_mood'] === 'حزين') {
                $moodValue = 1;
            }
            
            echo "dates.push('$date');\n";
            echo "moodValues.push($moodValue);\n";
        }
        ?>
        
        const moodTrendChart = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'مستوى المشاعر',
                    data: moodValues,
                    borderColor: '#4a6da7',
                    tension: 0.3,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 0,
                        max: 4,
                        ticks: {
                            callback: function(value) {
                                if (value === 1) return 'حزين';
                                if (value === 2) return 'طبيعي';
                                if (value === 3) return 'سعيد';
                                return '';
                            },
                            font: {
                                family: 'Tajawal'
                            }
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                family: 'Tajawal'
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        <?php endif; ?>
        <?php endif; ?>
        
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
