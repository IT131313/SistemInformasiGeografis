// Inisialisasi peta
const map = L.map('map').setView([-5.4295, 105.2610], 13); // Lokasi Bandar Lampung
console.log('Map initialized successfully');

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let routingControl; // Store the routing control reference
let startMarker; // Store the marker for the start point

function addRouting(destinationLatLng) {
    if (routingControl) {
        routingControl.remove(); // Remove existing route if any
    }

    // Remove the start marker if it exists
    if (startMarker) {
        startMarker.remove(); // Remove the previous start marker
    }

    // Create a new start marker with a green color
    startMarker = L.marker(map.getCenter(), {
        icon: L.icon({
            iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Green_marker.png', // Green marker icon URL
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    }).addTo(map).bindPopup("Your current location");

    // Create new routing control
    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(map.getCenter()), // Start point (current center of the map)
            L.latLng(destinationLatLng) // Destination point (clicked marker or from GeoJSON)
        ],
        routeWhileDragging: true, // Allow dragging of the route
        show: true, // Display the routing panel
        lineOptions: {
            styles: [{ color: '#28a745', weight: 6 }] // Styling the route line
        }
    }).addTo(map);
}

// Ambil data GeoJSON dari Flask (gunakan route yang mengembalikan data GeoJSON)
fetch('/get_geojson_data')
    .then(response => response.json())
    .then(data => {
        // Tambahkan data GeoJSON ke peta
        const geojsonLayer = L.geoJSON(data, {
            onEachFeature: function (feature, layer) {
                // Menambahkan popup untuk setiap objek
                layer.bindPopup(`
                    <div class="popup-container">
                        <img src="image.jpg" alt="Image" class="popup-image" />
                        <h3>${feature.properties.nama_objek}</h3>
                        <p class="popup-description">${feature.properties.deskripsi}</p>
                        <p><strong>Jenis:</strong> ${feature.properties.jenis_obje}</p>
                        <p><strong>Alamat:</strong> ${feature.properties.alamat}</p>
                        <button class="route-button" onclick="addRouting([${layer.getLatLng().lat}, ${layer.getLatLng().lng}])">Tampilkan Rute</button>
                    </div>
                `);

                // Tambahkan marker untuk setiap objek di sidebar
                const item = document.createElement('div');
                item.classList.add('sidebar-item');
                item.innerHTML = feature.properties.jenis_obje;
                item.addEventListener('click', () => {
                    // Ketika sidebar item diklik, fokuskan peta ke objek terkait
                    map.setView(layer.getLatLng(), 15);
                    layer.openPopup();
                });

                // Tambahkan item ke sidebar
                document.getElementById('object-list').appendChild(item);
            }
        }).addTo(map);
    })
    .catch(error => console.error('Error fetching GeoJSON data:', error));
