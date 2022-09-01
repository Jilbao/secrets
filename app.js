//Boilerplate
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

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
    username: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = mongoose.model("user", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user._id);
});
 
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

//Google oauth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id, username: profile._json.email }, function (err, user) {
      return cb(err, user);
    });
  }
));

//Routes
app.get("/", (req, res)=>{
    res.render("home");
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["openid","profile","email"] }));

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

app.get("/login", (req, res)=>{
    res.render("login");
});

app.get("/register", (req, res)=>{
    res.render("register");
});

app.get("/secrets", (req, res)=>{
    User.find({"secret": {$ne: null}}, (err, foundSecrets)=>{
        if (err) {
            console.log(err);
        } else {
            if (foundSecrets){
                res.render("secrets", {foundSecrets: foundSecrets});
            }
        }
    });
});

//Submit
app.get("/submit", (req, res)=>{
    if (req.isAuthenticated()) {
        res.render("submit");
    }else{
        res.redirect("/login");
    };
});

app.post("/submit", (req, res)=>{
    const submittedSecret = req.body.secret;

    
    User.findById(req.user.id, (err,foundUser)=>{
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.secret = submittedSecret;
                foundUser.save(()=>{
                    res.redirect("/secrets");
                });
            } else {
                res.redirect("/register");
            }
        }
    });
});

//Register
app.post("/register", (req, res)=>{
    
    User.register({username: req.body.username}, req.body.password, (err, user)=>{
        if (err) {
            console.log(err);
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