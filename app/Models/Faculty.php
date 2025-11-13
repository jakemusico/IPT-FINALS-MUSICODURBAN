<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Faculty extends Model
{
    use HasFactory;

    protected $table = 'faculty';

    protected $fillable = [
        'id_number', 'fname', 'lname', 'email', 'contact', 'department', 'position', 'archived',
        'gender', 'birthday', 'address', 'employment_type', 'education', 'photo', 'date_hired'
    ];
}
