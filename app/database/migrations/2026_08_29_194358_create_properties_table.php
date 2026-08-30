<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->string('owner_id');
            $table->foreign('owner_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('service_category_id');
            $table->string('service_sub_category_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('state');
            $table->string('city');
            $table->string('area')->nullable();
            $table->string('address')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('owner_phone', 40)->nullable();
            $table->string('status')->default('pending');
            $table->boolean('is_available')->default(true);
            $table->decimal('base_price', 15, 2)->nullable();
            $table->string('currency', 10)->default('NGN');
            $table->string('pricing_unit')->nullable();
            $table->unsignedInteger('limited_remaining_capacity')->nullable();
            $table->json('blocked_dates')->nullable();
            $table->unsignedInteger('buffer_minutes')->nullable();
            $table->unsignedInteger('minimum_duration_minutes')->nullable();
            $table->string('legacy_category')->nullable();
            $table->string('legacy_property_type')->nullable();
            $table->timestamps();

            $table->foreign('service_category_id')->references('id')->on('service_categories')->restrictOnDelete();
            $table->foreign('service_sub_category_id')->references('id')->on('service_sub_categories')->restrictOnDelete();
            $table->index(['service_category_id', 'service_sub_category_id', 'status']);
            $table->index(['owner_id', 'created_at']);
            $table->index(['status', 'is_available', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
};
