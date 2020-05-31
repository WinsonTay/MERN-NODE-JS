const HttpError = require("../models/http-error");
const fs = require('fs')
const { v4: uuid } = require("uuid");
const { validationResult } = require("express-validator");
const mongoose = require('mongoose')
const getCoordsForAddress = require("../util/location");
const Place = require("../models/place")
const User = require("../models/user")

let DUMMY_PLACES = [
  {
    id: "p1",
    title: "Empire State building",
    description: "One of the Most famous Skyscrappers in the World",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Empire_State_Building_%28aerial_view%29.jpg/250px-Empire_State_Building_%28aerial_view%29.jpg",
    address: "20 W 34th St, New York, NY 10001, United States",
    location: {
      lat: 40.7480522,
      lng: -73.9883054,
    },
    creator: "u1",
  },
  {
    id: "p2",
    title: "Emp.State building",
    description: "One of the Most famous Skyscrappers in the World",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Empire_State_Building_%28aerial_view%29.jpg/250px-Empire_State_Building_%28aerial_view%29.jpg",
    address: "20 W 34th St, New York, NY 10001, United States",
    location: {
      lat: 40.7480522,
      lng: -73.9883054,
    },
    creator: "u1",
  },
];

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place
  try {
    place = await Place.findById(placeId)
  }catch (err) {
   const error = new HttpError('Something Went wrong, could not find a place', 500)
    return next(error)
  }

  if (!place) {
    const error =  new HttpError("Could not find a place for the provided id", 404);
    return next(error)
  }

  // In REST API , typically we return data with JSON format
  res.json({ place: place.toObject({getters:true}) });
};

const getPlaceByUserID = async (req, res, next) => {
  const userId = req.params.uid;
  let userPlaces

  try {
      userPlaces = await Place.find({creator:userId})
    
  } catch (err) {
    const error = new HttpError('Could not Find Places by that User ID',500)
    return next(error)
  }

  if (userPlaces.length === 0) {
    userPlaces = []
  }

  res.json({ userPlaces: userPlaces.map(place => place.toObject({getters:true}))});
};

const createPlace = async (req, res, next) => {
  // Array  Destructring
  console.log(req.body);
  const error = validationResult(req);
  let user
 

  if (!error.isEmpty()) {
    return next(new HttpError("Invalid Inputs, Please Check your Data", 422));
  }
  const { title, description, address, creator } = req.body;

  try {
    user = await User.findById(creator)
  } catch (err) {
    const error = new HttpError("Creating Placed Failed, Please Try Again", 500)
    return next(error)
  }

  if (!user){
    const error = new HttpError("Could not Find User with the provided id",404)
    return next(error)
  }

  
  let coordinates
  try {
     coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error)
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location:coordinates,
    image:req.file.path,
    creator
  });

  try{
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({session:sess});
    user.places.push(createdPlace);
    await user.save({session:sess});
    await sess.commitTransaction();

  }catch (err){
    const error = new HttpError('Creating Place Failed, Please Try again',500);
    return next(error);
  }

  
  res.status(201).json({ place: createdPlace });
};
const updatePlace = async (req, res, next) => {
  const editPlaceId = req.params.pid;

  const error = validationResult(req);
  if (!error.isEmpty()) {
    throw new HttpError("Invalid Inputs, Please Check your Data", 422);
  }

  const { title, description } = req.body; // To be send as json request from Client
  let place 
  // Query from the MongoDB first
  try {
    place = await Place.findById(editPlaceId)
  } catch (err) {
    const error = new HttpError('Could Not Find The Place',500);
    return next(error)
  }
  // Update Parameter here
  place.title = title;
  place.description = description;
  if (place.creator.toString() !== req.userData.userId){
    const error = new HttpError('You Are not authorized to do that',401);
    return next(error)
  }
  
  // Update to the database
  try {
    result = await place.save();
  } catch (err) {
    const error = new HttpError('Something went wrong, could not update the place', 500)
    return next(error)  
  }



  res.status(201).json({ editedPlace: place.toObject({getters:true}) });
};

const deletePlace = async (req, res, next) => {
  const deletePlaceId = req.params.pid;
  let place
  try {
    place = await Place.findById(deletePlaceId).populate('creator')
  } catch (err) {
    const error = new HttpError("Could not Find Place",500)
    return next(error)
  }
  if (!place){
    const error = new HttpError("Could not Find Place for this id", 404)
    return next(error)
  }
  if (place.creator.toString() !== req.userData.userId){
    const error = new HttpError('You Are not authorized to do that',401);
    return next(error)
  }
  const imagePath = place.image

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    // await palce.save({session:sess});
    await place.remove({session:sess}); 
    place.creator.places.pull(place);
    await place.creator.save({session:sess})
    await sess.commitTransaction();
  
  } catch (err) {
    const error = new HttpError('Something went wrong , Could not delete Place',500)
  }

  fs.unlink(imagePath, err =>{
    console.log(err)
  })

  res.status(201).json({ message: "Success Deleted" });
};
exports.getPlaceById = getPlaceById;
exports.getPlaceByUserID = getPlaceByUserID;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
