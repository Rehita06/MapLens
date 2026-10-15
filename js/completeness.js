
const FIELD_DEFINITIONS = [
  { key: "name", label: "Name", source: "name" },
  { key: "address", label: "Address", source: "address" },
  { key: "phone", label: "Phone", source: "phone" },
  { key: "website", label: "Website", source: "website" },
  { key: "opening_hours", label: "Opening hours", source: "opening_hours" },
  { key: "accessibility", label: "Accessibility", source: "wheelchair" },
  { key: "cuisine", label: "Cuisine", source: "cuisine" }
];

export function getCompleteness(place) {
  const tags = place.tags || {};
  const available = [];
  const missing = [];

  for (const field of FIELD_DEFINITIONS) {
    let value = "";

    if (field.key === "name") {
      value = place.name;
    } else if (field.key === "address") {
      const address = place.raw?.address || {};
      value =
        address.road ||
        address.pedestrian ||
        address.house_number ||
        address.city ||
        address.town ||
        address.village ||
        place.address;
    } else {
      value = tags[field.source];
    }

    const hasValue =
      value !== undefined &&
      value !== null &&
      String(value).trim() !== "";

    if (hasValue) {
      available.push({
        label: field.label,
        value: String(value)
      });
    } else {
      missing.push({
        label: field.label
      });
    }
  }

  const total = FIELD_DEFINITIONS.length;
  const percentage = Math.round((available.length / total) * 100);

  return {
    available,
    missing,
    total,
    percentage
  };
}

export function getCategory(place) {
  const category = String(place.category || "").toLowerCase();
  const type = String(place.type || "").toLowerCase();
  const combined = `${category} ${type}`;

  if (
    /restaurant|cafe|fast_food|food|bar|pub|bakery|ice_cream|food_court/.test(combined)
  ) {
    return "food";
  }

  if (
    /hospital|clinic|doctors|dentist|pharmacy|healthcare|medical|veterinary/.test(combined)
  ) {
    return "health";
  }

  if (
    /school|college|university|kindergarten|education|library/.test(combined)
  ) {
    return "education";
  }

  if (
    /park|garden|nature|forest|playground|recreation|pitch|sports/.test(combined)
  ) {
    return "outdoors";
  }

  return "all";
}

export function getPlaceIcon(place) {
  const category = getCategory(place);

  const icons = {
    food: "🍽️",
    health: "✚",
    education: "🎓",
    outdoors: "🌳",
    all: "📍"
  };

  return icons[category] || "📍";
}
