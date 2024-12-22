// Load user location dynamically or fallback to map center
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };

                // Debug log
                console.log("User location captured:", userLocation);

                // Update global userLocation dynamically
                window.userLocation = userLocation;
            },
            (error) => {
                console.error("Geolocation error:", error);
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        alert("Location access denied. The route will start from the map center.");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        alert("Location unavailable. The route will start from the map center.");
                        break;
                    case error.TIMEOUT:
                        alert("Location request timed out. The route will start from the map center.");
                        break;
                    default:
                        alert("An unknown error occurred.");
                }
                window.userLocation = null; // Fallback to null
            }
        );
    } else {
        alert("Geolocation is not supported by your browser.");
        window.userLocation = null; // Fallback to null
    }
}

let routingControl;
let startMarker;

// Make routing functions globally accessible
window.addRouting = addRouting;
window.clearExistingRoute = clearExistingRoute;
window.getUserLocation = getUserLocation; // Export for external usage

function initializeRouting(map) {
    const clearRouteButton = document.createElement('button');
    clearRouteButton.textContent = 'Clear Route';
    clearRouteButton.className = 'clear-route-button';
    clearRouteButton.style.display = 'none'; // Hide initially
    clearRouteButton.addEventListener('click', () => clearExistingRoute(map));
    document.body.appendChild(clearRouteButton);

    // Prompt user for location when the map initializes
    getUserLocation();
}

function addRouting(destinationLatLng, map) {
    const markersLayer = window.markersLayer;

    // Ensure we have the user's location before proceeding
    if (!window.userLocation) {
        alert("User location not available. Attempting to fetch again...");
        getUserLocation();
        return;
    }

    clearExistingRoute(map);
    hideAllMarkers(map, markersLayer);
    addStartMarker(map);
    createRoutingControl(destinationLatLng, map);
}

function clearExistingRoute(map) {
    if (routingControl) routingControl.remove();
    if (startMarker) startMarker.remove();
    const clearButton = document.querySelector('.clear-route-button');
    if (clearButton) clearButton.style.display = 'none';
    showAllMarkers(window.markersLayer);
}

function hideAllMarkers(map, markersLayer) {
    markersLayer.eachLayer((layer) => {
        map.removeLayer(layer);
    });
}

function showAllMarkers(markersLayer) {
    markersLayer.eachLayer((layer) => {
        layer.addTo(map);
    });
}

function addStartMarker(map) {
    const startLatLng = window.userLocation
        ? L.latLng(window.userLocation.latitude, window.userLocation.longitude)
        : map.getCenter();

    if (!window.userLocation) {
        console.warn(
            "User location not available, using map center as starting point."
        );
        alert(
            "Your location is not available. The route will start from the map center."
        );
    }

    startMarker = L.marker(startLatLng, {
        icon: L.icon({
            iconUrl:
                "https://upload.wikimedia.org/wikipedia/commons/e/ec/RedDot.svg",
            iconSize: [25, 25],
            iconAnchor: [12, 12],
            popupAnchor: [0, -12],
        }),
    })
        .addTo(map)
        .bindPopup("Your current location");
}

function createRoutingControl(destinationLatLng, map) {
    const startLatLng = window.userLocation
        ? L.latLng(window.userLocation.latitude, window.userLocation.longitude)
        : map.getCenter();

    if (!destinationLatLng) {
        console.error("Destination LatLng is undefined.");
        alert("Invalid destination. Please try again.");
        return;
    }

    routingControl = L.Routing.control({
        waypoints: [startLatLng, L.latLng(destinationLatLng)],
        routeWhileDragging: true,
        show: true,
        lineOptions: {
            styles: [
                {
                    color: "#FF0000",
                    weight: 4,
                    opacity: 0.7,
                },
            ],
        },
        createMarker: function (i, waypoint, n) {
            const marker = L.circleMarker(waypoint.latLng, {
                radius: 8,
                fillColor: "#FF0000",
                color: "#FFFFFF",
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8,
            });

            if (i === 0) {
                marker.bindPopup("Your current location");
            }
            return marker;
        },
    }).addTo(map);

    const clearButton = document.querySelector('.clear-route-button');
    if (clearButton) clearButton.style.display = 'block';

    routingControl.on('routesfound', function (e) {
        const route = e.routes[0];
        const bounds = L.latLngBounds(route.coordinates);
        map.fitBounds(bounds);
    });

    routingControl.on('routingerror', function (error) {
        console.error("Routing error:", error);
        alert("Could not find a route to the destination.");
    });
}

export { initializeRouting, addRouting, clearExistingRoute };
