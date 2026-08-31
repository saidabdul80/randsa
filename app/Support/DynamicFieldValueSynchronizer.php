<?php

namespace App\Support;

use App\Models\MarketplaceListing;
use App\Models\Property;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DynamicFieldValueSynchronizer
{
    /**
     * @param  array<int, array<string, mixed>>  $values
     */
    public function syncProperty(Property $property, array $values): void
    {
        $this->sync($property->fieldValues(), $values);
    }

    /**
     * @param  array<int, array<string, mixed>>  $values
     */
    public function syncMarketplaceListing(MarketplaceListing $listing, array $values): void
    {
        $this->sync($listing->fieldValues(), $values);
    }

    /**
     * @param  HasMany<Model>  $relation
     * @param  array<int, array<string, mixed>>  $values
     */
    private function sync(HasMany $relation, array $values): void
    {
        $seenFieldIds = [];

        foreach ($values as $value) {
            if (empty($value['service_field_id'])) {
                continue;
            }

            $fieldId = (string) $value['service_field_id'];
            $seenFieldIds[] = $fieldId;

            $relation->updateOrCreate(
                ['service_field_id' => $fieldId],
                [
                    'field_key' => (string) ($value['field_key'] ?? $fieldId),
                    'value_string' => $value['value_string'] ?? null,
                    'value_number' => $value['value_number'] ?? null,
                    'value_boolean' => $value['value_boolean'] ?? null,
                    'value_date' => $value['value_date'] ?? null,
                    'value_json' => $value['value_json'] ?? null,
                ],
            );
        }

        if ($seenFieldIds !== []) {
            $relation->whereNotIn('service_field_id', array_unique($seenFieldIds))->delete();
        }
    }
}
