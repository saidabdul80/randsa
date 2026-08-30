<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_display_fields', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('service_sub_category_id');
            $table->string('service_field_id');
            $table->string('display_area');
            $table->string('label')->nullable();
            $table->string('icon_key')->nullable();
            $table->string('format')->default('text');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('service_sub_category_id')->references('id')->on('service_sub_categories')->cascadeOnDelete();
            $table->foreign('service_field_id')->references('id')->on('service_fields')->cascadeOnDelete();
            $table->index(['service_sub_category_id', 'display_area', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_display_fields');
    }
};
