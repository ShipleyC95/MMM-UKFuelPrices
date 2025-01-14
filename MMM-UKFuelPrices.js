Module.register("MMM-UKFuelPrices", {

  defaults: {
    postCode: "LA29RE",
    fuelType: "unleaded" //"unleaded", "premium unleaded", "diesel", "super diesel"
  },

  /**
   * Apply the default styles.
   */
  getStyles() {
    return ["uk-fuel-prices.css"]
  },

  /**
   * Pseudo-constructor for our module. Initialize stuff here.
   */
  start() {
    this.templateContent = "Loading Fuel Prices..."
    this.getFuelPrices();
    // set timeout for next random text
    setInterval(() => this.getFuelPrices(), 1000 * 60 * 60)
  },

  /**
   * Handle notifications received by the node helper.
   * So we can communicate between the node helper and the module.
   *
   * @param {string} notification - The notification identifier.
   * @param {any} payload - The payload data`returned by the node helper.
   */
  socketNotificationReceived: function (notification, payload) {
    if (notification === "FUEL_DATA") {
      const htmlContent = payload.fuelData
        .sort((a, b) => {
          const priceA = a.Prices[this.config.fuelType] !== undefined ? a.Prices[this.config.fuelType] : Infinity;
          const priceB = b.Prices[this.config.fuelType] !== undefined ? b.Prices[this.config.fuelType] : Infinity;
          return priceA - priceB;
        })
        .map((station, index) => {
          const highlightedClass = index === 0 ? "highlighted" : "";
          return `
            <div class="station ${highlightedClass}">
              <div class="location">
              ${station.Location}
              <span class="distance">(${station.Distance})</span>
              </div>
              <div class="prices">
              ${Object.entries(station.Prices).map(([key, value]) => `
                <div class="fuel-name">
                ${key}: <span class="fuel-price">${value ?? "N/A"}p</span>
                </div>
              `).join("")}
              </div>
            </div>
            `;
        }).join("");
      console.log(htmlContent)
      this.templateContent = htmlContent
      this.updateDom();
    }
  },

  /**
   * Render the page we're on.
   */
  getDom() {
    const wrapper = document.createElement("div");
    wrapper.className = "station-container";
    wrapper.innerHTML = this.templateContent

    return wrapper
  },

  getFuelPrices() {
    this.sendSocketNotification("GET_FUEL_DATA", { postCode: this.config.postCode })
  },
})