const fetch = require("node-fetch");
const NodeHelper = require("node_helper");
const Log = require("logger");

module.exports = NodeHelper.create({
  socketNotificationReceived: function (notification, payload) {
    Log.info(`Received notification: ${notification}`);
    if (notification === "FUEL_PRICES_GET") {
      this.getFuelData(payload);
    };

    if (notification === "POSTCODE_LON_LAT") {
      this.getLonLat(payload);
    }
  },

  getFuelData: function (payload) {
    payload.suppliers.forEach(supplier => {
      Log.info("Getting fuel data: ", supplier);
      fetch(supplier)
        .then(response => response.json())
        .then(dataJson => {
          Log.info("first station", dataJson.stations[0]);
          this.sendSocketNotification("FUEL_PRICES_DATA", dataJson.stations);
        })
        .catch(error => {
          console.error(`Couldn't fetch ${supplier}`, error);
        });
    });
  },

  getLonLat: function (postCode) {
    fetch(`https://api.postcodes.io/postcodes/${postCode}`)
      .then(response => response.json())
      .then(dataJson => {
        const location = { longitude: dataJson.result.longitude, latitude: dataJson.result.latitude };
        Log.info(location)
        this.sendSocketNotification("TARGET_LON_LAT", location);
      })
      .catch(error => {
        console.error(`Couldn't fetch ${postCode}`, error);
      });
  }
});