<?php

namespace App\Queries;

use App\Models\ListingPriceRange;
use App\Models\MarketplaceListing;
use App\Models\Property;
use App\Models\User;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class HomeMarketplaceSearch
{
    public const DEFAULT_PER_PAGE = 18;

    public function execute(array $filters, ?User $user = null): array
    {
        $perPage = $this->perPage($filters);
        $rows = $this->searchRows($filters, $perPage);
        $hasMore = $rows->count() > $perPage;
        $pageRows = $rows->take($perPage)->values();

        return [
            'items' => $this->hydrateRows($pageRows, $user),
            'meta' => [
                'count' => $pageRows->count(),
                'has_more' => $hasMore,
                'next_cursor' => $hasMore ? $this->encodeCursor($pageRows->last()) : null,
                'per_page' => $perPage,
            ],
        ];
    }

    private function searchRows(array $filters, int $perPage): Collection
    {
        $cursor = $this->decodeCursor($filters['cursor'] ?? '');

        return DB::query()
            ->fromSub(
                $this->propertySearchQuery($filters)
                    ->unionAll($this->marketplaceListingSearchQuery($filters)),
                'marketplace_results',
            )
            ->when($cursor, fn (Builder $query, array $cursor) => $this->applyCursor($query, $cursor))
            ->orderByDesc('sort_at')
            ->orderByDesc('source')
            ->orderByDesc('record_id')
            ->limit($perPage + 1)
            ->get();
    }

    private function propertySearchQuery(array $filters): Builder
    {
        return $this->applySharedFilters(
            DB::table('properties')
                ->join('service_categories as sc', 'sc.id', '=', 'properties.service_category_id')
                ->join('service_sub_categories as ssc', 'ssc.id', '=', 'properties.service_sub_category_id')
                ->selectRaw("'property' as source")
                ->selectRaw('properties.id as record_id')
                ->selectRaw('properties.created_at as sort_at')
                ->where('properties.status', 'approved')
                ->where('properties.is_available', true),
            $filters,
            'properties',
        );
    }

    private function marketplaceListingSearchQuery(array $filters): Builder
    {
        return $this->applySharedFilters(
            DB::table('marketplace_listings')
                ->join('service_categories as sc', 'sc.id', '=', 'marketplace_listings.service_category_id')
                ->join('service_sub_categories as ssc', 'ssc.id', '=', 'marketplace_listings.service_sub_category_id')
                ->selectRaw("'listing' as source")
                ->selectRaw('marketplace_listings.id as record_id')
                ->selectRaw('COALESCE(marketplace_listings.published_at, marketplace_listings.created_at) as sort_at')
                ->where('marketplace_listings.status', 'active')
                ->where('marketplace_listings.moderation_status', 'approved'),
            $filters,
            'marketplace_listings',
        );
    }

    private function applySharedFilters(Builder $query, array $filters, string $table): Builder
    {
        return $query
            ->when($filters['category'] ?? '', fn (Builder $query, string $category) => $query->where("{$table}.service_category_id", $category))
            ->when($filters['type'] ?? '', fn (Builder $query, string $type) => $query->where('ssc.type', $type))
            ->when($filters['city'] ?? '', fn (Builder $query, string $city) => $this->applyLocationFilter($query, $city, $table))
            ->when($filters['query'] ?? '', fn (Builder $query, string $term) => $this->applyTextFilter($query, $term, $table))
            ->when($filters['price'] ?? '', fn (Builder $query, string $range) => $this->applyPriceFilter($query, $range, $table));
    }

    private function applyLocationFilter(Builder $query, string $term, string $table): Builder
    {
        $like = $this->likeTerm($term);

        return $query->where(function (Builder $query) use ($like, $table): void {
            $query
                ->where("{$table}.city", 'like', $like)
                ->orWhere("{$table}.state", 'like', $like)
                ->orWhere("{$table}.area", 'like', $like)
                ->orWhere("{$table}.address", 'like', $like);
        });
    }

    private function applyTextFilter(Builder $query, string $term, string $table): Builder
    {
        $like = $this->likeTerm($term);

        return $query->where(function (Builder $query) use ($like, $table): void {
            $query
                ->where("{$table}.title", 'like', $like)
                ->orWhere("{$table}.description", 'like', $like)
                ->orWhere("{$table}.city", 'like', $like)
                ->orWhere("{$table}.state", 'like', $like)
                ->orWhere("{$table}.area", 'like', $like)
                ->orWhere('sc.label', 'like', $like)
                ->orWhere('ssc.label', 'like', $like);
        });
    }

    private function applyPriceFilter(Builder $query, string $range, string $table): Builder
    {
        $priceRange = ListingPriceRange::query()
            ->where('is_active', true)
            ->where('is_public', true)
            ->find($range);

        if (! $priceRange) {
            return $query;
        }

        return $query
            ->whereNotNull("{$table}.base_price")
            ->when($priceRange->min_amount !== null, fn (Builder $query) => $query->where("{$table}.base_price", '>=', $priceRange->min_amount))
            ->when($priceRange->max_amount !== null, fn (Builder $query) => $query->where("{$table}.base_price", '<=', $priceRange->max_amount));
    }

    private function applyCursor(Builder $query, array $cursor): Builder
    {
        return $query->where(function (Builder $query) use ($cursor): void {
            $query
                ->where('sort_at', '<', $cursor['sort_at'])
                ->orWhere(function (Builder $query) use ($cursor): void {
                    $query
                        ->where('sort_at', $cursor['sort_at'])
                        ->where('source', '<', $cursor['source']);
                })
                ->orWhere(function (Builder $query) use ($cursor): void {
                    $query
                        ->where('sort_at', $cursor['sort_at'])
                        ->where('source', $cursor['source'])
                        ->where('record_id', '<', $cursor['id']);
                });
        });
    }

    private function hydrateRows(Collection $rows, ?User $user): Collection
    {
        $propertyIds = $rows->where('source', 'property')->pluck('record_id');
        $listingIds = $rows->where('source', 'listing')->pluck('record_id');

        $propertyQuery = Property::query()
            ->with(['category', 'subCategory', 'images'])
            ->whereIn('id', $propertyIds);

        $listingQuery = MarketplaceListing::query()
            ->with(['category', 'subCategory', 'images'])
            ->whereIn('id', $listingIds);

        if ($user) {
            $propertyQuery->withExists([
                'savedItems as saved_by_current_user_exists' => fn ($query) => $query->where('user_id', $user->id),
            ]);
            $listingQuery->withExists([
                'savedItems as saved_by_current_user_exists' => fn ($query) => $query->where('user_id', $user->id),
            ]);
        }

        $properties = $propertyQuery
            ->get()
            ->keyBy('id');
        $listings = $listingQuery
            ->get()
            ->keyBy('id');

        return $rows
            ->map(function (object $row) use ($properties, $listings): ?array {
                $source = (string) $row->source;
                $item = $source === 'property'
                    ? $properties->get((int) $row->record_id)
                    : $listings->get((int) $row->record_id);

                if (! $item) {
                    return null;
                }

                return [
                    'source' => $source,
                    'item' => $item,
                ];
            })
            ->filter()
            ->values();
    }

    private function encodeCursor(?object $row): ?string
    {
        if (! $row) {
            return null;
        }

        return rtrim(strtr(base64_encode(json_encode([
            'sort_at' => (string) $row->sort_at,
            'source' => (string) $row->source,
            'id' => (int) $row->record_id,
        ], JSON_THROW_ON_ERROR)), '+/', '-_'), '=');
    }

    private function decodeCursor(string $cursor): ?array
    {
        if ($cursor === '') {
            return null;
        }

        $decoded = json_decode(base64_decode(strtr($cursor, '-_', '+/'), true) ?: '', true);

        if (
            ! is_array($decoded) ||
            ! isset($decoded['sort_at'], $decoded['source'], $decoded['id']) ||
            ! in_array($decoded['source'], ['property', 'listing'], true)
        ) {
            return null;
        }

        return [
            'sort_at' => (string) $decoded['sort_at'],
            'source' => (string) $decoded['source'],
            'id' => (int) $decoded['id'],
        ];
    }

    private function perPage(array $filters): int
    {
        return min(max((int) ($filters['per_page'] ?? self::DEFAULT_PER_PAGE), 6), 36);
    }

    private function likeTerm(string $term): string
    {
        return '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $term).'%';
    }
}
