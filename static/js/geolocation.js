function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };

                // Store in cookies
                document.cookie = `userLocation=${JSON.stringify(userLocation)}; path=/`;

                // Debug log
                console.log("User location captured and stored:", userLocation);
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
            }
        );
    } else {
        alert("Geolocation is not supported by your browser.");
    }
}
