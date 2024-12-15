
// Function to calculate the Haversine distance
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (degree) => degree * (Math.PI / 180);
//   const R = 6371; // Earth's radius in km
  const R = 3958.8; // Earth's radius in miles

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
          Math.cos(toRad(lat2)) *
          Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Find the closest 5 locations
export const  findClosestLocations = (stations, target, numResults = 5) =>  {
  return stations
      .map((station) => ({
          ...station,
          distance: haversineDistance(
              target.latitude,
              target.longitude,
              station.location.latitude,
              station.location.longitude
          ).toFixed(1)
      }))
      .sort((a, b) => a.distance - b.distance) // Sort by distance
      .slice(0, numResults); // Get the top `numResults`
}
