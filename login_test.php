<?php
session_start();
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>اختبار تسجيل الدخول</title>
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
    </style>
</head>
<body>
    <div class="container">
        <h1>اختبار تسجيل الدخول</h1>
        
        <?php if (isset($_SESSION['user_id'])): ?>
            <div class="result success">
                <p>أنت مسجل الدخول حاليًا</p>
                <p>اسم المستخدم: <?php echo htmlspecialchars($_SESSION['username']); ?></p>
                <p>الاسم: <?php echo htmlspecialchars($_SESSION['name']); ?></p>
                <p>مدير: <?php echo $_SESSION['is_admin'] ? 'نعم' : 'لا'; ?></p>
            </div>
            <form action="login_test.php" method="post" style="margin-top: 15px;">
                <input type="hidden" name="logout" value="1">
                <button type="submit">تسجيل الخروج</button>
            </form>
        <?php else: ?>
            <!-- Direct Login Form -->
            <form action="login_test.php" method="post">
                <div class="form-group">
                    <label for="username">اسم المستخدم:</label>
                    <input type="text" id="username" name="username" required>
                </div>
                <div class="form-group">
                    <label for="password">كلمة المرور:</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" name="login">تسجيل الدخول</button>
            </form>
            
            <?php if (isset($_POST['login'])): ?>
                <?php
                // Handle the direct login
                $username = isset($_POST['username']) ? trim($_POST['username']) : '';
                $password = isset($_POST['password']) ? $_POST['password'] : '';
                
                if (empty($username) || empty($password)) {
                    echo '<div class="result error">يرجى إدخال اسم المستخدم وكلمة المرور</div>';
                } else {
                    // Simulate a direct POST request to auth.php
                    $postData = http_build_query([
                        'action' => 'login',
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
                    
                    $context = stream_context_create($options);
                    $result = file_get_contents('http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . '/auth.php', false, $context);
                    
                    $response = json_decode($result, true);
                    
                    if ($response && $response['status'] === 'success') {
                        // Refresh the page to show login status
                        echo '<div class="result success">تم تسجيل الدخول بنجاح. الرجاء الانتظار...</div>';
                        echo '<script>setTimeout(function(){ window.location.reload(); }, 1500);</script>';
                    } else {
                        echo '<div class="result error">' . ($response['message'] ?? 'فشل تسجيل الدخول') . '</div>';
                    }
                }
                ?>
            <?php endif; ?>
        <?php endif; ?>
        
        <?php
        // Handle logout
        if (isset($_POST['logout'])) {
            $postData = http_build_query(['action' => 'logout']);
            $options = [
                'http' => [
                    'method' => 'POST',
                    'header' => 'Content-Type: application/x-www-form-urlencoded',
                    'content' => $postData
                ]
            ];
            $context = stream_context_create($options);
            file_get_contents('http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . '/auth.php', false, $context);
            
            // Redirect to clear the form submission
            header('Location: login_test.php');
            exit;
        }
        ?>
        
        <div style="margin-top: 20px; text-align: center;">
            <a href="test.php" style="color: #4CAF50; text-decoration: none;">عودة إلى صفحة الاختبار</a> | 
            <a href="index.html" style="color: #4CAF50; text-decoration: none;">عودة إلى الصفحة الرئيسية</a>
        </div>
    </div>
</body>
</html> 