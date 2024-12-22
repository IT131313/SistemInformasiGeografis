import {
    getFeatureByName,
    refreshMap
} from "./map.js";

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
                <button class="delete-button">
                    Delete
                </button>
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

    const deleteButton = popupContent.querySelector(".delete-button");
    if (deleteButton) {
        deleteButton.addEventListener("click", () => {
            if (confirm(`Are you sure you want to delete "${objectName}"?`)) {
                fetch("/delete_data", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nama_objek: objectName })  
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert(`Object '${objectName}' deleted successfully.`);
                        refreshMap()
                    } else {
                        alert(`An error occurred while deleting the object.`);
                    }
                })
                .catch(error => {
                    console.error("Error deleting the object:", error);
                    alert("An error occurred while deleting the object.");
                });
            }
        }
    )}

    const editButton = popupContent.querySelector(".edit-button");
    if (editButton){
        editButton.addEventListener("click", () => {
            const feature = getFeatureByName(objectName);

            if (!feature) {
                alert(`Feature "${objectName}" not found.`);
                return;
            }

            const editForm = `
                <div id="edit-form">
                    <h3>Edit ${objectName}</h3>
                    <label>
                        Category:
                        <input type="text" id="edit-category" value="${feature.properties.jenis_obje}">
                    </label>
                    <label>
                        Coordinates (for points):
                        <input type="text" id="edit-coordinates" value="${feature.geometry.type === "Point" ? feature.geometry.coordinates.join(", ") : ""}">
                    </label>
                    <button onclick="submitEdit('${objectName}')">Save Changes</button>
                    <button onclick="closeEditForm()">Cancel</button>
                </div>`;
        document.body.insertAdjacentHTML("beforeend", editForm);
        })
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

function closeEditForm() {
    const form = document.getElementById("edit-form");
    if (form) form.remove();
}

function submitEdit(objectName) {
    const newCategory = document.getElementById("edit-category").value;
    const newCoordinates = document.getElementById("edit-coordinates").value;

    const newGeometry = newCoordinates
        ? {
              type: "Point",
              coordinates: newCoordinates.split(",").map((coord) => parseFloat(coord.trim())),
          }
        : null;

    fetch(`/edit_data`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            nama_objek: objectName,
            newProperties: { jenis_obje: newCategory },
            newGeometry: newGeometry,
        }),
    })
        .then((response) => {
            if (response.ok) {
                console.log(`Feature "${objectName}" edited successfully.`);
                alterFeature(objectName, { jenis_obje: newCategory }, newGeometry);
                alert(`Feature "${objectName}" has been updated.`);
                closeEditForm();
            } else {
                alert(`Failed to edit "${objectName}".`);
            }
        })
        .catch((error) => {
            console.error("Error editing feature:", error);
            alert(`An error occurred while editing "${objectName}".`);
        });
}
