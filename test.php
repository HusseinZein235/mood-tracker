<?php
header('Content-Type: text/html; charset=utf-8');
include 'config.php';

echo "<h2 style='direction: rtl;'>اختبار النظام</h2>";

// Check database connection
echo "<h3 style='direction: rtl;'>اختبار الاتصال بقاعدة البيانات</h3>";
if ($pdo instanceof PDO) {
    echo "<p style='color: green; direction: rtl;'>✓ تم الاتصال بقاعدة البيانات بنجاح</p>";
} else {
    echo "<p style='color: red; direction: rtl;'>✗ فشل الاتصال بقاعدة البيانات</p>";
    exit;
}

// Check if the users table exists
echo "<h3 style='direction: rtl;'>اختبار جدول المستخدمين</h3>";
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    $tableExists = $stmt->fetchColumn();
    if ($tableExists) {
        echo "<p style='color: green; direction: rtl;'>✓ جدول المستخدمين موجود</p>";
    } else {
        echo "<p style='color: red; direction: rtl;'>✗ جدول المستخدمين غير موجود</p>";
    }
} catch (PDOException $e) {
    echo "<p style='color: red; direction: rtl;'>✗ خطأ في التحقق من جدول المستخدمين: " . $e->getMessage() . "</p>";
}

// Check if the mood_records table exists
echo "<h3 style='direction: rtl;'>اختبار جدول سجلات المزاج</h3>";
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'mood_records'");
    $tableExists = $stmt->fetchColumn();
    if ($tableExists) {
        echo "<p style='color: green; direction: rtl;'>✓ جدول سجلات المزاج موجود</p>";
        
        // Check table structure
        $stmt = $pdo->query("DESCRIBE mood_records");
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $requiredColumns = ['id', 'user_id', 'primary_mood', 'specific_mood', 'reason', 'activity', 'created_at'];
        $missingColumns = array_diff($requiredColumns, $columns);
        
        if (empty($missingColumns)) {
            echo "<p style='color: green; direction: rtl;'>✓ بنية جدول سجلات المزاج صحيحة</p>";
        } else {
            echo "<p style='color: red; direction: rtl;'>✗ بنية جدول سجلات المزاج غير صحيحة. الأعمدة المفقودة: " . implode(', ', $missingColumns) . "</p>";
        }
    } else {
        echo "<p style='color: red; direction: rtl;'>✗ جدول سجلات المزاج غير موجود</p>";
    }
} catch (PDOException $e) {
    echo "<p style='color: red; direction: rtl;'>✗ خطأ في التحقق من جدول سجلات المزاج: " . $e->getMessage() . "</p>";
}

// Check if admin user exists
echo "<h3 style='direction: rtl;'>اختبار حساب المدير</h3>";
try {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = 'admin'");
    $stmt->execute();
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($admin) {
        echo "<p style='color: green; direction: rtl;'>✓ حساب المدير موجود</p>";
        
        // Test admin login with password "12345678"
        $testPassword = "12345678";
        if (password_verify($testPassword, $admin['password'])) {
            echo "<p style='color: green; direction: rtl;'>✓ كلمة مرور المدير صحيحة</p>";
        } else {
            echo "<p style='color: red; direction: rtl;'>✗ كلمة مرور المدير غير صحيحة</p>";
            echo "<p style='direction: rtl;'>إعادة تعيين كلمة مرور المدير...</p>";
            
            // Update admin password
            $hashedPassword = password_hash($testPassword, PASSWORD_DEFAULT);
            $updateStmt = $pdo->prepare("UPDATE users SET password = ? WHERE username = 'admin'");
            $updateStmt->execute([$hashedPassword]);
            
            echo "<p style='color: green; direction: rtl;'>✓ تم إعادة تعيين كلمة مرور المدير إلى '12345678'</p>";
        }
    } else {
        echo "<p style='color: red; direction: rtl;'>✗ حساب المدير غير موجود</p>";
        echo "<p style='direction: rtl;'>إنشاء حساب المدير...</p>";
        
        // Create admin user
        $username = 'admin';
        $name = 'المدير';
        $password = password_hash('12345678', PASSWORD_DEFAULT);
        $email = 'admin@example.com';
        
        $insertStmt = $pdo->prepare("INSERT INTO users (username, name, password, email, is_admin) VALUES (?, ?, ?, ?, TRUE)");
        $insertStmt->execute([$username, $name, $password, $email]);
        
        echo "<p style='color: green; direction: rtl;'>✓ تم إنشاء حساب المدير بنجاح</p>";
    }
} catch (PDOException $e) {
    echo "<p style='color: red; direction: rtl;'>✗ خطأ في التحقق من حساب المدير: " . $e->getMessage() . "</p>";
}

