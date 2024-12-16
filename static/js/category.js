function initializeCategories(categories, markersLayer, map) {
    updateCategoriesList(categories, markersLayer, map);
}

function updateCategoriesList(categories, markersLayer, map) {
    const categoriesContainer = document.getElementById('categories-list');
    const searchInput = document.getElementById('search-input');
    categoriesContainer.innerHTML = '';
    
    const allCategory = document.createElement('div');
    allCategory.classList.add('category-item');
    allCategory.innerHTML = 'Tampilkan Semua';
    allCategory.addEventListener('click', () => filterMarkers('all', markersLayer, map));
    categoriesContainer.appendChild(allCategory);

    categories.forEach(category => {
        const item = document.createElement('div');
        item.classList.add('category-item');
        item.innerHTML = category;
        item.addEventListener('click', () => filterMarkers(category, markersLayer, map));
        categoriesContainer.appendChild(item);
    });
}

function filterMarkers(selectedCategory, markersLayer, map) {
    document.getElementById('search-input').value = '';
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

export { initializeCategories };
