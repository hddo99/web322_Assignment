const express = require('express')
const router = express.Router();
// const productModel = require("../model/product");
const signupModel = require("../model/model_schema/users");
const productModel = require("../model/model_schema/products");
const bcrypt = require('bcryptjs');
const fileUpload = require('express-fileupload'); //import file upload
router.use(fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 } //maximum 5 MB
}));
const path = require("path");


router.get("/",(req,res)=>{
    if (req.session.user) {
        if (req.session.user.isClerk) {
            //render clerk page
            res.redirect("/login/clerk");
        } else {
            //user
            res.redirect("/login/cart");
        }
    } else {
        res.render("login", {
            title: "Login",
        });
    }
});

router.post("/",(req,res)=>{
    const errorMessage_email = [];
    const errorMessage_pw = [];
    if(req.body.ap_email == "") {
        errorMessage_email.push('* Enter you email !');
    }
    if(req.body.user_password == "")
    {
        errorMessage_pw.push('* Enter you password !');
    }
    else if(req.body.user_password < 6 ){
        errorMessage_pw.push('* Password should be 6-12 charcters long !');
    }
    if (errorMessage_email.length == 0 &&  errorMessage_pw.length == 0) {
        signupModel.findOne({ "u_email": req.body.ap_email})
        .then(database_user =>{
            if(database_user)
            {
                bcrypt.compare(req.body.user_password, database_user.u_password, function(err, result) {
                    if(result)
                    {
                        req.session.user = database_user;
                        res.redirect("/");
                    }   
                    else
                    {
                        errorMessage_pw.push('You entered incorrect password');
                        console.log("no");
                        res.render("login",{
                            title: "Incorrect password",
                            ap_email:  req.body.ap_email,
                            e_Password: errorMessage_pw
                        });
                    }
                });
            }
            else
            {
                errorMessage_email.push('Email or password is incorrect');
                res.render("login",{
                    title: "Login Failed",
                    ap_email:  req.body.ap_email,
                    e_Email: errorMessage_email,
                    e_Password: errorMessage_pw
                });
            }
        })
        .catch(err => console.log(`Err : ${err}`));
    }
    else
    {
        res.render("login",{
            titile: "Login Failed",
            ap_email:  req.body.ap_email,
            e_Email: errorMessage_email,
            e_Password: errorMessage_pw
        });
    }
  });
    

    //logout
router.get("/logout", (req, res) => {
    //destroy session
    if (req.session.user) {
        delete req.session.user;
    };

    res.redirect("/login");
});

router.get("/dashboard", (req,res)=>{
    if (req.session.user) {
        if (req.session.user.u_isClerk) {
            //render clerk page
            res.render("clerk", {
                name: "Clerk " +  req.session.user.u_name,
                email: req.session.user.u_email
            });
        } else {
            //get cart
            var temp_cart = [];
            var total = 0;
            // signupModel.findById(req.session.user._id).then((user) => {
            //     user.cart.forEach(element => {
            //         total += 1;
            //         temp_cart.push(element);
            //         console.log(`element: ${element}`);
            //     });
                res.render("dashboard", {
                    name: req.session.user.u_name,
                    // product_list: temp_cart
                });
        }
        } else {
        //not login
        res.redirect("/login");
    }
})

router.get("/addproduct", (req, res) => {
    if (req.session.user) {
        if (req.session.user.u_isClerk) {
            //render clerk page
            res.render("product_add");
        } else {
            //user
            res.render("dashboard", {
                name: req.session.user.u_name,
                email: req.session.user.u_mail
            });
        }
    } else {
        //not login
        res.redirect("/login");
    }
})

//add product to database
router.post("/addproduct", (req, res) => {
    const err = [];
    if (req.session.user) {
        if (!req.files) {
            res.redirect("product-add");
        } else {
            if (req.session.user.u_isClerk) {
                //check image uploaded or not
                if (!req.files.product_picture || !(path.parse(req.files.product_picture.name).ext === ".png" || path.parse(req.files.product_picture.name).ext === ".jpg" || path.parse(req.files.product_picture.name).ext === ".JPG" || path.parse(req.files.product_picture.name).ext === ".tiff" || path.parse(req.files.product_picture.name).ext === ".gif")) {
                    //wrong type, file not exist
                    err.push(`Unsupported file or file does not exist`);
                    res.render("product_add", {
                        error: err
                    });
                } else {
                    //set up image
                    const p_image = `${req.files.product_picture.name}${req.session.user._id}${path.parse(req.files.product_picture.name).ext}`;
                    req.files.product_picture.mv(`public/img/${p_image}`);
                    //no error, addto database
                    if (!req.body.p_isBest) {
                        req.body.p_isBest = "false";
                    }
                    const newProduct = {
                        p_name: req.body.product_name,
                        p_price: req.body.product_price,
                        p_desc: req.body.product_description,
                        p_quantity: req.body.product_quantity,
                        p_Pic: p_image,
                        p_category: req.body.category,
                        p_isBest: req.body.isBest,
                        p_whoCreated: req.session.user._id
                    }
                    const newItem = new productModel(newProduct);
                    newItem.save();

                    //success, render login
                    res.redirect("/login");
                    console.log(`Product added`);
                }

            } else {
                //user
                console.log(`User cannot add item`);
                res.redirect("/login");
            }
        }

    } else {
        //not login
        res.redirect("/login");
    }

});


module.exports=router;