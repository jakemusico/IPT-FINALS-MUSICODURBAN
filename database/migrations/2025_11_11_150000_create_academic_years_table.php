<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        if (!Schema::hasTable('academic_years')) {
            Schema::create('academic_years', function (Blueprint $table) {
                $table->id();
                $table->string('year_name', 50)->unique();
                $table->date('start_date');
                $table->date('end_date');
                $table->enum('status', ['active','inactive','archived'])->default('active');
                $table->timestamps();
            });
        }
    }

    public function down()
    {
        Schema::dropIfExists('academic_years');
    }
};
