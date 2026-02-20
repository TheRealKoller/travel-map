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
        
        /* Color Scheme Variables - Minimalist Template */
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 11px;
            line-height: 1.6;
            color: #000000;
            background-color: #ffffff;
            --primary: #000000;
            --secondary: #000000;
            --accent: #ef4444;
            --dark: #000000;
            --light: #ffffff;
            --border: #000000;
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
            color: #ef4444;
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
        
        /* Cover Page Styles - Minimalist Template */
        .cover-page {
            position: relative;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #ffffff;
            border: 4px solid #000000;
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
            filter: grayscale(100%);
        }
        
        .cover-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.7);
        }
        
        .cover-content {
            position: relative;
            z-index: 10;
            text-align: center;
            color: #000000;
            padding: 60px 40px;
        }
        
        .cover-badge {
            display: inline-block;
            background: #000000;
            color: #ffffff;
            padding: 8px 20px;
            border-radius: 0;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 20px;
        }
        
        .trip-title {
            font-size: 52px;
            font-weight: 900;
            text-shadow: none;
            margin-bottom: 30px;
            color: #000000;
            border-bottom: 4px solid #ef4444;
            padding-bottom: 20px;
        }
        
        .cover-dates,
        .cover-duration {
            font-size: 18px;
            font-weight: 500;
            margin: 10px 0;
            text-shadow: none;
            color: #000000;
        }
        
        .date-icon,
        .duration-icon {
            margin-right: 8px;
        }
        
        /* Table of Contents Styles */
        .toc-page {
            page-break-after: always;
            padding: 40px;
            min-height: 90vh;
        }
        
        .toc-header {
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid var(--primary);
        }
        
        .toc-title {
            font-size: 42px;
            font-weight: 800;
            color: var(--dark);
            margin-bottom: 10px;
        }
        
        .toc-subtitle {
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
        }
        
        .toc-overview {
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(245, 158, 11, 0.05) 100%);
            border-radius: 12px;
            border-left: 4px solid var(--primary);
        }
        
        .toc-overview-title {
            font-size: 16px;
            font-weight: 700;
            color: var(--dark);
            margin-bottom: 8px;
        }
        
        .toc-overview-text {
            font-size: 11px;
            color: #6b7280;
            line-height: 1.6;
        }
        
        .toc-tours-section {
            margin-top: 30px;
        }
        
        .toc-tours-title {
            font-size: 24px;
            font-weight: 700;
            color: var(--dark);
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid var(--border);
        }
        
        .toc-tour-entry {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        
        .toc-tour-header {
            display: table;
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(37, 99, 235, 0.03) 100%);
            border-radius: 8px;
            border-left: 4px solid var(--primary);
            margin-bottom: 10px;
        }
        
        .toc-tour-icon {
            display: table-cell;
            width: 30px;
            font-size: 18px;
            vertical-align: middle;
        }
        
        .toc-tour-info {
            display: table-cell;
            vertical-align: middle;
        }
        
        .toc-tour-name {
            font-size: 16px;
            font-weight: 700;
            color: var(--dark);
            margin-bottom: 4px;
        }
        
        .toc-tour-meta {
            font-size: 10px;
            color: #6b7280;
            font-weight: 500;
        }
        
        .toc-tour-meta-item {
            display: inline-block;
            margin-right: 15px;
        }
        
        .toc-markers-list {
            margin-left: 30px;
            padding-left: 15px;
            border-left: 2px solid var(--border);
        }
        
        .toc-marker-item {
            display: table;
            width: 100%;
            padding: 8px 0;
            page-break-inside: avoid;
        }
        
        .toc-marker-icon {
            display: table-cell;
            width: 25px;
            font-size: 12px;
            color: var(--secondary);
            vertical-align: middle;
        }
        
        .toc-marker-name {
            display: table-cell;
            vertical-align: middle;
            font-size: 11px;
            color: #4b5563;
        }
        
        .toc-marker-badge {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            font-size: 8px;
            padding: 2px 6px;
            border-radius: 4px;
            margin-left: 6px;
            font-weight: 600;
            vertical-align: middle;
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
            border-radius: 0;
            border: 2px solid #000000;
            box-shadow: none;
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
            background: #000000;
        }
        
        .marker-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            filter: grayscale(100%);
        }
        
        .marker-image-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 60px;
            background: #f5f5f5;
            color: #000000;
        }
        
        .marker-type-badge {
            position: absolute;
            top: 12px;
            left: 12px;
            background: #ef4444;
            color: white;
            padding: 6px 14px;
            border-radius: 0;
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
            border-bottom: 2px solid var(--accent);
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
        
        /* Summary Page Styles */
        .summary-page {
            page-break-before: always;
            padding: 40px;
            min-height: 90vh;
        }
        
        .summary-header {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid var(--primary);
        }
        
        .summary-title {
            font-size: 42px;
            font-weight: 800;
            color: var(--dark);
            margin-bottom: 10px;
        }
        
        .summary-subtitle {
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
        }
        
        .summary-stats-grid {
            display: table;
            width: 100%;
            margin-bottom: 30px;
            border-spacing: 15px 0;
        }
        
        .summary-stat-row {
            display: table-row;
        }
        
        .summary-stat-card {
            display: table-cell;
            width: 33.333%;
            padding: 20px;
            background: linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(37, 99, 235, 0.03) 100%);
            border-radius: 12px;
            text-align: center;
            border: 2px solid rgba(37, 99, 235, 0.1);
        }
        
        .summary-stat-icon {
            font-size: 32px;
            margin-bottom: 10px;
        }
        
        .summary-stat-value {
            font-size: 32px;
            font-weight: 800;
            color: var(--primary);
            margin-bottom: 5px;
        }
        
        .summary-stat-label {
            font-size: 12px;
            color: #6b7280;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .summary-section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .summary-section-title {
            font-size: 20px;
            font-weight: 700;
            color: var(--dark);
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid var(--border);
        }
        
        .summary-tour-breakdown {
            margin-bottom: 15px;
        }
        
        .summary-tour-item {
            display: table;
            width: 100%;
            margin-bottom: 15px;
            padding: 15px;
            background: white;
            border-radius: 8px;
            border-left: 4px solid var(--primary);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            page-break-inside: avoid;
        }
        
        .summary-tour-icon-cell {
            display: table-cell;
            width: 40px;
            vertical-align: middle;
            font-size: 24px;
        }
        
        .summary-tour-info-cell {
            display: table-cell;
            vertical-align: middle;
            padding-left: 15px;
        }
        
        .summary-tour-name {
            font-size: 14px;
            font-weight: 700;
            color: var(--dark);
            margin-bottom: 5px;
        }
        
        .summary-tour-stats {
            font-size: 10px;
            color: #6b7280;
        }
        
        .summary-tour-stat-item {
            display: inline-block;
            margin-right: 15px;
        }
        
        .summary-distribution {
            margin-top: 10px;
        }
        
        .summary-distribution-item {
            display: table;
            width: 100%;
            margin-bottom: 12px;
            page-break-inside: avoid;
        }
        
        .summary-distribution-label-cell {
            display: table-cell;
            width: 30%;
            vertical-align: middle;
            font-size: 11px;
            color: #4b5563;
            font-weight: 600;
        }
        
        .summary-distribution-bar-cell {
            display: table-cell;
            vertical-align: middle;
            padding-left: 10px;
            padding-right: 10px;
        }
        
        .summary-distribution-value-cell {
            display: table-cell;
            width: 50px;
            text-align: right;
            vertical-align: middle;
            font-size: 11px;
            color: #6b7280;
            font-weight: 600;
        }
        
        .summary-progress-bar-bg {
            width: 100%;
            height: 20px;
            background: #f3f4f6;
            border-radius: 10px;
            overflow: hidden;
            position: relative;
        }
        
        .summary-progress-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%);
            border-radius: 10px;
            transition: width 0.3s ease;
        }
        
        .summary-empty-state {
            padding: 30px;
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
            background: #f9fafb;
            border-radius: 8px;
            border: 2px dashed #e5e7eb;
        }
        
        .summary-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid var(--border);
            text-align: center;
        }
        
        .summary-footer-date {
            font-size: 10px;
            color: #6b7280;
            margin-bottom: 10px;
        }
        
        .summary-footer-tagline {
            font-size: 12px;
            color: var(--primary);
            font-weight: 600;
            font-style: italic;
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

    {{-- Table of Contents --}}
    <div class="toc-page">
        <div class="toc-header">
            <h1 class="toc-title">Table of Contents</h1>
            <p class="toc-subtitle">Your complete travel itinerary at a glance</p>
        </div>
        
        @if($tableOfContents['hasOverview'])
            <div class="toc-overview">
                <div class="toc-overview-title">📍 Trip Overview</div>
                <p class="toc-overview-text">
                    This itinerary includes <strong>{{ count($tableOfContents['tours']) }} {{ count($tableOfContents['tours']) == 1 ? 'tour' : 'tours' }}</strong> 
                    with a total of <strong>{{ $markersCount }} {{ $markersCount == 1 ? 'location' : 'locations' }}</strong> to explore.
                </p>
            </div>
        @endif
        
        @if(!empty($tableOfContents['tours']))
            <div class="toc-tours-section">
                <h2 class="toc-tours-title">Tours & Locations</h2>
                
                @foreach($tableOfContents['tours'] as $tourEntry)
                    <div class="toc-tour-entry">
                        <div class="toc-tour-header">
                            <div class="toc-tour-icon">🗺️</div>
                            <div class="toc-tour-info">
                                <div class="toc-tour-name">{{ $tourEntry['name'] }}</div>
                                <div class="toc-tour-meta">
                                    <span class="toc-tour-meta-item">📍 {{ $tourEntry['markerCount'] }} {{ $tourEntry['markerCount'] == 1 ? 'location' : 'locations' }}</span>
                                    @if(isset($tourEntry['estimatedDurationHours']) && $tourEntry['estimatedDurationHours'] > 0)
                                        <span class="toc-tour-meta-item">⏱️ {{ number_format($tourEntry['estimatedDurationHours'], 1) }}h</span>
                                    @endif
                                </div>
                            </div>
                        </div>
                        
                        @if(!empty($tourEntry['markers']))
                            <div class="toc-markers-list">
                                @foreach($tourEntry['markers'] as $markerEntry)
                                    <div class="toc-marker-item">
                                        <div class="toc-marker-icon">
                                            @if($markerEntry['type'] === 'accommodation')
                                                🏨
                                            @elseif($markerEntry['type'] === 'restaurant')
                                                🍽️
                                            @elseif($markerEntry['type'] === 'activity')
                                                🎯
                                            @elseif($markerEntry['type'] === 'sight')
                                                🏛️
                                            @elseif($markerEntry['type'] === 'nature')
                                                🌲
                                            @elseif($markerEntry['type'] === 'transport')
                                                🚗
                                            @else
                                                📍
                                            @endif
                                        </div>
                                        <div class="toc-marker-name">
                                            {{ $markerEntry['name'] }}
                                            @if($markerEntry['isUnesco'])
                                                <span class="toc-marker-badge">UNESCO</span>
                                            @endif
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        @endif
                    </div>
                @endforeach
            </div>
        @endif
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
                Generated on {{ $generatedAt->format('F j, Y \a\t g:i A') }}
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
            Generated on {{ $generatedAt->format('F j, Y \a\t g:i A') }}
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
                Generated on {{ $generatedAt->format('F j, Y \a\t g:i A') }}
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
                Generated on {{ $generatedAt->format('F j, Y \a\t g:i A') }}
            </div>
        </div>
    @endforeach

    {{-- Summary Page --}}
    <div class="summary-page">
        <div class="summary-header">
            <h1 class="summary-title">Trip Summary</h1>
            <p class="summary-subtitle">Your travel statistics and highlights</p>
        </div>
        
        {{-- Key Statistics --}}
        <div class="summary-stats-grid">
            <div class="summary-stat-row">
                <div class="summary-stat-card">
                    <div class="summary-stat-icon">📍</div>
                    <div class="summary-stat-value">{{ $summaryStats['totalLocations'] }}</div>
                    <div class="summary-stat-label">Total Locations</div>
                </div>
                
                <div class="summary-stat-card">
                    <div class="summary-stat-icon">🗺️</div>
                    <div class="summary-stat-value">{{ $summaryStats['totalTours'] }}</div>
                    <div class="summary-stat-label">Tours</div>
                </div>
                
                <div class="summary-stat-card">
                    <div class="summary-stat-icon">⏱️</div>
                    <div class="summary-stat-value">{{ number_format($summaryStats['totalDuration'], 1) }}</div>
                    <div class="summary-stat-label">Total Hours</div>
                </div>
            </div>
        </div>
        
        <div class="summary-stats-grid">
            <div class="summary-stat-row">
                <div class="summary-stat-card">
                    <div class="summary-stat-icon">🚗</div>
                    <div class="summary-stat-value">{{ number_format($summaryStats['totalDistance'], 1) }}</div>
                    <div class="summary-stat-label">Kilometers</div>
                </div>
                
                <div class="summary-stat-card">
                    <div class="summary-stat-icon">🏛️</div>
                    <div class="summary-stat-value">{{ $summaryStats['unescoCount'] }}</div>
                    <div class="summary-stat-label">UNESCO Sites</div>
                </div>
                
                <div class="summary-stat-card">
                    <div class="summary-stat-icon">📌</div>
                    <div class="summary-stat-value">{{ count($summaryStats['markerTypeDistribution']) }}</div>
                    <div class="summary-stat-label">Marker Types</div>
                </div>
            </div>
        </div>
        
        {{-- Tour Breakdown --}}
        @if(!empty($summaryStats['tourBreakdown']))
            <div class="summary-section">
                <h2 class="summary-section-title">Tour Breakdown</h2>
                <div class="summary-tour-breakdown">
                    @foreach($summaryStats['tourBreakdown'] as $tourItem)
                        <div class="summary-tour-item">
                            <div class="summary-tour-icon-cell">🗺️</div>
                            <div class="summary-tour-info-cell">
                                <div class="summary-tour-name">{{ $tourItem['name'] }}</div>
                                <div class="summary-tour-stats">
                                    <span class="summary-tour-stat-item">📍 {{ $tourItem['markerCount'] }} {{ $tourItem['markerCount'] == 1 ? 'location' : 'locations' }}</span>
                                    @if($tourItem['duration'] > 0)
                                        <span class="summary-tour-stat-item">⏱️ {{ number_format($tourItem['duration'], 1) }}h</span>
                                    @endif
                                    @if($tourItem['distance'] > 0)
                                        <span class="summary-tour-stat-item">🚗 {{ number_format($tourItem['distance'], 1) }}km</span>
                                    @endif
                                </div>
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        @endif
        
        {{-- Marker Type Distribution --}}
        @if(!empty($summaryStats['markerTypeDistribution']))
            <div class="summary-section">
                <h2 class="summary-section-title">Marker Type Distribution</h2>
                <div class="summary-distribution">
                    @foreach($summaryStats['markerTypeDistribution'] as $typeItem)
                        <div class="summary-distribution-item">
                            <div class="summary-distribution-label-cell">
                                @if($typeItem['type'] === 'accommodation')
                                    🏨 Accommodation
                                @elseif($typeItem['type'] === 'restaurant')
                                    🍽️ Restaurant
                                @elseif($typeItem['type'] === 'activity')
                                    🎯 Activity
                                @elseif($typeItem['type'] === 'sight')
                                    🏛️ Sight
                                @elseif($typeItem['type'] === 'nature')
                                    🌲 Nature
                                @elseif($typeItem['type'] === 'transport')
                                    🚗 Transport
                                @else
                                    📍 {{ ucfirst($typeItem['type']) }}
                                @endif
                            </div>
                            <div class="summary-distribution-bar-cell">
                                <div class="summary-progress-bar-bg">
                                    <div class="summary-progress-bar-fill" style="width: {{ $typeItem['percentage'] }}%;"></div>
                                </div>
                            </div>
                            <div class="summary-distribution-value-cell">
                                {{ $typeItem['count'] }} ({{ $typeItem['percentage'] }}%)
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        @else
            <div class="summary-section">
                <h2 class="summary-section-title">Marker Type Distribution</h2>
                <div class="summary-empty-state">
                    No markers to display
                </div>
            </div>
        @endif
        
        {{-- Footer --}}
        <div class="summary-footer">
            <div class="summary-footer-date">
                Generated on {{ $generatedAt->format('F j, Y \a\t g:i A') }}
            </div>
            <div class="summary-footer-tagline">
                "The journey of a thousand miles begins with a single step" 🌍
            </div>
        </div>
    </div>
</body>
</html>
