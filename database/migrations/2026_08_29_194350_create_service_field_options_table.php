<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_field_options', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('service_field_id');
            $table->string('value');
            $table->string('label');
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('service_field_id')->references('id')->on('service_fields')->cascadeOnDelete();
            $table->unique(['service_field_id', 'value']);
            $table->index(['service_field_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_field_options');
    }
};
