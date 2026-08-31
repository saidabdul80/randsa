<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketplace_listing_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('marketplace_listing_id')->constrained()->cascadeOnDelete();
            $table->text('url');
            $table->string('storage_path')->nullable();
            $table->string('alt_text')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_cover')->default(false);
            $table->timestamps();

            $table->index(['marketplace_listing_id', 'sort_order'], 'market_listing_images_sort_idx');
            $table->index(['marketplace_listing_id', 'is_cover'], 'market_listing_images_cover_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketplace_listing_images');
    }
};
