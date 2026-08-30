<?php

namespace App\Actions\Properties;

use App\Events\PropertySubmitted;
use App\Models\Property;
use App\Models\User;
use App\Support\DynamicFieldValueSynchronizer;
use App\Support\ImageSynchronizer;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class StorePropertyAction
{
    public function __construct(
        private readonly DynamicFieldValueSynchronizer $fields,
        private readonly ImageSynchronizer $images,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function execute(User $owner, array $data): Property
    {
        return DB::transaction(function () use ($owner, $data): Property {
            $property = Property::query()->create(array_merge(
                Arr::except($data, ['field_values', 'images']),
                [
                    'owner_id' => $owner->id,
                    'status' => 'pending',
                    'is_available' => true,
                ],
            ));

            $this->fields->syncProperty($property, $data['field_values'] ?? []);
            $this->images->replace($property->images(), $data['images'] ?? []);

            PropertySubmitted::dispatch($property);

            return $property;
        });
    }
}
