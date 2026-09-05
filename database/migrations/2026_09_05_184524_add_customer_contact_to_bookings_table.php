<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->renameColumn('guest_phone', 'customer_phone');
            $table->string('customer_name')->nullable()->after('agent_id');
            $table->string('customer_email')->nullable()->after('customer_name');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['customer_name', 'customer_email']);
            $table->renameColumn('customer_phone', 'guest_phone');
        });
    }
};
