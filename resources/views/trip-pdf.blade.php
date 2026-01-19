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
        
        .page-break {
            page-break-after: always;
        }
        
        .markers-info {
            margin-top: 10px;
            padding: 10px;
            background-color: #f9fafb;
            border-radius: 6px;
            font-size: 11px;
            color: #6b7280;
        }
        
        .tour-header {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
        }
        
        .marker-list {
            margin-top: 20px;
        }
        
        .marker-item {
            margin-bottom: 15px;
            padding: 12px;
            background-color: #f9fafb;
            border-left: 3px solid #3b82f6;
            border-radius: 4px;
        }
        
        .marker-name {
            font-size: 13px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 4px;
        }
        
        .marker-type {
            font-size: 11px;
            color: #6b7280;
            font-style: italic;
            margin-bottom: 6px;
        }
        
        .marker-detail {
            font-size: 11px;
            color: #4b5563;
            margin-bottom: 3px;
        }
        
        .marker-notes {
            font-size: 11px;
            color: #4b5563;
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1px solid #e5e7eb;
        }
        
        .unesco-badge {
            display: inline-block;
            background-color: #fef3c7;
            color: #92400e;
            font-size: 10px;
            padding: 2px 8px;
            border-radius: 3px;
            margin-left: 8px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="trip-name">{{ $trip->name }}</h1>
        </div>

        <div class="section">
            <h2 class="section-title">Map viewport</h2>
            <div class="image-container">
                @if($viewportImageUrl)
                    <img src="{{ $viewportImageUrl }}" alt="Map viewport">
                @else
                    <div class="placeholder">
                        Map viewport placeholder
                    </div>
                @endif
            </div>
        </div>

        <div class="footer">
            Generated on {{ now()->format('F j, Y \a\t g:i A') }}
        </div>
    </div>

    @if($markersOverviewUrl)
        <div class="page-break"></div>
        
        <div class="container">
            <div class="header">
                <h1 class="trip-name">{{ $trip->name }}</h1>
            </div>

            <div class="section">
                <h2 class="section-title">Markers overview</h2>
                <div class="markers-info">
                    This map shows all {{ $markersCount }} marker(s) of your trip.
                </div>
                <div class="image-container">
                    <img src="{{ $markersOverviewUrl }}" alt="Markers overview map">
                </div>
            </div>

            <div class="footer">
                Generated on {{ now()->format('F j, Y \a\t g:i A') }}
            </div>
        </div>
    @endif

    @foreach($tours as $tour)
        <div class="page-break"></div>
        
        <div class="container">
            <div class="header">
                <h1 class="trip-name">{{ $trip->name }}</h1>
            </div>

            <div class="section">
                <h2 class="tour-header">{{ $tour['name'] }}</h2>
                
                @if($tour['mapUrl'])
                    <div class="image-container">
                        <img src="{{ $tour['mapUrl'] }}" alt="Tour map: {{ $tour['name'] }}">
                    </div>
                @endif

                @if(!empty($tour['markers']))
                    <div class="marker-list">
                        <h3 class="section-title">Markers</h3>
                        @foreach($tour['markers'] as $marker)
                            <div class="marker-item">
                                <div class="marker-name">
                                    {{ $marker['name'] }}
                                    @if($marker['is_unesco'])
                                        <span class="unesco-badge">UNESCO</span>
                                    @endif
                                </div>
                                @if($marker['type'])
                                    <div class="marker-type">{{ $marker['type'] }}</div>
                                @endif
                                <div class="marker-detail">
                                    Coordinates: {{ number_format($marker['latitude'], 6) }}, {{ number_format($marker['longitude'], 6) }}
                                </div>
                                @if($marker['url'])
                                    <div class="marker-detail">
                                        URL: {{ $marker['url'] }}
                                    </div>
                                @endif
                                @if($marker['notes'])
                                    <div class="marker-notes">
                                        <strong>Notes:</strong> {{ $marker['notes'] }}
                                    </div>
                                @endif
                            </div>
                        @endforeach
                    </div>
                @endif
            </div>

            <div class="footer">
                Generated on {{ now()->format('F j, Y \a\t g:i A') }}
            </div>
        </div>
    @endforeach
</body>
</html>
