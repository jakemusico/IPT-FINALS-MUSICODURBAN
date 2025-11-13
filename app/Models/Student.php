<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    // By convention this model maps to `students` table
    protected $fillable = [
        'fname', 'lname', 'middle_name', 'age', 'gender', 'birthday', 'address', 'email', 'contact',
        'student_id', 'id_number', 'course', 'department', 'year', 'section', 'school_year', 'gpa', 'status', 'join_date',
        // parent/guardian fields
        'parent_name', 'parent_relationship', 'parent_contact', 'parent_address',
        // fields added to match Faculty features
        'photo', 'archived'
    ];
}
