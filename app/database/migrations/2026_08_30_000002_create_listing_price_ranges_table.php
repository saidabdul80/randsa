<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('listing_price_ranges', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('label');
            $table->string('currency', 10)->default('NGN');
            $table->decimal('min_amount', 15, 2)->nullable();
            $table->decimal('max_amount', 15, 2)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_public')->default(true);
            $table->string('created_by')->nullable();
            $table->string('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
            $table->index(['is_active', 'is_public', 'sort_order']);
            $table->index(['currency', 'min_amount', 'max_amount']);
        });

        DB::table('listing_price_ranges')->insert([
            [
                'id' => 'under_250k',
                'label' => 'Under NGN 250,000',
                'currency' => 'NGN',
                'min_amount' => null,
                'max_amount' => 249999.99,
                'sort_order' => 10,
                'is_active' => true,
                'is_public' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => '250k_to_1m',
                'label' => 'NGN 250,000 - 1M',
                'currency' => 'NGN',
                'min_amount' => 250000,
                'max_amount' => 999999.99,
                'sort_order' => 20,
                'is_active' => true,
                'is_public' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 'above_1m',
                'label' => 'NGN 1M and above',
                'currency' => 'NGN',
                'min_amount' => 1000000,
                'max_amount' => null,
                'sort_order' => 30,
                'is_active' => true,
                'is_public' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('listing_price_ranges');
    }
};
