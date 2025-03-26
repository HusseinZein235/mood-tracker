<?php
header('Content-Type: text/html; charset=utf-8');

// Include CSV handler instead of using database
require_once __DIR__ . '/includes/csv_handler.php';

// No need for database connection anymore
?>