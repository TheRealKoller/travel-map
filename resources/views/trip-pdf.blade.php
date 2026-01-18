<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $trip->name }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #333;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }
        
        .header {
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .trip-name {
            font-size: 32px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
        }
        
        .trip-country {
            font-size: 18px;
            color: #6b7280;
            margin-bottom: 5px;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #374151;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .image-container {
            margin-top: 15px;
            text-align: center;
        }
        
        .image-container img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .placeholder {
            background-color: #f3f4f6;
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            padding: 60px 20px;
            text-align: center;
            color: #9ca3af;
            font-size: 14px;
        }
        
        .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #9ca3af;
            font-size: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="trip-name">{{ $trip->name }}</h1>
            @if($trip->country)
                <div class="trip-country">{{ $countryName }}</div>
            @endif
        </div>

        @if($trip->image_url || !$trip->image_url)
        <div class="section">
            <h2 class="section-title">Title image</h2>
            <div class="image-container">
                @if($trip->image_url)
                    <img src="{{ $trip->image_url }}" alt="{{ $trip->name }}">
                @else
                    <div class="placeholder">
                        Title image placeholder
                    </div>
                @endif
            </div>
        </div>
        @endif

        @if($trip->viewport_static_image_url || !$trip->viewport_static_image_url)
        <div class="section">
            <h2 class="section-title">Map viewport</h2>
            <div class="image-container">
                @if($trip->viewport_static_image_url)
                    <img src="{{ $trip->viewport_static_image_url }}" alt="Map viewport">
                @else
                    <div class="placeholder">
                        Map viewport placeholder
                    </div>
                @endif
            </div>
        </div>
        @endif

        <div class="footer">
            Generated on {{ now()->format('F j, Y \a\t g:i A') }}
        </div>
    </div>
</body>
</html>
