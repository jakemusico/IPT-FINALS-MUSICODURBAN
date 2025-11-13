<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\Faculty;

class DashboardController extends Controller
{
    /**
     * Return consolidated dashboard data.
     *
     * Accepts being called from browser (web) or as an API endpoint.
     */
    public function index(Request $request)
    {
        // lightweight: return full arrays so the frontend can map/filter as it needs.
        // If you prefer aggregated counts only, we can change this later.
        $students = Student::all();
        $faculty = Faculty::all();

        return response()->json([
            'students' => $students,
            'faculty' => $faculty,
        ]);
    }
}
