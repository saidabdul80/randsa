<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_sub_category_form_config', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('service_sub_category_id')->unique();
            $table->string('form_title');
            $table->string('short_label');
            $table->json('description_prompts')->nullable();
            $table->json('suggested_amenities')->nullable();
            $table->json('image_guidance')->nullable();
            $table->string('default_payment_duration')->nullable();
            $table->string('default_currency', 10)->default('NGN');
            $table->string('default_country')->default('Nigeria');
            $table->json('wizard_steps')->nullable();
            $table->json('quality_rules')->nullable();
            $table->timestamps();

            $table->foreign('service_sub_category_id')->references('id')->on('service_sub_categories')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_sub_category_form_config');
    }
};
