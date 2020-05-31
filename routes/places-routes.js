const express = require("express");
const fileUpload =  require("../middleware/file-upload")
const checkAuth = require("../middleware/check-auth")
const { check } = require("express-validator");
const bodyParser = require("body-parser");
const HttpError = require("../models/http-error");
const placesControllers = require("../controllers/places-controllers");

const router = express.Router();

// Get places from User ID
// This two 'GET' Routes doesnt need Authentication and Protected 
router.get("/user/:uid", placesControllers.getPlaceByUserID);

// Get Places By Place Id
router.get("/:pid", placesControllers.getPlaceById);

// Create a New Place
// Using Express Validator
// This Route Need to be Protected with authenticated access
router.use(checkAuth)  //This middleware here will check the token whether is valid and correct, 
// if invalid ,the below route cannot be accessed
router.post(
  "/",
  fileUpload.single('image'),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],

  placesControllers.createPlace
);

// Update Place description/tile from Given ID
router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  placesControllers.updatePlace
);

// Delete a Place from Given ID
router.delete("/:pid", placesControllers.deletePlace);
module.exports = router;
