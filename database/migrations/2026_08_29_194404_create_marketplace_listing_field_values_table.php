<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketplace_listing_field_values', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('marketplace_listing_id');
            $table->string('service_field_id');
            $table->string('field_key');
            $table->text('value_string')->nullable();
            $table->decimal('value_number', 15, 2)->nullable();
            $table->boolean('value_boolean')->nullable();
            $table->date('value_date')->nullable();
            $table->json('value_json')->nullable();
            $table->timestamps();

            $table->foreign('marketplace_listing_id', 'market_field_values_listing_fk')
                ->references('id')
                ->on('marketplace_listings')
                ->cascadeOnDelete();
            $table->foreign('service_field_id')->references('id')->on('service_fields')->restrictOnDelete();
            $table->unique(['marketplace_listing_id', 'service_field_id'], 'marketplace_listing_field_values_listing_field_unique');
            $table->index('service_field_id');
            $table->index('field_key');
            $table->index('value_number');
            $table->index('value_boolean');
            $table->index('value_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketplace_listing_field_values');
    }
};
