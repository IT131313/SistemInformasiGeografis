import { reloadGeoJSONData } from "./map.js";

let isAddingPoint = false;
let isAddingArea = false;
let tempMarkerLayer = L.layerGroup();
let tempLayerGroup = L.layerGroup();
let tempLatLng = null;
let areaCoordinates = [];
let mapInstance;

export function initializeAddData(map) {
    mapInstance = map;
    tempMarkerLayer.addTo(map);
    tempLayerGroup.addTo(map);
    setupEventListeners();
}

function setupEventListeners() {
    // Point form submission
    document
        .getElementById("point-form")
        .addEventListener("submit", async function (e) {
            e.preventDefault();
            await handlePointFormSubmit();
        });

    // Area form submission
    document
        .getElementById("area-form")
        .addEventListener("submit", async function (e) {
            e.preventDefault();
            await handleAreaFormSubmit();
        });

    // Map click handlers
    mapInstance.on("click", function (e) {
        if (isAddingPoint) {
            showPointForm(e.latlng);
        }
        if (isAddingArea) {
            handleAreaClick(e.latlng);
        }
    });

    // Double click for area completion
    mapInstance.on("dblclick", function () {
        if (!isAddingArea || areaCoordinates.length < 3) return;
        completeAreaDrawing();
    });

    // Escape key handler
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (isAddingArea) deactivateAddArea();
            if (isAddingPoint) deactivateAddPoint();
        }
    });
}

// Point functions
export function activateAddPoint() {
    const addPointButton = document.getElementById("addPointButton");
    isAddingPoint = true;
    tempMarkerLayer.clearLayers();
    addPointButton.classList.add("active");
    addPointButton.innerHTML = '<span class="material-icons">close</span>Batal';
}

export function deactivateAddPoint() {
    const addPointButton = document.getElementById("addPointButton");
    isAddingPoint = false;
    tempMarkerLayer.clearLayers();
    addPointButton.classList.remove("active");
    addPointButton.innerHTML =
        '<span class="material-icons">add_location</span>Tambah Titik';
}

// Area functions
export function activateAddArea() {
    const addAreaButton = document.getElementById("addAreaButton");
    isAddingArea = true;
    areaCoordinates = [];
    tempLayerGroup.clearLayers();
    addAreaButton.classList.add("active");
    addAreaButton.innerHTML = '<span class="material-icons">close</span>Batal';
}

export function deactivateAddArea() {
    const addAreaButton = document.getElementById("addAreaButton");
    isAddingArea = false;
    areaCoordinates = [];
    tempLayerGroup.clearLayers();
    addAreaButton.classList.remove("active");
    addAreaButton.innerHTML =
        '<span class="material-icons">add_chart</span>Tambah Area';
}

function showPointForm(latlng) {
    tempLatLng = latlng;
    document.getElementById("modal-overlay").style.display = "block";
    document.getElementById("point-form-popup").style.display = "block";
    mapInstance.dragging.disable();
    mapInstance.touchZoom.disable();
    mapInstance.doubleClickZoom.disable();
    mapInstance.scrollWheelZoom.disable();
}

function closePointForm() {
    document.getElementById("modal-overlay").style.display = "none";
    document.getElementById("point-form-popup").style.display = "none";
    document.getElementById("point-form").reset();
    mapInstance.dragging.enable();
    mapInstance.touchZoom.enable();
    mapInstance.doubleClickZoom.enable();
    mapInstance.scrollWheelZoom.enable();
}

function handleAreaClick(latlng) {
    const { lat, lng } = latlng;
    areaCoordinates.push([lng, lat]);
    L.circleMarker([lat, lng], {
        radius: 5,
        color: "#FF0000",
        fillOpacity: 0.8,
    }).addTo(tempLayerGroup);
}

function completeAreaDrawing() {
    if (
        areaCoordinates[0][0] !==
            areaCoordinates[areaCoordinates.length - 1][0] ||
        areaCoordinates[0][1] !== areaCoordinates[areaCoordinates.length - 1][1]
    ) {
        areaCoordinates.push(areaCoordinates[0]);
    }
    showAreaForm();
}

function showAreaForm() {
    document.getElementById("modal-overlay").style.display = "block";
    document.getElementById("area-form-popup").style.display = "block";
    mapInstance.dragging.disable();
    mapInstance.touchZoom.disable();
    mapInstance.doubleClickZoom.disable();
    mapInstance.scrollWheelZoom.disable();
}

function closeAreaForm() {
    document.getElementById("modal-overlay").style.display = "none";
    document.getElementById("area-form-popup").style.display = "none";
    document.getElementById("area-form").reset();
    mapInstance.dragging.enable();
    mapInstance.touchZoom.enable();
    mapInstance.doubleClickZoom.enable();
    mapInstance.scrollWheelZoom.enable();
}

function calculateCentroid(coords) {
    let xSum = 0,
        ySum = 0;
    const numPoints = coords.length;
    coords.forEach((coord) => {
        xSum += coord[0];
        ySum += coord[1];
    });
    return [xSum / numPoints, ySum / numPoints];
}

async function handlePointFormSubmit() {
    const pointData = {
        latitude: tempLatLng.lat,
        longitude: tempLatLng.lng,
        nama_objek: document.getElementById("point-name").value,
        jenis_obje: document.getElementById("point-type").value,
        alamat: document.getElementById("point-address").value,
        deskripsi: document.getElementById("point-description").value,
    };

    try {
        const response = await fetch("/add_point", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pointData),
        });
        const data = await response.json();

        if (data.success) {
            closePointForm();
            deactivateAddPoint();
            reloadGeoJSONData();
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error("Error adding point:", error);
        alert("An unexpected error occurred.");
    }
}

async function handleAreaFormSubmit() {
    const areaData = {
        polygon: [areaCoordinates],
        centroid: calculateCentroid(areaCoordinates),
        nama_objek: document.getElementById("area-name").value,
        jenis_obje: document.getElementById("area-type").value,
        alamat: document.getElementById("area-address").value,
        deskripsi: document.getElementById("area-description").value,
    };

    try {
        const response = await fetch("/add_polygon", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(areaData),
        });
        const data = await response.json();

        if (data.success) {
            closeAreaForm();
            deactivateAddArea();
            reloadGeoJSONData();
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error("Error adding area:", error);
        alert("An unexpected error occurred.");
    }
}

// Make form closing functions globally available
window.closePointForm = closePointForm;
window.closeAreaForm = closeAreaForm;
