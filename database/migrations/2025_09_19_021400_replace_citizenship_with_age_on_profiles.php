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
            if (Schema::hasColumn('profiles', 'citizenship')) {
                $table->dropColumn('citizenship');
            }
            $table->unsignedTinyInteger('age')->nullable()->after('nationality');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->string('citizenship')->nullable()->after('nationality');
            if (Schema::hasColumn('profiles', 'age')) {
                $table->dropColumn('age');
            }
        });
    }
};
