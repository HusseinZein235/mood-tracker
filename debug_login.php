<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Create a log file
function log_debug($message) {
    $log_file = 'login_debug.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($log_file, "[$timestamp] $message\n", FILE_APPEND);
}

// Log the request
log_debug("Request received");
log_debug("POST data: " . print_r($_POST, true));
log_debug("GET data: " . print_r($_GET, true));
log_debug("SESSION data: " . print_r($_SESSION ?? 'No session', true));
log_debug("COOKIE data: " . print_r($_COOKIE, true));

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    log_debug("Processing form submission");
    
    // Get form data
    $username = isset($_POST['username']) ? trim($_POST['username']) : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    $action = isset($_POST['action']) ? $_POST['action'] : 'login';
    
    log_debug("Username: $username");
    log_debug("Password length: " . strlen($password));
    log_debug("Action: $action");
    
    // Forward to auth.php
    $postData = http_build_query([
        'action' => $action,
        'username' => $username,
        'password' => $password
    ]);
    
    $options = [
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/x-www-form-urlencoded',
            'content' => $postData
        ]
    ];
    
    log_debug("Sending request to auth.php with data: $postData");
    
    $context = stream_context_create($options);
    $result = file_get_contents('http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . '/auth.php', false, $context);
    
    log_debug("Response from auth.php: $result");
    
    $response = json_decode($result, true);
    log_debug("Decoded response: " . print_r($response, true));
}
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تصحيح مشكلة تسجيل الدخول</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            direction: rtl;
        }
        .container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            text-align: center;
            color: #333;
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
        .result {
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
        pre {
            background-color: #f8f9fa;
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            direction: ltr;
            text-align: left;
            max-height: 200px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>تصحيح مشكلة تسجيل الدخول</h1>
        
        <form action="debug_login.php" method="post">
            <div class="form-group">
                <label for="username">اسم المستخدم:</label>
                <input type="text" id="username" name="username" required>
            </div>
            <div class="form-group">
                <label for="password">كلمة المرور:</label>
                <input type="password" id="password" name="password" required>
            </div>
            <div class="form-group">
                <label for="action">الإجراء:</label>
                <select id="action" name="action" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="login">تسجيل الدخول</option>
                    <option value="check_session">فحص الجلسة</option>
                </select>
            </div>
            <button type="submit">إرسال</button>
        </form>
        
        <?php if (isset($result)): ?>
            <div class="result <?php echo ($response && $response['status'] === 'success') ? 'success' : 'error'; ?>">
                <h3>استجابة الخادم:</h3>
                <pre><?php echo htmlspecialchars($result); ?></pre>
            </div>
        <?php endif; ?>
        
        <div style="margin-top: 20px; text-align: center;">
            <a href="test.php" style="color: #4CAF50; text-decoration: none;">عودة إلى صفحة الاختبار</a> | 
            <a href="index.html" style="color: #4CAF50; text-decoration: none;">عودة إلى الصفحة الرئيسية</a>
        </div>
        
        <div style="margin-top: 20px;">
            <h3>معلومات التصحيح:</h3>
            <p>تم إنشاء ملف login_debug.log يحتوي على تفاصيل التصحيح. يمكنك الاطلاع على هذا الملف لتحديد المشكلة.</p>
        </div>
    </div>
</body>
</html> 