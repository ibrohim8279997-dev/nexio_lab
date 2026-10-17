<?php

use App\Http\Controllers\Api\V1\Admin\AuthController;
use App\Http\Controllers\Api\V1\Admin\ContentController;
use App\Http\Controllers\Api\V1\Admin\MediaController;
use App\Http\Controllers\Api\V1\Admin\OrderController;
use App\Http\Controllers\Api\V1\Admin\ReviewController as AdminReviewController;
use App\Http\Controllers\Api\V1\Admin\ServicePlanController;
use App\Http\Controllers\Api\V1\Client\AccessController;
use App\Http\Controllers\Api\V1\PublicContentController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/site', [PublicContentController::class, 'site']);
    Route::get('/home', [PublicContentController::class, 'home']);
    Route::get('/services', [PublicContentController::class, 'services']);
    Route::get('/services/{slug}', [PublicContentController::class, 'service']);
    Route::get('/projects', [PublicContentController::class, 'projects']);
    Route::get('/projects/{slug}', [PublicContentController::class, 'project']);
    Route::get('/employees', [PublicContentController::class, 'employees']);
    Route::get('/employees/{slug}', [PublicContentController::class, 'employee'])->name('public.employees.show');
    Route::get('/reviews', [PublicContentController::class, 'reviews']);

    Route::prefix('admin')->group(function (): void {
        Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login');
        Route::post('/auth/2fa/verify', [AuthController::class, 'verify'])->middleware('throttle:login');

        Route::middleware('auth')->group(function (): void {
            Route::get('/auth/me', [AuthController::class, 'me']);
            Route::post('/auth/logout', [AuthController::class, 'logout']);

            Route::get('/orders', [OrderController::class, 'index']);
            Route::post('/orders', [OrderController::class, 'store']);
            Route::get('/orders/{order}', [OrderController::class, 'show']);
            Route::put('/orders/{order}/assignees', [OrderController::class, 'assignees']);
            Route::put('/orders/{order}/status', [OrderController::class, 'status']);
            Route::get('/orders/{order}/history', [OrderController::class, 'history']);
            Route::post('/orders/{order}/client-access', [OrderController::class, 'clientAccess'])->middleware('throttle:10,1');
            Route::delete('/orders/{order}/client-access', [OrderController::class, 'revokeClientAccess']);

            Route::middleware('admin')->group(function (): void {
                Route::get('/site-settings', [ContentController::class, 'site']);
                Route::put('/site-settings', [ContentController::class, 'updateSite']);
                Route::post('/media', [MediaController::class, 'store'])->middleware('throttle:20,1');
                Route::get('/reviews', [AdminReviewController::class, 'index']);
                Route::put('/reviews/{review}/moderate', [AdminReviewController::class, 'moderate']);
                Route::post('/services/{service}/plans', [ServicePlanController::class, 'store']);
                Route::put('/service-plans/{servicePlan}', [ServicePlanController::class, 'update']);
                Route::delete('/service-plans/{servicePlan}', [ServicePlanController::class, 'destroy']);

                Route::get('/{resource}', [ContentController::class, 'index'])->whereIn('resource', ['services', 'projects', 'employees']);
                Route::post('/{resource}', [ContentController::class, 'store'])->whereIn('resource', ['services', 'projects', 'employees']);
                Route::get('/{resource}/{record}', [ContentController::class, 'show'])->whereIn('resource', ['services', 'projects', 'employees']);
                Route::put('/{resource}/{record}', [ContentController::class, 'update'])->whereIn('resource', ['services', 'projects', 'employees']);
                Route::delete('/{resource}/{record}', [ContentController::class, 'destroy'])->whereIn('resource', ['services', 'projects', 'employees']);
            });
        });
    });

    Route::get('/client/csrf', fn () => response()->json(['data' => ['token' => csrf_token()]]));
    Route::post('/client/access/exchange', [AccessController::class, 'exchange'])->middleware('throttle:client-exchange');
    Route::middleware(['client.access', 'throttle:client-write'])->prefix('client')->group(function (): void {
        Route::get('/order', [AccessController::class, 'order']);
        Route::put('/order/brief', [AccessController::class, 'brief']);
        Route::post('/order/review', [AccessController::class, 'review']);
        Route::post('/logout', [AccessController::class, 'logout']);
    });
});
