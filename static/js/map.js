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
