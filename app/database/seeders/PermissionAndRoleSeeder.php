<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;

class PermissionAndRoleSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            ['name' => 'admin.access', 'description' => 'Access the admin dashboard.', 'group' => 'admin'],
            ['name' => 'roles.manage', 'description' => 'Manage role permission assignments.', 'group' => 'admin'],
            ['name' => 'service-categories.manage', 'description' => 'Manage service categories and subcategories.', 'group' => 'services'],
            ['name' => 'service-fields.manage', 'description' => 'Manage service form fields.', 'group' => 'services'],
            ['name' => 'properties.create', 'description' => 'Create property listings.', 'group' => 'properties'],
            ['name' => 'properties.moderate', 'description' => 'Review property listings.', 'group' => 'properties'],
            ['name' => 'marketplace-listings.create', 'description' => 'Create marketplace listings.', 'group' => 'marketplace'],
            ['name' => 'marketplace-listings.moderate', 'description' => 'Review marketplace listings.', 'group' => 'marketplace'],
            ['name' => 'bookings.create', 'description' => 'Create bookings.', 'group' => 'bookings'],
            ['name' => 'payments.create', 'description' => 'Create payments.', 'group' => 'payments'],
            ['name' => 'payments.manage', 'description' => 'Manage payments.', 'group' => 'payments'],
            ['name' => 'agent-verifications.submit', 'description' => 'Submit verification requests.', 'group' => 'verification'],
            ['name' => 'agent-verifications.review', 'description' => 'Review verification requests.', 'group' => 'verification'],
        ];

        foreach ($permissions as $permission) {
            Permission::query()->updateOrCreate(
                ['name' => $permission['name'], 'guard_name' => 'web'],
                $permission + ['guard_name' => 'web'],
            );
        }

        $admin = Role::findOrCreate('admin', 'web');
        $admin->update(['description' => 'System administrator.', 'is_system' => true]);
        $customer = Role::findOrCreate('customer', 'web');
        $customer->update(['description' => 'Customer account.', 'is_system' => true]);
        $provider = Role::findOrCreate('provider', 'web');
        $provider->update(['description' => 'Service provider or listing owner.', 'is_system' => true]);

        $admin->syncPermissions(Permission::query()->pluck('name')->all());
        $customer->syncPermissions(['bookings.create', 'payments.create']);
        $provider->syncPermissions([
            'properties.create',
            'marketplace-listings.create',
            'bookings.create',
            'payments.create',
            'agent-verifications.submit',
        ]);
    }
}
