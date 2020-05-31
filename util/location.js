const axios = require("axios");
const HttpError = require("../models/http-error");

let getCoordsForAddress = async (address) => {
  const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${process.env.GOOGLE_API_KEY}`);

  // The Rest of the code will only run , once the await is resolve from the axios.get
  // Blocking Code

  const data = response.data;

  if (!data || data.status == "ZERO RESULTS") {
    const error = new HttpError("Could Not find specified address", 422);
    throw error
  };
  const coordinates = data.results[0].geometry.location;
  return coordinates
};

module.exports = getCoordsForAddress;
