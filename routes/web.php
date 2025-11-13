<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

// Serve the React app entrypoint
Route::get('/', function () {
    return view('welcome');
});

// Dashboard JSON endpoint (convenience)
Route::get('/dashboard', [App\Http\Controllers\DashboardController::class, 'index']);

// Fallback for all non-API routes so React Router can handle them
Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '^(?!api).+');