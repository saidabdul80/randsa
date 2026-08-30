<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_fields', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('key')->unique();
            $table->string('label');
            $table->string('management_label')->nullable();
            $table->string('field_type');
            $table->string('data_type');
            $table->string('placeholder')->nullable();
            $table->text('help_text')->nullable();
            $table->json('default_value')->nullable();
            $table->json('validation_rules')->nullable();
            $table->boolean('is_system')->default(false);
            $table->boolean('is_active')->default(true);
            $table->string('created_by')->nullable();
            $table->string('updated_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_fields');
    }
};
