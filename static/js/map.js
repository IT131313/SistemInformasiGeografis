// Map Configuration
const MAP_CONFIG = {
    center: [-5.4295, 105.2610],
    zoom: 13,
    maxZoom: 19
};

// Initialize map
const map = L.map('map').setView(MAP_CONFIG.center, MAP_CONFIG.zoom);
let routingControl, startMarker;
let markersLayer;
let categories = new Set();
let searchInput;

// Thunderforest Neighbourhood
// L.tileLayer('https://tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=API_KEY', {
//     maxZoom: MAP_CONFIG.maxZoom,
//     attribution: '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
// }).addTo(map);

// Esri World Imagery
// L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
//     attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
// }).addTo(map);

// OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: MAP_CONFIG.maxZoom,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

searchInput = document.getElementById('search-input');
searchInput.addEventListener('input', handleSearch);

// Add after searchInput initialization
const suggestionsContainer = document.getElementById('search-suggestions');

function showOnlySelectedMarker(selectedName) {
    markersLayer.eachLayer(layer => {
        const name = layer.feature.properties.nama_objek;
        if (name === selectedName) {
            layer.addTo(map);
        } else {
            map.removeLayer(layer);
        }
    });
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (searchTerm.length < 2) {
        suggestionsContainer.style.display = 'none';
        return;
    }

    // Get all location names
    const suggestions = [];
    markersLayer.eachLayer(layer => {
        const name = layer.feature.properties.nama_objek;
        if (name.toLowerCase().includes(searchTerm)) {
            suggestions.push(name);
        }
    });

    // Display suggestions
    if (suggestions.length > 0) {
        suggestionsContainer.innerHTML = '';
        suggestions.forEach(suggestion => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.textContent = suggestion;
            div.addEventListener('click', () => {
                searchInput.value = suggestion;
                suggestionsContainer.style.display = 'none';
                
                // Show only the selected marker
                showOnlySelectedMarker(suggestion);
                
                // Find and zoom to the selected marker
                markersLayer.eachLayer(layer => {
                    if (layer.feature.properties.nama_objek === suggestion) {
                        const latlng = layer.getLatLng();
                        map.setView(latlng, 16);
                        layer.openPopup();
                    }
                });
            });
            suggestionsContainer.appendChild(div);
        });
        suggestionsContainer.style.display = 'block';
    } else {
        suggestionsContainer.style.display = 'none';
    }

    filterBySearchTerm(searchTerm);
}

function filterBySearchTerm(searchTerm) {
    const categorySections = document.querySelectorAll('.category-section');
    
    categorySections.forEach(section => {
        let hasVisibleItems = false;
        const items = section.querySelectorAll('.sidebar-item');
        
        items.forEach(item => {
            const itemText = item.textContent.toLowerCase();
            if (itemText.includes(searchTerm)) {
                item.style.display = 'block';
                hasVisibleItems = true;
                markersLayer.eachLayer(layer => {
                    if (layer.feature.properties.nama_objek.toLowerCase() === itemText) {
                        layer.addTo(map);
                    }
                });
            } else {
                item.style.display = 'none';
                markersLayer.eachLayer(layer => {
                    if (layer.feature.properties.nama_objek.toLowerCase() === itemText) {
                        map.removeLayer(layer);
                    }
                });
            }
        });

        section.style.display = hasVisibleItems ? 'block' : 'none';
    });
}

// Add click event listener to close suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) {
        suggestionsContainer.style.display = 'none';
    }
});

// Routing functions
function addRouting(destinationLatLng) {
    clearExistingRoute();
    addStartMarker();
    createRoutingControl(destinationLatLng);
}

function clearExistingRoute() {
    if (routingControl) routingControl.remove();
    if (startMarker) startMarker.remove();
}

function addStartMarker() {
    startMarker = L.marker(map.getCenter(), {
        icon: L.icon({
            iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Green_marker.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    }).addTo(map).bindPopup("Your current location");
}

function createRoutingControl(destinationLatLng) {
    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(map.getCenter()),
            L.latLng(destinationLatLng)
        ],
        routeWhileDragging: true,
        show: true,
        lineOptions: {
            styles: [{ color: '#28a745', weight: 6 }]
        }
    }).addTo(map);
}

// GeoJSON handling
function createPopupContent(feature) {
    return `
        <div class="popup-container">
            <img src="image.jpg" alt="Image" class="popup-image" />
            <h3>${feature.properties.nama_objek}</h3>
            <p class="popup-description">${feature.properties.deskripsi}</p>
            <p><strong>Jenis:</strong> ${feature.properties.jenis_obje}</p>
            <p><strong>Alamat:</strong> ${feature.properties.alamat}</p>
            <button class="route-button" onclick="addRouting([${feature.geometry.coordinates[1]}, ${feature.geometry.coordinates[0]}])">
                Tampilkan Rute
            </button>
        </div>
    `;
}

// Remove addToSidebar function as it's no longer needed

function updateCategoriesList() {
    const categoriesContainer = document.getElementById('categories-list');
    categoriesContainer.innerHTML = '';
    
    // Add "Show All" option
    const allCategory = document.createElement('div');
    allCategory.classList.add('category-item');
    allCategory.innerHTML = 'Tampilkan Semua';
    allCategory.addEventListener('click', () => filterMarkers('all'));
    categoriesContainer.appendChild(allCategory);

    // Add individual categories
    categories.forEach(category => {
        const item = document.createElement('div');
        item.classList.add('category-item');
        item.innerHTML = category;
        item.addEventListener('click', () => filterMarkers(category));
        categoriesContainer.appendChild(item);
    });
}

function filterMarkers(selectedCategory) {
    searchInput.value = ''; // Clear search input
    markersLayer.eachLayer(layer => {
        if (selectedCategory === 'all') {
            layer.addTo(map);
        } else {
            const layerCategory = layer.feature.properties.jenis_obje;
            if (layerCategory === selectedCategory) {
                layer.addTo(map);
            } else {
                map.removeLayer(layer);
            }
        }
    });
}

// Fetch and display GeoJSON data
fetch('/get_geojson_data')
    .then(response => response.json())
    .then(data => {
        markersLayer = L.geoJSON(data, {
            onEachFeature: (feature, layer) => {
                layer.bindPopup(createPopupContent(feature));
                categories.add(feature.properties.jenis_obje);
            }
        }).addTo(map);
        
        updateCategoriesList();
    })
    .catch(error => console.error('Error fetching GeoJSON data:', error));

// Style for GeoJSON linestring
function style(feature) {
    return {
        color: '#ff7800', // Line color
        weight: 5,        // Line thickness
        opacity: 0.8,     // Transparency
        fillOpacity: 0    // Fill transparency disabled
    };
}

// Load GeoJSON data
fetch('/static/js/geojson-lampung.geojson')
    .then(response => response.json())
    .then(data => {
        // Convert MultiPolygon to LineString
        L.geoJSON(data, {
            style: style,
            filter: function(feature) {
                // Only show outer boundary lines
                return feature.geometry.type === "MultiPolygon";
            },
            onEachFeature: function(feature, layer) {
                // Convert polygon to lines
                if (feature.geometry.type === "MultiPolygon") {
                    layer.setStyle({
                        fill: false // Remove fill
                    });
                }
            }
        }).addTo(map);
    })
    .catch(error => console.error('Error loading GeoJSON:', error));
