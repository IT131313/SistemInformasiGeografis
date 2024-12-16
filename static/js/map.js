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

// Fetch and display GeoJSON data
fetch('/get_geojson_data')
    .then(response => response.json())
    .then(data => {
        markersLayer = L.geoJSON(data, {
            onEachFeature: (feature, layer) => {
                layer.bindPopup(createPopupContent(feature, map));
                categories.add(feature.properties.jenis_obje);
            }
        }).addTo(map);
        
        window.markersLayer = markersLayer;
        
        // Initialize components after markersLayer is created
        initializeSearch(markersLayer, map);
        initializeRouting(map, markersLayer);
        initializeCategories(categories, markersLayer, map);
    })
    .catch(error => console.error('Error fetching GeoJSON data:', error));

// Style for GeoJSON linestring
function style(feature) {
    return {
        color: '#ff7800',
        weight: 5,
        opacity: 0.8,
        fillOpacity: 0
    };
}

// Load boundary GeoJSON data
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
