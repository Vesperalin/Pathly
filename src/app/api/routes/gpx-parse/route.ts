import { GpxParsingService } from "@/features/gpx/gpx-parsing.service";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/routes/gpx-parse
 *
 * Parses one or more GPX files and returns aggregated route data.
 * This endpoint does not create any database records.
 *
 * @param request - The incoming HTTP request with multipart/form-data
 * @returns JSON response with aggregated route data or error
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Extract files from the request
    const formData = await request.formData();
    const gpxFiles = formData.getAll("gpxFiles");

    // 2. Validate that files were provided
    if (!gpxFiles || gpxFiles.length === 0) {
      return NextResponse.json(
        { error: "No GPX files provided. Please upload at least one .gpx file." },
        { status: 400 }
      );
    }

    // 3. Validate file types and convert to File array
    const validFiles: File[] = [];
    for (const file of gpxFiles) {
      // Check if it's a string (invalid) or File/Blob
      if (typeof file === "string") {
        return NextResponse.json({ error: "Invalid file format. Expected file upload, got string." }, { status: 400 });
      }

      // TypeScript narrowing: at this point file is File | Blob
      // In practice, FormData file uploads are File objects
      const fileObj = file as File;

      // Check for .gpx extension
      if (!fileObj.name.toLowerCase().endsWith(".gpx")) {
        return NextResponse.json(
          {
            error: `Invalid file type: ${fileObj.name}. Only .gpx files are allowed.`,
          },
          { status: 400 }
        );
      }

      validFiles.push(fileObj);
    }

    // 4. Parse and aggregate GPX files
    const gpxService = new GpxParsingService();
    const result = await gpxService.parseAndAggregate(validFiles);

    // 5. Return the aggregated data
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // Log the error for debugging
    // eslint-disable-next-line no-console
    console.error("Error parsing GPX files:", error);

    // Distinguish between parsing errors (400) and server errors (500)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    // If the error message indicates a parsing issue, return 400
    if (
      errorMessage.includes("Failed to parse") ||
      errorMessage.includes("contains no tracks") ||
      errorMessage.includes("No files provided")
    ) {
      return NextResponse.json(
        {
          error: `GPX parsing error: ${errorMessage}`,
        },
        { status: 400 }
      );
    }

    // For all other errors, return 500
    return NextResponse.json(
      {
        error: "An internal server error occurred while processing your GPX files.",
      },
      { status: 500 }
    );
  }
}
