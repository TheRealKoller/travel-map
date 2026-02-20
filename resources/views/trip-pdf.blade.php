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
        
        /* Color Scheme Variables */
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 11px;
            line-height: 1.6;
            color: #374151;
            background-color: white;
            --primary: #2563eb;
            --secondary: #f59e0b;
            --accent: #10b981;
            --dark: #1f2937;
            --light: #f3f4f6;
            --border: #e5e7eb;
        }
        
        /* Typography Hierarchy */
        h1 { 
            font-size: 42px; 
            font-weight: 800; 
            color: #1f2937;
            line-height: 1.2; 
            margin-bottom: 15px;
        }

        h2 { 
            font-size: 28px; 
            font-weight: 700; 
            color: #1f2937;
            line-height: 1.3; 
            margin-top: 25px; 
            margin-bottom: 12px;
        }

        h3 { 
            font-size: 18px; 
            font-weight: 600; 
            color: #2563eb;
            line-height: 1.4; 
            margin-top: 15px; 
            margin-bottom: 8px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }
        
        .page-break {
            page-break-after: always;
        }
        
        /* Cover Page Styles */
        .cover-page {
            position: relative;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            page-break-after: always;
            padding: 60px 40px;
        }
        
        .cover-image-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
        
        .cover-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .cover-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.7) 0%, rgba(118, 75, 162, 0.7) 100%);
        }
        
        .cover-content {
            position: relative;
            z-index: 10;
            text-align: center;
            color: white;
            padding: 60px 40px;
        }
        
        .cover-badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 20px;
        }
        
        .trip-title {
            font-size: 52px;
            font-weight: 900;
            text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
            margin-bottom: 30px;
            color: white;
        }
        
        .cover-dates,
        .cover-duration {
            font-size: 18px;
            font-weight: 500;
            margin: 10px 0;
            text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
        }
        
        .date-icon,
        .duration-icon {
            margin-right: 8px;
        }
        
        /* Header Styles */
        .header {
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2563eb;
        }
        
        .trip-name {
            font-size: 32px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
        }
        
        /* Section Styles */
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
        
        .section-divider {
            height: 2px;
            background: linear-gradient(90deg, transparent 0%, #2563eb 50%, transparent 100%);
            margin: 30px 0;
        }
        
        /* Image Styles */
        .image-container {
            margin-top: 15px;
            text-align: center;
        }
        
        .image-container img {
            max-width: 100%;
            height: auto;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
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
        
        /* Tour Page Styles */
        .tour-page {
            page-break-before: always;
            padding-top: 20px;
        }
        
        .tour-header-section {
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2563eb;
        }
        
        .tour-title {
            font-size: 32px;
            font-weight: 800;
            color: #1f2937;
            margin-bottom: 15px;
        }
        
        .tour-stats-row {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }
        
        .stat-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            color: white;
            padding: 10px 18px;
            border-radius: 25px;
            font-weight: 600;
        }
        
        .stat-icon {
            font-size: 18px;
        }
        
        .stat-value {
            font-size: 18px;
            font-weight: 800;
        }
        
        .stat-label {
            font-size: 11px;
            opacity: 0.9;
        }
        
        .tour-map-container {
            margin-bottom: 25px;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            border: 4px solid white;
            outline: 1px solid #e5e7eb;
        }
        
        .tour-map {
            width: 100%;
            display: block;
        }
        
        /* Marker Card Styles */
        .marker-list {
            margin-top: 20px;
        }
        
        .marker-card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            page-break-inside: avoid;
            break-inside: avoid;
            margin-bottom: 20px;
            orphans: 3;
            widows: 3;
        }
        
        .marker-image-container {
            position: relative;
            width: 100%;
            height: 200px;
            overflow: hidden;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .marker-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .marker-image-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 60px;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
        }
        
        .marker-type-badge {
            position: absolute;
            top: 12px;
            left: 12px;
            background: #f59e0b;
            color: white;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .unesco-badge {
            position: absolute;
            top: 12px;
            right: 12px;
            background: rgba(254, 243, 199, 0.95);
            color: #92400e;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: 700;
        }
        
        .marker-body {
            padding: 18px;
        }
        
        .marker-title {
            font-size: 18px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 12px;
            padding-bottom: 10px;
            border-bottom: 2px solid #f59e0b;
            page-break-after: avoid;
        }
        
        .marker-details-grid {
            display: table;
            width: 100%;
            margin-bottom: 12px;
            padding: 10px;
            background-color: #f3f4f6;
            border-radius: 8px;
        }
        
        .detail-item {
            display: table-row;
        }
        
        .detail-icon,
        .detail-text {
            display: table-cell;
            padding: 4px;
            font-size: 10px;
            color: #6b7280;
        }
        
        .detail-icon {
            width: 20px;
            font-size: 14px;
        }
        
        .marker-notes {
            font-size: 11px;
            color: #4b5563;
            line-height: 1.6;
            margin-top: 12px;
            padding: 12px;
            background-color: #fafafa;
            border-radius: 6px;
            border-left: 3px solid #2563eb;
            orphans: 2;
            widows: 2;
        }
        
        /* Markdown formatting for notes */
        .marker-notes p {
            margin-bottom: 8px;
        }
        
        .marker-notes ul,
        .marker-notes ol {
            margin-left: 20px;
            margin-bottom: 8px;
        }
        
        .marker-notes li {
            margin-bottom: 4px;
        }
        
        .marker-notes strong {
            font-weight: bold;
            color: #1f2937;
        }
        
        .marker-notes em {
            font-style: italic;
        }
        
        .marker-notes code {
            background-color: #f3f4f6;
            padding: 2px 4px;
            border-radius: 2px;
            font-family: 'Courier New', monospace;
            font-size: 10px;
        }
        
        .marker-notes pre {
            background-color: #f3f4f6;
            padding: 8px;
            border-radius: 4px;
            overflow-x: auto;
            margin-bottom: 8px;
        }
        
        .marker-notes pre code {
            background-color: transparent;
            padding: 0;
        }
        
        .marker-notes blockquote {
            border-left: 3px solid #d1d5db;
            padding-left: 10px;
            margin-left: 10px;
            color: #6b7280;
            font-style: italic;
        }
        
        .marker-notes a {
            color: #2563eb;
            text-decoration: underline;
        }
        
        .marker-notes h1,
        .marker-notes h2,
        .marker-notes h3,
        .marker-notes h4,
        .marker-notes h5,
        .marker-notes h6 {
            font-weight: bold;
            color: #1f2937;
            margin-top: 8px;
            margin-bottom: 4px;
        }
        
        .marker-notes h1 { font-size: 14px; }
        .marker-notes h2 { font-size: 13px; }
        .marker-notes h3 { font-size: 12px; }
        .marker-notes h4,
        .marker-notes h5,
        .marker-notes h6 { font-size: 11px; }
        
        /* QR Code Section */
        .qr-section {
            display: table;
            width: 100%;
            margin-top: 15px;
            padding: 12px;
            background-color: #f3f4f6;
            border-radius: 8px;
        }
        
        .qr-code-box {
            display: table-cell;
            width: 70px;
            vertical-align: middle;
        }
        
        .qr-code-box img {
            width: 60px;
            height: 60px;
            background: white;
            padding: 4px;
            border-radius: 6px;
            border: 2px solid #e5e7eb;
        }
        
        .qr-text {
            display: table-cell;
            vertical-align: middle;
            padding-left: 12px;
        }
        
        .qr-label {
            font-size: 9px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
            margin-bottom: 2px;
        }
        
        .qr-url {
            font-size: 10px;
            color: #2563eb;
            font-weight: 500;
            word-break: break-all;
        }
        
        /* Footer Styles */
        .pdf-footer {
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
            margin-top: 30px;
            text-align: center;
            font-size: 9px;
            color: #9ca3af;
        }
        
        .markers-info {
            margin-top: 10px;
            padding: 10px;
            background-color: #f9fafb;
            border-radius: 6px;
            font-size: 11px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    {{-- Cover Page --}}
    <div class="cover-page">
        @if($tripImageUrl)
            <div class="cover-image-container">
                <img src="{{ $tripImageUrl }}" alt="Trip cover" class="cover-image">
                <div class="cover-overlay"></div>
            </div>
        @endif
        
        <div class="cover-content">
            <div class="cover-badge">Travel Itinerary</div>
            <h1 class="trip-title">{{ $trip->name }}</h1>
            
            @if($trip->planned_start_year || $trip->planned_end_year)
                @php
                $monthNames = [
                    1 => 'January', 2 => 'February', 3 => 'March', 4 => 'April',
                    5 => 'May', 6 => 'June', 7 => 'July', 8 => 'August',
                    9 => 'September', 10 => 'October', 11 => 'November', 12 => 'December'
                ];
                
                $startPeriod = '';
                if ($trip->planned_start_year) {
                    if ($trip->planned_start_day && $trip->planned_start_month) {
                        $startPeriod = $monthNames[$trip->planned_start_month] . ' ' . $trip->planned_start_day . ', ' . $trip->planned_start_year;
                    } elseif ($trip->planned_start_month) {
                        $startPeriod = $monthNames[$trip->planned_start_month] . ' ' . $trip->planned_start_year;
                    } else {
                        $startPeriod = (string) $trip->planned_start_year;
                    }
                }
                
                $endPeriod = '';
                if ($trip->planned_end_year) {
                    if ($trip->planned_end_day && $trip->planned_end_month) {
                        $endPeriod = $monthNames[$trip->planned_end_month] . ' ' . $trip->planned_end_day . ', ' . $trip->planned_end_year;
                    } elseif ($trip->planned_end_month) {
                        $endPeriod = $monthNames[$trip->planned_end_month] . ' ' . $trip->planned_end_year;
                    } else {
                        $endPeriod = (string) $trip->planned_end_year;
                    }
                }
                @endphp
                
                <div class="cover-dates">
                    <span class="date-icon">📅</span>
                    {{ $startPeriod }}
                    @if($endPeriod)
                        → {{ $endPeriod }}
                    @endif
                </div>
            @endif
            
            @if($trip->planned_duration_days)
                <div class="cover-duration">
                    <span class="duration-icon">⏱️</span>
                    {{ $trip->planned_duration_days }} {{ $trip->planned_duration_days == 1 ? 'day' : 'days' }}
                </div>
            @endif
        </div>
    </div>

    {{-- Trip Notes Page --}}
    @if($tripNotesHtml)
        <div class="container">
            <div class="header">
                <h1 class="trip-name">{{ $trip->name }}</h1>
            </div>
            
            <div class="section">
                <h2 class="section-title">Trip Notes</h2>
                <div class="marker-notes">
                    {!! $tripNotesHtml !!}
                </div>
            </div>
            
            <div class="pdf-footer">
                Generated on {{ now()->format('F j, Y \a\t g:i A') }}
            </div>
        </div>
        
        <div class="page-break"></div>
    @endif

    {{-- Map Viewport Page --}}
    <div class="container">
        <div class="header">
            <h1 class="trip-name">{{ $trip->name }}</h1>
        </div>
        
        <div class="section">
            <h2 class="section-title">Map Viewport</h2>
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

        <div class="pdf-footer">
            Generated on {{ now()->format('F j, Y \a\t g:i A') }}
        </div>
    </div>

    {{-- Markers Overview Page --}}
    @if($markersOverviewUrl)
        <div class="page-break"></div>
        
        <div class="container">
            <div class="header">
                <h1 class="trip-name">{{ $trip->name }}</h1>
            </div>

            <div class="section">
                <h2 class="section-title">Markers Overview</h2>
                <div class="markers-info">
                    This map shows all {{ $markersCount }} marker(s) of your trip.
                </div>
                <div class="image-container">
                    <img src="{{ $markersOverviewUrl }}" alt="Markers overview map">
                </div>
            </div>

            <div class="pdf-footer">
                Generated on {{ now()->format('F j, Y \a\t g:i A') }}
            </div>
        </div>
    @endif

    {{-- Tour Pages --}}
    @foreach($tours as $tour)
        <div class="page-break"></div>
        
        <div class="container">
            <div class="header">
                <h1 class="trip-name">{{ $trip->name }}</h1>
            </div>

            <div class="tour-page">
                <div class="tour-header-section">
                    <h2 class="tour-title">{{ $tour['name'] }}</h2>
                    
                    <div class="tour-stats-row">
                        @if(!empty($tour['markers']))
                            <div class="stat-badge">
                                <span class="stat-icon">📍</span>
                                <span class="stat-value">{{ count($tour['markers']) }}</span>
                                <span class="stat-label">Locations</span>
                            </div>
                        @endif
                        
                        @if(isset($tour['estimated_duration_hours']) && $tour['estimated_duration_hours'] > 0)
                            <div class="stat-badge">
                                <span class="stat-icon">⏱️</span>
                                <span class="stat-value">{{ number_format($tour['estimated_duration_hours'], 1) }}</span>
                                <span class="stat-label">Hours</span>
                            </div>
                        @endif
                    </div>
                </div>
                
                @if($tour['mapUrl'])
                    <div class="tour-map-container">
                        <img src="{{ $tour['mapUrl'] }}" alt="Tour map: {{ $tour['name'] }}" class="tour-map">
                    </div>
                @endif

                @if(!empty($tour['markers']))
                    <div class="marker-list">
                        <h3 class="section-title">Locations</h3>
                        @foreach($tour['markers'] as $marker)
                            <div class="marker-card">
                                <div class="marker-image-container">
                                    @if(!empty($marker['image_base64']))
                                        <img src="{{ $marker['image_base64'] }}" alt="{{ $marker['name'] }}" class="marker-image">
                                    @else
                                        <div class="marker-image-placeholder">
                                            <span>📍</span>
                                        </div>
                                    @endif
                                    
                                    @if($marker['type'])
                                        <div class="marker-type-badge">{{ $marker['type'] }}</div>
                                    @endif
                                    
                                    @if($marker['is_unesco'])
                                        <div class="unesco-badge">🏛️ UNESCO</div>
                                    @endif
                                </div>
                                
                                <div class="marker-body">
                                    <h3 class="marker-title">{{ $marker['name'] }}</h3>
                                    
                                    <div class="marker-details-grid">
                                        <div class="detail-item">
                                            <div class="detail-icon">📍</div>
                                            <div class="detail-text">{{ number_format($marker['latitude'], 4) }}, {{ number_format($marker['longitude'], 4) }}</div>
                                        </div>
                                        
                                        @if($marker['estimated_hours'])
                                            <div class="detail-item">
                                                <div class="detail-icon">⏱️</div>
                                                <div class="detail-text">{{ number_format($marker['estimated_hours'], 1) }}h</div>
                                            </div>
                                        @endif
                                    </div>
                                    
                                    @if($marker['notes_html'])
                                        <div class="marker-notes">
                                            {!! $marker['notes_html'] !!}
                                        </div>
                                    @endif
                                    
                                    @if($marker['url'])
                                        <div class="qr-section">
                                            <div class="qr-code-box">
                                                @if(!empty($marker['qr_code']))
                                                    <img src="{{ $marker['qr_code'] }}" alt="QR Code">
                                                @endif
                                            </div>
                                            <div class="qr-text">
                                                <p class="qr-label">Scan for details</p>
                                                <p class="qr-url">{{ Str::limit($marker['url'], 40) }}</p>
                                            </div>
                                        </div>
                                    @endif
                                </div>
                            </div>
                        @endforeach
                    </div>
                @endif
            </div>

            <div class="pdf-footer">
                Generated on {{ now()->format('F j, Y \a\t g:i A') }}
            </div>
        </div>
    @endforeach
</body>
</html>
