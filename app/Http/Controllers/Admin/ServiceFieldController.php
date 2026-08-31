<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ServiceFieldRequest;
use App\Http\Resources\ServiceFieldResource;
use App\Models\ServiceField;
use App\Support\ServiceFieldOptionSynchronizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class ServiceFieldController extends Controller
{
    public function index()
    {
        return ServiceFieldResource::collection(
            ServiceField::query()->with('options')->orderBy('label')->get(),
        );
    }

    public function store(ServiceFieldRequest $request, ServiceFieldOptionSynchronizer $options): RedirectResponse
    {
        DB::transaction(function () use ($request, $options) {
            $field = ServiceField::query()->create(array_merge(
                Arr::except($request->validated(), ['options']),
                [
                    'created_by' => $request->user()->id,
                    'updated_by' => $request->user()->id,
                ],
            ));

            $options->sync($field, $request->validated('options', []));
        });

        return back()->with('status', 'service-field-created');
    }

    public function show(ServiceField $serviceField): ServiceFieldResource
    {
        return new ServiceFieldResource($serviceField->load('options'));
    }

    public function update(ServiceFieldRequest $request, ServiceField $serviceField, ServiceFieldOptionSynchronizer $options): RedirectResponse
    {
        DB::transaction(function () use ($request, $serviceField, $options) {
            $serviceField->update(array_merge(
                Arr::except($request->validated(), ['options']),
                ['updated_by' => $request->user()->id],
            ));

            $options->sync($serviceField, $request->validated('options', []));
        });

        return back()->with('status', 'service-field-updated');
    }

    public function destroy(ServiceField $serviceField): RedirectResponse
    {
        abort_if($serviceField->is_system, 403);

        $serviceField->delete();

        return back()->with('status', 'service-field-deleted');
    }
}
