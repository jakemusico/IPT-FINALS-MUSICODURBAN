<?php

namespace App\Http\Controllers;

use App\Models\Profile;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $profiles = Profile::orderByDesc('created_at')->get();

        return response()->json([
            'success' => true,
            'message' => 'Profiles retrieved successfully.',
            'data' => $profiles,
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'fname' => 'required|string|max:255',
            'lname' => 'required|string|max:255',
            'age' => 'nullable|integer|min:0|max:150',
            'email' => 'required|email|max:255|unique:profiles,email',
            'contact' => 'nullable|string|max:255',
        ]);

        $profile = Profile::create([
            'fname' => $validated['fname'],
            'lname' => $validated['lname'],
            'age' => $validated['age'] ?? null,
            'email' => $validated['email'],
            'contact' => $validated['contact'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Profile created successfully.',
            'data' => $profile,
        ], 201);
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\Profile  $profile
     * @return \Illuminate\Http\Response
     */
    public function show(Profile $profile)
    {
        return response()->json([
            'success' => true,
            'message' => 'Profile retrieved successfully.',
            'data' => $profile,
        ], 200);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Profile  $profile
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, Profile $profile)
    {
        $validated = $request->validate([
            'fname' => 'sometimes|required|string|max:255',
            'lname' => 'sometimes|required|string|max:255',
            'age' => 'sometimes|nullable|integer|min:0|max:150',
            'email' => 'sometimes|required|email|max:255|unique:profiles,email,' . $profile->id,
            'contact' => 'sometimes|nullable|string|max:255',
        ]);

        $profile->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data' => $profile->fresh(),
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Profile  $profile
     * @return \Illuminate\Http\Response
     */
    public function destroy(Profile $profile)
    {
        $profile->delete();

        return response()->json([
            'success' => true,
            'message' => 'Profile deleted successfully.',
            'data' => null,
        ], 200);
    }
}
