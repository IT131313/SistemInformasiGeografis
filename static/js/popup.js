function createPopupContent(feature) {
    return `
        <div class="popup-container">
            <h3 class="popup-title">${feature.properties.nama_objek}</h3>
            <div class="popup-details">
                <div class="popup-item">
                    <span class="popup-value">${feature.properties.jenis_obje}</span>
                </div>
                <div class="popup-item">
                    <span class="popup-value">${feature.properties.alamat}</span>
                </div>
                <div class="popup-item">
                    <span class="popup-label">Informasi</span>
                    <span class="popup-value">${feature.properties.deskripsi}</span>
                </div>
            </div>
            <button class="route-button">
                Tampilkan Rute
            </button>
        </div>
    `;
}

function initializeFloatingPopup() {
    const floatingPopup = document.getElementById("floating-popup");
    const closeButton = floatingPopup.querySelector(".close-button");

    closeButton.addEventListener("click", () => {
        floatingPopup.style.display = "none";
        // Call hidePolygonByObjectName when closing popup
        if (window.currentObjectName) {
            window.hidePolygonByObjectName(window.currentObjectName);
            window.currentObjectName = null;
        }
    });

    return floatingPopup;
}

function showFloatingPopup(content, objectName) {
    const floatingPopup = document.getElementById("floating-popup");
    const popupContent = document.getElementById("popup-content");
    popupContent.innerHTML = content;

    // Add event listener to route button
    const routeButton = popupContent.querySelector(".route-button");
    if (routeButton) {
        routeButton.addEventListener("click", () => {
            // Find the marker coordinates for the selected object
            const marker = findMarkerByName(objectName);
            if (marker) {
                // Call the routing function with the marker's coordinates
                window.addRouting(marker.getLatLng(), window.map);
            }
        });
    }

    floatingPopup.style.display = "block";
    window.currentObjectName = objectName;
}

// Add this new helper function
function findMarkerByName(objectName) {
    let foundMarker = null;
    window.markersLayer.eachLayer((layer) => {
        if (layer.feature.properties.nama_objek === objectName) {
            foundMarker = layer;
        }
    });
    return foundMarker;
}

export { createPopupContent, initializeFloatingPopup, showFloatingPopup };
