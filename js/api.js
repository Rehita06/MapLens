
const NOMINATIM_URL =
  "https://nominatim.openstreetmap.org/search";

export async function searchPlaces(query) {
  const cleanedQuery = query.trim();

  if (cleanedQuery.length < 2) {
    throw new Error("Please enter at least 2 characters.");
  }

  const params = new URLSearchParams({
    q: cleanedQuery,
    format: "jsonv2",
    addressdetails: "1",
    namedetails: "1",
    extratags: "1",
    limit: "12"
  });

  const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(
      `The place search service returned an error (${response.status}). Please try again later.`
    );
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("The search service returned an unexpected response.");
  }

  return data.map((item) => ({
    id: `${item.osm_type || "place"}-${item.osm_id || item.place_id}`,
    osmType: item.osm_type || "",
    osmId: item.osm_id || "",
    name:
      item.name ||
      item.namedetails?.name ||
      item.display_name?.split(",")[0] ||
      "Unnamed place",
    address: item.display_name || "Address not available",
    category: item.category || item.class || "place",
    type: item.type || "unknown",
    lat: item.lat,
    lon: item.lon,
    tags: {
      ...(item.extratags || {}),
      ...(item.namedetails || {})
    },
    raw: item
  }));
}
