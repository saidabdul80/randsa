<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_media_rules', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('service_sub_category_id')->unique();
            $table->boolean('requires_images')->default(false);
            $table->unsignedInteger('min_images')->default(0);
            $table->unsignedInteger('max_images')->default(12);
            $table->boolean('allows_video')->default(false);
            $table->json('allowed_video_providers')->nullable();
            $table->boolean('allows_private_document')->default(false);
            $table->string('private_document_label')->nullable();
            $table->boolean('private_document_required')->default(false);
            $table->json('allowed_file_types')->nullable();
            $table->unsignedInteger('max_file_size_mb')->default(2);
            $table->timestamps();

            $table->foreign('service_sub_category_id')->references('id')->on('service_sub_categories')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_media_rules');
    }
};
