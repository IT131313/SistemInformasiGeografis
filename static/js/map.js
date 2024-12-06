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

// Ambil data GeoJSON dari Flask (gunakan route yang mengembalikan data GeoJSON)
fetch('/get_geojson_data')
    .then(response => response.json())
    .then(data => {
        // Tambahkan data GeoJSON ke peta
        const geojsonLayer = L.geoJSON(data, {
            onEachFeature: function (feature, layer) {
                // Menambahkan popup untuk setiap objek
                layer.bindPopup(`
                    <b>${feature.properties.nama_objek}</b><br>
                    Jenis: ${feature.properties.jenis_obje}<br>
                    Alamat: ${feature.properties.alamat}<br>
                    Deskripsi: ${feature.properties.deskripsi}
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
