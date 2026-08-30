<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saved_items', function (Blueprint $table) {
            $table->id();
            $table->string('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('item_type');
            $table->foreignId('property_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('marketplace_listing_id')->nullable()->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'item_type', 'property_id', 'marketplace_listing_id'], 'saved_items_unique_target');
            $table->index(['user_id', 'created_at']);
            $table->index(['property_id', 'item_type']);
            $table->index(['marketplace_listing_id', 'item_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saved_items');
    }
};
