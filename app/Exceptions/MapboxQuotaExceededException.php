<?php

namespace App\Exceptions;

use Exception;

class MapboxQuotaExceededException extends Exception
{
    public function __construct(string $message = 'Mapbox API quota exceeded', int $code = 0, ?Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}
