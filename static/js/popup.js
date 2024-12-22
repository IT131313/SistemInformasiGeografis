function createPopupContent(feature) {
    return `
        <div class="popup-container">
            <img src="image.jpg" alt="${feature.properties.nama_objek}" class="popup-image" />
            <div class="popup-content">
                <h3 class="popup-title">${feature.properties.nama_objek}</h3>
                <p class="popup-description">${feature.properties.deskripsi}</p>
                <p><strong>Jenis:</strong> ${feature.properties.jenis_obje}</p>
                <p><strong>Alamat:</strong> ${feature.properties.alamat}</p>
                <button class="route-button" onclick="window.addRouting([${feature.geometry.coordinates[1]}, ${feature.geometry.coordinates[0]}], window.map)">
                    Tampilkan Rute
                </button>
            </div>
        </div>
    `;
}

export { createPopupContent };
