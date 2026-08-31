<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ImageSynchronizer
{
    /**
     * @param  HasMany<Model>  $relation
     * @param  array<int, array<string, mixed>>  $images
     */
    public function replace(HasMany $relation, array $images): void
    {
        if ($images === []) {
            return;
        }

        $relation->delete();
        $relation->createMany($images);
    }
}
