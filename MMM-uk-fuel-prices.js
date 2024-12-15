import { findClosestLocations } from "./nearest-lon-lat";
import getPricesFromSuppliers from "./api/fuel-prices";
import {fuelTypeMapping} from "./constants"

Module.register("MMM-UKFuelPrices", {
  defaults: {
    longitude: 54.093409,
    latitude: -2.89479,
    fuelType: "unleaded" // options: ["unleaded", "premium unleaded", "disel", "super "]
  },

  /**
   * Apply the default styles.
   */
  getStyles() {
    return ["uk-fuel-prices.css"];
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
    getPricesFromSuppliers()
      .then((data) => {
        const closestLocations = findClosestLocations(data, {longitude: this.config.longitude, latitude: this.config.latitude}, 5)
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
        console.error("Errors happened", error )
      });
  },

  createRender(data) {
    data.forEach((station, index) => {
      const s = document.createElement("div");
      s.className = index === 0 ? "station.highlighted" : "station";
      const location = document.createElement("p");
      location.textContent = station.Location;
      location.classList.add("location");
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
    })
  },

  /**
   * Render the page we're on.
   */
  getDom() {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `<b>Title</b><br />${this.templateContent}`;

    return wrapper;
  },

});
