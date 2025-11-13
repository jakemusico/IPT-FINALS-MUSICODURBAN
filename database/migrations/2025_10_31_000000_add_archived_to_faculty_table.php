<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddArchivedToFacultyTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('faculty') && !Schema::hasColumn('faculty', 'archived')) {
            Schema::table('faculty', function (Blueprint $table) {
                $table->boolean('archived')->default(false)->after('position');
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('faculty') && Schema::hasColumn('faculty', 'archived')) {
            Schema::table('faculty', function (Blueprint $table) {
                $table->dropColumn('archived');
            });
        }
    }
}
