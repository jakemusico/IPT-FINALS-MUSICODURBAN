<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddHeadToDepartments extends Migration
{
    /**
     * Run the migrations.
     * Adds a nullable 'head' column (Dean name) to departments table if missing.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('departments')) {
            return;
        }

        Schema::table('departments', function (Blueprint $table) {
            if (!Schema::hasColumn('departments', 'head')) {
                $table->string('head')->nullable()->after('code');
            }
        });
    }

    /**
     * Reverse the migrations.
     * Drop the 'head' column if it exists.
     *
     * @return void
     */
    public function down()
    {
        if (!Schema::hasTable('departments')) {
            return;
        }

        Schema::table('departments', function (Blueprint $table) {
            if (Schema::hasColumn('departments', 'head')) {
                $table->dropColumn('head');
            }
        });
    }
}