// Display all users in the system
echo "<h3 style='direction: rtl;'>المستخدمون في النظام</h3>";
try {
    $stmt = $pdo->query("SELECT id, username, name, email, created_at, is_admin FROM users ORDER BY id");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($users) > 0) {
        echo "<table style='width: 100%; border-collapse: collapse; direction: rtl;'>";
        echo "<tr style='background-color: #f2f2f2;'>";
        echo "<th style='border: 1px solid #ddd; padding: 8px; text-align: right;'>الرقم</th>";
        echo "<th style='border: 1px solid #ddd; padding: 8px; text-align: right;'>اسم المستخدم</th>";
        echo "<th style='border: 1px solid #ddd; padding: 8px; text-align: right;'>الاسم</th>";
        echo "<th style='border: 1px solid #ddd; padding: 8px; text-align: right;'>البريد الإلكتروني</th>";
        echo "<th style='border: 1px solid #ddd; padding: 8px; text-align: right;'>تاريخ التسجيل</th>";
        echo "<th style='border: 1px solid #ddd; padding: 8px; text-align: right;'>مدير</th>";
        echo "</tr>";
        
        foreach ($users as $user) {
            echo "<tr>";
            echo "<td style='border: 1px solid #ddd; padding: 8px;'>" . $user['id'] . "</td>";
            echo "<td style='border: 1px solid #ddd; padding: 8px;'>" . $user['username'] . "</td>";
            echo "<td style='border: 1px solid #ddd; padding: 8px;'>" . $user['name'] . "</td>";
            echo "<td style='border: 1px solid #ddd; padding: 8px;'>" . $user['email'] . "</td>";
            echo "<td style='border: 1px solid #ddd; padding: 8px;'>" . $user['created_at'] . "</td>";
            echo "<td style='border: 1px solid #ddd; padding: 8px;'>" . ($user['is_admin'] ? "نعم" : "لا") . "</td>";
            echo "</tr>";
        }
        
        echo "</table>";
    } else {
        echo "<p style='direction: rtl;'>لا يوجد مستخدمين في النظام.</p>";
    }
} catch (PDOException $e) {
    echo "<p style='color: red; direction: rtl;'>✗ خطأ في استرجاع المستخدمين: " . $e->getMessage() . "</p>";
}

// Test user login form
echo "<h3 style='direction: rtl;'>اختبار تسجيل الدخول</h3>";
echo "<form method='post' action='test.php' style='direction: rtl; max-width: 400px; margin: 0 auto;'>";
echo "<div style='margin-bottom: 15px;'>";
echo "<label style='display: block; margin-bottom: 5px;'>اسم المستخدم:</label>";
echo "<input type='text' name='test_username' style='width: 100%; padding: 8px;'>";
echo "</div>";
echo "<div style='margin-bottom: 15px;'>";
echo "<label style='display: block; margin-bottom: 5px;'>كلمة المرور:</label>";
echo "<input type='password' name='test_password' style='width: 100%; padding: 8px;'>";
echo "</div>";
echo "<button type='submit' name='test_login' style='background-color: #4CAF50; color: white; padding: 10px 15px; border: none; cursor: pointer;'>تحقق من كلمة المرور</button>";
echo "</form>";

// Process test login
if (isset($_POST['test_login'])) {
    $test_username = isset($_POST['test_username']) ? trim($_POST['test_username']) : '';
    $test_password = isset($_POST['test_password']) ? $_POST['test_password'] : '';
    
    if (empty($test_username) || empty($test_password)) {
        echo "<p style='color: red; direction: rtl;'>يرجى إدخال اسم المستخدم وكلمة المرور</p>";
    } else {
        try {
            $stmt = $pdo->prepare("SELECT id, username, name, password, is_admin FROM users WHERE username = ?");
            $stmt->execute([$test_username]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                echo "<p style='color: red; direction: rtl;'>✗ اسم المستخدم غير موجود</p>";
            } else if (password_verify($test_password, $user['password'])) {
                echo "<p style='color: green; direction: rtl;'>✓ كلمة المرور صحيحة لـ " . htmlspecialchars($user['username']) . "</p>";
                echo "<p style='direction: rtl;'>الاسم: " . htmlspecialchars($user['name']) . "</p>";
                echo "<p style='direction: rtl;'>مدير: " . ($user['is_admin'] ? "نعم" : "لا") . "</p>";
            } else {
                echo "<p style='color: red; direction: rtl;'>✗ كلمة المرور غير صحيحة</p>";
            }
        } catch (PDOException $e) {
            echo "<p style='color: red; direction: rtl;'>✗ خطأ في التحقق من المستخدم: " . $e->getMessage() . "</p>";
        }
    }
}

// Check PHP version
echo "<h3 style='direction: rtl;'>اختبار إصدار PHP</h3>";
$phpVersion = phpversion();
echo "<p style='direction: rtl;'>إصدار PHP: " . $phpVersion . "</p>";
if (version_compare($phpVersion, '7.0.0', '>=')) {
    echo "<p style='color: green; direction: rtl;'>✓ إصدار PHP متوافق</p>";
} else {
    echo "<p style='color: red; direction: rtl;'>✗ إصدار PHP قديم. يوصى بالإصدار 7.0.0 أو أعلى</p>";
}

// Check permissions
echo "<h3 style='direction: rtl;'>اختبار صلاحيات الملفات</h3>";
$filestoCheck = ['config.php', 'auth.php', 'save_mood.php', 'admin.php', 'index.html'];
foreach ($filestoCheck as $file) {
    if (file_exists($file)) {
        echo "<p style='direction: rtl;'>" . $file . ": ";
        if (is_readable($file)) {
            echo "<span style='color: green;'>قابل للقراءة</span>";
        } else {
            echo "<span style='color: red;'>غير قابل للقراءة</span>";
        }
        
        if (is_writable($file)) {
            echo " | <span style='color: green;'>قابل للكتابة</span></p>";
        } else {
            echo " | <span style='color: red;'>غير قابل للكتابة</span></p>";
        }
    } else {
        echo "<p style='color: red; direction: rtl;'>✗ الملف " . $file . " غير موجود</p>";
    }
}

echo "<br><p style='direction: rtl;'><a href='index.html' style='background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;'>العودة إلى الصفحة الرئيسية</a></p>";
?> 