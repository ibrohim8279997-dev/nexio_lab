<?php

$origins = array_values(array_filter(array_map(
    static fn (string $origin): string => trim($origin),
    explode(',', (string) env('CORS_ALLOWED_ORIGINS', env('FRONTEND_URL', 'http://localhost:5173'))),
)));

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => $origins,
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Accept', 'Content-Type', 'Origin', 'X-CSRF-TOKEN', 'X-Requested-With', 'X-Request-Id'],
    'exposed_headers' => ['X-Request-Id'],
    'max_age' => 600,
    'supports_credentials' => true,
];
