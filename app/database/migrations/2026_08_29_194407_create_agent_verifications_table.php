<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agent_verifications', function (Blueprint $table) {
            $table->id();
            $table->string('agent_id');
            $table->foreign('agent_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('full_name');
            $table->string('phone', 40);
            $table->string('whatsapp_number', 40)->nullable();
            $table->string('office_address');
            $table->json('profile_photo');
            $table->json('id_document');
            $table->json('cac_document')->nullable();
            $table->json('authorization_document');
            $table->string('status')->default('pending');
            $table->text('admin_note')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['agent_id', 'submitted_at']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_verifications');
    }
};
