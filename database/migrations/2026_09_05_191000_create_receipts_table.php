<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('receipts', function (Blueprint $table) {
            $table->id();
            $table->string('receipt_number')->unique();
            $table->string('owner_id');
            $table->string('user_id');
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->foreignId('property_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('marketplace_listing_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('payment_id')->nullable()->constrained()->nullOnDelete();
            $table->string('receipt_type')->default('service');
            $table->string('status')->default('issued');
            $table->string('item_title');
            $table->string('issuer_name');
            $table->string('issuer_email')->nullable();
            $table->string('issuer_phone', 40)->nullable();
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone', 40)->nullable();
            $table->string('property_address')->nullable();
            $table->json('line_items')->nullable();
            $table->decimal('amount', 15, 2);
            $table->string('currency', 10)->default('NGN');
            $table->string('payment_method')->default('bank_transfer');
            $table->string('payment_reference')->nullable();
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();
            $table->timestamp('paid_at');
            $table->timestamp('issued_at');
            $table->timestamp('sent_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('owner_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['owner_id', 'issued_at']);
            $table->index(['user_id', 'issued_at']);
            $table->index(['booking_id', 'receipt_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receipts');
    }
};
