<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateFacultyTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('faculty')) {
            Schema::create('faculty', function (Blueprint $table) {
                $table->id();
                $table->string('fname');
                $table->string('lname');
                $table->string('email')->unique();
                $table->string('contact')->nullable();
                $table->string('department')->nullable();
                $table->string('position')->nullable();
                $table->timestamps();
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
        Schema::dropIfExists('faculty');
    }
}
