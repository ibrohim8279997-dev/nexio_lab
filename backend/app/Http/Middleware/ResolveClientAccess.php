<?php

namespace App\Http\Middleware;

use App\Models\ClientAccess;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveClientAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->cookie('nexio_client_session');
        $access = is_string($token) ? ClientAccess::query()->with('order')->where('session_hash', hash('sha256', $token))->first() : null;

        if (! $access || ! $access->consumed_at || $access->revoked_at || $access->expires_at->isPast()) {
            return response()->json(['error' => ['code' => 'CLIENT_ACCESS_INVALID', 'message' => 'Client access is missing, expired, or revoked.', 'fields' => (object) [], 'request_id' => $request->header('X-Request-Id')]], 401);
        }

        $access->forceFill(['last_used_at' => now()])->save();
        $request->attributes->set('client_access', $access);

        return $next($request);
    }
}
