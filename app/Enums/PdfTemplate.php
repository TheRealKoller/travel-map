<?php

namespace App\Enums;

enum PdfTemplate: string
{
    case MODERN = 'modern';
    case PROFESSIONAL = 'professional';
    case MINIMALIST = 'minimalist';
    case COMPACT = 'compact';

    public function viewName(): string
    {
        return match ($this) {
            self::MODERN => 'trip-pdf',
            self::PROFESSIONAL => 'trip-pdf-professional',
            self::MINIMALIST => 'trip-pdf-minimalist',
            self::COMPACT => 'trip-pdf-compact',
        };
    }

    public static function fromString(string $template): self
    {
        return self::tryFrom($template) ?? self::MODERN;
    }

    public static function values(): array
    {
        return array_map(fn ($case) => $case->value, self::cases());
    }
}
