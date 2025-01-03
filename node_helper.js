const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
  socketNotificationReceived: function (notification, payload) {
    if (notification === "FUEL_PRICES_GET") {
      //first data pull after new config
      this.getPredictions(payload);
    };

    if (notification === "POSTCODE_LON_LAT") {
      this.getLonLat(payload);
    }
  },

  getFuelData: function (payload) {
    payload.suppliers.forEach(supplier => {
      fetch(supplier)
        .then(response => response.json())
        .then(dataJson => {
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
        this.sendSocketNotification("TARGET_LON_LAT", location);
      })
      .catch(error => {
        console.error(`Couldn't fetch ${postCode}`, error);
      });
  }
});