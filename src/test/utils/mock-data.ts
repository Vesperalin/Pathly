/**
 * Mockowane dane testowe dla testów jednostkowych
 */

export const mockProfile = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  email: "test@example.com",
  display_name: "Test User",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

export const mockRoute = {
  id: "123e4567-e89b-12d3-a456-426614174001",
  user_id: mockProfile.id,
  name: "Testowa Trasa",
  distance: 10.5,
  ascent: 500,
  descent: 450,
  duration: 180,
  date: "2024-01-15",
  got_points: 15,
  notes: "Piękna pogoda",
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
};

export const mockCatalog = {
  id: "123e4567-e89b-12d3-a456-426614174002",
  user_id: mockProfile.id,
  name: "Ulubione",
  description: "Moje ulubione trasy",
  is_public: false,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

export const mockMountainGroup = {
  id: "123e4567-e89b-12d3-a456-426614174003",
  name: "Tatry",
  code: "TAT",
  region: "Polska",
};

export const mockGPXData = {
  name: "Trasa z GPS",
  distance: 12.3,
  ascent: 600,
  descent: 550,
  duration: 240,
  date: "2024-01-20",
  coordinates: [
    { lat: 49.2794, lon: 19.949, ele: 1000 },
    { lat: 49.2795, lon: 19.9491, ele: 1010 },
  ],
};
