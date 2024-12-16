let routingControl;
let startMarker;

// Make routing functions available globally
window.addRouting = addRouting;
window.clearExistingRoute = clearExistingRoute;

function initializeRouting(map) {
    const clearRouteButton = document.createElement('button');
    clearRouteButton.textContent = 'Clear Route';
    clearRouteButton.className = 'clear-route-button';
    clearRouteButton.addEventListener('click', () => clearExistingRoute(map));
    document.body.appendChild(clearRouteButton);
}

function addRouting(destinationLatLng, map) {
    const markersLayer = window.markersLayer;
    clearExistingRoute(map);
    hideAllMarkers(map, markersLayer);
    addStartMarker(map);
    createRoutingControl(destinationLatLng, map);
}

function clearExistingRoute(map) {
    if (routingControl) routingControl.remove();
    if (startMarker) startMarker.remove();
    document.querySelector('.clear-route-button').style.display = 'none';
    showAllMarkers(window.markersLayer);
}

function hideAllMarkers(map, markersLayer) {
    markersLayer.eachLayer(layer => {
        map.removeLayer(layer);
    });
}

function showAllMarkers(markersLayer) {
    markersLayer.eachLayer(layer => {
        layer.addTo(map);
    });
}

function addStartMarker(map) {
    const startLatLng = window.userLocation || map.getCenter();
    startMarker = L.marker(startLatLng, {
        icon: L.icon({
            iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/RedDot.svg',
            iconSize: [25, 25],
            iconAnchor: [12, 12],
            popupAnchor: [0, -12]
        })
    }).addTo(map).bindPopup("Your current location");
}

function createRoutingControl(destinationLatLng, map) {
    const startLatLng = window.userLocation || map.getCenter();
    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(startLatLng),
            L.latLng(destinationLatLng)
        ],
        routeWhileDragging: true,
        show: true,
        lineOptions: {
            styles: [{ color: '#28a745', weight: 6 }]
        },
        createMarker: function(i, waypoint, n) {
            if (i === 0) {
                return L.marker(waypoint.latLng, {
                    icon: L.icon({
                        iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/RedDot.svg',
                        iconSize: [25, 25],
                        iconAnchor: [12, 12],
                        popupAnchor: [0, -12]
                    })
                }).bindPopup("Your current location");
            } else {
                return L.marker(waypoint.latLng);
            }
        }
    }).addTo(map);

    document.querySelector('.clear-route-button').style.display = 'block';

    routingControl.on('routesfound', function(e) {
        const route = e.routes[0];
        const bounds = L.latLngBounds(route.coordinates);
        map.fitBounds(bounds);
    });
}

export { initializeRouting, addRouting, clearExistingRoute };
