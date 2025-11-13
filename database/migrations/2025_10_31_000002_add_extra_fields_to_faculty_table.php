<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddExtraFieldsToFacultyTable extends Migration
{
    public function up()
    {
        if (Schema::hasTable('faculty')) {
            Schema::table('faculty', function (Blueprint $table) {
                if (!Schema::hasColumn('faculty', 'gender')) $table->string('gender')->nullable()->after('position');
                if (!Schema::hasColumn('faculty', 'birthday')) $table->date('birthday')->nullable()->after('gender');
                if (!Schema::hasColumn('faculty', 'address')) $table->text('address')->nullable()->after('birthday');
                if (!Schema::hasColumn('faculty', 'employment_type')) $table->string('employment_type')->nullable()->after('address');
                if (!Schema::hasColumn('faculty', 'education')) $table->text('education')->nullable()->after('employment_type');
                if (!Schema::hasColumn('faculty', 'photo')) $table->string('photo')->nullable()->after('education');
                if (!Schema::hasColumn('faculty', 'date_hired')) $table->date('date_hired')->nullable()->after('photo');
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('faculty')) {
            Schema::table('faculty', function (Blueprint $table) {
                if (Schema::hasColumn('faculty', 'date_hired')) $table->dropColumn('date_hired');
                if (Schema::hasColumn('faculty', 'photo')) $table->dropColumn('photo');
                if (Schema::hasColumn('faculty', 'education')) $table->dropColumn('education');
                if (Schema::hasColumn('faculty', 'employment_type')) $table->dropColumn('employment_type');
                if (Schema::hasColumn('faculty', 'address')) $table->dropColumn('address');
                if (Schema::hasColumn('faculty', 'birthday')) $table->dropColumn('birthday');
                if (Schema::hasColumn('faculty', 'gender')) $table->dropColumn('gender');
            });
        }
    }
}
