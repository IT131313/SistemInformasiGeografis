document.addEventListener('DOMContentLoaded', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            window.userLocation = { lat: latitude, lng: longitude };
        }, error => {
            console.error('Error getting user location:', error);
        });
    } else {
        console.error('Geolocation is not supported by this browser.');
    }
});
