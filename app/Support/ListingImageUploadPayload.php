<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ListingImageUploadPayload
{
    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function merge(Request $request, array $data, string $directory): array
    {
        $images = array_values($data['images'] ?? []);

        foreach ($request->file('image_files', []) as $file) {
            $path = $file->store($directory, 'public');

            if (! $path) {
                continue;
            }

            $images[] = [
                'url' => Storage::disk('public')->url($path),
                'storage_path' => $path,
                'alt_text' => $data['title'] ?? null,
                'sort_order' => count($images),
                'is_cover' => count($images) === 0,
            ];
        }

        if ($images !== []) {
            $hasCover = collect($images)->contains(fn (array $image): bool => (bool) ($image['is_cover'] ?? false));

            $data['images'] = collect($images)
                ->values()
                ->map(fn (array $image, int $index): array => array_merge($image, [
                    'sort_order' => $index,
                    'is_cover' => $hasCover ? (bool) ($image['is_cover'] ?? false) : $index === 0,
                ]))
                ->all();
        }

        unset($data['image_files']);

        return $data;
    }
}
