
//1. Import coingecko-api
export const CoinGecko = require('coingecko-api');

//2. Initiate the CoinGecko API Client
export const CoinGeckoClient = new CoinGecko();

//3. Make calls
const func = async() => {
  let data = await CoinGeckoClient.ping();
  console.log(data);
};
