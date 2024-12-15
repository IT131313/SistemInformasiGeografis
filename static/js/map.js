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

// Add base tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: MAP_CONFIG.maxZoom,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

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

// Modified addToSidebar function to group by category
function addToSidebar(feature, layer) {
    const objectList = document.getElementById('object-list');
    const categoryId = `category-${feature.properties.jenis_obje.replace(/\s+/g, '-')}`;
    
    // Check if category section already exists
    let categorySection = document.getElementById(categoryId);
    
    if (!categorySection) {
        // Create new category section if it doesn't exist
        categorySection = document.createElement('div');
        categorySection.id = categoryId;
        categorySection.classList.add('category-section');
        
        const categoryTitle = document.createElement('h4');
        categoryTitle.innerHTML = feature.properties.jenis_obje;
        categorySection.appendChild(categoryTitle);
        
        objectList.appendChild(categorySection);
    }

    // Add object under its category
    const item = document.createElement('div');
    item.classList.add('sidebar-item');
    item.innerHTML = feature.properties.nama_objek;
    item.addEventListener('click', () => {
        map.setView([
            feature.geometry.coordinates[1], 
            feature.geometry.coordinates[0]
        ], 15);
        layer.openPopup();
    });
    
    categorySection.appendChild(item);
}

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
                addToSidebar(feature, layer);
            }
        }).addTo(map);
        
        updateCategoriesList();
    })
    .catch(error => console.error('Error fetching GeoJSON data:', error));
