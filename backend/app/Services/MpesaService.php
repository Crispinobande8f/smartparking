<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MpesaService
{
    protected $baseUrl;
    protected $consumerKey;
    protected $consumerSecret;
    protected $shortcode;
    protected $passkey;
    protected $callbackUrl;
    protected $checkoutCallbackUrl;

    public function __construct()
    {
        $this->baseUrl               = config('mpesa.base_url');
        $this->consumerKey           = config('mpesa.consumer_key');
        $this->consumerSecret        = config('mpesa.consumer_secret');
        $this->shortcode             = config('mpesa.shortcode');
        $this->passkey               = config('mpesa.passkey');
        $this->callbackUrl           = config('mpesa.callback_url');
        $this->checkoutCallbackUrl   = config('mpesa.checkout_callback_url');
    }

    private function getAccessToken(): string
    {
        $response = Http::withBasicAuth($this->consumerKey, $this->consumerSecret)
            ->withoutVerifying()   // ← sandbox SSL fix
            ->get("{$this->baseUrl}/oauth/v1/generate?grant_type=client_credentials");

        Log::debug('M-Pesa auth', [
            'status' => $response->status(),
            'body'   => $response->body(),
        ]);

        if (!$response->successful()) {
            Log::error('M-Pesa token fetch failed', ['body' => $response->body()]);
            throw new \RuntimeException('Unable to authenticate with M-Pesa: ' . $response->body());
        }

        return $response->json('access_token');
    }

    private function generatePassword(string $timestamp): string
    {
        return base64_encode($this->shortcode . $this->passkey . $timestamp);
    }

    public function stkPush(string $phone, float $amount, string $accountRef, string $description = 'Parking payment'): array
    {
        $token     = $this->getAccessToken();
        $timestamp = now()->format('YmdHis');
        $password  = $this->generatePassword($timestamp);
        $phone     = $this->normalisePhone($phone);

        $response = Http::withToken($token)
            ->withoutVerifying()   // ← sandbox SSL fix
            ->post("{$this->baseUrl}/mpesa/stkpush/v1/processrequest", [
                'BusinessShortCode' => $this->shortcode,
                'Password'          => $password,
                'Timestamp'         => $timestamp,
                'TransactionType'   => 'CustomerPayBillOnline',
                'Amount'            => (int) ceil($amount),
                'PartyA'            => $phone,
                'PartyB'            => $this->shortcode,
                'PhoneNumber'       => $phone,
                'CallBackURL'       => $this->callbackUrl,
                'AccountReference'  => $accountRef,
                'TransactionDesc'   => 'Parking Advance Payment',
            ]);

        Log::info('M-Pesa STK Push', [
            'reference' => $accountRef,
            'phone'     => $phone,
            'amount'    => (int) ceil($amount),
            'status'    => $response->status(),
            'response'  => $response->json(),
        ]);

        if ($response->failed()) {
            throw new \RuntimeException('STK push failed: ' . $response->body());
        }

        return $response->json();
    }

    private function normalisePhone(string $phone): string
    {
        if (str_starts_with($phone, '07')) {
            return '254' . substr($phone, 1);
        }
        return $phone;
    }
}
