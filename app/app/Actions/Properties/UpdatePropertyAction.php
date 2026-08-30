<?php

namespace App\Actions\Properties;

use App\Models\Property;
use App\Models\User;
use App\Support\DynamicFieldValueSynchronizer;
use App\Support\ImageSynchronizer;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class UpdatePropertyAction
{
    public function __construct(
        private readonly DynamicFieldValueSynchronizer $fields,
        private readonly ImageSynchronizer $images,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function execute(Property $property, User $actor, array $data): Property
    {
        return DB::transaction(function () use ($property, $actor, $data): Property {
            $payload = Arr::except($data, ['field_values', 'images']);

            if (! $actor->can('properties.moderate')) {
                unset($payload['status']);
            }

            $property->update($payload);
            $this->fields->syncProperty($property, $data['field_values'] ?? []);
            $this->images->replace($property->images(), $data['images'] ?? []);

            return $property->refresh();
        });
    }
}
