const NodeHelper = require("node_helper");
const Log = require("logger");

const fuelTypeMapping = {
  E10: "unleaded",
  // E5: "premium unleaded",
  B7: "diesel",
  // SDV: "super diesel",
};

const suppliers = [
  "https://applegreenstores.com/fuel-prices/data.json",
  "https://fuelprices.asconagroup.co.uk/newfuel.json",
  "https://storelocator.asda.com/fuel_prices_data.json",
  "https://www.bp.com/en_gb/united-kingdom/home/fuelprices/fuel_prices_data.json",
  "https://fuelprices.esso.co.uk/latestdata.json",
  "https://jetlocal.co.uk/fuel_prices_data.json",
  "https://api2.krlmedia.com/integration/live_price/krl",
  "https://www.morrisons.com/fuel-prices/fuel.json",
  "https://moto-way.com/fuel-price/fuel_prices.json",
  "https://fuel.motorfuelgroup.com/fuel_prices_data.json",
  "https://www.rontec-servicestations.co.uk/fuel-prices/data/fuel_prices_data.json",
  "https://api.sainsburys.co.uk/v1/exports/latest/fuel_prices_data.json",
  "https://www.sgnretail.uk/files/data/SGN_daily_fuel_prices.json",
  "https://www.shell.co.uk/fuel-prices-data.html",
  // "https://www.tesco.com/fuel_prices/fuel_prices_data.json",
];

module.exports = NodeHelper.create({

  async getLonLat(postCode) {
    this.location = {};
    const response = await fetch(`https://api.postcodes.io/postcodes/${postCode}`);
    const locationJson = await response.json();
    console.log({ locationJson });
    this.location.longitude = locationJson.result?.longitude;
    this.location.latitude = locationJson.result?.latitude;
    Log.info(this.location);
  },

  async socketNotificationReceived(notification, payload) {
    switch (notification) {
      case "GET_FUEL_DATA":
        await this.getLonLat(payload.postCode ?? "LA29RE");
        await this.getFuelData();
        const nearestStations = this.mapData(this.findClosestLocations(this.fuelData, this.location));
        this.sendSocketNotification("FUEL_DATA", { fuelData: nearestStations })
        break;
    }
  },

  async getFuelData() {
    const fuelData = [];
    for (const supplier of suppliers) {
      Log.info("Getting fuel data: ", supplier);
      const response = await fetch(supplier);
      const dataJson = await response.json();
      fuelData.push(...dataJson?.stations);
    }
    this.fuelData = fuelData;
  },

  findClosestLocations(stations, target, numResults = 5) {
    return stations
      .map((station) => ({
        ...station,
        distance: this.haversineDistance(
          target.latitude,
          target.longitude,
          station.location.latitude,
          station.location.longitude
        ).toFixed(1),
      }))
      .sort((a, b) => a.distance - b.distance) // Sort by distance
      .slice(0, numResults); // Get the top `numResults`
  },

  haversineDistance(lat1, lon1, lat2, lon2, unit = "miles") {
    const toRad = (degree) => degree * (Math.PI / 180);
    const R = unit == "miles" ? 3958.8 : 6371; // Earth's radius in miles or km

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  },

  mapData(closestLocations) {
    return closestLocations.map((station) => {
      const mappedPrices = Object.entries(station.prices).reduce(
        (acc, [key, value]) => {
          const fuelName = fuelTypeMapping[key] || key; // Use the common name or fallback to the key
          acc[fuelName] = value;
          return acc;
        },
        {}
      );

      return {
        Location: `${station.brand} ${station.address}`,
        Prices: mappedPrices,
        Distance: `${station.distance} miles`,
      };
    });
  },
});