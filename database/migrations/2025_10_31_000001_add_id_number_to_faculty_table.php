<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddIdNumberToFacultyTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (Schema::hasTable('faculty')) {
            Schema::table('faculty', function (Blueprint $table) {
                if (!Schema::hasColumn('faculty', 'id_number')) {
                    $table->string('id_number', 20)->nullable()->unique()->after('id');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if (Schema::hasTable('faculty')) {
            Schema::table('faculty', function (Blueprint $table) {
                if (Schema::hasColumn('faculty', 'id_number')) {
                    $table->dropUnique(['id_number']);
                    $table->dropColumn('id_number');
                }
            });
        }
    }
}
