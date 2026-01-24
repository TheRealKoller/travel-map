<?php

use App\Support\ImageHelper;
use Illuminate\Support\Facades\Log;

test('convertToBase64 returns base64 data URI for valid image URL', function () {
    // Create a simple 1x1 PNG image (smallest valid PNG)
    $pngData = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');

    // Create a temporary file
    $tempFile = tempnam(sys_get_temp_dir(), 'test_image');
    file_put_contents($tempFile, $pngData);

    // Convert the local file URL
    $result = ImageHelper::convertToBase64($tempFile);

    // Cleanup
    unlink($tempFile);

    expect($result)->not->toBeNull();
    expect($result)->toStartWith('data:image/png;base64,');
    expect($result)->toContain('iVBORw0KGgo');
});

test('convertToBase64 returns null for invalid URL', function () {
    Log::shouldReceive('warning')
        ->once()
        ->with('Failed to download image', ['url' => 'https://invalid-url-that-does-not-exist.com/image.jpg']);

    $result = ImageHelper::convertToBase64('https://invalid-url-that-does-not-exist.com/image.jpg');

    expect($result)->toBeNull();
});

test('convertToBase64 handles file_get_contents failure gracefully', function () {
    Log::shouldReceive('warning')
        ->once();

    // Use a URL that will fail
    $result = ImageHelper::convertToBase64('http://localhost:99999/nonexistent.jpg');

    expect($result)->toBeNull();
});

test('convertToBase64 detects correct MIME type', function () {
    // Create a simple 1x1 JPEG image
    $jpegData = base64_decode('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA//2Q==');

    // Create a temporary file
    $tempFile = tempnam(sys_get_temp_dir(), 'test_image');
    file_put_contents($tempFile, $jpegData);

    // Convert the local file URL
    $result = ImageHelper::convertToBase64($tempFile);

    // Cleanup
    unlink($tempFile);

    expect($result)->not->toBeNull();
    expect($result)->toStartWith('data:image/jpeg;base64,');
});

test('convertToBase64 logs error on exception', function () {
    Log::shouldReceive('error')
        ->once()
        ->withArgs(function ($message, $context) {
            return $message === 'Error converting image to base64'
                && isset($context['url'])
                && isset($context['error']);
        });

    // Use an invalid protocol that will cause an exception
    $result = ImageHelper::convertToBase64('invalid://protocol/image.jpg');

    expect($result)->toBeNull();
});
