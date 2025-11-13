<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Course;

class Department extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'code', 'description', 'archived', 'head', 'office_location', 'contact_email', 'contact_number'];

    public function courses()
    {
        return $this->hasMany(Course::class);
    }
}
