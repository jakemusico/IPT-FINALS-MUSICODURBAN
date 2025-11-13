<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

class RenameProfilesToStudents extends Migration
{
    /**
     * Run the migrations.
     * Rename the existing `profiles` table to `students` to match domain language.
     *
     * @return void
     */
    public function up()
    {
        if (Schema::hasTable('profiles') && !Schema::hasTable('students')) {
            Schema::rename('profiles', 'students');
        }
    }

    /**
     * Reverse the migrations.
     * Rename `students` back to `profiles`.
     *
     * @return void
     */
    public function down()
    {
        if (Schema::hasTable('students') && !Schema::hasTable('profiles')) {
            Schema::rename('students', 'profiles');
        }
    }
}
