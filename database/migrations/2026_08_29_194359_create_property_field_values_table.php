<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('property_field_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->string('service_field_id');
            $table->string('field_key');
            $table->text('value_string')->nullable();
            $table->decimal('value_number', 15, 2)->nullable();
            $table->boolean('value_boolean')->nullable();
            $table->date('value_date')->nullable();
            $table->json('value_json')->nullable();
            $table->timestamps();

            $table->foreign('service_field_id')->references('id')->on('service_fields')->restrictOnDelete();
            $table->unique(['property_id', 'service_field_id']);
            $table->index('service_field_id');
            $table->index('field_key');
            $table->index('value_number');
            $table->index('value_boolean');
            $table->index('value_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('property_field_values');
    }
};
