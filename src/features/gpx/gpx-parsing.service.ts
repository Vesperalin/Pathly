import type { GpxParseResultDto } from "@/types";
import gpxParser from "gpxparser";

/**
 * Configuration for elevation calculation
 */
const ELEVATION_CONFIG = {
  // Minimum elevation change to count (meters) - filters out GPS noise
  THRESHOLD: 4,
  // Window size for smoothing filter
  SMOOTHING_WINDOW: 5,
};

/**
 * Service for parsing and aggregating GPX file data.
 * Extracts route metrics from one or more GPX files and returns aggregated results.
 */
export class GpxParsingService {
  /**
   * Parses multiple GPX files and aggregates their data.
   *
   * @param files - Array of GPX files to parse
   * @returns Promise resolving to aggregated route data
   * @throws Error if any file fails to parse or contains invalid data
   */
  async parseAndAggregate(files: File[]): Promise<GpxParseResultDto> {
    if (!files || files.length === 0) {
      throw new Error("No files provided for parsing");
    }

    const parsedResults = await Promise.all(files.map(async (file) => this.parseFile(file)));

    return this.aggregateResults(parsedResults);
  }

  /**
   * Parses a single GPX file and extracts route metrics.
   *
   * @param file - GPX file to parse
   * @returns Promise resolving to parsed route data
   * @throws Error if file fails to parse or contains invalid data
   */
  private async parseFile(file: File): Promise<GpxParseResultDto> {
    try {
      // Read file content as text
      const fileContent = await file.text();

      // Parse GPX content
      const gpx = new gpxParser();
      gpx.parse(fileContent);

      // Validate that GPX has tracks with points
      if (!gpx.tracks || gpx.tracks.length === 0) {
        throw new Error(`File ${file.name} contains no tracks`);
      }

      // Extract metrics from all tracks in the file
      let totalDistance = 0;
      let totalAscent = 0;
      let totalDescent = 0;
      let earliestDate: Date | null = null;
      let startTime: Date | null = null;
      let endTime: Date | null = null;

      // Collect all elevation points for custom calculation
      const allElevationPoints: number[] = [];

      for (const track of gpx.tracks) {
        // Accumulate distance (convert from km to meters if needed)
        if (track.distance?.total) {
          totalDistance += track.distance.total;
        }

        // Collect elevation data from track points for custom calculation
        for (const point of track.points || []) {
          // Collect elevation data
          if (point.ele !== undefined && point.ele !== null) {
            allElevationPoints.push(point.ele);
          }

          // Extract dates from track points
          if (point.time) {
            const pointDate = new Date(point.time);

            if (!earliestDate || pointDate < earliestDate) {
              earliestDate = pointDate;
            }

            if (!startTime || pointDate < startTime) {
              startTime = pointDate;
            }

            if (!endTime || pointDate > endTime) {
              endTime = pointDate;
            }
          }
        }
      }

      // Calculate elevation with smoothing and threshold
      const elevationData = this.calculateElevationGain(allElevationPoints);
      totalAscent = elevationData.ascent;
      totalDescent = elevationData.descent;

      // Calculate duration in seconds
      let duration: number | null = null;
      if (startTime && endTime) {
        const durationMs = endTime.getTime() - startTime.getTime();
        duration = Math.round(durationMs / 1000); // Convert to seconds
      }

      // Format date as ISO string (YYYY-MM-DD)
      const routeDate = earliestDate
        ? earliestDate.toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      return {
        route_date: routeDate,
        distance: Math.round(totalDistance), // Round to nearest meter
        total_ascent: Math.round(totalAscent),
        total_descent: Math.round(totalDescent),
        duration: duration ?? 0,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown parsing error";
      throw new Error(`Failed to parse file ${file.name}: ${errorMessage}`);
    }
  }

  /**
   * Calculates elevation gain and loss with smoothing and threshold filtering.
   * This provides more accurate results than raw GPS elevation data.
   *
   * @param elevations - Array of elevation values in meters
   * @returns Object with ascent and descent in meters
   */
  private calculateElevationGain(elevations: number[]): { ascent: number; descent: number } {
    if (elevations.length < 2) {
      return { ascent: 0, descent: 0 };
    }

    // Step 1: Apply smoothing filter to reduce GPS noise
    const smoothed = this.smoothElevations(elevations);

    // Step 2: Calculate cumulative elevation changes with threshold
    let totalAscent = 0;
    let totalDescent = 0;
    let cumulativeChange = 0;

    for (let i = 1; i < smoothed.length; i++) {
      const elevationChange = smoothed[i] - smoothed[i - 1];
      cumulativeChange += elevationChange;

      // Only count changes that exceed the threshold
      if (cumulativeChange >= ELEVATION_CONFIG.THRESHOLD) {
        totalAscent += cumulativeChange;
        cumulativeChange = 0;
      } else if (cumulativeChange <= -ELEVATION_CONFIG.THRESHOLD) {
        totalDescent += Math.abs(cumulativeChange);
        cumulativeChange = 0;
      }
    }

    return {
      ascent: Math.round(totalAscent),
      descent: Math.round(totalDescent),
    };
  }

  /**
   * Applies a moving average filter to smooth elevation data.
   * Reduces GPS noise while preserving the overall elevation profile.
   *
   * @param elevations - Array of raw elevation values
   * @returns Smoothed elevation values
   */
  private smoothElevations(elevations: number[]): number[] {
    const windowSize = ELEVATION_CONFIG.SMOOTHING_WINDOW;
    const smoothed: number[] = [];

    for (let i = 0; i < elevations.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(elevations.length, i + Math.ceil(windowSize / 2));
      const window = elevations.slice(start, end);
      const average = window.reduce((sum, val) => sum + val, 0) / window.length;
      smoothed.push(average);
    }

    return smoothed;
  }

  /**
   * Aggregates results from multiple parsed GPX files.
   * Sums numerical values and finds the earliest date.
   *
   * @param results - Array of parsed route data
   * @returns Aggregated route data
   */
  private aggregateResults(results: GpxParseResultDto[]): GpxParseResultDto {
    let totalDistance = 0;
    let totalAscent = 0;
    let totalDescent = 0;
    let totalDuration = 0;
    let earliestDate: string | null = null;

    for (const result of results) {
      totalDistance += result.distance ?? 0;
      totalAscent += result.total_ascent ?? 0;
      totalDescent += result.total_descent ?? 0;
      totalDuration += result.duration ?? 0;

      if (result.route_date && (!earliestDate || result.route_date < earliestDate)) {
        earliestDate = result.route_date;
      }
    }

    return {
      route_date: earliestDate ?? new Date().toISOString().split("T")[0],
      distance: totalDistance,
      total_ascent: totalAscent,
      total_descent: totalDescent,
      duration: totalDuration,
    };
  }
}
