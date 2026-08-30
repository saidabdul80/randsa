<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_categories', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('label');
            $table->text('description')->nullable();
            $table->string('slug')->unique();
            $table->string('type')->default('marketplace');
            $table->string('icon_key')->nullable();
            $table->json('keywords')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_public')->default(true);
            $table->string('created_by')->nullable();
            $table->string('updated_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['type', 'is_active', 'is_public', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_categories');
    }
};
