const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');

//Importing express graphql to parse incoming request
const graphqlHttp = require('express-graphql');

//Importing the graphql schema and resolver
const graphqlSchema  = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');

//Importing middleware auth
const auth = require('./middleware/auth');

//Deleting File Helper
const {clearImage} = require('./helper/deleteFile');

//File Storage
var fileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'images')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
});

//File filter
const fileFilter = (req,file,cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') 
    {
        cb(null,true);
    }
    else
    {
        cb(null,false);
    }
}

//Body parser for json format // application/json
app.use(bodyParser.json());

//Registering multer
app.use(multer({storage:fileStorage, fileFilter:fileFilter}).single('image'));

//Indicating the path for storing images
app.use('/images',express.static(path.join(__dirname,'images')));

//Configuring CORS (Cross Origin Resource Sharing)
app.use((req,res,next) => {
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods','OPTIONS,GET,POST,PUT,PATCH,DELETE');
    res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
    if (req.method === 'OPTIONS') 
    {
        res.sendStatus(200);    
    }
    next();
});

//Middleware to check if the user is autenticated
app.use(auth);

//Registando um route para receber ficheiros(usando REST)
app.use('/post-image',(req,res,next) => {
    if (!req.isAuth) 
    {
        throw new Error('Not authenticated');    
    }

    if (!req.file) 
    {
        return res.status(200).json({message:'No files sent!'});    
    }

    if (req.body.oldPath) 
    {
        clearImage(req.body.oldPath);
    }

    return res.status(201).json({message:"File Received",filePath:req.file.path});
});

//Express graphql middleware
app.use('/graphql',graphqlHttp({
    schema:graphqlSchema,
    rootValue:graphqlResolver,
    graphiql:true,
    customFormatErrorFn(err) 
    {
        if(!err.originalError)
        {
            return err;
        }
        const data = err.originalError.data;
        const message = err.message || 'An error occured.';
        const code = err.originalError.code || 500;
        return {message:message, status:code,data:data};
    }
}));

//Middleware for error handler definition
app.use((error,req,res,next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({message:message,data:data});
});

//MongoDB Connection
mongoose.connect('mongodb://localhost:27017/feednewsapi?readPreference=primary&appname=MongoDB%20Compass&ssl=false',{useNewUrlParser: true,useUnifiedTopology: true})
    .then(result => {
        app.listen(8080);
    })
    .catch(err => console.log(err));

