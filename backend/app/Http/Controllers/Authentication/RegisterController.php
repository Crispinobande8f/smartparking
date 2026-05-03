<?php

namespace App\Http\Controllers\Authentication;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;


class RegisterController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request -> validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone_number' => ['required','regex:/^07\d{8}$/','unique:users,phone_number'],
            'password' => ['required','confirmed',Password::min(8)],
            'role' => 'sometimes|in:driver,attendant,admin,county_official',
        ]);
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone_number' => $validated['phone_number'],
            'password' => $validated['password'],
            'role' => $validated['role'] ?? 'driver',
            'is_active' => true,
        ]);

        $token = $user->createToken('authToken')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone_number' => $user->phone_number,
                'role' => $user->role
            ],
        ],201);
    }
}
