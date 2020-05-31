const HttpError = require("../models/http-error")
const jwt = require('jsonwebtoken')
module.exports = (req,res,next) =>{
    if(req.method === 'OPTIONS'){
        return next();
    }
    try {
        const token= req.headers.authorization.split(' ')[1]
        if(!token){
            const error = new HttpError("Headers Problem Failed", 401)
            return next(error)
        }
        console.log(token)
        let decodedToken = jwt.verify(token,process.env.JWT_KEY);
        req.userData = {userId:decodedToken.userId};

        next()
        
    } catch (err) {
        throw new Error('Authenticaion Failed')
    }

}
