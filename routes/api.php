<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\FacultyController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AcademicYearController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// allow updating current authenticated user's basic info
Route::middleware('auth:sanctum')->patch('/user', [AuthController::class, 'update']);

// simple endpoint to update authenticated user's profile (name, email, phone, location)
Route::middleware('auth:sanctum')->put('/profile', [AuthController::class, 'updateProfile']);

// Authentication for API (issue sanctum personal access token)
Route::post('login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->post('logout', [AuthController::class, 'logout']);


// PROFILES: existing (kept for compatibility)
Route::get('profiles', [ProfileController::class, 'index']);
Route::get('profiles/{profile}', [ProfileController::class, 'show']);
Route::post('profiles', [ProfileController::class, 'store']);
Route::put('profiles/{profile}', [ProfileController::class, 'update']);
Route::patch('profiles/{profile}', [ProfileController::class, 'update']);
Route::delete('profiles/{profile}', [ProfileController::class, 'destroy']);

// STUDENTS: new endpoints mapped to StudentController (preferred)
use App\Http\Controllers\StudentController;
Route::get('students', [StudentController::class, 'index']);
Route::get('students/{student}', [StudentController::class, 'show']);
Route::post('students', [StudentController::class, 'store']);
Route::put('students/{student}', [StudentController::class, 'update']);
Route::patch('students/{student}', [StudentController::class, 'update']);
Route::delete('students/{student}', [StudentController::class, 'destroy']);

// CONTACTS: GET, POST, PUT, PATCH, DELETE
Route::get('contacts', [ContactController::class, 'index']);
Route::get('contacts/{contact}', [ContactController::class, 'show']);
Route::post('contacts', [ContactController::class, 'store']);
Route::put('contacts/{contact}', [ContactController::class, 'update']);
Route::patch('contacts/{contact}', [ContactController::class, 'update']);
Route::delete('contacts/{contact}', [ContactController::class, 'destroy']);

// Faculty endpoints
Route::get('faculty', [FacultyController::class, 'index']);
Route::get('faculty/{faculty}', [FacultyController::class, 'show']);
Route::post('faculty', [FacultyController::class, 'store']);
Route::put('faculty/{faculty}', [FacultyController::class, 'update']);
Route::patch('faculty/{faculty}', [FacultyController::class, 'update']);
Route::delete('faculty/{faculty}', [FacultyController::class, 'destroy']);

// Departments
Route::get('departments', [DepartmentController::class, 'index']);
Route::get('departments/{department}', [DepartmentController::class, 'show']);
Route::post('departments', [DepartmentController::class, 'store']);
Route::put('departments/{department}', [DepartmentController::class, 'update']);
Route::patch('departments/{department}', [DepartmentController::class, 'update']);
Route::delete('departments/{department}', [DepartmentController::class, 'destroy']);

// Courses
Route::get('courses', [CourseController::class, 'index']);
Route::get('courses/{course}', [CourseController::class, 'show']);
Route::post('courses', [CourseController::class, 'store']);
Route::put('courses/{course}', [CourseController::class, 'update']);
Route::patch('courses/{course}', [CourseController::class, 'update']);
Route::delete('courses/{course}', [CourseController::class, 'destroy']);

// Consolidated dashboard endpoint
Route::get('dashboard', [DashboardController::class, 'index']);

// Generic quick-stats endpoints used by older front-end bundles: return simple counts
Route::get('{resource}/count', function ($resource) {
    $map = [
        'students' => \App\Models\Student::class,
        'faculty' => \App\Models\Faculty::class,
        'departments' => \App\Models\Department::class,
        'courses' => \App\Models\Course::class,
    ];
    if (!isset($map[$resource])) {
        return response()->json(['success' => false, 'message' => 'Not found'], 404);
    }
    try {
        $count = $map[$resource]::count();
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'message' => 'Server error'], 500);
    }
    return response()->json(['success' => true, 'count' => $count]);
});

// Academic Years
Route::get('academic-years', [AcademicYearController::class, 'index']);
Route::post('academic-years', [AcademicYearController::class, 'store']);
Route::get('academic-years/{id}', [AcademicYearController::class, 'show']);
Route::put('academic-years/{id}', [AcademicYearController::class, 'update']);
Route::patch('academic-years/{id}', [AcademicYearController::class, 'update']);
Route::delete('academic-years/{id}', [AcademicYearController::class, 'destroy']);

