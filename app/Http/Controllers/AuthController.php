<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Profile;
use App\Models\Student;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $user = User::where('email', $request->email)->first();
        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // create a personal access token
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
        ]);
    }

    public function logout(Request $request)
    {
        if ($request->user()) {
            // revoke current token
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json(['message' => 'Logged out']);
    }

    /**
     * Update the authenticated user's basic profile (name, email).
     * Accepts: name, email
     * Returns updated user JSON.
     */
    public function update(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'sometimes|nullable|string|max:255',
            'location' => 'sometimes|nullable|string|max:255',
        ]);

        // keep old email to help find matching profile/student records
        $oldEmail = $user->email;

        $user->fill(array_intersect_key($validated, array_flip(['name','email'])));
        $user->save();

        // try to update a matching Student or Profile record (match by old or new email)
        $emailToMatch = $oldEmail ?: ($validated['email'] ?? null);
        $profileRecord = null;
        if ($emailToMatch) {
            $profileRecord = Student::where('email', $emailToMatch)->orWhere('email', $user->email)->first();
            if (! $profileRecord) {
                // Profile table may not exist in this schema (project uses students table). Check before querying.
                if (Schema::hasTable('profiles')) {
                    $profileRecord = Profile::where('email', $emailToMatch)->orWhere('email', $user->email)->first();
                }
            }
        }

        if ($profileRecord) {
            // split name into fname / lname when possible
            if (isset($validated['name'])) {
                $parts = preg_split('/\s+/', trim($validated['name']));
                $fname = $parts[0] ?? '';
                $lname = count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : '';
            } else {
                $fname = $profileRecord->fname ?? '';
                $lname = $profileRecord->lname ?? '';
            }

            $update = [];
            $update['fname'] = $fname;
            $update['lname'] = $lname;
            if (isset($validated['email'])) $update['email'] = $validated['email'];
            if (isset($validated['phone'])) {
                $update['phone'] = $validated['phone'];
                $update['contact'] = $validated['phone'];
            }
            if (isset($validated['location'])) $update['location'] = $validated['location'];

            $profileRecord->update($update);
        }

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully.',
            'user' => $user->fresh(),
        ], 200);
    }

    /**
     * Update the authenticated user's basic profile (name, email, phone, location).
     * PUT /api/profile
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'sometimes|nullable|string|max:255',
            'location' => 'sometimes|nullable|string|max:255',
            // allow either a URL in `photo` or an uploaded file in `photo_file`
            'photo' => 'sometimes|nullable|string|max:1000',
            'photo_file' => 'sometimes|nullable|file|image|mimes:jpeg,png,jpg|max:4096',
            'remove_photo' => 'sometimes|boolean',
        ]);

        // handle uploaded file if present (store under profile_photos)
        try { Log::info('AuthController@updateProfile incoming', ['hasFile' => $request->hasFile('photo_file'), 'files' => array_keys($request->files->all()), 'input' => array_filter($request->all()) ]); } catch (\Exception $e) { }

        if ($request->hasFile('photo_file')) {
            $path = $request->file('photo_file')->store('profile_photos', 'public');
            $validated['photo'] = Storage::url($path);
            try { Log::info('AuthController@updateProfile saved file', ['path' => $path, 'url' => $validated['photo']]); } catch (\Exception $e) { }
        }

        // update user record
        $user->fill(array_intersect_key($validated, array_flip(['name','email','phone','location'])));
        $user->save();

        // try to update a matching Student or Profile record (match by email)
        $emailToMatch = $user->email;
        $profileRecord = Student::where('email', $emailToMatch)->orWhere('email', $emailToMatch)->first();
        if (! $profileRecord) {
            if (Schema::hasTable('profiles')) {
                $profileRecord = Profile::where('email', $emailToMatch)->orWhere('email', $emailToMatch)->first();
            }
        }

        if ($profileRecord) {
            $update = [];
            if (isset($validated['name'])) {
                $parts = preg_split('/\s+/', trim($validated['name']));
                $update['fname'] = $parts[0] ?? '';
                $update['lname'] = count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : '';
            }
            if (isset($validated['email'])) $update['email'] = $validated['email'];
            if (isset($validated['phone'])) { $update['phone'] = $validated['phone']; $update['contact'] = $validated['phone']; }
            if (isset($validated['location'])) $update['location'] = $validated['location'];

            // handle photo removal request
            if ($request->boolean('remove_photo')) {
                if ($profileRecord->photo) {
                    $currentUrl = $profileRecord->photo;
                    $currentPath = parse_url($currentUrl, PHP_URL_PATH);
                    if ($currentPath && strpos($currentPath, '/storage/') === 0) {
                        $rel = substr($currentPath, strlen('/storage/'));
                        Storage::disk('public')->delete($rel);
                    }
                }
                $update['photo'] = null;
            }

            // if a new stored photo was created above, set it
            if (isset($validated['photo'])) $update['photo'] = $validated['photo'];

            $profileRecord->update($update);
        }

        return response()->json(['success' => true, 'message' => 'Profile updated', 'user' => $user->fresh()], 200);
    }
}
