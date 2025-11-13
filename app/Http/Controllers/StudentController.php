<?php

namespace App\Http\Controllers;

use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class StudentController extends Controller
{
    public function index()
    {
        // Explicitly select commonly used student columns so clients
        // always receive the parent/guardian fields in the JSON payload.
        $cols = [
            'id','id_number','student_id','fname','middle_name','lname','age','gender','birthday',
            'email','contact','address','course','department','year','section','school_year',
            'gpa','status','join_date',
            // parent / guardian fields (ensure these are included)
            'parent_name','parent_relationship','parent_contact','parent_address',
            // presentation/storage fields
            'photo','archived','created_at','updated_at'
        ];

        $students = Student::select($cols)->orderByDesc('created_at')->get();

        return response()->json([
            'success' => true,
            'message' => 'Students retrieved successfully.',
            'data' => $students,
        ], 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'fname' => 'required|string|max:255',
            'lname' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'gender' => 'nullable|string|max:50',
            'birthday' => 'nullable|date',
            'address' => 'nullable|string|max:1000',
            'age' => 'nullable|integer|min:0|max:150',
            'email' => 'required|email|max:255|unique:students,email',
            'contact' => 'nullable|string|max:255',
            'student_id' => 'nullable|string|max:100',
            // allow id_number auto-generation like Faculty
            'id_number' => 'nullable|string|max:20|unique:students,id_number',
            // allow either a URL in `photo` or an uploaded file in `photo_file`
            'photo' => 'nullable|string|max:1000',
            'photo_file' => 'nullable|file|image|mimes:jpeg,png,jpg|max:2048',
            'archived' => 'nullable|boolean',
            'course' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'section' => 'nullable|string|max:100',
            'school_year' => 'nullable|string|max:50',
            'year' => 'nullable|string|max:50',
            'gpa' => 'nullable|numeric|between:0,4.00',
            'status' => 'nullable|string|max:50',
            'join_date' => 'nullable|date',
            // parent/guardian fields (allow on create)
            'parent_name' => 'nullable|string|max:255',
            'parent_relationship' => 'nullable|string|max:255',
            'parent_contact' => 'nullable|string|max:255',
            'parent_address' => 'nullable|string|max:1000',
        ]);
        // handle uploaded file if present
        if ($request->hasFile('photo_file')) {
            $path = $request->file('photo_file')->store('student_photos', 'public');
            $validated['photo'] = Storage::url($path);
            try { Log::info('StudentController@store saved file', ['path' => $path, 'url' => $validated['photo']]); } catch (\Exception $e) { }
        }

        // auto-generate id_number if not provided: format YYYY-###
        if (empty($validated['id_number'])) {
            $year = date('Y');
            $last = Student::where('id_number', 'like', "$year-%")->orderByDesc('id')->first();
            $nextSeq = 1;
            if ($last && !empty($last->id_number)) {
                $parts = explode('-', $last->id_number);
                $num = intval(end($parts));
                if ($num > 0) $nextSeq = $num + 1;
            }
            $validated['id_number'] = sprintf('%s-%03d', $year, $nextSeq);
        }

        // auto-generate student_id if not provided: format YEAR + 5 digits (e.g. 202500001)
        if (empty($validated['student_id'])) {
            $year = date('Y');
            $lastStudent = Student::where('student_id', 'like', "$year%")
                ->orderByDesc('id')
                ->first();
            $nextSeq = 1;
            if ($lastStudent && !empty($lastStudent->student_id)) {
                // extract numeric suffix
                $suffix = substr($lastStudent->student_id, strlen($year));
                $num = intval($suffix);
                if ($num > 0) $nextSeq = $num + 1;
            }
            $validated['student_id'] = $year . str_pad($nextSeq, 5, '0', STR_PAD_LEFT);
        }

        $student = Student::create([
            'id_number' => $validated['id_number'] ?? null,
            'fname' => $validated['fname'],
            'lname' => $validated['lname'],
            'middle_name' => $validated['middle_name'] ?? null,
            'age' => $validated['age'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'birthday' => $validated['birthday'] ?? null,
            'address' => $validated['address'] ?? null,
            'email' => $validated['email'],
            'contact' => $validated['contact'] ?? null,
            'student_id' => $validated['student_id'] ?? null,
            'course' => $validated['course'] ?? null,
            'department' => $validated['department'] ?? null,
            'year' => $validated['year'] ?? null,
            'section' => $validated['section'] ?? null,
            'school_year' => $validated['school_year'] ?? null,
            'gpa' => isset($validated['gpa']) ? $validated['gpa'] : null,
            'status' => $validated['status'] ?? null,
            'join_date' => $validated['join_date'] ?? null,
            'parent_name' => $validated['parent_name'] ?? null,
            'parent_relationship' => $validated['parent_relationship'] ?? null,
            'parent_contact' => $validated['parent_contact'] ?? null,
            'parent_address' => $validated['parent_address'] ?? null,
            'photo' => $validated['photo'] ?? null,
            'archived' => $validated['archived'] ?? false,
        ]);

        try { Log::info('StudentController@store created student', ['id' => $student->id, 'fields' => array_keys($validated)]); } catch (\Exception $e) { }

        return response()->json([
            'success' => true,
            'message' => 'Student created successfully.',
            'data' => $student,
        ], 201);
    }

    public function show(Student $student)
    {
        // Re-query explicitly selecting the parent/guardian columns to
        // guarantee the GET /students/{id} JSON includes those fields.
        $cols = [
            'id','id_number','student_id','fname','middle_name','lname','age','gender','birthday',
            'email','contact','address','course','department','year','section','school_year',
            'gpa','status','join_date',
            'parent_name','parent_relationship','parent_contact','parent_address',
            'photo','archived','created_at','updated_at'
        ];

        $fresh = Student::select($cols)->where('id', $student->id)->first();

        return response()->json([
            'success' => true,
            'message' => 'Student retrieved successfully.',
            'data' => $fresh,
        ], 200);
    }

    public function update(Request $request, Student $student)
    {
        $validated = $request->validate([
            'fname' => 'sometimes|required|string|max:255',
            'lname' => 'sometimes|required|string|max:255',
            'middle_name' => 'sometimes|nullable|string|max:255',
            'age' => 'sometimes|nullable|integer|min:0|max:150',
            'gender' => 'sometimes|nullable|string|max:50',
            'birthday' => 'sometimes|nullable|date',
            'address' => 'sometimes|nullable|string|max:1000',
            'email' => 'sometimes|required|email|max:255|unique:students,email,' . $student->id,
            'contact' => 'sometimes|nullable|string|max:255',
            'student_id' => 'sometimes|nullable|string|max:100',
            'id_number' => 'sometimes|nullable|string|max:20|unique:students,id_number,' . $student->id,
            'photo' => 'sometimes|nullable|string|max:1000',
            'photo_file' => 'sometimes|nullable|file|image|mimes:jpeg,png,jpg|max:2048',
            'archived' => 'sometimes|boolean',
            'course' => 'sometimes|nullable|string|max:255',
            'department' => 'sometimes|nullable|string|max:255',
            'section' => 'sometimes|nullable|string|max:100',
            'school_year' => 'sometimes|nullable|string|max:50',
            'year' => 'sometimes|nullable|string|max:50',
            'gpa' => 'sometimes|nullable|numeric|between:0,4.00',
            'status' => 'sometimes|nullable|string|max:50',
            'join_date' => 'sometimes|nullable|date',
            'parent_name' => 'sometimes|nullable|string|max:255',
            'parent_relationship' => 'sometimes|nullable|string|max:255',
            'parent_contact' => 'sometimes|nullable|string|max:255',
            'parent_address' => 'sometimes|nullable|string|max:1000',
            'remove_photo' => 'sometimes|boolean',
        ]);

    try { Log::info('StudentController@update validated', ['id' => $student->id, 'validated_keys' => array_keys($validated)]); } catch (\Exception $e) { }

        // handle uploaded file if present
        if ($request->hasFile('photo_file')) {
            if ($student->photo) {
                $currentUrl = $student->photo;
                $currentPath = parse_url($currentUrl, PHP_URL_PATH);
                if ($currentPath && strpos($currentPath, '/storage/') === 0) {
                    $rel = substr($currentPath, strlen('/storage/'));
                    Storage::disk('public')->delete($rel);
                }
            }
            $path = $request->file('photo_file')->store('student_photos', 'public');
            $validated['photo'] = Storage::url($path);
        } else {
            if ($request->boolean('remove_photo')) {
                if ($student->photo) {
                    $currentUrl = $student->photo;
                    $currentPath = parse_url($currentUrl, PHP_URL_PATH);
                    if ($currentPath && strpos($currentPath, '/storage/') === 0) {
                        $rel = substr($currentPath, strlen('/storage/'));
                        Storage::disk('public')->delete($rel);
                    }
                }
                $validated['photo'] = null;
            }
        }

        $student->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Student updated successfully.',
            'data' => $student->fresh(),
        ], 200);
    }

    public function destroy(Student $student)
    {
        $student->delete();

        return response()->json([
            'success' => true,
            'message' => 'Student deleted successfully.',
            'data' => null,
        ], 200);
    }
}
