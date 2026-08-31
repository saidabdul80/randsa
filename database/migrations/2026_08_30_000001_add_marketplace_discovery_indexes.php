<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->index(['status', 'is_available', 'service_category_id', 'base_price', 'created_at'], 'properties_discovery_filter_idx');
            $table->index(['status', 'is_available', 'service_sub_category_id', 'created_at'], 'properties_discovery_subcategory_idx');
            $table->index(['state', 'city', 'area'], 'properties_discovery_location_idx');
            $table->index('base_price', 'properties_discovery_price_idx');
        });

        Schema::table('marketplace_listings', function (Blueprint $table) {
            $table->index(['status', 'moderation_status', 'service_category_id', 'base_price', 'published_at'], 'marketplace_discovery_filter_idx');
            $table->index(['status', 'moderation_status', 'service_sub_category_id', 'published_at'], 'marketplace_discovery_subcategory_idx');
            $table->index(['state', 'city', 'area'], 'marketplace_discovery_location_idx');
            $table->index('base_price', 'marketplace_discovery_price_idx');
        });
    }

    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->dropIndex('properties_discovery_filter_idx');
            $table->dropIndex('properties_discovery_subcategory_idx');
            $table->dropIndex('properties_discovery_location_idx');
            $table->dropIndex('properties_discovery_price_idx');
        });

        Schema::table('marketplace_listings', function (Blueprint $table) {
            $table->dropIndex('marketplace_discovery_filter_idx');
            $table->dropIndex('marketplace_discovery_subcategory_idx');
            $table->dropIndex('marketplace_discovery_location_idx');
            $table->dropIndex('marketplace_discovery_price_idx');
        });
    }
};
