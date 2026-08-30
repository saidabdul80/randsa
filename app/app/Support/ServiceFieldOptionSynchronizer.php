<?php

namespace App\Support;

use App\Models\ServiceField;
use Illuminate\Support\Arr;

class ServiceFieldOptionSynchronizer
{
    /**
     * @param  array<int, array<string, mixed>>  $options
     */
    public function sync(ServiceField $field, array $options): void
    {
        if ($options === []) {
            return;
        }

        $seen = [];

        foreach ($options as $option) {
            $seen[] = $option['id'];

            $field->options()->updateOrCreate(
                ['id' => $option['id']],
                Arr::except($option, ['id']),
            );
        }

        $field->options()->whereNotIn('id', $seen)->delete();
    }
}
