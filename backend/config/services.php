<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Nexio CRM inbound API. Values MUST come from the agreed contract with the CRM developer.
    'nexio_crm' => [
        'url' => env('NEXIO_CRM_URL'),
        'secret' => env('NEXIO_CRM_SECRET'),
        'auth_scheme' => env('NEXIO_CRM_AUTH_SCHEME', 'bearer'), // bearer | header
        'auth_header' => env('NEXIO_CRM_AUTH_HEADER', 'X-API-Key'),
        'lead_id_key' => env('NEXIO_CRM_LEAD_ID_KEY', 'id'),
        'source' => env('NEXIO_CRM_SOURCE', 'Website / NexioLab.uz'),
        'timeout' => (int) env('NEXIO_CRM_TIMEOUT', 10),
        // Keep true. Set false ONLY as a temporary stopgap while the CRM host has a self-signed certificate.
        'verify_ssl' => (bool) env('NEXIO_CRM_VERIFY_SSL', true),
    ],

];
