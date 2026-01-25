<?php

namespace App\Services;

use App\Models\Marker;

class TourSortingService
{
    /**
     * Sort markers to minimize total walking distance using a greedy nearest neighbor algorithm.
     * This provides a good approximation for the Traveling Salesman Problem (TSP).
     *
     * @param  array<Marker>  $markers  Array of markers to sort
     * @param  array  $matrix  Distance/duration matrix from Matrix API
     * @return array<string> Sorted array of marker IDs in optimal order
     */
    public function sortMarkersOptimally(array $markers, array $matrix): array
    {
        $markerCount = count($markers);

        if ($markerCount < 2) {
            return array_map(fn (Marker $m) => $m->id, $markers);
        }

        // Use distances for sorting
        $distances = $matrix['distances'];

        // Nearest Neighbor Algorithm:
        // 1. Start from the first marker
        // 2. Always go to the nearest unvisited marker
        // 3. Repeat until all markers are visited

        $visited = [];
        $sortedIndices = [];

        // Start from the first marker
        $currentIndex = 0;
        $sortedIndices[] = $currentIndex;
        $visited[$currentIndex] = true;

        // Visit remaining markers
        while (count($sortedIndices) < $markerCount) {
            $nearestIndex = null;
            $nearestDistance = PHP_FLOAT_MAX;

            // Find nearest unvisited marker
            for ($i = 0; $i < $markerCount; $i++) {
                if (isset($visited[$i])) {
                    continue;
                }

                $distance = $distances[$currentIndex][$i];

                // Skip if no route exists
                if ($distance === null) {
                    continue;
                }

                if ($distance < $nearestDistance) {
                    $nearestDistance = $distance;
                    $nearestIndex = $i;
                }
            }

            // If no nearest neighbor found (isolated markers), just add the next unvisited
            if ($nearestIndex === null) {
                for ($i = 0; $i < $markerCount; $i++) {
                    if (! isset($visited[$i])) {
                        $nearestIndex = $i;
                        break;
                    }
                }
            }

            if ($nearestIndex !== null) {
                $sortedIndices[] = $nearestIndex;
                $visited[$nearestIndex] = true;
                $currentIndex = $nearestIndex;
            } else {
                // Should not happen, but break to prevent infinite loop
                break;
            }
        }

        // Convert indices back to marker IDs
        return array_map(fn ($index) => $markers[$index]->id, $sortedIndices);
    }

    /**
     * Calculate the total distance for a given marker order.
     *
     * @param  array<int>  $order  Array of marker indices in order
     * @param  array  $distances  Distance matrix
     * @return float Total distance in meters
     */
    public function calculateTotalDistance(array $order, array $distances): float
    {
        $total = 0.0;

        for ($i = 0; $i < count($order) - 1; $i++) {
            $from = $order[$i];
            $to = $order[$i + 1];

            $distance = $distances[$from][$to];

            if ($distance !== null) {
                $total += $distance;
            }
        }

        return $total;
    }
}
