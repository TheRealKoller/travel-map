<?php

namespace App\Exceptions;

use Exception;

class RouteNotFoundException extends Exception
{
    public function __construct(string $message = 'No route found between the markers', int $code = 0, ?Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}
