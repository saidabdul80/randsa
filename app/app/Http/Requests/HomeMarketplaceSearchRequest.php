<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class HomeMarketplaceSearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'query' => ['nullable', 'string', 'max:120'],
            'city' => ['nullable', 'string', 'max:120'],
            'category' => ['nullable', 'string', 'max:120', Rule::exists('service_categories', 'id')],
            'type' => ['nullable', 'string', 'max:120'],
            'price' => ['nullable', 'string', Rule::exists('listing_price_ranges', 'id')->where('is_active', true)->where('is_public', true)],
            'cursor' => ['nullable', 'string', 'max:500'],
            'per_page' => ['nullable', 'integer', 'min:6', 'max:36'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'query' => $this->cleanString('query'),
            'city' => $this->cleanString('city'),
            'category' => $this->cleanString('category'),
            'type' => $this->cleanString('type'),
            'price' => $this->cleanString('price'),
            'cursor' => $this->cleanString('cursor'),
        ]);
    }

    public function filters(): array
    {
        return array_merge([
            'query' => '',
            'city' => '',
            'category' => '',
            'type' => '',
            'price' => '',
            'cursor' => '',
            'per_page' => 18,
        ], $this->validated());
    }

    private function cleanString(string $key): string
    {
        return trim((string) $this->input($key, ''));
    }
}
