<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\TwoFactorCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate(['email' => ['required', 'email'], 'password' => ['required', 'string', 'max:255']]);

        if (! Auth::attempt($credentials, false)) {
            return response()->json(['error' => ['code' => 'INVALID_CREDENTIALS', 'message' => 'Email or password is incorrect.', 'fields' => (object) [], 'request_id' => $request->header('X-Request-Id')]], 422);
        }

        $request->session()->regenerate();
        $user = $request->user();

        if (in_array($user->role, ['owner', 'admin'], true)) {
            if ($this->canBypassTwoFactor()) {
                return response()->json(['data' => $this->userData($user)]);
            }

            if (! $user->two_factor_secret || ! $user->two_factor_confirmed_at) {
                Auth::logout();

                return response()->json(['error' => ['code' => 'TWO_FACTOR_NOT_CONFIGURED', 'message' => 'Administrator two-factor authentication is required.', 'fields' => (object) [], 'request_id' => $request->header('X-Request-Id')]], 403);
            }

            $request->session()->put('pending_2fa_user_id', $user->id);
            Auth::logout();

            return response()->json(['data' => ['two_factor_required' => true]], 202);
        }

        return response()->json(['data' => $this->userData($user)]);
    }

    public function verify(Request $request, TwoFactorCode $twoFactorCode): JsonResponse
    {
        $validated = $request->validate(['code' => ['required', 'digits:6']]);
        $user = User::query()->find($request->session()->get('pending_2fa_user_id'));

        if (! $user || ! $user->two_factor_secret || ! $twoFactorCode->verify($user->two_factor_secret, $validated['code'])) {
            return response()->json(['error' => ['code' => 'INVALID_TWO_FACTOR_CODE', 'message' => 'The two-factor code is invalid.', 'fields' => (object) [], 'request_id' => $request->header('X-Request-Id')]], 422);
        }

        Auth::login($user);
        $request->session()->forget('pending_2fa_user_id');
        $request->session()->regenerate();

        return response()->json(['data' => $this->userData($user)]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->userData($request->user())]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['data' => ['logged_out' => true]]);
    }

    private function userData(User $user): array
    {
        return ['name' => $user->name, 'email' => $user->email, 'role' => $user->role];
    }

    private function canBypassTwoFactor(): bool
    {
        return app()->environment(['local', 'testing']) && config('auth.admin_2fa_bypass') === true;
    }
}
