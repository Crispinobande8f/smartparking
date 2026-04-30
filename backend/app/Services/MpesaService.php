<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class MpesaService
{
    private string $baseUrl;
    private string $consumerKey;
    private string $consumerSecret;
    private string $shortcode;
    private string $passkey;
    private string $callbackUrl;

    public function __construct()
    {
        $this->baseUrl  = config('mpesa.base_url');
        $this->consumerKey   = config('mpesa.consumer_key');
        $this->consumerSecret= config('mpesa.consumer_secret');
        $this->shortcode = config('mpesa.shortcode');
        $this->passkey = config('mpesa.passkey');
        $this->callbackUrl = config('mpesa.callback_url');
    }

    // Step 1 — Get access token
    private function getAccessToken(): string
    {
        $response = Http::withBasicAuth($this->consumerKey, $this->consumerSecret)
            ->get("{$this->baseUrl}/oauth/v1/generate?grant_type=client_credentials");

        return $response->json('access_token');
    }

    //Step 2 — Generate password
    private function generatePassword(): string
    {
        $timestamp = now()->format('YmdHis');
        return base64_encode($this->shortcode . $this->passkey . $timestamp);
    }

    // Step 3 — Initiate STK push
    public function stkPush(string $phone, float $amount, string $reference): array
    {
        $token     = $this->getAccessToken();
        $timestamp = now()->format('YmdHis');
        $password  = $this->generatePassword();

        //Format phone: 07XXXXXXXX → 2547XXXXXXXX
        $phone = '254' . substr($phone, 1);

        $response = Http::withToken($token)
            ->post("{$this->baseUrl}/mpesa/stkpush/v1/processrequest", [
                'BusinessShortCode' => $this->shortcode,
                'Password'  => $password,
                'Timestamp' => $timestamp,
                'TransactionType'   => 'CustomerPayBillOnline',
                'Amount' => (int) $amount,
                'PartyA'  => $phone,
                'PartyB'  => $this->shortcode,
                'PhoneNumber'  => $phone,
                'CallBackURL' => $this->callbackUrl,
                'AccountReference' => $reference,
                'TransactionDesc' => 'Parking Advance Payment',
            ]);

        return $response->json();
    }
}
