
import { searchPlaces } from "./api.js";
import {
  getCompleteness,
  getCategory,
  getPlaceIcon
} from "./completeness.js";
import { saveReport } from "./reports.js";

const searchForm = document.querySelector("#searchForm");
const searchInput = document.querySelector("#searchInput");
const searchButton = document.querySelector("#searchButton");

const statusMessage = document.querySelector("#statusMessage");
const loadingState = document.querySelector("#loadingState");
const emptyState = document.querySelector("#emptyState");
const noResultsState = document.querySelector("#noResultsState");

const resultsList = document.querySelector("#resultsList");
const resultsCount = document.querySelector("#resultsCount");
const resultsBadge = document.querySelector("#resultsBadge");

const filterButtons = document.querySelectorAll("[data-category]");

const detailsPlaceholder = document.querySelector("#detailsPlaceholder");
const placeDetails = document.querySelector("#placeDetails");
const placeCategory = document.querySelector("#placeCategory");
const placeName = document.querySelector("#placeName");
const placeAddress = document.querySelector("#placeAddress");

const completenessScore = document.querySelector("#completenessScore");
const completenessProgress = document.querySelector("#completenessProgress");
const completenessBar = document.querySelector("#completenessBar");
const completenessSummary = document.querySelector("#completenessSummary");

const availableFields = document.querySelector("#availableFields");
const missingFields = document.querySelector("#missingFields");

const reportButton = document.querySelector("#reportButton");
const osmLink = document.querySelector("#osmLink");

const reportSection = document.querySelector("#reportSection");
const reportForm = document.querySelector("#reportForm");
const reportPlace = document.querySelector("#reportPlace");
const reportType = document.querySelector("#reportType");
const reportDescription = document.querySelector("#reportDescription");
const reportFeedback = document.querySelector("#reportFeedback");

const currentYear = document.querySelector("#currentYear");

let allPlaces = [];
let selectedPlaceId = null;
let activeCategory = "all";
let requestNumber = 0;

currentYear.textContent = new Date().getFullYear();

function showStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`.trim();
  statusMessage.hidden = !message;
}

function setLoading(isLoading) {
  loadingState.hidden = !isLoading;
  searchButton.disabled = isLoading;
  searchInput.disabled = isLoading;
  searchButton.textContent = isLoading
    ? "Searching..."
    : "Search places →";
}

function renderFieldChips(container, fields, isMissing = false) {
  container.replaceChildren();

  if (fields.length === 0) {
    const message = document.createElement("span");
    message.className = "field-empty";
    message.textContent = isMissing
      ? "No missing fields in this checklist."
      : "No recorded fields available.";
    container.append(message);
    return;
  }

  for (const field of fields) {
    const chip = document.createElement("span");
    chip.className = isMissing
      ? "field-chip missing"
      : "field-chip";

    chip.textContent = isMissing
      ? field.label
      : `${field.label}: ${field.value}`;

    container.append(chip);
  }
}

function renderDetails(place) {
  if (!place) {
    detailsPlaceholder.hidden = false;
    placeDetails.hidden = true;
    selectedPlaceId = null;
    return;
  }

  selectedPlaceId = place.id;

  detailsPlaceholder.hidden = true;
  placeDetails.hidden = false;

  placeCategory.textContent =
    `${place.category} · ${place.type}`.replaceAll("_", " ");

  placeName.textContent = place.name;
  placeAddress.textContent = place.address;

  const summary = getCompleteness(place);

  completenessScore.textContent = `${summary.percentage}%`;
  completenessBar.style.width = `${summary.percentage}%`;
  completenessProgress.setAttribute(
    "aria-valuenow",
    String(summary.percentage)
  );

  completenessSummary.textContent =
    `${summary.available.length} of ${summary.total} checklist fields are recorded in this result.`;

  renderFieldChips(availableFields, summary.available);
  renderFieldChips(missingFields, summary.missing, true);

  if (place.osmType && place.osmId) {
    const osmTypes = {
      node: "node",
      way: "way",
      relation: "relation"
    };

    const safeType = osmTypes[place.osmType];

    if (safeType) {
      osmLink.href =
        `https://www.openstreetmap.org/${safeType}/${encodeURIComponent(place.osmId)}`;
    } else {
      osmLink.href = "https://www.openstreetmap.org/";
    }
  } else {
    osmLink.href = "https://www.openstreetmap.org/";
  }

  reportPlace.value = place.name;
  renderResults();
}

