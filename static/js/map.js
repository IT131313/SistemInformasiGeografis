// Inisialisasi peta
const map = L.map('map').setView([-5.4295, 105.2610], 13); // Lokasi Bandar Lampung

// Tambahkan peta dasar dari Mapbox
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=AccessToken', {
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'AccessToken' // Ganti dengan token Mapbox Anda
}).addTo(map);

// Tambahkan batas wilayah (contoh GeoJSON)
const geojsonLayer = L.geoJSON(yourGeoJsonData, {
    style: {
        color: "#FF6600",
        weight: 2
    }
}).addTo(map);

// Tambahkan marker kategori
L.marker([-5.4295, 105.2610]).addTo(map)
    .bindPopup('Bandar Lampung')
    .openPopup();
