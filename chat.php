<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['user_id']) || !isset($data['message'])) {
        http_response_code(400);
        echo json_encode(['error' => true, 'message' => 'البيانات غير مكتملة']);
        exit;
    }
    
    $userId = $data['user_id'];
    $message = $data['message'];
    
    try {
        // Get user's mood history
        $stmt = $pdo->prepare("
            SELECT 
                primary_mood,
                specific_mood,
                reason
            FROM moods 
            WHERE user_id = ? 
            ORDER BY created_at DESC
            LIMIT 5
        ");
        $stmt->execute([$userId]);
        $moods = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Generate a response based on user's message and mood history
        $response = generateResponse($message, $moods);
        
        // Save chat message and response
        $stmt = $pdo->prepare("INSERT INTO chat_history (user_id, message, response) VALUES (?, ?, ?)");
        $stmt->execute([$userId, $message, $response]);
        
        echo json_encode(['success' => true, 'response' => $response]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => true, 'message' => 'خطأ في معالجة الرسالة: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => true, 'message' => 'طريقة الطلب غير مسموح بها']);
}

// Function to generate a response based on user message and mood history
function generateResponse($message, $moods) {
    // Simple rule-based responses with consideration of mood history
    
    // Check most common mood
    $moodCount = ['سعيد' => 0, 'طبيعي' => 0, 'حزين' => 0];
    $reasonCount = ['المدرسة/الجامعة' => 0, 'العائلة' => 0, 'الأصدقاء' => 0, 'الصحة' => 0];
    
    foreach ($moods as $mood) {
        if (isset($moodCount[$mood['primary_mood']])) {
            $moodCount[$mood['primary_mood']]++;
        }
        
        if (isset($reasonCount[$mood['reason']])) {
            $reasonCount[$mood['reason']]++;
        }
    }
    
    // Find most common mood and reason
    $mostCommonMood = array_search(max($moodCount), $moodCount);
    $mostCommonReason = array_search(max($reasonCount), $reasonCount);
    
    // Basic responses based on message content
    if (strpos($message, 'سعيد') !== false || strpos($message, 'سعادة') !== false || strpos($message, 'فرح') !== false) {
        return 'أنا سعيد لسماع ذلك! الشعور بالسعادة يعزز صحتك العامة. حاول الاستمتاع بهذه اللحظات والتركيز على ما يجلب لك السعادة.';
    } 
    
    if (strpos($message, 'حزين') !== false || strpos($message, 'حزن') !== false || strpos($message, 'اكتئاب') !== false) {
        if ($mostCommonMood == 'حزين') {
            return 'لاحظت أنك شعرت بالحزن مؤخرًا. تذكر أن المشاعر مؤقتة وستتحسن. هل تريد التحدث عن ' . $mostCommonReason . ' وكيف يؤثر على حالتك النفسية؟';
        } else {
            return 'أنا آسف لسماع ذلك. الحزن هو جزء طبيعي من الحياة. هل يمكنني مساعدتك في التحدث عن مشاعرك أو اقتراح بعض الأنشطة التي قد تساعدك؟';
        }
    } 
    
    if (strpos($message, 'قلق') !== false || strpos($message, 'توتر') !== false || strpos($message, 'خوف') !== false) {
        return 'القلق شعور شائع، لكن يمكن التغلب عليه. جرب تمارين التنفس العميق، أو التأمل لبضع دقائق. هل تريد أن أوجهك لتمرين التنفس؟';
    } 
    
    if (strpos($message, 'نوم') !== false || strpos($message, 'أرق') !== false || strpos($message, 'تعب') !== false) {
        return 'النوم الجيد أساسي للصحة النفسية. حاول الحفاظ على روتين منتظم للنوم، وتجنب الشاشات قبل النوم بساعة، واجعل غرفتك مريحة وهادئة.';
    } 
    
    if (strpos($message, 'شكرا') !== false || strpos($message, 'ممتن') !== false) {
        return 'العفو! أنا هنا للمساعدة. لا تتردد في التواصل معي في أي وقت تحتاج فيه إلى دعم أو نصيحة.';
    }
    
    if (strpos($message, 'المدرسة') !== false || strpos($message, 'الجامعة') !== false || strpos($message, 'الدراسة') !== false) {
        return 'الضغط الدراسي أمر شائع. حاول تقسيم دراستك إلى فترات قصيرة مع استراحات قصيرة، واستخدم تقنية البومودورو (25 دقيقة دراسة، 5 دقائق راحة). هذا سيساعدك على التركيز وتقليل التوتر.';
    }
    
    if (strpos($message, 'العائلة') !== false || strpos($message, 'الأهل') !== false) {
        return 'العلاقات العائلية مهمة جدًا لصحتنا النفسية. خصص وقتًا للتواصل مع عائلتك، واستمع إليهم بانفتاح، وعبر عن مشاعرك بصدق وهدوء.';
    }
    
    if (strpos($message, 'الأصدقاء') !== false || strpos($message, 'صديق') !== false) {
        return 'الصداقات الجيدة يمكن أن تدعم صحتك النفسية. ابحث عن أصدقاء إيجابيين يدعمونك ويقدرونك، وقم بتقوية هذه العلاقات من خلال الاهتمام المتبادل والتواصل المستمر.';
    }
    
    // Default response based on mood history
    if ($mostCommonMood == 'سعيد') {
        return 'يبدو أن مزاجك جيد بشكل عام! هذا رائع. هل هناك شيء محدد تود التحدث عنه اليوم؟';
    } else if ($mostCommonMood == 'حزين') {
        return 'لاحظت أنك قد تكون متوترًا أو حزينًا في الفترة الأخيرة. تذكر أنك لست وحدك، وأنا هنا للاستماع والمساعدة. هل تريد مشاركة ما يدور في ذهنك؟';
    } else {
        return 'شكرًا لمشاركة مشاعرك معي. أنا هنا لدعمك. هل هناك شيء محدد تود التحدث عنه أو الحصول على مساعدة فيه؟';
    }
}
?> 