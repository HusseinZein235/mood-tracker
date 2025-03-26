<?php
// Script to update index.html with our enhancements

// Read the current index.html file
$indexContent = file_get_contents('index.html');

// Add CSS link in head section
$cssLink = '<link rel="stylesheet" href="css/enhanced-style.css">';
$indexContent = str_replace('</head>', "    $cssLink\n</head>", $indexContent);

// Add link to navbar_updates.js at the end of the body
$scriptTag = '<script src="navbar_updates.js"></script>';
$indexContent = str_replace('</body>', "    $scriptTag\n</body>", $indexContent);

// Add a link to user statistics in the home section
$statsLink = '<div class="text-center mt-4 mb-8">
                <a href="user_statistics.php" class="bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-2 px-6 rounded-lg inline-flex items-center">
                    <i class="fas fa-chart-pie mr-2"></i>
                    عرض إحصائيات المشاعر
                </a>
            </div>';
            
$homeHeadingPattern = '<h2 class="text-3xl font-bold text-blue-600 mb-8 text-center">مرحبًا بك، <span id="user-name-display"></span></h2>';
$homeHeadingReplacement = '<h2 class="text-3xl font-bold text-blue-600 mb-4 text-center">مرحبًا بك، <span id="user-name-display"></span></h2>';
$indexContent = str_replace($homeHeadingPattern, $homeHeadingReplacement . "\n            " . $statsLink, $indexContent);

// Add back buttons to the tracking sections
$backButtonHTML = '<button onclick="goToSection(\'home-section\')" class="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow transition">
                    <i class="fas fa-arrow-right ml-2"></i>العودة
                </button>';

// Add back button to the mood section
$moodSectionPattern = '<div id="mood-section" class="min-h-screen hidden flex flex-col items-center justify-center section-fade">';
$moodSectionReplacement = '<div id="mood-section" class="min-h-screen hidden flex flex-col items-center justify-center section-fade relative">';
$indexContent = str_replace($moodSectionPattern, $moodSectionReplacement, $indexContent);

$moodHeadingPattern = '<div class="text-center mb-6">';
$indexContent = str_replace('<div id="mood-section" class="min-h-screen hidden flex flex-col items-center justify-center section-fade relative">
        <div class="bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
            ' . $moodHeadingPattern, 
            '<div id="mood-section" class="min-h-screen hidden flex flex-col items-center justify-center section-fade relative">
        ' . $backButtonHTML . '
        <div class="bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
            ' . $moodHeadingPattern, $indexContent);

// Save the modified content back to index.html
file_put_contents('index.html', $indexContent);

echo "Updated index.html with enhanced styling, navigation, and features.<br>";
echo "Changes include:<br>";
echo "- Added personalized messages in tracking sections<br>";
echo "- Added improved navigation with dropdown menus<br>";
echo "- Added back buttons to tracking sections<br>";
echo "- Added statistics views for users and admins<br>";
echo "- All content is kept in Arabic<br>";
echo "<br>All updates complete.<br>";
echo "<a href='index.html'>Go to your application</a>";
?>
