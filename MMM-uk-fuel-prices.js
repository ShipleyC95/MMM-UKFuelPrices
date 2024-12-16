const fuelTypeMapping = {
  E10: "unleaded",
  E5: "premium unleaded",
  B7: "diesel",
  SDV: "super diesel",
};

Module.register("MMM-UKFuelPrices", {
  defaults: {
    longitude: 54.093409,
    latitude: -2.89479,
    fuelType: "unleaded", // options: ["unleaded", "premium unleaded", "disel", "super "]
  },

  // Function to calculate the Haversine distance
  haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = (degree) => degree * (Math.PI / 180);
    //   const R = 6371; // Earth's radius in km
    const R = 3958.8; // Earth's radius in miles

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  },

  // Find the closest 5 locations
  findClosestLocations(stations, target, numResults = 5) {
    return stations
      .map((station) => ({
        ...station,
        distance: haversineDistance(
          target.latitude,
          target.longitude,
          station.location.latitude,
          station.location.longitude
        ).toFixed(1),
      }))
      .sort((a, b) => a.distance - b.distance) // Sort by distance
      .slice(0, numResults); // Get the top `numResults`
  },

  suppliers: [
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
    "https://www.tesco.com/fuel_prices/fuel_prices_data.json",
  ],

  /**
   * Apply the default styles.
   */
  getStyles() {
    return ["uk-fuel-prices.css"];
  },

  async getPricesFromSuppliers() {
    // TODO: Add caching to check last_updated property
    const allStations = [];
    for (const supplier of this.suppliers) {
      try {
        const result = await fetch(supplier);
        const dataJson = await result.json();

        allStations?.push(...dataJson.stations);
      } catch (error) {
        console.error(`Couldn't fetch ${supplier}`, error);
        continue;
      }
    }

    return allStations;
  },

  /**
   * Pseudo-constructor for our module. Initialize stuff here.
   */
  start() {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "station-container";
    this.loadData();
    this.scheduleUpdate();
  },

  scheduleUpdate() {
    const self = this;
    setInterval(function () {
      self.loadData();
    }, this.config.updateInterval * 60000);
  },

  loadData() {
    this.getPricesFromSuppliers()
      .then((data) => {
        const closestLocations = findClosestLocations(
          data,
          { longitude: this.config.longitude, latitude: this.config.latitude },
          5
        );
        const mappedData = mapData(closestLocations);
        const sortedByPrice = mappedData.sort((a, b) => {
          const priceA =
            a.Prices.unleaded !== undefined ? a.Prices.unleaded : Infinity;
          const priceB =
            b.Prices.unleaded !== undefined ? b.Prices.unleaded : Infinity;
          return priceA - priceB;
        });
        createRender(sortedByPrice);
      })
      .catch((error) => {
        console.error("Errors happened", error);
      });
  },

  createRender(data) {
    data.forEach((station, index) => {
      const s = document.createElement("div");
      s.className = "station";
      if (index === 0) s.classList("highlighted");
      const location = document.createElement("p");
      location.textContent = station.Location;
      location.classList.add("location");
      s.appendChild(location);

      for (const [key, value] of Object.entries(prices)) {
        const priceElement = document.createElement("p");
        priceElement.textContent = `${key}: ${value}`;
        s.appendChild(priceElement);
      }

      const distance = document.createElement("p");
      distance.textContent(station.distance);
      s.appendChild(distance);
    });
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

  /**
   * Render the page we're on.
   */
  getDom() {
    return this.wrapper;
  },
});
