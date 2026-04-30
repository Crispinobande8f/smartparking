<?php

namespace App\Http\Controllers\Authentication;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class UserController extends Controller
{
    //Get paginated user list
    public function index(Request $request)
    {
        $users = User::query()
            ->when($request->role, function ($q, $role) {
                return $q->where('role', $role);
            })
            ->when($request->search, function ($q, $s) {
                return $q->where('name', 'like', "%$s%")
                        ->orWhere('email', 'like', "%$s%");
            })
            ->orderBy('created_at', 'desc')
            ->paginate(20);

            return response()->json($users);
    }

    public function update(Request $request, User $user)
    {
        $validate = $request->validate([
            'role' => 'sometimes|in:driver,attendant,admin,county_official',
            'is_active' => 'sometimes|boolean',
        ]);
        $user -> update($validate);
        return response()->json([
            'message' => 'User updated',
            'user' => $user
        ]);
    }

    public function destroy(User $user)
    {
        $user->update(['is_active'=>false]);
        return response()->json([
            'message'=>'User deactivated',
        ]);
    }
}
