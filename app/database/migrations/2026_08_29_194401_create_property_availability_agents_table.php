<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('property_availability_agents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->string('agent_id');
            $table->foreign('agent_id')->references('id')->on('users')->cascadeOnDelete();
            $table->json('working_days')->nullable();
            $table->string('start_time', 5);
            $table->string('end_time', 5);
            $table->unsignedInteger('slot_interval_minutes')->default(30);
            $table->unsignedInteger('duration_minutes')->default(30);
            $table->unsignedInteger('maximum_bookings_per_day')->default(16);
            $table->json('unavailable_dates')->nullable();
            $table->timestamps();

            $table->index(['property_id', 'agent_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('property_availability_agents');
    }
};
