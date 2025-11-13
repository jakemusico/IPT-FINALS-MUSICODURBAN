<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddContactFieldsToDepartments extends Migration
{
    /**
     * Run the migrations.
     * Adds office_location, contact_email, contact_number to departments table if missing.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('departments')) {
            return;
        }

        Schema::table('departments', function (Blueprint $table) {
            if (!Schema::hasColumn('departments', 'office_location')) {
                $table->string('office_location')->nullable()->after('description');
            }
            if (!Schema::hasColumn('departments', 'contact_email')) {
                $table->string('contact_email')->nullable()->after('office_location');
            }
            if (!Schema::hasColumn('departments', 'contact_number')) {
                $table->string('contact_number')->nullable()->after('contact_email');
            }
        });
    }

    /**
     * Reverse the migrations.
     * Drop the added columns if they exist.
     *
     * @return void
     */
    public function down()
    {
        if (!Schema::hasTable('departments')) {
            return;
        }

        Schema::table('departments', function (Blueprint $table) {
            if (Schema::hasColumn('departments', 'office_location')) {
                $table->dropColumn('office_location');
            }
            if (Schema::hasColumn('departments', 'contact_email')) {
                $table->dropColumn('contact_email');
            }
            if (Schema::hasColumn('departments', 'contact_number')) {
                $table->dropColumn('contact_number');
            }
        });
    }
}
