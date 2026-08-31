<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('listing_private_data', function (Blueprint $table) {
            $table->foreignId('listing_id')->primary()->constrained('marketplace_listings')->cascadeOnDelete();
            $table->string('owner_id');
            $table->foreign('owner_id')->references('id')->on('users')->cascadeOnDelete();
            $table->text('document_url');
            $table->string('document_type')->default('cv');
            $table->string('storage_path')->nullable();
            $table->timestamps();

            $table->index('owner_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('listing_private_data');
    }
};
