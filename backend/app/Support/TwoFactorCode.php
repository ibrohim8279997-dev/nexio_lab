<?php

namespace App\Support;

class TwoFactorCode
{
    public function verify(string $secret, string $code, ?int $timestamp = null): bool
    {
        $counter = intdiv($timestamp ?? time(), 30);

        for ($offset = -1; $offset <= 1; $offset++) {
            if (hash_equals($this->code($secret, $counter + $offset), $code)) {
                return true;
            }
        }

        return false;
    }

    private function code(string $secret, int $counter): string
    {
        $binaryCounter = pack('N*', 0).pack('N*', $counter);
        $hash = hash_hmac('sha1', $binaryCounter, $this->decodeBase32($secret), true);
        $offset = ord($hash[19]) & 0x0F;
        $value = ((ord($hash[$offset]) & 0x7F) << 24)
            | ((ord($hash[$offset + 1]) & 0xFF) << 16)
            | ((ord($hash[$offset + 2]) & 0xFF) << 8)
            | (ord($hash[$offset + 3]) & 0xFF);

        return str_pad((string) ($value % 1_000_000), 6, '0', STR_PAD_LEFT);
    }

    private function decodeBase32(string $secret): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $bits = '';

        foreach (str_split(strtoupper(preg_replace('/[^A-Z2-7]/i', '', $secret) ?? '')) as $character) {
            $position = strpos($alphabet, $character);

            if ($position !== false) {
                $bits .= str_pad(decbin($position), 5, '0', STR_PAD_LEFT);
            }
        }

        $decoded = '';
        foreach (str_split($bits, 8) as $byte) {
            if (strlen($byte) === 8) {
                $decoded .= chr(bindec($byte));
            }
        }

        return $decoded;
    }
}
