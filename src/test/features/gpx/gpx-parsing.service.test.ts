import { GpxParsingService } from "@/features/gpx/gpx-parsing.service";
import { vi } from "vitest";

function buildGpx(points: { lat: number; lon: number; ele?: number; time?: string }[]) {
  const segments = points
    .map((point) => {
      const elevation = point.ele !== undefined ? `<ele>${point.ele}</ele>` : "";
      const time = point.time ? `<time>${point.time}</time>` : "";
      return `<trkpt lat="${point.lat}" lon="${point.lon}">${elevation}${time}</trkpt>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
  <gpx>
    <trk>
      <trkseg>
        ${segments}
      </trkseg>
    </trk>
  </gpx>`;
}

function createGpxFile(name: string, content: string): File {
  return {
    name,
    async text() {
      return content;
    },
  } as unknown as File;
}

describe("GPX import/parsing behaviours", () => {
  const service = new GpxParsingService();

  it("calculates distance, elevation and duration for a valid file", async () => {
    const file = createGpxFile(
      "route.gpx",
      buildGpx([
        { lat: 0, lon: 0, ele: 100, time: "2024-01-01T10:00:00Z" },
        { lat: 0, lon: 0.0005, ele: 120, time: "2024-01-01T10:05:00Z" },
        { lat: 0, lon: 0.001, ele: 140, time: "2024-01-01T10:10:00Z" },
        { lat: 0, lon: 0.0015, ele: 160, time: "2024-01-01T10:15:00Z" },
      ])
    );

    const result = await service.parseAndAggregate([file]);

    expect(result.route_date).toBe("2024-01-01");
    expect(result.distance).toBeGreaterThan(100);
    expect(result.total_ascent).toBeGreaterThan(0);
    expect(result.total_descent).toBe(0);
    expect(result.duration).toBe(900);
  });

  it("throws an error for a corrupted GPX file", async () => {
    const brokenFile = createGpxFile("broken.gpx", "<gpx><trk></gpx>");

    await expect(service.parseAndAggregate([brokenFile])).rejects.toThrow(/Failed to parse file/);
  });

  it("aggregates values from multiple files", async () => {
    const fileA = createGpxFile(
      "a.gpx",
      buildGpx([
        { lat: 0, lon: 0, ele: 100, time: "2024-01-01T10:00:00Z" },
        { lat: 0, lon: 0.0005, ele: 120, time: "2024-01-01T10:05:00Z" },
      ])
    );

    const fileB = createGpxFile(
      "b.gpx",
      buildGpx([
        { lat: 0, lon: 0.001, ele: 200, time: "2024-01-05T08:00:00Z" },
        { lat: 0, lon: 0.0015, ele: 180, time: "2024-01-05T08:10:00Z" },
      ])
    );

    const result = await service.parseAndAggregate([fileA, fileB]);

    expect(result.distance).toBeGreaterThan(100);
    expect(result.duration).toBeGreaterThan(0);
    expect(result.route_date).toBe("2024-01-01");
  });

  it("falls back to the current date when timestamps are missing", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-03-10T12:00:00Z"));

    const file = createGpxFile(
      "no-date.gpx",
      buildGpx([
        { lat: 0, lon: 0, ele: 100 },
        { lat: 0, lon: 0.0005, ele: 110 },
      ])
    );

    try {
      const result = await service.parseAndAggregate([file]);
      expect(result.route_date).toBe("2024-03-10");
    } finally {
      vi.useRealTimers();
    }
  });
});
