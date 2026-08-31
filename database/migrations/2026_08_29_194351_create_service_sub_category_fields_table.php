<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_sub_category_fields', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('service_sub_category_id');
            $table->string('service_field_id');
            $table->string('field_group')->default('details');
            $table->string('section_label')->nullable();
            $table->boolean('is_required')->default(false);
            $table->boolean('is_filterable')->default(false);
            $table->boolean('is_searchable')->default(false);
            $table->boolean('is_displayed_on_card')->default(false);
            $table->boolean('is_displayed_on_details')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->decimal('min_value', 15, 2)->nullable();
            $table->decimal('max_value', 15, 2)->nullable();
            $table->unsignedInteger('min_length')->nullable();
            $table->unsignedInteger('max_length')->nullable();
            $table->json('visibility_condition')->nullable();
            $table->string('clearing_group')->nullable();
            $table->timestamps();

            $table->foreign('service_sub_category_id')->references('id')->on('service_sub_categories')->cascadeOnDelete();
            $table->foreign('service_field_id')->references('id')->on('service_fields')->cascadeOnDelete();
            $table->unique(['service_sub_category_id', 'service_field_id'], 'svc_sub_field_unique');
            $table->index(['service_sub_category_id', 'field_group', 'sort_order'], 'svc_sub_field_group_sort_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_sub_category_fields');
    }
};
