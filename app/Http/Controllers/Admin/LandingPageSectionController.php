<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\LandingPageSectionRequest;
use App\Http\Resources\LandingPageSectionResource;
use App\Models\LandingPageSection;
use Illuminate\Http\RedirectResponse;

class LandingPageSectionController extends Controller
{
    public function index()
    {
        return LandingPageSectionResource::collection(
            LandingPageSection::query()
                ->orderBy('placement')
                ->orderBy('section_key')
                ->orderBy('sort_order')
                ->get(),
        );
    }

    public function store(LandingPageSectionRequest $request): RedirectResponse
    {
        LandingPageSection::query()->create(array_merge($request->validated(), [
            'placement' => $request->validated('placement') ?: 'home',
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]));

        return back()->with('status', 'landing-page-section-created');
    }

    public function show(LandingPageSection $landingPageSection): LandingPageSectionResource
    {
        return new LandingPageSectionResource($landingPageSection);
    }

    public function update(LandingPageSectionRequest $request, LandingPageSection $landingPageSection): RedirectResponse
    {
        $landingPageSection->update(array_merge($request->validated(), [
            'placement' => $request->validated('placement') ?: 'home',
            'updated_by' => $request->user()->id,
        ]));

        return back()->with('status', 'landing-page-section-updated');
    }

    public function destroy(LandingPageSection $landingPageSection): RedirectResponse
    {
        $landingPageSection->delete();

        return back()->with('status', 'landing-page-section-deleted');
    }
}
