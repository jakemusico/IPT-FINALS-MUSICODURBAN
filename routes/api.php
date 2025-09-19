<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ContactController;

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


// PROFILES: GET, POST, PUT, PATCH (aka "push"), DELETE
Route::get('profiles', [ProfileController::class, 'index']);
Route::get('profiles/{profile}', [ProfileController::class, 'show']);
Route::post('profiles', [ProfileController::class, 'store']);
Route::put('profiles/{profile}', [ProfileController::class, 'update']);
Route::patch('profiles/{profile}', [ProfileController::class, 'update']);
Route::delete('profiles/{profile}', [ProfileController::class, 'destroy']);

// CONTACTS: GET, POST, PUT, PATCH, DELETE
Route::get('contacts', [ContactController::class, 'index']);
Route::get('contacts/{contact}', [ContactController::class, 'show']);
Route::post('contacts', [ContactController::class, 'store']);
Route::put('contacts/{contact}', [ContactController::class, 'update']);
Route::patch('contacts/{contact}', [ContactController::class, 'update']);
Route::delete('contacts/{contact}', [ContactController::class, 'destroy']);

