<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_booking_configs', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('service_sub_category_id')->unique();
            $table->boolean('is_bookable')->default(false);
            $table->string('booking_mode')->default('generic');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('primary_action_label');
            $table->string('date_label');
            $table->string('start_time_label');
            $table->string('end_date_label')->nullable();
            $table->string('end_time_label')->nullable();
            $table->string('summary_label');
            $table->string('payment_label');
            $table->string('reminder_title');
            $table->string('reminder_lead');
            $table->string('selection_kind')->default('none');
            $table->unsignedInteger('default_duration_minutes')->default(60);
            $table->unsignedInteger('minimum_duration_minutes')->default(60);
            $table->unsignedInteger('buffer_minutes')->default(0);
            $table->string('default_pricing_unit')->default('fixed');
            $table->boolean('uses_agent_schedule')->default(false);
            $table->boolean('prevents_duplicate_active_booking')->default(false);
            $table->timestamps();

            $table->foreign('service_sub_category_id')->references('id')->on('service_sub_categories')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_booking_configs');
    }
};
