<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketplace_listings', function (Blueprint $table) {
            $table->id();
            $table->string('owner_id');
            $table->foreign('owner_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('service_category_id');
            $table->string('service_sub_category_id');
            $table->string('title');
            $table->text('description');
            $table->string('status')->default('pending_review');
            $table->string('moderation_status')->default('pending');
            $table->string('country')->default('Nigeria');
            $table->string('state');
            $table->string('city');
            $table->string('area')->nullable();
            $table->string('address')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('currency', 10)->default('NGN');
            $table->decimal('base_price', 15, 2)->nullable();
            $table->decimal('maximum_amount', 15, 2)->nullable();
            $table->string('price_type')->default('fixed');
            $table->string('billing_period')->nullable();
            $table->boolean('negotiable')->default(false);
            $table->string('contact_name');
            $table->string('contact_phone', 40);
            $table->boolean('whatsapp_enabled')->default(false);
            $table->string('preferred_contact_method')->default('phone');
            $table->boolean('delivery_available')->default(false);
            $table->boolean('pickup_available')->default(true);
            $table->text('delivery_details')->nullable();
            $table->unsignedBigInteger('view_count')->default(0);
            $table->unsignedBigInteger('favourite_count')->default(0);
            $table->timestamp('published_at')->nullable();
            $table->string('legacy_category')->nullable();
            $table->string('legacy_sub_category')->nullable();
            $table->timestamps();

            $table->foreign('service_category_id')->references('id')->on('service_categories')->restrictOnDelete();
            $table->foreign('service_sub_category_id')->references('id')->on('service_sub_categories')->restrictOnDelete();
            $table->index(['service_category_id', 'service_sub_category_id', 'status'], 'market_listings_service_status_idx');
            $table->index(['owner_id', 'created_at']);
            $table->index(['status', 'moderation_status', 'published_at'], 'market_listings_status_pub_idx');
            $table->index(['state', 'city']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketplace_listings');
    }
};
