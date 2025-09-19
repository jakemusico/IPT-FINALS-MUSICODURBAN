<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class RenameDateOfBirthToDateofbirthInProfilesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Only run if the old column exists and the new one does not
        if (Schema::hasColumn('profiles', 'date_of_birth') && !Schema::hasColumn('profiles', 'dateofbirth')) {
            // MySQL/MariaDB: CHANGE old new type
            DB::statement("ALTER TABLE `profiles` CHANGE `date_of_birth` `dateofbirth` DATE NULL");
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if (Schema::hasColumn('profiles', 'dateofbirth') && !Schema::hasColumn('profiles', 'date_of_birth')) {
            DB::statement("ALTER TABLE `profiles` CHANGE `dateofbirth` `date_of_birth` DATE NULL");
        }
    }
}
