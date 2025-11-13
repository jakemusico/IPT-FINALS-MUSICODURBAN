<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddIdPhotoArchivedToStudents extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('students')) return;

        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'id_number')) $table->string('id_number')->nullable()->after('id');
            if (!Schema::hasColumn('students', 'photo')) $table->string('photo')->nullable()->after('id_number');
            if (!Schema::hasColumn('students', 'archived')) $table->boolean('archived')->default(false)->after('photo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('students')) return;

        Schema::table('students', function (Blueprint $table) {
            if (Schema::hasColumn('students', 'id_number')) $table->dropColumn('id_number');
            if (Schema::hasColumn('students', 'photo')) $table->dropColumn('photo');
            if (Schema::hasColumn('students', 'archived')) $table->dropColumn('archived');
        });
    }
}
