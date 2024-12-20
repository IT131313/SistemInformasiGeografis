import { initializeSearch } from "./search.js";
import { initializeRouting, addRouting } from "./routing.js";
import {
    createPopupContent,
    initializeFloatingPopup,
    showFloatingPopup,
} from "./popup.js";
import { initializeCategories } from "./category.js";

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
        // Separate points and polygons
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
                        iconSize: [30, 42],
                        iconAnchor: [15, 42],
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
function showAndHighlightPolygon(objectName) {
    // First hide all polygons
    polygonsLayerGroup.eachLayer((layer) => {
        map.removeLayer(layer);
    });

    // Then show and highlight only the selected polygon
    polygonsLayerGroup.eachLayer((layer) => {
        if (
            layer.feature &&
            layer.feature.properties.nama_objek === objectName
        ) {
            layer.setStyle({
                color: "#FF0000",
                weight: 2,
                fillOpacity: 0.3,
                fillColor: "#FF0000",
            });
            map.addLayer(layer);
            map.fitBounds(layer.getBounds());
        }
    });
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

// ACTIVATE THIS
// Add point by clicking on the map
// map.on('click', function(e) {
//     const { lat, lng } = e.latlng;

//     // Prompt the user for additional details about the point
//     const nama_objek = prompt('Enter the name of the place:');
//     const jenis_obje = prompt('Enter the type of the place (e.g., Museum, Park):');
//     const alamat = prompt('Enter the address of the place:');
//     const deskripsi = prompt('Enter a description for the place:');

//     if (nama_objek && jenis_obje && alamat && deskripsi) {
//         // Add a temporary marker to the map
//         const marker = L.marker([lat, lng]).addTo(map);
//         marker.bindPopup(`<b>${nama_objek}</b><br>${jenis_obje}<br>${alamat}`).openPopup();

//         // Send the data to the server
//         fetch('/add_point', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//                 latitude: lat,
//                 longitude: lng,
//                 nama_objek,
//                 jenis_obje,
//                 alamat,
//                 deskripsi
//             })
//         })
//             .then(response => response.json())
//             .then(data => {
//                 if (data.success) {
//                     alert('Point added successfully!');
//                 } else {
//                     alert(`Error: ${data.error}`);
//                 }
//             })
//             .catch(error => {
//                 console.error('Error adding point:', error);
//                 alert('An unexpected error occurred.');
//             });
//     } else {
//         alert('All fields are required to add a point.');
//     }
// });

export { showAndHighlightPolygon };
