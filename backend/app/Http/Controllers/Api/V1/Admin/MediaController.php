<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MediaController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate(['image' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:8192', 'dimensions:min_width=64,min_height=64,max_width=8000,max_height=8000']]);
        $image = $validated['image'];
        $imageInfo = @getimagesize($image->getRealPath());

        if ($imageInfo === false || ! in_array($imageInfo['mime'], ['image/jpeg', 'image/png', 'image/webp'], true)) {
            throw ValidationException::withMessages(['image' => ['The uploaded file is not a decodable JPEG, PNG, or WebP image.']]);
        }

        $extension = match ($imageInfo['mime']) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
        };
        $path = 'media/'.now()->format('Y/m').'/'.Str::random(40).'.'.$extension;
        Storage::disk('public')->putFileAs(dirname($path), $image, basename($path));

        $media = Media::query()->create(['disk' => 'public', 'path' => $path, 'original_name' => Str::limit($image->getClientOriginalName(), 255, ''), 'mime_type' => $imageInfo['mime'], 'size' => $image->getSize(), 'width' => $imageInfo[0], 'height' => $imageInfo[1], 'uploaded_by' => $request->user()->id]);

        $url = Storage::disk('public')->url($media->path);

        return response()->json(['data' => ['public_id' => $media->public_id, 'path' => $media->path, 'url' => $url, 'original_url' => $url, 'mime_type' => $media->mime_type, 'width' => $media->width, 'height' => $media->height]], 201);
    }
}
