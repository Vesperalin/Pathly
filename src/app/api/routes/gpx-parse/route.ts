import { GpxParsingService } from "@/features/gpx/gpx-parsing.service";
import { handleApiError } from "@/lib/apiErrors";
import { ValidationError } from "@/lib/errors";
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
      throw new ValidationError("No GPX files provided. Please upload at least one .gpx file.", [
        {
          code: "no_files",
          message: "No GPX files provided. Please upload at least one .gpx file.",
          path: [],
        },
      ]);
    }

    // 3. Validate file types and convert to File array
    const validFiles: File[] = [];
    for (const file of gpxFiles) {
      // Check if it's a string (invalid) or File/Blob
      if (typeof file === "string") {
        throw new ValidationError("Invalid file format. Expected file upload, got string.", [
          {
            code: "invalid_file_type",
            message: "Invalid file format. Expected file upload, got string.",
            path: ["gpxFiles"],
          },
        ]);
      }

      // TypeScript narrowing: at this point file is File | Blob
      // In practice, FormData file uploads are File objects
      const fileObj = file as File;

      // Check for .gpx extension
      if (!fileObj.name.toLowerCase().endsWith(".gpx")) {
        throw new ValidationError(`Invalid file type: ${fileObj.name}. Only .gpx files are allowed.`, [
          {
            code: "invalid_extension",
            message: `Invalid file type: ${fileObj.name}. Only .gpx files are allowed.`,
            path: ["gpxFiles", fileObj.name],
          },
        ]);
      }

      if (fileObj.size > 10 * 1024 * 1024) {
        const sizeMB = Math.round(fileObj.size / (1024 * 1024));
        throw new ValidationError(`File too large: ${fileObj.name} (${sizeMB}MB). Maximum allowed size is 10MB.`, [
          {
            code: "file_too_large",
            message: `File too large: ${fileObj.name} (${sizeMB}MB). Maximum allowed size is 10MB.`,
            path: ["gpxFiles", fileObj.name],
          },
        ]);
      }

      validFiles.push(fileObj);
    }

    // 4. Parse and aggregate GPX files
    const gpxService = new GpxParsingService();
    const result = await gpxService.parseAndAggregate(validFiles);

    // 5. Return the aggregated data
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
