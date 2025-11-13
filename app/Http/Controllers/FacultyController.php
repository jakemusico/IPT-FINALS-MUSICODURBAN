<?php

namespace App\Http\Controllers;

use App\Models\Faculty;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class FacultyController extends Controller
{
    public function index()
    {
        $data = Faculty::orderByDesc('created_at')->get();
        return response()->json([ 'success' => true, 'message' => 'Faculty retrieved successfully.', 'data' => $data ], 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_number' => 'nullable|string|max:20|unique:faculty,id_number',
            'fname' => 'required|string|max:255',
            'lname' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:faculty,email',
            'contact' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'position' => 'nullable|string|max:255',
            'gender' => 'nullable|string|max:50',
            'birthday' => 'nullable|date',
            'address' => 'nullable|string',
            'employment_type' => 'nullable|string|max:100',
            'education' => 'nullable|string',
            // allow either a URL in `photo` or an uploaded file in `photo_file`
            'photo' => 'nullable|string|max:1000',
            'photo_file' => 'nullable|file|image|mimes:jpeg,png,jpg|max:2048',
            'date_hired' => 'nullable|date',
        ]);

        // Debug: log whether a file was received (temporary)
        try { Log::info('FacultyController@store incoming', ['hasFile' => $request->hasFile('photo_file'), 'files' => array_keys($request->files->all()), 'input' => array_filter($request->all()) ]); } catch (
        \Exception $e) { /* ignore logging failures */ }

        // handle uploaded file if present
        if ($request->hasFile('photo_file')) {
            $path = $request->file('photo_file')->store('faculty_photos', 'public');
            // store a publicly accessible url (requires `php artisan storage:link` in deployment)
            $validated['photo'] = Storage::url($path);
            try { Log::info('FacultyController@store saved file', ['path' => $path, 'url' => $validated['photo']]); } catch (\Exception $e) { }
        }

        // auto-generate id_number if not provided: format YYYY-### (incrementing per year)
        if (empty($validated['id_number'])) {
            $year = date('Y');
            // find last id_number for this year (highest sequence)
            $last = Faculty::where('id_number', 'like', "$year-%")->orderByDesc('id')->first();
            $nextSeq = 1;
            if ($last && !empty($last->id_number)) {
                $parts = explode('-', $last->id_number);
                $num = intval(end($parts));
                if ($num > 0) $nextSeq = $num + 1;
            }
            $validated['id_number'] = sprintf('%s-%03d', $year, $nextSeq);
        }

        $f = Faculty::create($validated);

        return response()->json([ 'success' => true, 'message' => 'Faculty created successfully.', 'data' => $f ], 201);
    }

    public function show(Faculty $faculty)
    {
        return response()->json([ 'success' => true, 'message' => 'Faculty retrieved successfully.', 'data' => $faculty ], 200);
    }

    public function update(Request $request, Faculty $faculty)
    {
        $validated = $request->validate([
            'fname' => 'sometimes|required|string|max:255',
            'lname' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255|unique:faculty,email,' . $faculty->id,
            'contact' => 'sometimes|nullable|string|max:255',
            'department' => 'sometimes|nullable|string|max:255',
            'position' => 'sometimes|nullable|string|max:255',
            'gender' => 'sometimes|nullable|string|max:50',
            'birthday' => 'sometimes|nullable|date',
            'address' => 'sometimes|nullable|string',
            'employment_type' => 'sometimes|nullable|string|max:100',
            'education' => 'sometimes|nullable|string',
            // accept a URL or an uploaded file
            'photo' => 'sometimes|nullable|string|max:1000',
            'photo_file' => 'sometimes|nullable|file|image|mimes:jpeg,png,jpg|max:2048',
            'date_hired' => 'sometimes|nullable|date',
            // allow archiving via boolean field
            'archived' => 'sometimes|boolean',
            // allow the frontend to request removal of the stored photo
            'remove_photo' => 'sometimes|boolean',
        ]);
            // Debug: log incoming update request and files (temporary)
            try { Log::info('FacultyController@update incoming', ['id' => $faculty->id, 'hasFile' => $request->hasFile('photo_file'), 'files' => array_keys($request->files->all()), 'input' => array_filter($request->all()) ]); } catch (\Exception $e) { }

            // handle uploaded file if present
            if ($request->hasFile('photo_file')) {
                // if there's an existing stored photo, attempt to delete it
                if ($faculty->photo) {
                    $currentUrl = $faculty->photo;
                    $currentPath = parse_url($currentUrl, PHP_URL_PATH);
                    if ($currentPath && strpos($currentPath, '/storage/') === 0) {
                        $rel = substr($currentPath, strlen('/storage/'));
                        Storage::disk('public')->delete($rel);
                    }
                }
                $path = $request->file('photo_file')->store('faculty_photos', 'public');
                $validated['photo'] = Storage::url($path);
                try { Log::info('FacultyController@update saved file', ['id' => $faculty->id, 'path' => $path, 'url' => $validated['photo']]); } catch (\Exception $e) { }
            } else {
                // if the frontend explicitly requested removal of the photo, delete stored file and set photo to null
                if ($request->boolean('remove_photo')) {
                    if ($faculty->photo) {
                        $currentUrl = $faculty->photo;
                        $currentPath = parse_url($currentUrl, PHP_URL_PATH);
                        if ($currentPath && strpos($currentPath, '/storage/') === 0) {
                            $rel = substr($currentPath, strlen('/storage/'));
                            Storage::disk('public')->delete($rel);
                        }
                    }
                    $validated['photo'] = null;
                }
            }

            $faculty->update($validated);
        return response()->json([ 'success' => true, 'message' => 'Faculty updated successfully.', 'data' => $faculty->fresh() ], 200);
    }

    public function destroy(Faculty $faculty)
    {
        $faculty->delete();
        return response()->json([ 'success' => true, 'message' => 'Faculty deleted successfully.', 'data' => null ], 200);
    }
}
