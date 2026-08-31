<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('user_id');
            $table->foreignId('property_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('marketplace_listing_id')->nullable()->constrained()->nullOnDelete();
            $table->string('service_category_id');
            $table->string('service_sub_category_id');
            $table->string('booking_config_id')->nullable();
            $table->string('agent_id')->nullable();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('agent_id')->references('id')->on('users')->nullOnDelete();
            $table->string('booking_mode')->default('generic');
            $table->timestamp('inspection_date')->nullable();
            $table->string('inspection_time')->nullable();
            $table->timestamp('start_at')->nullable();
            $table->timestamp('end_at')->nullable();
            $table->unsignedInteger('duration_minutes')->nullable();
            $table->unsignedInteger('quantity')->default(1);
            $table->string('pricing_unit')->nullable();
            $table->decimal('estimated_total', 15, 2)->nullable();
            $table->json('category_details')->nullable();
            $table->string('status')->default('pending');
            $table->string('payment_status')->default('pending');
            $table->boolean('reminder_sent')->default(false);
            $table->string('guest_phone', 40)->nullable();
            $table->text('notes')->nullable();
            $table->string('request_id')->unique();
            $table->unsignedInteger('schema_version')->default(3);
            $table->timestamps();

            $table->foreign('service_category_id')->references('id')->on('service_categories')->restrictOnDelete();
            $table->foreign('service_sub_category_id')->references('id')->on('service_sub_categories')->restrictOnDelete();
            $table->foreign('booking_config_id')->references('id')->on('service_booking_configs')->nullOnDelete();
            $table->index(['user_id', 'created_at']);
            $table->index(['property_id', 'start_at']);
            $table->index(['marketplace_listing_id', 'start_at']);
            $table->index(['agent_id', 'start_at']);
            $table->index(['status', 'payment_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
