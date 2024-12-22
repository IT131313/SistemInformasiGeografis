import { initializeSearch } from './search.js';
import { initializeRouting, addRouting } from './routing.js';
import { createPopupContent } from './popup.js';
import { initializeCategories } from './category.js';

// Make addRouting available globally for popup buttons
window.addRouting = addRouting;

// Map Configuration
const MAP_CONFIG = {
    center: [-5.4295, 105.2610],
    zoom: 13,
    maxZoom: 19
};

// Initialize map and global variables
const map = L.map('map').setView(MAP_CONFIG.center, MAP_CONFIG.zoom);
let markersLayer;
let categories = new Set();

// Make map available globally
window.map = map;

// Add base tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: MAP_CONFIG.maxZoom,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Store references to polygons for highlighting
let polygonsLayerGroup = L.layerGroup().addTo(map);

// Fetch and display GeoJSON data (points and polygons from /get_geojson_data)
fetch('/get_geojson_data')
    .then(response => response.json())
    .then(data => {
        // Separate points and polygons
        markersLayer = L.geoJSON(data, {
            filter: feature => feature.properties.geometry_type === 'Point',
            onEachFeature: (feature, layer) => {
                layer.bindPopup(createPopupContent(feature, map));
                categories.add(feature.properties.jenis_obje);

                // Add click event to show related polygon
                layer.on('click', () => showAndHighlightPolygon(feature.properties.nama_objek));

                // Hide polygon when popup closes
                layer.on('popupclose', () => hidePolygonByObjectName(feature.properties.nama_objek));
            }
        }).addTo(map);

        const polygonsLayer = L.geoJSON(data, {
            filter: feature => feature.properties.geometry_type === 'Polygon',
            style: {
                color: "#0078FF",
                weight: 2,
                fillOpacity: 0.3
            },
            onEachFeature: (feature, layer) => {
                polygonsLayerGroup.addLayer(layer);
                map.removeLayer(layer); // Initially hide all polygons
            }
        });

        // Make markersLayer globally available
        window.markersLayer = markersLayer;

        // Initialize other components
        initializeSearch(markersLayer, map);
        initializeRouting(map);
        initializeCategories(categories, markersLayer, map);
    })
    .catch(error => console.error("Error fetching GeoJSON data:", error));

// Function to hide all polygons
function hideAllPolygons() {
    polygonsLayerGroup.eachLayer(layer => map.removeLayer(layer));
}

// Function to show and highlight a specific polygon
function showAndHighlightPolygon(objectName) {
    polygonsLayerGroup.eachLayer(layer => {
        if (layer.feature && layer.feature.properties.nama_objek === objectName) {
            layer.setStyle({
                color: "#FF0000",
                weight: 3,
                fillOpacity: 0.5
            });
            map.addLayer(layer);
            map.fitBounds(layer.getBounds());
        }
    });
}

// Function to hide a specific polygon by object name
function hidePolygonByObjectName(objectName) {
    polygonsLayerGroup.eachLayer(layer => {
        if (layer.feature && layer.feature.properties.nama_objek === objectName) {
            map.removeLayer(layer);
        }
    });
}
// Fetch and display GeoJSON data (multipolygons from /static/js/geojson-lampung.geojson)
fetch('/static/js/geojson-lampung.geojson')
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            style: style,
            filter: function(feature) {
                return feature.geometry.type === "MultiPolygon";
            },
            onEachFeature: function(feature, layer) {
                if (feature.geometry.type === "MultiPolygon") {
                    layer.setStyle({
                        fill: false
                    });
                }
            }
        }).addTo(map);
    })
    .catch(error => console.error('Error loading GeoJSON:', error));
// Style for GeoJSON linestring
function style(feature) {
    return {
        color: '#ff7800',
        weight: 5,
        opacity: 0.8,
        fillOpacity: 0,
        fillColor: 'lightblue'
    };
}

// ADD POINT FUNCTION
let isAddingPoint = false; // Flag to track if we're in add_point mode
let tempMarkerLayer = L.layerGroup().addTo(map); // Temporary layer group for markers

// Function to activate the add_point mode
export function activateAddPoint() {
    const addPointButton = document.getElementById('addPointButton');

    isAddingPoint = true;
    tempMarkerLayer.clearLayers(); // Clear any temporary markers

    addPointButton.textContent = "Cancel Add Point";
    addPointButton.style.backgroundColor = "red";
    addPointButton.style.color = "white";

    alert('Add Point mode activated! Click on the map to add a point.');
}

// Function to deactivate the add_point mode
export function deactivateAddPoint() {
    const addPointButton = document.getElementById('addPointButton');

    isAddingPoint = false;
    tempMarkerLayer.clearLayers();

    addPointButton.textContent = "Add Point";
    addPointButton.style.backgroundColor = "";
    addPointButton.style.color = "";

    alert('Add Point mode deactivated.');
}

