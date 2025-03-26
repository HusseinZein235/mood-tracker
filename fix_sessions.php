<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'config.php';

$message = '';
$messageType = '';

// Handle admin password reset
if (isset($_POST['reset_admin'])) {
    try {
        $hashedPassword = password_hash('12345678', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE username = 'admin'");
        $stmt->execute([$hashedPassword]);
        
        $message = 'تم إعادة تعيين كلمة مرور المدير إلى: 12345678';
        $messageType = 'success';
    } catch (PDOException $e) {
        $message = 'خطأ: ' . $e->getMessage();
        $messageType = 'error';
    }
}

// Handle creating admin account
if (isset($_POST['create_admin'])) {
    try {
        // Check if admin exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = 'admin'");
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $message = 'حساب المدير موجود بالفعل. يمكنك استخدام خيار إعادة تعيين كلمة المرور.';
            $messageType = 'warning';
        } else {
            $username = 'admin';
            $name = 'المدير';
            $password = password_hash('12345678', PASSWORD_DEFAULT);
            $email = 'admin@example.com';
            
            $insertStmt = $pdo->prepare("INSERT INTO users (username, name, password, email, is_admin) VALUES (?, ?, ?, ?, TRUE)");
            $insertStmt->execute([$username, $name, $password, $email]);
            
            $message = 'تم إنشاء حساب المدير بنجاح. بيانات الدخول: admin / 12345678';
            $messageType = 'success';
        }
    } catch (PDOException $e) {
        $message = 'خطأ: ' . $e->getMessage();
        $messageType = 'error';
    }
}

// Handle user password reset
if (isset($_POST['reset_user_password'])) {
    $username = isset($_POST['username']) ? trim($_POST['username']) : '';
    $newPassword = isset($_POST['new_password']) ? trim($_POST['new_password']) : '';
    
    if (empty($username) || empty($newPassword)) {
        $message = 'يرجى إدخال اسم المستخدم وكلمة المرور الجديدة';
        $messageType = 'error';
    } else {
        try {
            // Check if user exists
            $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
            $stmt->execute([$username]);
            
            if ($stmt->rowCount() === 0) {
                $message = 'المستخدم غير موجود: ' . htmlspecialchars($username);
                $messageType = 'error';
            } else {
                // Update password
                $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
                $updateStmt = $pdo->prepare("UPDATE users SET password = ? WHERE username = ?");
                $updateStmt->execute([$hashedPassword, $username]);
                
                $message = 'تم إعادة تعيين كلمة المرور للمستخدم: ' . htmlspecialchars($username);
                $messageType = 'success';
            }
        } catch (PDOException $e) {
            $message = 'خطأ: ' . $e->getMessage();
            $messageType = 'error';
        }
    }
}

// Handle session reset
if (isset($_POST['reset_sessions'])) {
    // Clear all sessions
    session_start();
    session_unset();
    session_destroy();
    
    // Attempt to fix session directory permissions if needed
    $sessionPath = session_save_path();
    if (!empty($sessionPath) && is_dir($sessionPath)) {
        @chmod($sessionPath, 0777);
    }
    
    $message = 'تم إعادة تعيين جلسات المستخدمين. قد تحتاج إلى إعادة تسجيل الدخول.';
    $messageType = 'success';
}

// Handle cookie cleaning
if (isset($_POST['clear_cookies'])) {
    // Clear all cookies
    if (isset($_SERVER['HTTP_COOKIE'])) {
        $cookies = explode(';', $_SERVER['HTTP_COOKIE']);
        foreach($cookies as $cookie) {
            $parts = explode('=', $cookie);
            $name = trim($parts[0]);
            setcookie($name, '', time()-1000);
            setcookie($name, '', time()-1000, '/');
        }
    }
    
    $message = 'تم مسح كوكيز المتصفح. قد تحتاج إلى إعادة تحميل الصفحة.';
    $messageType = 'success';
}

