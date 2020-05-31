const fs = require('fs')
const path = require('path')
const express = require("express");
const bodyParser = require("body-parser");
const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");
const mongoose = require("mongoose");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }))

app.use(bodyParser.json());
app.use('/uploads/images',express.static(path.join('uploads','images')))
app.use((req,res,next) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Origin , X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods','GET, POST , PATCH, DELETE');
  next()
});


app.use("/api/places", placesRoutes);
app.use("/api/users", usersRoutes);

// Handles Non Existing routes
app.use((req, res, next) => {
 
  const error = new HttpError("Could Not Find this Route.", 404);
  throw error;
});
// Error Response
app.use((error, req, res, next) => {
  if(req.file){
    fs.unlink(req.file.path, (err) => {
      console.log(err)
    });

  }  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An Unknown error message occured !" });
});
// This is a Promise
mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0-43exo.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
                ,{useNewUrlParser:true})
        .then(()=>{console.log("Connected to MongoDB atlas");app.listen(process.env.PORT || 5000);})
        .catch(err=>{
            console.log(err)
        });

