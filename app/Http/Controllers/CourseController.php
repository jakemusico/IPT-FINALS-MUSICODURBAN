<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index()
    {
        $data = Course::orderBy('name')->get();
        return response()->json(['success' => true, 'message' => 'Courses retrieved.', 'data' => $data], 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'sometimes|nullable|string|max:50',
            'description' => 'sometimes|nullable|string',
            'duration' => 'sometimes|nullable|string|max:100',
            'department_id' => 'sometimes|nullable|exists:departments,id',
            'archived' => 'sometimes|boolean',
        ]);

        $course = Course::create($validated);
        return response()->json(['success' => true, 'message' => 'Course created.', 'data' => $course], 201);
    }

    public function show(Course $course)
    {
        return response()->json(['success' => true, 'message' => 'Course retrieved.', 'data' => $course], 200);
    }

    public function update(Request $request, Course $course)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => 'sometimes|nullable|string|max:50',
            'description' => 'sometimes|nullable|string',
            'duration' => 'sometimes|nullable|string|max:100',
            'department_id' => 'sometimes|nullable|exists:departments,id',
            'archived' => 'sometimes|boolean',
        ]);

        $course->update($validated);
        return response()->json(['success' => true, 'message' => 'Course updated.', 'data' => $course->fresh()], 200);
    }

    public function destroy(Course $course)
    {
        $course->delete();
        return response()->json(['success' => true, 'message' => 'Course deleted.', 'data' => null], 200);
    }
}
