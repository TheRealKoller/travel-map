<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;

class ImageHelper
{
    /**
     * Convert an image URL to a base64 data URI.
     * Downloads the image and converts it to base64 format.
     *
     * @param  string  $url  The image URL to convert
     * @return string|null The base64 data URI or null if conversion fails
     */
    public static function convertToBase64(string $url): ?string
    {
        try {
            // Suppress warnings for file_get_contents as we handle errors via return value and exceptions
            $imageContent = @file_get_contents($url);

            if ($imageContent === false) {
                Log::warning('Failed to download image', ['url' => $url]);

                return null;
            }

            // Detect MIME type from image content
            $finfo = new \finfo(FILEINFO_MIME_TYPE);
            $mimeType = $finfo->buffer($imageContent);

            // Convert to base64 data URI
            $base64 = base64_encode($imageContent);

            return "data:{$mimeType};base64,{$base64}";
        } catch (\Exception $e) {
            Log::error('Error converting image to base64', [
                'url' => $url,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
