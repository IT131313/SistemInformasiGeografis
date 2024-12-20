// Load user location from cookies or fallback to map center
const cookies = document.cookie.split("; ").reduce((acc, cookie) => {
    const [key, value] = cookie.split("=");
    acc[key] = value;
    return acc;
}, {});

if (cookies.userLocation) {
    window.userLocation = JSON.parse(cookies.userLocation);
} else {
    console.warn("User location not available. Using map center as fallback.");
    alert(
        "Your location is not available. The route will start from the map center."
    );
    window.userLocation = null;
}

let routingControl;
let startMarker;

// Make routing functions globally accessible
window.addRouting = addRouting;
window.clearExistingRoute = clearExistingRoute;

function initializeRouting(map) {
    const clearRouteButton = document.createElement("button");
    clearRouteButton.textContent = "Clear Route";
    clearRouteButton.className = "clear-route-button";
    clearRouteButton.addEventListener("click", () => clearExistingRoute(map));
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
    document.querySelector(".clear-route-button").style.display = "none";
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

    document.querySelector(".clear-route-button").style.display = "block";

    routingControl.on("routingstart", function () {
        console.log("Routing started...");
        document.body.classList.add("loading"); // Add a CSS class for spinner
    });

    routingControl.on("routesfound", function (e) {
        const route = e.routes[0];
        const bounds = L.latLngBounds(route.coordinates);
        map.fitBounds(bounds);
    });

    routingControl.on("routingerror", function (error) {
        document.body.classList.remove("loading");
        console.error("Routing error:", error);
        alert("Could not find a route to the destination.");
    });
}

export { initializeRouting, addRouting, clearExistingRoute };
