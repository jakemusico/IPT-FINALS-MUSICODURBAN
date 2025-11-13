<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AcademicYear extends Model
{
    use HasFactory;

    protected $table = 'academic_years';

    protected $fillable = [
        'year_name',
        'start_date',
        'end_date',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public static function validationRules($id = null)
    {
        $unique = 'unique:academic_years,year_name';
        if ($id) $unique .= ',' . $id;
        return [
            'year_name' => ['required', 'string', 'max:50', $unique],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'status' => ['sometimes', 'in:active,inactive,archived'],
        ];
    }
}
