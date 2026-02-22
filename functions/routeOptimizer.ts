// Route optimization based on alert density
export async function optimizeRoute(userLocation, waypoints, alerts) {
  // Calculate alert density in regions
  const calculateAlertDensity = (lat, lng, radius = 0.1) => {
    return alerts.filter(alert => {
      const distance = Math.sqrt(
        Math.pow((alert.lat - lat) * 111, 2) +
        Math.pow((alert.lng - lng) * 111, 2)
      );
      return distance <= radius;
    }).length;
  };

  // Add score to each waypoint
  const scoredWaypoints = waypoints.map((wp, idx) => ({
    ...wp,
    order: idx,
    alertDensity: calculateAlertDensity(wp[0], wp[1])
  }));

  // Simple optimization: sort by alert density (avoid high-density areas)
  const optimized = scoredWaypoints.sort((a, b) => a.alertDensity - b.alertDensity);

  return [userLocation, ...optimized.map(wp => [wp[0], wp[1]])];
}

// Calculate route distance
export function calculateDistance(point1, point2) {
  const R = 6371; // Earth radius in km
  const dLat = (point2[0] - point1[0]) * Math.PI / 180;
  const dLng = (point2[1] - point1[1]) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1[0] * Math.PI / 180) * Math.cos(point2[0] * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateRouteTotalDistance(route) {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += calculateDistance(route[i], route[i + 1]);
  }
  return total;
}