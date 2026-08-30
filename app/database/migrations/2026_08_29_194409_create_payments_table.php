<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('user_id');
            $table->foreignId('property_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('marketplace_listing_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('booking_id')->nullable()->constrained()->nullOnDelete();
            $table->string('service_pricing_field_id')->nullable();
            $table->string('agent_id')->nullable();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('agent_id')->references('id')->on('users')->nullOnDelete();
            $table->string('item_title');
            $table->string('payer_name');
            $table->string('payer_email');
            $table->decimal('amount', 15, 2);
            $table->string('currency', 10)->default('NGN');
            $table->string('payment_type');
            $table->string('paystack_reference')->unique();
            $table->string('status')->default('pending');
            $table->string('verification_mode')->nullable();
            $table->string('gateway')->default('paystack');
            $table->json('gateway_authorization')->nullable();
            $table->json('gateway_customer')->nullable();
            $table->json('gateway_metadata')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->foreign('service_pricing_field_id')->references('id')->on('service_pricing_fields')->nullOnDelete();
            $table->index(['user_id', 'created_at']);
            $table->index(['booking_id', 'status']);
            $table->index(['property_id', 'status']);
            $table->index(['marketplace_listing_id', 'status']);
            $table->index(['agent_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
