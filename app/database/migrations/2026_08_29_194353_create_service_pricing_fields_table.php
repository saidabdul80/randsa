<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_pricing_fields', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('service_sub_category_id');
            $table->string('key');
            $table->string('label');
            $table->text('description')->nullable();
            $table->string('amount_type')->default('user_input');
            $table->boolean('is_required')->default(false);
            $table->boolean('is_payable')->default(false);
            $table->string('payment_type')->nullable();
            $table->decimal('default_amount', 15, 2)->nullable();
            $table->decimal('minimum_amount', 15, 2)->nullable();
            $table->decimal('maximum_amount', 15, 2)->nullable();
            $table->string('currency', 10)->default('NGN');
            $table->string('pricing_unit')->default('one_time');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('service_sub_category_id')->references('id')->on('service_sub_categories')->cascadeOnDelete();
            $table->unique(['service_sub_category_id', 'key']);
            $table->index(['service_sub_category_id', 'sort_order']);
            $table->index('payment_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_pricing_fields');
    }
};
