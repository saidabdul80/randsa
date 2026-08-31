<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('property_availability_vacations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('property_availability_agent_id');
            $table->foreign('property_availability_agent_id', 'prop_avail_vac_agent_fk')
                ->references('id')
                ->on('property_availability_agents')
                ->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->timestamps();

            $table->index(['property_availability_agent_id', 'start_date', 'end_date'], 'prop_avail_vac_dates_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('property_availability_vacations');
    }
};
