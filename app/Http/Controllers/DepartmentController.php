<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index()
    {
        $data = Department::orderBy('name')->get();
        return response()->json(['success' => true, 'message' => 'Departments retrieved.', 'data' => $data], 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'head' => 'sometimes|nullable|string|max:255',
            'description' => 'nullable|string',
            'office_location' => 'sometimes|nullable|string|max:255',
            'contact_email' => 'sometimes|nullable|email|max:255',
            'contact_number' => 'sometimes|nullable|string|max:50',
            'archived' => 'sometimes|boolean',
        ]);

        $dept = Department::create($validated);
        return response()->json(['success' => true, 'message' => 'Department created.', 'data' => $dept], 201);
    }

    public function show(Department $department)
    {
        $department->load('courses');
        return response()->json(['success' => true, 'message' => 'Department retrieved.', 'data' => $department], 200);
    }

    public function update(Request $request, Department $department)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => 'sometimes|nullable|string|max:50',
            'head' => 'sometimes|nullable|string|max:255',
            'description' => 'sometimes|nullable|string',
            'office_location' => 'sometimes|nullable|string|max:255',
            'contact_email' => 'sometimes|nullable|email|max:255',
            'contact_number' => 'sometimes|nullable|string|max:50',
            'archived' => 'sometimes|boolean',
        ]);

        $department->update($validated);
        return response()->json(['success' => true, 'message' => 'Department updated.', 'data' => $department->fresh()], 200);
    }

    public function destroy(Department $department)
    {
        $department->delete();
        return response()->json(['success' => true, 'message' => 'Department deleted.', 'data' => null], 200);
    }
}
