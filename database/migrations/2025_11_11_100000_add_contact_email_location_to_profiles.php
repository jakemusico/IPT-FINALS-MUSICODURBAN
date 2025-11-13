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
        // support projects that renamed `profiles` -> `students` (migration exists in this repo)
        if (Schema::hasTable('profiles')) {
            Schema::table('profiles', function (Blueprint $table) {
                if (! Schema::hasColumn('profiles', 'email')) {
                    $table->string('email')->nullable()->after('lname')->index();
                }
                if (! Schema::hasColumn('profiles', 'contact')) {
                    $table->string('contact')->nullable()->after('email');
                }
                if (! Schema::hasColumn('profiles', 'phone')) {
                    $table->string('phone')->nullable()->after('contact');
                }
                if (! Schema::hasColumn('profiles', 'location')) {
                    $table->string('location')->nullable()->after('phone');
                }
            });
        } elseif (Schema::hasTable('students')) {
            Schema::table('students', function (Blueprint $table) {
                if (! Schema::hasColumn('students', 'email')) {
                    $table->string('email')->nullable()->after('lname')->index();
                }
                if (! Schema::hasColumn('students', 'contact')) {
                    $table->string('contact')->nullable()->after('email');
                }
                if (! Schema::hasColumn('students', 'phone')) {
                    $table->string('phone')->nullable()->after('contact');
                }
                if (! Schema::hasColumn('students', 'location')) {
                    $table->string('location')->nullable()->after('phone');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            if (Schema::hasColumn('profiles', 'location')) {
                $table->dropColumn('location');
            }
            if (Schema::hasColumn('profiles', 'phone')) {
                $table->dropColumn('phone');
            }
            if (Schema::hasColumn('profiles', 'contact')) {
                $table->dropColumn('contact');
            }
            if (Schema::hasColumn('profiles', 'email')) {
                $table->dropColumn('email');
            }
        });
    }
};