// Display all users in the system
$users = [];
try {
    $stmt = $pdo->query("SELECT id, username, name, email, created_at, is_admin FROM users ORDER BY id");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    $message = 'خطأ في استرجاع المستخدمين: ' . $e->getMessage();
    $messageType = 'error';
}
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إصلاح مشاكل تسجيل الدخول</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            direction: rtl;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1, h2 {
            text-align: center;
            color: #333;
        }
        .section {
            margin-bottom: 30px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input[type="text"], input[type="password"] {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        }
        button {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
        }
        .warning button {
            background-color: #ff9800;
        }
        .danger button {
            background-color: #f44336;
        }
        .message {
            margin-top: 20px;
            padding: 10px;
            border-radius: 4px;
        }
        .success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .warning {
            background-color: #fff3cd;
            color: #856404;
            border: 1px solid #ffeeba;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        table, th, td {
            border: 1px solid #ddd;
        }
        th, td {
            padding: 8px;
            text-align: right;
        }
        th {
            background-color: #f2f2f2;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>إصلاح مشاكل تسجيل الدخول</h1>
        
        <?php if (!empty($message)): ?>
            <div class="message <?php echo $messageType; ?>">
                <?php echo htmlspecialchars($message); ?>
            </div>
        <?php endif; ?>
        
        <div class="section">
            <h2>إعادة تعيين حساب المدير</h2>
            <form action="fix_sessions.php" method="post">
                <p>استخدم هذا الخيار لإعادة تعيين كلمة مرور المدير إلى القيمة الافتراضية (12345678).</p>
                <button type="submit" name="reset_admin">إعادة تعيين كلمة مرور المدير</button>
            </form>
        </div>
        
        <div class="section">
            <h2>إنشاء حساب المدير</h2>
            <form action="fix_sessions.php" method="post">
                <p>استخدم هذا الخيار لإنشاء حساب المدير إذا لم يكن موجودًا.</p>
                <button type="submit" name="create_admin">إنشاء حساب المدير</button>
            </form>
        </div>
        
        <div class="section">
            <h2>إعادة تعيين كلمة مرور مستخدم</h2>
            <form action="fix_sessions.php" method="post">
                <div class="form-group">
                    <label for="username">اسم المستخدم:</label>
                    <input type="text" id="username" name="username" required>
                </div>
                <div class="form-group">
                    <label for="new_password">كلمة المرور الجديدة:</label>
                    <input type="password" id="new_password" name="new_password" required>
                </div>
                <button type="submit" name="reset_user_password">إعادة تعيين كلمة المرور</button>
            </form>
        </div>
        
        <div class="section warning">
            <h2>إعادة تعيين جلسات المستخدمين</h2>
            <form action="fix_sessions.php" method="post">
                <p>استخدم هذا الخيار لإعادة تعيين جميع جلسات المستخدمين. ستحتاج إلى إعادة تسجيل الدخول بعد هذا الإجراء.</p>
                <button type="submit" name="reset_sessions">إعادة تعيين الجلسات</button>
            </form>
        </div>
        
        <div class="section warning">
            <h2>مسح كوكيز المتصفح</h2>
            <form action="fix_sessions.php" method="post">
                <p>استخدم هذا الخيار لمسح كوكيز المتصفح المتعلقة بهذا الموقع.</p>
                <button type="submit" name="clear_cookies">مسح الكوكيز</button>
            </form>
        </div>
        
        <div class="section">
            <h2>المستخدمون في النظام</h2>
            <?php if (count($users) > 0): ?>
                <table>
                    <tr>
                        <th>الرقم</th>
                        <th>اسم المستخدم</th>
                        <th>الاسم</th>
                        <th>البريد الإلكتروني</th>
                        <th>تاريخ التسجيل</th>
                        <th>مدير</th>
                    </tr>
                    <?php foreach ($users as $user): ?>
                        <tr>
                            <td><?php echo htmlspecialchars($user['id']); ?></td>
                            <td><?php echo htmlspecialchars($user['username']); ?></td>
                            <td><?php echo htmlspecialchars($user['name']); ?></td>
                            <td><?php echo htmlspecialchars($user['email']); ?></td>
                            <td><?php echo htmlspecialchars($user['created_at']); ?></td>
                            <td><?php echo $user['is_admin'] ? "نعم" : "لا"; ?></td>
                        </tr>
                    <?php endforeach; ?>
                </table>
            <?php else: ?>
                <p>لا يوجد مستخدمين في النظام.</p>
            <?php endif; ?>
        </div>
        
        <div style="margin-top: 20px; text-align: center;">
            <a href="test.php" style="color: #4CAF50; text-decoration: none;">عودة إلى صفحة الاختبار</a> | 
            <a href="login_test.php" style="color: #4CAF50; text-decoration: none;">اختبار تسجيل الدخول</a> | 
            <a href="index.html" style="color: #4CAF50; text-decoration: none;">عودة إلى الصفحة الرئيسية</a>
        </div>
    </div>
</body>
</html> 