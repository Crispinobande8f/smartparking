<?php

use App\Http\Controllers\Authentication\LoginController;
use App\Http\Controllers\Authentication\RegisterController;
use App\Http\Controllers\Authentication\UserController;
use App\Http\Controllers\Slots\SlotController;
use App\Http\Controllers\Booking\BookingController;
use App\Http\Controllers\Booking\MpesaCallbackController;
use App\Http\Controllers\Booking\PricingRuleController;
use App\Http\Controllers\Slots\SlotStatusController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


//Mpesa webhooks
Route::post('v1/mpesa/callback', [MpesaCallbackController::class, 'handle']);
Route::post('v1/mpesa/checkout-callback', [PaymentController::class,'checkoutCallback']);

//Authentication routes
Route::prefix('v1/auth')->group(function(){
    Route::post('/register',[RegisterController::class, 'register']);
    Route::post('/login', [LoginController::class, 'login']);
});

//Authenticated routes
Route:: prefix('v1') -> middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [LoginController::class, 'logout']);

    Route::get('/slots',[SlotController::class, 'index']);
    Route::get('/slots/{slot}',[SlotController::class, 'show']);

    Route::patch('/slots/{slot}/status',  [SlotStatusController::class, 'transition']);
    Route::get('/slots/{slot}/history',   [SlotStatusController::class, 'history']);

    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::get('/bookings/{booking}', [BookingController::class, 'show']);

    Route::apiResource('/pricing-rules', PricingRuleController::class)->only(['index','show']);

    //Driver
    Route::post('/sessions/checkin', [SessionController::class, 'checkin']);
    Route::get('/sessions/active',[SessionController::class, 'activeSession']);
    Route::get('/sessions/{id}/checkout-preview',[SessionController::class, 'initiateCheckout']);
    Route::post('/sessions/{id}/checkout', [SessionController::class, 'confirmCheckout']);
    Route::get('/sessions/{id}/receipt', [ReceiptController::class, 'show']);

    //Attendant
    Route::middleware('role:attendant,admin')->group(function () {
        Route::post('/attendant/checkin', [AttendantController::class, 'assistCheckin']);
    });

    //Admin
    Route::middleware('role:admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);

        Route::post('/slots', [SlotController::class, 'store']);
        Route::put('/slots/{slot}', [SlotController::class, 'update']);
        Route::delete('/slots/{slot}', [SlotController::class, 'destroy']);

        Route::post('/pricing-rules', [PricingRuleController::class, 'store']);
        Route::put('/pricing-rules/{rule}', [PricingRuleController::class, 'update']);
        Route::delete('/pricing-rules/{rule}', [PricingRuleController::class, 'destroy']);

        Route::get('/admin/occupancy', [AdminController::class, 'occupancyDashboard']);
        Route::get('/admin/revenue',   [AdminController::class, 'revenueReport']);
        Route::get('/admin/sessions',  [AdminController::class, 'sessionsMonitor']);
    });
});

