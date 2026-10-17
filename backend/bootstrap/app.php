<?php

use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\ResolveClientAccess;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function (): void {
            Route::middleware('web')
                ->prefix('api')
                ->group(base_path('routes/api.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectGuestsTo(null);
        $middleware->encryptCookies(except: ['nexio_client_session']);
        $middleware->append(SecurityHeaders::class);
        $middleware->alias([
            'admin' => EnsureAdmin::class,
            'client.access' => ResolveClientAccess::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
        $exceptions->render(function (ValidationException $exception, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json(['error' => ['code' => 'VALIDATION_FAILED', 'message' => 'The provided data is invalid.', 'fields' => $exception->errors(), 'request_id' => $request->attributes->get('request_id')]], 422);
        });
        $exceptions->render(function (AuthenticationException $exception, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            return response()->json(['error' => ['code' => 'UNAUTHENTICATED', 'message' => 'Authentication is required.', 'fields' => (object) [], 'request_id' => $request->attributes->get('request_id')]], 401);
        });
        $exceptions->render(function (HttpExceptionInterface $exception, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            $status = $exception->getStatusCode();
            $message = $exception->getMessage() ?: match ($status) {
                403 => 'This action is forbidden.', 404 => 'The requested resource was not found.', 429 => 'Too many requests.', default => 'The request could not be completed.'
            };

            return response()->json(['error' => ['code' => match ($status) {
                403 => 'FORBIDDEN', 404 => 'NOT_FOUND', 429 => 'TOO_MANY_REQUESTS', default => 'HTTP_ERROR'
            }, 'message' => $message, 'fields' => (object) [], 'request_id' => $request->attributes->get('request_id')]], $status);
        });
    })->create();
