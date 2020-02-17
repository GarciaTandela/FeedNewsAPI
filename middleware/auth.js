//Importing the package jsonwebtoken
const jwt = require('jsonwebtoken');

//This middleware verify if the token is valid and store the userId coming fron token in req variable for usage in our API
module.exports = (req,res,next) => {
    
    const authHeader = req.get('Authorization');
    if(!authHeader)
    {
        req.isAuth = false;
        return next();
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;

    try
    {
        decodedToken = jwt.verify(token,'secret');
    }
    catch(err)
    {
        req.isAuth = false;
        return next();
    }

    if (!decodedToken) 
    {
        req.isAuth = false;
        return next();    
    }

    req.post = req.get('Single');
    req.userId = decodedToken.userId;
    req.isAuth = true;
    next();

};