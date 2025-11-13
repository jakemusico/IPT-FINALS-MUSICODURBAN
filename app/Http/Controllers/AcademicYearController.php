<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AcademicYearController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = AcademicYear::query();
            if ($request->filled('search')) {
                $q = $request->get('search');
                $query->where('year_name', 'like', "%{$q}%");
            }
            if ($request->filled('status')) {
                $query->where('status', $request->get('status'));
            }
            $years = $query->orderBy('start_date', 'desc')->get();
            return response()->json(['success' => true, 'data' => $years]);
        } catch (\Exception $e) {
            \Log::error('AcademicYearController@index: ' . $e->getMessage());
            return response()->json(['success' => true, 'data' => []]);
        }
    }

    public function store(Request $request)
    {
        $rules = AcademicYear::validationRules();
        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }
        $year = AcademicYear::create($request->only(['year_name','start_date','end_date','status']));
        return response()->json(['success' => true, 'message' => 'Academic year created', 'data' => $year], 201);
    }

    public function show($id)
    {
        $year = AcademicYear::find($id);
        if (!$year) return response()->json(['success' => false, 'message' => 'Not found'], 404);
        return response()->json(['success' => true, 'data' => $year]);
    }

    public function update(Request $request, $id)
    {
        $year = AcademicYear::find($id);
        if (!$year) return response()->json(['success' => false, 'message' => 'Not found'], 404);
        $rules = AcademicYear::validationRules($id);
        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }
        $year->fill($request->only(['year_name','start_date','end_date','status']));
        $year->save();
        return response()->json(['success' => true, 'message' => 'Academic year updated', 'data' => $year]);
    }

    public function destroy(Request $request, $id)
    {
        $year = AcademicYear::find($id);
        if (!$year) return response()->json(['success' => false, 'message' => 'Not found'], 404);

        // Support permanent deletion when ?force=1 is passed (or force in request body)
        $force = $request->query('force', $request->input('force', false));
        if ($force === '1' || $force === 1 || $force === true || $force === 'true') {
            try {
                $year->delete();
                return response()->json(['success' => true, 'message' => 'Academic year deleted', 'data' => null]);
            } catch (\Exception $e) {
                \Log::error('AcademicYearController@destroy (force): ' . $e->getMessage());
                return response()->json(['success' => false, 'message' => 'Delete failed'], 500);
            }
        }

        // Default behavior: mark as archived
        $year->status = 'archived';
        $year->save();
        return response()->json(['success' => true, 'message' => 'Academic year archived', 'data' => $year]);
    }
}
