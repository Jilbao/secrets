//Boilerplate
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));

//Session setup
app.use(session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false
  }))

app.use(passport.initialize());
app.use(passport.session());

//DB
mongoose.connect(process.env.DB_URL);

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("user", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


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

app.get("/secrets", (req, res)=>{
    if (req.isAuthenticated()) {
        res.render("secrets");
    }else{
        res.redirect("/login");
    };
});

//Register
app.post("/register", (req, res)=>{
    
    User.register({username: req.body.username}, req.body.password, (err, user)=>{
        if (err) {
            console.log("err");
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, ()=>{
                res.redirect("/login");
            });
        }
    });



});

//Login
app.post("/login",
    passport.authenticate("local", { failureRedirect: "/login", failureMessage: "Incorrect password or username" }),
    (req, res)=>{
  
    res.redirect("/secrets");

    });

//Logout
app.get("/logout", (req, res)=>{
    req.logout((err)=>{
        if (err) {
            console.log(err);
        } else {
            res.redirect("/");
        }
    });
    
});











//Listen
app.listen(3000, ()=>{
    console.log("Server is up! Port: 3000");
});