function renderResults() {
  const filteredPlaces = allPlaces.filter((place) => {
    return activeCategory === "all" ||
      getCategory(place) === activeCategory;
  });

  resultsList.replaceChildren();

  resultsCount.textContent = allPlaces.length
    ? `${filteredPlaces.length} matching place(s)`
    : "No places loaded yet";

  resultsBadge.textContent =
    `${filteredPlaces.length} place${filteredPlaces.length === 1 ? "" : "s"}`;

  noResultsState.hidden =
    allPlaces.length === 0 || filteredPlaces.length !== 0;

  for (const place of filteredPlaces) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "result-card";

    if (place.id === selectedPlaceId) {
      card.classList.add("selected");
    }

    card.setAttribute(
      "aria-pressed",
      String(place.id === selectedPlaceId)
    );

    const icon = document.createElement("span");
    icon.className = "result-icon";
    icon.textContent = getPlaceIcon(place);

    const copy = document.createElement("span");
    copy.className = "result-copy";

    const title = document.createElement("strong");
    title.textContent = place.name;

    const address = document.createElement("p");
    address.textContent = place.address;

    const meta = document.createElement("span");
    meta.className = "result-meta";

    const categoryTag = document.createElement("span");
    categoryTag.className = "result-tag";
    categoryTag.textContent =
      `${place.category} · ${place.type}`.replaceAll("_", " ");

    const completenessTag = document.createElement("span");
    completenessTag.className = "result-tag";
    completenessTag.textContent =
      `${getCompleteness(place).percentage}% checklist recorded`;

    meta.append(categoryTag, completenessTag);
    copy.append(title, address, meta);

    const arrow = document.createElement("span");
    arrow.className = "result-arrow";
    arrow.textContent = "→";
    arrow.setAttribute("aria-hidden", "true");

    card.append(icon, copy, arrow);

    card.addEventListener("click", () => {
      renderDetails(place);
    });

    resultsList.append(card);
  }
}

function setActiveFilter(category) {
  activeCategory = category;

  filterButtons.forEach((button) => {
    const isActive = button.dataset.category === category;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  renderResults();
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveFilter(button.dataset.category);
  });
});

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!searchForm.reportValidity()) {
    return;
  }

  const query = searchInput.value.trim();

  if (query.length < 2) {
    showStatus("Please enter at least 2 characters.", "error");
    searchInput.focus();
    return;
  }

  const thisRequest = ++requestNumber;

  showStatus("");
  emptyState.hidden = true;
  noResultsState.hidden = true;
  setLoading(true);

  try {
    const places = await searchPlaces(query);

    if (thisRequest !== requestNumber) {
      return;
    }

    allPlaces = places;
    selectedPlaceId = null;

    if (places.length === 0) {
      resultsList.replaceChildren();
      resultsCount.textContent = "No places found";
      resultsBadge.textContent = "0 places";
      detailsPlaceholder.hidden = false;
      placeDetails.hidden = true;
      emptyState.hidden = true;
      noResultsState.hidden = false;

      showStatus(
        "No places matched that search. Try a nearby city, landmark, or a more specific name."
      );
      return;
    }

    renderResults();

    const firstVisiblePlace = allPlaces.find((place) => {
      return activeCategory === "all" ||
        getCategory(place) === activeCategory;
    });

    if (firstVisiblePlace) {
      renderDetails(firstVisiblePlace);
    } else {
      renderDetails(null);
      showStatus(
        "Places were found, but none match the selected category. Choose All places or another category."
      );
    }
  } catch (error) {
    if (thisRequest !== requestNumber) {
      return;
    }

    allPlaces = [];
    selectedPlaceId = null;
    resultsList.replaceChildren();
    resultsCount.textContent = "Search unavailable";
    resultsBadge.textContent = "0 places";
    detailsPlaceholder.hidden = false;
    placeDetails.hidden = true;
    emptyState.hidden = true;
    noResultsState.hidden = true;

    showStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong. Please try again.",
      "error"
    );
  } finally {
    if (thisRequest === requestNumber) {
      setLoading(false);
    }
  }
});

reportButton.addEventListener("click", () => {
  reportSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  reportPlace.focus({ preventScroll: true });
});

reportForm.addEventListener("submit", (event) => {
  event.preventDefault();

  reportFeedback.hidden = false;
  reportFeedback.className = "form-feedback";
  reportFeedback.textContent = "";

  if (!reportForm.reportValidity()) {
    return;
  }

  try {
    const saved = saveReport({
      place: reportPlace.value,
      type: reportType.value,
      description: reportDescription.value
    });

    reportFeedback.textContent =
      `Suggestion saved in this browser for "${saved.place}". It has not been sent to OpenStreetMap.`;

    reportForm.reset();
    reportFeedback.hidden = false;
    reportFeedback.className = "form-feedback";

    if (selectedPlaceId) {
      const selected = allPlaces.find(
        (place) => place.id === selectedPlaceId
      );

      if (selected) {
        reportPlace.value = selected.name;
      }
    }
  } catch (error) {
    reportFeedback.textContent =
      error instanceof Error
        ? error.message
        : "Could not save your suggestion.";

    reportFeedback.className = "form-feedback error";
    reportFeedback.hidden = false;
  }
});
