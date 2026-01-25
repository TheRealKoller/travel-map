<?php

namespace App\Exceptions;

use Exception;

class BusinessLogicException extends Exception
{
    /**
     * Additional error details.
     */
    private ?array $errors = null;

    /**
     * HTTP status code.
     */
    private int $statusCode;

    /**
     * Create a new BusinessLogicException instance.
     */
    public function __construct(
        string $message,
        int $statusCode = 422,
        ?array $errors = null,
        int $code = 0,
        ?Exception $previous = null
    ) {
        parent::__construct($message, $code, $previous);
        $this->statusCode = $statusCode;
        $this->errors = $errors;
    }

    /**
     * Get the HTTP status code.
     */
    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    /**
     * Get additional error details.
     */
    public function getErrors(): ?array
    {
        return $this->errors;
    }
}