// Event listener for map clicks when in add_point mode
map.on('click', function (e) {
    if (!isAddingPoint) return;

    const { lat, lng } = e.latlng;

    // Prompt the user for additional details about the point
    const nama_objek = prompt('Enter the name of the place:');
    const jenis_obje = prompt('Enter the type of the place (e.g., Museum, Park):');
    const alamat = prompt('Enter the address of the place:');
    const deskripsi = prompt('Enter a description for the place:');

    if (nama_objek && jenis_obje && alamat && deskripsi) {
        // Add a temporary marker to the map
        const marker = L.marker([lat, lng]).addTo(tempMarkerLayer);
        marker.bindPopup(`<b>${nama_objek}</b><br>${jenis_obje}<br>${alamat}`).openPopup();

        // Send the data to the server
        fetch('/add_point', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                latitude: lat,
                longitude: lng,
                nama_objek,
                jenis_obje,
                alamat,
                deskripsi
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Point added successfully!');
                    deactivateAddPoint(); // Automatically deactivate after successful addition
                } else {
                    alert(`Error: ${data.error}`);
                }
            })
            .catch(error => {
                console.error('Error adding point:', error);
                alert('An unexpected error occurred.');
            });
    } else {
        alert('All fields are required to add a point.');
    }
});

// Button event listeners for activating/deactivating add_point mode
document.addEventListener("DOMContentLoaded", () => {
    const addPointButton = document.getElementById("addPointButton");

    addPointButton.addEventListener("click", () => {
        if (isAddingPoint) {
            deactivateAddPoint();
        } else {
            activateAddPoint();
        }
    });
});

// ADD AREA FUNCTION
let isAddingArea = false; // Flag to track if we're in add_area mode
let areaCoordinates = []; // Array to store the points for the polygon
let tempLayerGroup = L.layerGroup().addTo(map); // Temporary layer group for area points

// Function to activate the add_area mode
export function activateAddArea() {
    const addAreaButton = document.getElementById('addAreaButton');

    isAddingArea = true;
    areaCoordinates = [];
    tempLayerGroup.clearLayers(); // Clear previous temporary layers

    addAreaButton.textContent = "Cancel Add Area";
    addAreaButton.style.backgroundColor = "red";
    addAreaButton.style.color = "white";

    alert('Add Area mode activated! Click on the map to add points. Double-click to complete the polygon.');
}

// Function to deactivate the add_area mode
export function deactivateAddArea() {
    const addAreaButton = document.getElementById('addAreaButton');

    isAddingArea = false;
    areaCoordinates = [];
    tempLayerGroup.clearLayers();

    addAreaButton.textContent = "Add Area";
    addAreaButton.style.backgroundColor = "";
    addAreaButton.style.color = "";

    alert('Add Area mode deactivated.');
}

// Event listener for map clicks when in add_area mode
map.on('click', function (e) {
    if (!isAddingArea) return;

    const { lat, lng } = e.latlng;

    // Add the clicked point to the areaCoordinates array
    areaCoordinates.push([lng, lat]);

    // Add a temporary marker to the map
    const tempMarker = L.circleMarker([lat, lng], {
        radius: 5,
        color: '#FF0000',
        fillOpacity: 0.8
    }).addTo(tempLayerGroup);
});

// Event listener for double-click to finish the polygon
map.on('dblclick', function () {
    if (!isAddingArea || areaCoordinates.length < 3) {
        alert('You need at least 3 points to form a polygon.');
        return;
    }

    // Ensure the polygon is closed by adding the first point to the end
    if (areaCoordinates[0][0] !== areaCoordinates[areaCoordinates.length - 1][0] ||
        areaCoordinates[0][1] !== areaCoordinates[areaCoordinates.length - 1][1]) {
        areaCoordinates.push(areaCoordinates[0]); // Add the first point as the last point
    }

    // Create the polygon geometry
    const polygonCoordinates = [areaCoordinates];

    // Calculate the centroid of the polygon
    const centroid = calculateCentroid(areaCoordinates);

    // Prompt user for details about the area
    const nama_objek = prompt('Enter the name of the area:');
    const jenis_obje = prompt('Enter the type of the area (e.g., Park, District):');
    const alamat = prompt('Enter the address of the area:');
    const deskripsi = prompt('Enter a description for the area:');

    if (nama_objek && jenis_obje && alamat && deskripsi) {
        // Send the data to the server
        fetch('/add_polygon', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                polygon: polygonCoordinates,
                centroid,
                nama_objek,
                jenis_obje,
                alamat,
                deskripsi
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Area added successfully!');

                    // Display the polygon on the map
                    const polygon = L.polygon(areaCoordinates, {
                        color: '#0078FF',
                        weight: 2,
                        fillOpacity: 0.3
                    }).addTo(map);

                    // Clear temporary data
                    deactivateAddArea();
                } else {
                    alert(`Error: ${data.error}`);
                }
            })
            .catch(error => {
                console.error('Error adding area:', error);
                alert('An unexpected error occurred.');
            });
    } else {
        alert('All fields are required to add an area.');
    }
});

// Function to calculate the centroid of a polygon
function calculateCentroid(coords) {
    let xSum = 0, ySum = 0;
    const numPoints = coords.length;

    coords.forEach(coord => {
        xSum += coord[0]; // Longitude
        ySum += coord[1]; // Latitude
    });

    return [xSum / numPoints, ySum / numPoints];
}

// Deactivate Add Area mode on Escape key press
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isAddingArea) {
        deactivateAddArea();
    }
});