<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->json('availability_slots')->nullable()->after('blocked_dates');
        });

        Schema::table('marketplace_listings', function (Blueprint $table) {
            $table->json('availability_slots')->nullable()->after('delivery_details');
        });
    }

    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->dropColumn('availability_slots');
        });

        Schema::table('marketplace_listings', function (Blueprint $table) {
            $table->dropColumn('availability_slots');
        });
    }
};
