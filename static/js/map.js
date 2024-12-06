// Inisialisasi peta
const map = L.map('map').setView([-5.4295, 105.2610], 13); // Lokasi Bandar Lampung

// Tambahkan peta dasar dari Mapbox
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=Token', {
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'Token' // Ganti dengan token Mapbox Anda
}).addTo(map);

// Fetch data GeoJSON dari server Flask
fetch('/data')
    .then(response => response.json())
    .then(data => {
        // Tambahkan layer GeoJSON ke peta
        L.geoJSON(data, {
            onEachFeature: function (feature, layer) {
                layer.bindPopup(`<b>Nama Objek:</b> ${feature.properties.nama_objek}<br><b>Jenis Objek:</b> ${feature.properties.jenis_obje}`);
            }
        }).addTo(map);
    })
    .catch(error => console.error('Error loading GeoJSON:', error));
