<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddStudentExtraFields extends Migration
{
    /**
     * Run the migrations.
     * Adds optional fields used by the UI: student_id, course, department, year, gpa, status, join_date
     * Only runs if `students` table exists and the columns are not already present.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('students')) {
            return;
        }

        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'student_id')) $table->string('student_id')->nullable();
            if (!Schema::hasColumn('students', 'course')) $table->string('course')->nullable();
            if (!Schema::hasColumn('students', 'department')) $table->string('department')->nullable();
            if (!Schema::hasColumn('students', 'year')) $table->string('year')->nullable();
            if (!Schema::hasColumn('students', 'gpa')) $table->decimal('gpa', 3, 2)->nullable();
            if (!Schema::hasColumn('students', 'status')) $table->string('status')->nullable();
            if (!Schema::hasColumn('students', 'join_date')) $table->date('join_date')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     * Drop the columns if they exist.
     *
     * @return void
     */
    public function down()
    {
        if (!Schema::hasTable('students')) {
            return;
        }

        Schema::table('students', function (Blueprint $table) {
            if (Schema::hasColumn('students', 'student_id')) $table->dropColumn('student_id');
            if (Schema::hasColumn('students', 'course')) $table->dropColumn('course');
            if (Schema::hasColumn('students', 'department')) $table->dropColumn('department');
            if (Schema::hasColumn('students', 'year')) $table->dropColumn('year');
            if (Schema::hasColumn('students', 'gpa')) $table->dropColumn('gpa');
            if (Schema::hasColumn('students', 'status')) $table->dropColumn('status');
            if (Schema::hasColumn('students', 'join_date')) $table->dropColumn('join_date');
        });
    }
}
