<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_sub_categories', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('service_category_id');
            $table->string('name');
            $table->string('label');
            $table->text('description')->nullable();
            $table->string('slug');
            $table->json('keywords')->nullable();
            $table->string('type')->default('marketplace');
            $table->string('transaction_type')->default('sale');
            $table->string('provider_kind')->default('user');
            $table->string('fulfillment_mode')->default('none');
            $table->string('default_listing_table')->default('marketplace_listings');
            $table->string('default_status')->default('pending_review');
            $table->boolean('requires_moderation')->default(true);
            $table->boolean('requires_provider_verification')->default(false);
            $table->boolean('uses_service_area')->default(false);
            $table->boolean('is_bookable')->default(false);
            $table->boolean('is_payable')->default(false);
            $table->boolean('allows_private_document')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_public')->default(true);
            $table->string('created_by')->nullable();
            $table->string('updated_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
            $table->timestamps();

            $table->foreign('service_category_id')->references('id')->on('service_categories')->cascadeOnDelete();
            $table->unique(['service_category_id', 'slug']);
            $table->index(['service_category_id', 'type', 'transaction_type']);
            $table->index(['service_category_id', 'is_active', 'is_public', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_sub_categories');
    }
};
