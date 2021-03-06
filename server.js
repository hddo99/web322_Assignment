const express = require("express"); 
const exphbs= require("express-handlebars");
const app = express(); 
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');

// load the env variable file
require('dotenv').config({path:"./config/keys.env"}); 
//This tells express to set up our template engine has handlebars
app.engine("handlebars",exphbs());
app.set("view engine", "handlebars");

//load static resources
app.use(express.static("public"));
app.use(express.static("model"));

app.use(bodyParser.urlencoded({ extended: false }))

const generalController= require("./controllers/general");
const productController= require("./controllers/product");
const signupController = require("./controllers/signup");
const signinController = require("./controllers/signin");



// custom middleware function
app.use(session({
    secret: `session_user`,
    resave: false,
    saveUninitialized: true
}))
app.use((req, res, next) => {

    //res.locals.user is a global handlebars variable. This means that ever single handlebars file can access 
    //that user variable
    res.locals.user = req.session.user;
    next();
});

app.use("/",generalController); 
app.use("/login", signinController);
app.use("/cus_regis", signupController);
app.use("/product",productController);
app.use("/", (req, res) => {
    res.render("error");
});




mongoose.connect(process.env.MONGODB_CONNECTION_STRING, {useNewUrlParser: true, useUnifiedTopology: true})
.then(()=>{
    console.log(`Connected to the MongoDB database`);
})
.catch(err=>console.log(`Error occured when connecting to the database ${err}`));

const PORT= process.env.PORT;
//This creates an Express Web Server that listens to HTTP Reuqest on port 3000
app.listen(PORT,()=>{
    console.log(`WeB Assignment  - Web Server Running`);
});