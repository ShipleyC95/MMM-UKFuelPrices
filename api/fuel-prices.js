import suppliers from "./suppliers.json";

const getPricesFromSuppliers = async () => {
  // TODO: Add caching to check last_updated property
  const allStations = [];
  for (const supplier of suppliers) {
    try {
      const result = await fetch(supplier);
      const dataJson = await result.json();

      allStations?.push(...dataJson.stations);
    } catch (error) {
      console.error(`Couldn't fetch ${supplier}`, error);
      continue;
    }
  };

  return allStations;
};

export default getPricesFromSuppliers;