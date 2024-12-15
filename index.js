import suppliers from "./fuel-prices.json" assert { type: "json" };
import { findClosestLocations } from "./nearest-lon-lat.js";
const targetLocation = {
  latitude: 54.07359095165437,
  longitude: -2.715958890730694,
};

const fuelTypeMapping = {
  E10: "unleaded",
  E5: "premium unleaded",
  B7: "diesel",
  SDV: "super diesel",
};

const main = async () => {


  const closestLocations = findClosestLocations(allStations, targetLocation);
  ;

  console.log(
    mappedData.sort((a, b) => {
      const priceA =
        a.Prices.unleaded !== undefined ? a.Prices.unleaded : Infinity;
      const priceB =
        b.Prices.unleaded !== undefined ? b.Prices.unleaded : Infinity;
      return priceA - priceB;
    })
  );
};

main();
