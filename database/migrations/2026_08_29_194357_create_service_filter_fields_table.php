<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_filter_fields', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('service_category_id')->nullable();
            $table->string('service_sub_category_id')->nullable();
            $table->string('service_field_id');
            $table->string('filter_label');
            $table->string('filter_type');
            $table->string('operator')->default('equals');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('service_category_id')->references('id')->on('service_categories')->nullOnDelete();
            $table->foreign('service_sub_category_id')->references('id')->on('service_sub_categories')->nullOnDelete();
            $table->foreign('service_field_id')->references('id')->on('service_fields')->cascadeOnDelete();
            $table->index(['service_category_id', 'sort_order']);
            $table->index(['service_sub_category_id', 'sort_order'], 'svc_filter_fields_sub_sort_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_filter_fields');
    }
};
