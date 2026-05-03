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
        $this->baseUrl  = config('mpesa.base_url');
        $this->consumerKey   = config('mpesa.consumer_key');
        $this->consumerSecret= config('mpesa.consumer_secret');
        $this->shortcode = config('mpesa.shortcode');
        $this->passkey = config('mpesa.passkey');
        $this->callbackUrl = config('mpesa.callback_url');
        $this->checkoutCallbackUrl=config('mpesa.checkout_callback_url');
    }

    // Step 1 — Get access token
    private function getAccessToken(): string
    {
        $response = Http::withBasicAuth($this->consumerKey, $this->consumerSecret)
            ->get("{$this->baseUrl}/oauth/v1/generate?grant_type=client_credentials");

        if (!$response -> successful()){
            Log::error('M-Pesa token fetch failed', $response.json() ?? []);
            throw new \RuntimeException('Unable to authenticate with M-Pesa.');
        }

        return $response->json('access_token');
    }

    //Step 2 — Generate password
    private function generatePassword(string $timestamp ): string
    {
        return base64_encode($this->shortcode . $this->passkey . $timestamp);
    }

    // Step 3 — Initiate STK push
    public function stkPush(string $phone, float $amount, string $accountRef, string $description = 'Parking payment'): array
    {
        $token     = $this->getAccessToken();
        $timestamp = now()->format('YmdHis');
        $password  = $this->generatePassword($timestamp);
        $phone = $this->normalisePhone($phone);

        $response = Http::withToken($token)
            ->post("{$this->baseUrl}/mpesa/stkpush/v1/processrequest", [
                'BusinessShortCode' => $this->shortcode,
                'Password'  => $password,
                'Timestamp' => $timestamp,
                'TransactionType'   => 'CustomerPayBillOnline',
                'Amount' => (int) ceil ($amount),
                'PartyA'  => $phone,
                'PartyB'  => $this->shortcode,
                'PhoneNumber'  => $phone,
                'CallBackURL' => $this->callbackUrl,
                'AccountReference' => $accountRef,
                'TransactionDesc' => 'Parking Advance Payment',
            ]);

        return $response->json();
    }

    private function normalisePhone(string $phone):string
    {
        if(str_starts_with($phone, '07')){
            return '245'.substr($phone, 1);
        }
        return $phone;
    }
}
