import { createPopupContent, showFloatingPopup } from "./popup.js";
import { showAndHighlightPolygon } from "./map.js";

let searchInput;
const suggestionsContainer = document.getElementById("search-suggestions");

function initializeSearch(markersLayer, map) {
    searchInput = document.getElementById("search-input");
    searchInput.addEventListener("input", (e) =>
        handleSearch(e, markersLayer, map)
    );

    // Add click event listener to close suggestions
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".search-box")) {
            suggestionsContainer.style.display = "none";
        }
    });
}

function showOnlySelectedMarker(selectedName, markersLayer) {
    markersLayer.eachLayer((layer) => {
        const name = layer.feature.properties.nama_objek;
        if (name === selectedName) {
            layer.addTo(map);
        } else {
            map.removeLayer(layer);
        }
    });
}

function handleSearch(e, markersLayer, map) {
    const searchTerm = e.target.value.toLowerCase();

    if (searchTerm.length < 2) {
        suggestionsContainer.style.display = "none";
        return;
    }

    const suggestions = [];
    markersLayer.eachLayer((layer) => {
        const name = layer.feature.properties.nama_objek;
        if (name.toLowerCase().includes(searchTerm)) {
            suggestions.push(name);
        }
    });

    displaySuggestions(suggestions, markersLayer, map);
    filterBySearchTerm(searchTerm, markersLayer);
}

function displaySuggestions(suggestions, markersLayer, map) {
    if (suggestions.length > 0) {
        suggestionsContainer.innerHTML = "";
        suggestions.forEach((suggestion) => {
            const div = document.createElement("div");
            div.className = "suggestion-item";
            div.textContent = suggestion;
            div.addEventListener("click", () => {
                searchInput.value = suggestion;
                suggestionsContainer.style.display = "none";

                // Hide all markers first
                markersLayer.eachLayer((layer) => {
                    map.removeLayer(layer);
                });

                // Show only the selected marker and its popup
                markersLayer.eachLayer((layer) => {
                    if (layer.feature.properties.nama_objek === suggestion) {
                        // Show the marker
                        layer.addTo(map);

                        // Center the map on the marker
                        const latlng = layer.getLatLng();
                        map.setView(latlng, 16);

                        // Show the floating popup
                        const popupContent = createPopupContent(layer.feature);
                        showFloatingPopup(popupContent, suggestion);

                        // Show and highlight the polygon
                        window.setTimeout(() => {
                            showAndHighlightPolygon(suggestion);
                        }, 100);
                    }
                });
            });
            suggestionsContainer.appendChild(div);
        });
        suggestionsContainer.style.display = "block";
    } else {
        suggestionsContainer.style.display = "none";
    }
}

function filterBySearchTerm(searchTerm, markersLayer) {
    const categorySections = document.querySelectorAll(".category-section");

    categorySections.forEach((section) => {
        let hasVisibleItems = false;
        const items = section.querySelectorAll(".sidebar-item");

        items.forEach((item) => {
            const itemText = item.textContent.toLowerCase();
            if (itemText.includes(searchTerm)) {
                item.style.display = "block";
                hasVisibleItems = true;
                markersLayer.eachLayer((layer) => {
                    if (
                        layer.feature.properties.nama_objek.toLowerCase() ===
                        itemText
                    ) {
                        layer.addTo(map);
                    }
                });
            } else {
                item.style.display = "none";
                markersLayer.eachLayer((layer) => {
                    if (
                        layer.feature.properties.nama_objek.toLowerCase() ===
                        itemText
                    ) {
                        map.removeLayer(layer);
                    }
                });
            }
        });

        section.style.display = hasVisibleItems ? "block" : "none";
    });
}

export { initializeSearch };
