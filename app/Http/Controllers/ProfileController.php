<?php

namespace App\Http\Controllers;

use App\Models\Profile;
use App\Models\Student;
use Illuminate\Support\Facades\Schema;
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
        // Prefer students table; if students table exists use Student model,
        // otherwise fall back to Profile for backward compatibility.
        if (Schema::hasTable('students')) {
            $students = Student::orderByDesc('created_at')->get();
            return response()->json([
                'success' => true,
                'message' => 'Students retrieved successfully.',
                'data' => $students,
            ], 200);
        }

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
            'contact' => 'sometimes|nullable|string|max:255',
            'phone' => 'sometimes|nullable|string|max:255',
            'location' => 'sometimes|nullable|string|max:255',
        ]);

        // prefer explicit contact field, otherwise accept phone
        $contact = $validated['contact'] ?? $validated['phone'] ?? null;

        // if this project migrated profiles -> students, prefer Student model
        if (Schema::hasTable('students')) {
            $profile = \App\Models\Student::create([
                'fname' => $validated['fname'],
                'lname' => $validated['lname'],
                'age' => $validated['age'] ?? null,
                'email' => $validated['email'],
                'contact' => $contact,
                'phone' => $validated['phone'] ?? null,
                'location' => $validated['location'] ?? null,
            ]);
        } else {
            $profile = Profile::create([
                'fname' => $validated['fname'],
                'lname' => $validated['lname'],
                'age' => $validated['age'] ?? null,
                'email' => $validated['email'],
                'contact' => $contact,
                'phone' => $validated['phone'] ?? null,
                'location' => $validated['location'] ?? null,
            ]);
        }

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
    public function show($profile)
    {
        // accept either an id or model instance; prefer students table when present
        if (Schema::hasTable('students')) {
            $rec = \App\Models\Student::find($profile);
        } else {
            $rec = Profile::find($profile);
        }
        if (! $rec) {
            return response()->json(['success' => false, 'message' => 'Not found'], 404);
        }
        return response()->json(['success' => true, 'message' => 'Profile retrieved successfully.', 'data' => $rec], 200);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Profile  $profile
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $profile)
    {
        // determine numeric id for unique validation (route may pass id string)
        $idForUnique = is_numeric($profile) ? $profile : (is_object($profile) && isset($profile->id) ? $profile->id : null);

        $validated = $request->validate([
            'fname' => 'sometimes|required|string|max:255',
            'lname' => 'sometimes|required|string|max:255',
            'age' => 'sometimes|nullable|integer|min:0|max:150',
            'email' => 'sometimes|required|email|max:255' . ($idForUnique ? '|unique:profiles,email,' . $idForUnique : ''),
            'contact' => 'sometimes|nullable|string|max:255',
            'phone' => 'sometimes|nullable|string|max:255',
            'location' => 'sometimes|nullable|string|max:255',
        ]);

        if (Schema::hasTable('students')) {
            $rec = \App\Models\Student::find($profile);
        } else {
            $rec = Profile::find($profile);
        }
        if (! $rec) return response()->json(['success' => false, 'message' => 'Not found'], 404);

        // map phone to contact if contact not provided (backwards compatibility)
        if (! isset($validated['contact']) && isset($validated['phone'])) {
            $validated['contact'] = $validated['phone'];
        }

        $rec->update(array_intersect_key($validated, array_flip(['fname','lname','age','email','contact','phone','location'])));

        return response()->json(['success' => true, 'message' => 'Profile updated successfully.', 'data' => $rec->fresh()], 200);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Profile  $profile
     * @return \Illuminate\Http\Response
     */
    public function destroy($profile)
    {
        if (Schema::hasTable('students')) {
            $rec = \App\Models\Student::find($profile);
        } else {
            $rec = Profile::find($profile);
        }
        if (! $rec) return response()->json(['success' => false, 'message' => 'Not found'], 404);
        $rec->delete();
        return response()->json(['success' => true, 'message' => 'Profile deleted successfully.', 'data' => null], 200);
    }
}
