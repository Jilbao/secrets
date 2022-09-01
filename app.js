//Boilerplate
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));

//DB
mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});


const UserModel = mongoose.model("user", userSchema);



//Routes
app.get("/", (req, res)=>{
    res.render("home");
});

app.get("/login", (req, res)=>{
    res.render("login");
});

app.get("/register", (req, res)=>{
    res.render("register");
});

//Register
app.post("/register", (req, res)=>{
    
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        // Store hash in your password DB.
        const newUser = new UserModel({
            email: req.body.username,
            password: hash
        });
        //Check username exist
        UserModel.findOne({email: req.body.username}, (err, foundUser)=>{
            if (err) {
                console.log(err);
            } else {
                if (foundUser) {
                    res.send("Username already exist!");
                } else {
                    // Save user to database
                    newUser.save((err)=>{
                        if (err) {
                            console.log(err);
                        } else {
                            res.render("secrets");
                        }
                    });
                }
            }
        });
    });



});

//Login
app.post("/login", (req, res)=>{
    const username = req.body.username;
    const password = req.body.password;

    UserModel.findOne({email: username}, (err, foundUser)=>{
        if (err) {
            console.log(err);
        } else {
            if (foundUser){
                bcrypt.compare(password, foundUser.password, function(err, result) {
                    if (result === true) {
                        res.render("secrets");
                    } else {
                        res.send("username or password is wrong!");
                    }
                });              
            }else{
                res.send("username or password is wrong!");
            }
        }
    });
});











//Listen
app.listen(3000, ()=>{
    console.log("Server is up! Port: 3000");
});