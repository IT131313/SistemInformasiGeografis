import { initializeSearch } from "./search.js";
import { initializeRouting, addRouting } from "./routing.js";
import {
    createPopupContent,
    initializeFloatingPopup,
    showFloatingPopup,
} from "./popup.js";
import { initializeCategories } from "./category.js";
import { initializeAddData } from "./addData.js";

// Make addRouting available globally for popup buttons
window.addRouting = addRouting;

// Map Configuration
const MAP_CONFIG = {
    center: [-5.4295, 105.261],
    zoom: 13,
    maxZoom: 19,
};

// Initialize map and global variables
const map = L.map("map", {
    zoomControl: false, // Disable default zoom control
}).setView(MAP_CONFIG.center, MAP_CONFIG.zoom);

// Add zoom control to bottom left
L.control
    .zoom({
        position: "bottomleft",
    })
    .addTo(map);

let markersLayer;
let categories = new Set();

// Make map available globally
window.map = map;

// Define base layers
const baseLayers = {
    OpenStreetMap: L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: MAP_CONFIG.maxZoom,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }
    ),
    Satellite: L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
            maxZoom: MAP_CONFIG.maxZoom,
            attribution:
                "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
        }
    ),
    Topographic: L.tileLayer(
        "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 17,
            attribution:
                'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
        }
    ),
};

// Add the default layer to the map
baseLayers["OpenStreetMap"].addTo(map);

// Add layer control to bottom left
L.control
    .layers(baseLayers, null, {
        position: "bottomleft",
    })
    .addTo(map);

// Store references to polygons for highlighting
let polygonsLayerGroup = L.layerGroup().addTo(map);

// Add this before fetch GeoJSON data
const markerIcons = {
    Museum: "museum",
    "Rumah Makan": "restaurant",
    "Kawasan Seni": "palette",
    "Taman Makam Pahlawan": "military_tech",
    Menara: "tower",
    "Desa Wisata": "holiday_village",
    "Rumah Adat": "home",
    "Taman Nasional": "forest",
    Danau: "water",
    Taman: "park",
    "Kawasan Wisata": "tour",
    "Air Terjun": "water_drop",
    Monumen: "account_balance",
    "Kantor Pemerintahan": "account_balance",
    Vihara: "temple_buddhist",
    Pantai: "beach_access",
    Default: "place", // default icon
};

// Fetch and display GeoJSON data (points and polygons from /get_geojson_data)
fetch("/get_geojson_data")
    .then((response) => response.json())
    .then((data) => {
        // Clear existing layers
        if (markersLayer) markersLayer.clearLayers();
        if (polygonsLayerGroup) polygonsLayerGroup.clearLayers();

        // Handle points
        markersLayer = L.geoJSON(data, {
            filter: (feature) => feature.properties.geometry_type === "Point",
            pointToLayer: (feature, latlng) => {
                const category = feature.properties.jenis_obje;
                const iconName =
                    markerIcons[category] || markerIcons["Default"];

                return L.marker(latlng, {
                    icon: L.divIcon({
                        className: "custom-div-icon",
                        html: `
                            <div class="marker-pin" style="background-color: #FF4646;">
                                <span class="material-icons">${iconName}</span>
                            </div>
                        `,
                        iconSize: [30, 30], // Changed from [30, 42]
                        iconAnchor: [15, 30], // Changed from [15, 42]
                    }),
                });
            },
            onEachFeature: (feature, layer) => {
                // Remove the bindPopup and instead add click handler
                layer.on("click", () => {
                    showFloatingPopup(
                        createPopupContent(feature),
                        feature.properties.nama_objek
                    );
                    showAndHighlightPolygon(feature.properties.nama_objek);
                });
                categories.add(feature.properties.jenis_obje);
            },
        }).addTo(map);

        // Handle polygons
        const polygonsLayer = L.geoJSON(data, {
            filter: (feature) => feature.properties.geometry_type === "Polygon",
            style: {
                color: "#FF0000",
                weight: 2,
                fillOpacity: 0.3,
                fillColor: "#FF0000",
            },
            onEachFeature: (feature, layer) => {
                polygonsLayerGroup.addLayer(layer);
                map.removeLayer(layer); // Initially hide all polygons
            },
        });

        // Make sure polygonsLayerGroup is added to the map
        polygonsLayerGroup.addTo(map);

        // Make markersLayer globally available
        window.markersLayer = markersLayer;

        // Initialize other components
        initializeSearch(markersLayer, map);
        initializeRouting(map);
        initializeCategories(categories, markersLayer, map);
    })
    .catch((error) => console.error("Error fetching GeoJSON data:", error));

// Initialize floating popup
initializeFloatingPopup();

// Function to hide all polygons
function hideAllPolygons() {
    polygonsLayerGroup.eachLayer((layer) => map.removeLayer(layer));
}

