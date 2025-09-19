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
        Schema::table('profiles', function (Blueprint $table) {
            if (Schema::hasColumn('profiles', 'nationality')) {
                $table->dropColumn('nationality');
            }
            if (Schema::hasColumn('profiles', 'dateofbirth')) {
                $table->dropColumn('dateofbirth');
            }
            $table->string('email')->unique()->after('lname');
            $table->string('contact')->nullable()->after('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->string('nationality')->nullable()->after('lname');
            $table->date('dateofbirth')->nullable()->after('citizenship');
            $table->dropColumn(['email', 'contact']);
        });
    }
};
