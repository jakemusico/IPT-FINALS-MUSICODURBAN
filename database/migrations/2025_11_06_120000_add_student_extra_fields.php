<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // Add columns only if they don't already exist to be safe
            if (!Schema::hasColumn('students', 'middle_name')) {
                $table->string('middle_name')->nullable()->after('lname');
            }
            if (!Schema::hasColumn('students', 'gender')) {
                $table->string('gender', 50)->nullable()->after('middle_name');
            }
            if (!Schema::hasColumn('students', 'birthday')) {
                $table->date('birthday')->nullable()->after('gender');
            }
            if (!Schema::hasColumn('students', 'address')) {
                $table->string('address', 1000)->nullable()->after('birthday');
            }
            if (!Schema::hasColumn('students', 'section')) {
                $table->string('section', 100)->nullable()->after('year');
            }
            if (!Schema::hasColumn('students', 'school_year')) {
                $table->string('school_year', 50)->nullable()->after('section');
            }
            if (!Schema::hasColumn('students', 'parent_name')) {
                $table->string('parent_name')->nullable()->after('school_year');
            }
            if (!Schema::hasColumn('students', 'parent_relationship')) {
                $table->string('parent_relationship')->nullable()->after('parent_name');
            }
            if (!Schema::hasColumn('students', 'parent_contact')) {
                $table->string('parent_contact')->nullable()->after('parent_relationship');
            }
            if (!Schema::hasColumn('students', 'parent_address')) {
                $table->string('parent_address', 1000)->nullable()->after('parent_contact');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $cols = [
                'middle_name','gender','birthday','address','section','school_year',
                'parent_name','parent_relationship','parent_contact','parent_address'
            ];
            foreach ($cols as $c) {
                if (Schema::hasColumn('students', $c)) {
                    $table->dropColumn($c);
                }
            }
        });
    }
};