// Function to show and highlight a specific polygon
export function showAndHighlightPolygon(objectName) {
    console.log("Highlighting polygon for:", objectName); // Debug log

    // First hide all polygons
    hideAllPolygons();

    // Then show and highlight the selected polygon
    let found = false;
    polygonsLayerGroup.eachLayer((layer) => {
        if (
            layer.feature &&
            layer.feature.properties.nama_objek === objectName
        ) {
            found = true;
            layer.setStyle({
                color: "#FF0000",
                weight: 2,
                fillOpacity: 0.3,
                fillColor: "#FF0000",
            });
            layer.addTo(map);
            map.fitBounds(layer.getBounds());
            console.log("Found and highlighted polygon"); // Debug log
        }
    });

    if (!found) {
        console.log("No polygon found for:", objectName); // Debug log
    }
}

// Function to hide a specific polygon by object name
function hidePolygonByObjectName(objectName) {
    polygonsLayerGroup.eachLayer((layer) => {
        if (
            layer.feature &&
            layer.feature.properties.nama_objek === objectName
        ) {
            map.removeLayer(layer);
        }
    });
}

// Make hidePolygonByObjectName available globally
window.hidePolygonByObjectName = hidePolygonByObjectName;

// Fetch and display GeoJSON data (multipolygons from /static/js/geojson-lampung.geojson)
fetch("/static/js/geojson-lampung.geojson")
    .then((response) => response.json())
    .then((data) => {
        L.geoJSON(data, {
            style: style,
            filter: function (feature) {
                return feature.geometry.type === "MultiPolygon";
            },
            onEachFeature: function (feature, layer) {
                if (feature.geometry.type === "MultiPolygon") {
                    layer.setStyle({
                        fill: false,
                    });
                }
            },
        }).addTo(map);
    })
    .catch((error) => console.error("Error loading GeoJSON:", error));
// Style for GeoJSON linestring
function style(feature) {
    return {
        color: "#FF0000", // Changed to red
        weight: 3, // Reduced weight for better appearance
        opacity: 0.7, // Slightly more transparent
        fillOpacity: 0,
        fillColor: "#FF0000",
    };
}

// Initialize add data functionality
initializeAddData(map);

// Utility functions
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

// Export reloadGeoJSONData for external use
export function reloadGeoJSONData() {
    fetch("/get_geojson_data")
        .then((response) => response.json())
        .then((data) => {
            // Clear existing layers
            if (markersLayer) markersLayer.clearLayers();
            if (polygonsLayerGroup) polygonsLayerGroup.clearLayers();

            // Handle points
            markersLayer = L.geoJSON(data, {
                filter: (feature) =>
                    feature.properties.geometry_type === "Point",
                pointToLayer: (feature, latlng) => {
                    const category = feature.properties.jenis_obje;
                    const iconName =
                        markerIcons[category] || markerIcons["Default"];
                    return L.marker(latlng, {
                        icon: L.divIcon({
                            className: "custom-div-icon",
                            html: `
                                <div class="marker-pin" style="background-color: #FF4646;">
                                    <span class="material-icons">${iconName}</span>
                                </div>
                            `,
                            iconSize: [30, 30],
                            iconAnchor: [15, 30],
                        }),
                    });
                },
                onEachFeature: (feature, layer) => {
                    layer.on("click", () => {
                        showFloatingPopup(
                            createPopupContent(feature),
                            feature.properties.nama_objek
                        );
                        showAndHighlightPolygon(feature.properties.nama_objek);
                    });
                    categories.add(feature.properties.jenis_obje);
                },
            }).addTo(map);

            // Update global markersLayer reference
            window.markersLayer = markersLayer;

            // Handle polygons
            L.geoJSON(data, {
                filter: (feature) =>
                    feature.properties.geometry_type === "Polygon",
                style: {
                    color: "#FF0000",
                    weight: 2,
                    fillOpacity: 0.3,
                    fillColor: "#FF0000",
                },
                onEachFeature: (feature, layer) => {
                    polygonsLayerGroup.addLayer(layer);
                    map.removeLayer(layer); // Initially hide all polygons
                },
            });

            // Make sure polygonsLayerGroup is added to the map
            polygonsLayerGroup.addTo(map);

            // Re-initialize routing capability
            initializeRouting(map);

            // Re-initialize other components
            initializeSearch(markersLayer, map);
            initializeCategories(categories, markersLayer, map);
        })
        .catch((error) =>
            console.error("Error reloading GeoJSON data:", error)
        );
}

// Make it available globally as well
window.reloadGeoJSONData = reloadGeoJSONData;

// Make functions globally available
window.closePointForm = closePointForm;
window.closeAreaForm = closeAreaForm;
