const ROOM_ID = "83a356a2-756f-45a6-9408-51e5ae8eba19";

const mongoose = require("mongoose");
const express = require("express");
const path = require("path");
require("dotenv").config();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");
const multer = require("multer");
const fs = require("fs");
const {v4:uuidv4} = require('uuid');

const crypto = require("crypto"); // Import NodeJS's Crypto Module

const { Decimal128, Double } = require("mongodb");
const { info } = require("console");
const { ObjectId } = require("mongodb");
const { ObjectID } = require("mongodb");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);
app.use(
    session({
        secret: "Our little secret.",
        resave: false,
        saveUninitialized: false,
    })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static("public/img"));

// const url = 'mongodb+srv://rakshith:rakshith2107@cluster0.v2kuy.mongodb.net/userDB?retryWrites=true&w=majority'

const url = 'mongodb://localhost:27017/userDB';

mongoose.connect(url, { useNewUrlParser: true }).then(() => console.log('Connected successfully'));

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    Role: String,
});
const informationSchema = new mongoose.Schema({
    ID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    Name: String,
    Address: String,
    tin: Number,
    gmail: String,
    adhaarNumber: Number,
    about: String,
    imagename: String,
    Rating: Number,
});
const patientSchema = new mongoose.Schema({
    ID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    Room_no: Number,
    Result: Number,
    HasTherapy: Boolean,
});

const therapySessionSchema = new mongoose.Schema({
    Outcome: String,
    Date: Date,
    Diagnosis: String,
    Prescription: String,
    Status: String,
});

const therapySchema = new mongoose.Schema({
    DoctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "information",
    },
    PatientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    PatientName : String,
    StartDate: Date,
    EndDate: Date,
    Status: String,
    RoomId : String,
    TherapySessions: [therapySessionSchema],
});

const therapyReportsSchema = new mongoose.Schema({
    DoctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "information",
    },
    Title : String,
    DoctorName : String,
    Filename : String 
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
const information = new mongoose.model("information", informationSchema);
const patient = new mongoose.model("patient", patientSchema);
const therapySession = new mongoose.model(
    "therapySessions",
    therapySessionSchema
);
const therapies = new mongoose.model("therapies", therapySchema);
const therapyReports = new mongoose.model("therapyReports", therapyReportsSchema);

passport.use(User.createStrategy());
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

app.use(express.static("public/img"));

var Storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "./public/img");
    },
    filename: function (req, file, callback) {
        callback(
            null,
            file.fieldname + "_" + Date.now() + "_" + file.originalname
        );
    },
});

var reportStorage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "./public/reports");
    },
    filename: function (req, file, callback) {
        callback(
            null,
            file.fieldname + "_" + Date.now() + "_" + file.originalname
        );
    },
});

var upload = multer({
    storage: Storage,
}).single("image");

var reportUpload = multer({
    storage: reportStorage,
}).single("report")

app.get("/", function (req, res) {
    if (req.isAuthenticated()) {
        if (req.user.Role == "Patient") {
            information.find({}, function (err, doctor) {
                if (err) {
                    console.log(err);
                } else {
                    res.render("home", {
                        loggedIn: 1,
                        page: 1,
                        doctor: doctor,
                    });
                }
            });
        } else if (req.user.Role == "Doctor") {
            information.find({}, function (err, doctor) {
                if (err) {
                    console.log(err);
                } else {
                    res.render("home", {
                        loggedIn: 2,
                        page: 1,
                        doctor: doctor,
                    });
                }
            });
        } else {
            information.find({}, function (err, doctor) {
                if (err) {
                    console.log(err);
                } else {
                    res.render("home", {
                        loggedIn: 3,
                        page: 1,
                        doctor: doctor,
                    });
                }
            });
        }
    } else {
        information.find({}, function (err, doctor) {
            if (err) {
                console.log(err);
            } else {
                res.render("home", { loggedIn: 0, page: 1, doctor: doctor });
            }
        });
    }
});

app.get("/login", function (req, res) {
    if (!req.isAuthenticated()) {
        res.render("login", { loggedIn: 0, page: 5 });
    }
});

app.get("/register", function (req, res) {
    if (!req.isAuthenticated()) {
        res.render("register", { loggedIn: 0, page: 4 });
    } else {
        res.redirect("/");
    }
});

app.get("/about", function (req, res) {
    if (req.isAuthenticated()) {
        if (req.user.Role == "Patient") {
            res.render("about", { loggedIn: 1, page: 2 });
        } else if (req.user.Role == "Doctor") {
            res.render("about", { loggedIn: 2, page: 2 });
        } else {
            res.render("about", { loggedIn: 3, page: 2 });
        }
    } else {
        res.render("about", { loggedIn: 0, page: 2 });
    }
});

app.get("/feature", function (req, res) {
    if (req.isAuthenticated()) {
        if (req.user.Role == "Patient") {
            res.render("feature", { loggedIn: 1, page: 6 });
        } else if (req.user.Role == "Doctor") {
            res.render("feature", { loggedIn: 2, page: 6 });
        } else {
            res.render("feature", { loggedIn: 3, page: 6 });
        }
    } else {
        res.render("feature", { loggedIn: 0, page: 6 });
    }
});

app.get("/team", function (req, res) {
    if (req.isAuthenticated()) {
        if (req.user.Role == "Patient") {
            information.find({}, function (err, doctor) {
                if (err) {
                    console.log(err);
                } else {
                    patient.find(
                        { ID: req.user._id },
                        function (err, patientResult) {
                            if (err) console.log(err);
                            else {
                                if (patientResult[0].HasTherapy) {
                                    res.render("team-without-pay-review", {
                                        loggedIn: 1,
                                        page: 7,
                                        doctor: doctor,
                                    });
                                } else {
                                    res.render("team", {
                                        loggedIn: 1,
                                        page: 7,
                                        doctor: doctor,
                                    });
                                }
                            }
                        }
                    );
                }
            });
        } else if (req.user.Role == "Doctor") {
            information.find({}, function (err, doctor) {
                if (err) {
                    console.log(err);
                } else {
                    res.render("team-without-pay-review", {
                        loggedIn: 2,
                        page: 7,
                        doctor: doctor,
                    });
                }
            });
        } else {
            information.find({}, function (err, doctor) {
                if (err) {
                    console.log(err);
                } else {
                    res.render("team", {
                        loggedIn: 3,
                        page: 7,
                        doctor: doctor,
                    });
                }
            });
        }
    } else {
        information.find({}, function (err, doctor) {
            if (err) {
                console.log(err);
            } else {
                res.render("team", { loggedIn: 0, page: 7, doctor: doctor });
            }
        });
    }
});

app.get("/detail", function (req, res) {
    if (req.isAuthenticated()) {
        if (req.user.Role == "Patient") {
            res.render("detail", { loggedIn: 1, page: 8 });
        } else if (req.user.Role == "Doctor") {
            res.render("detail", { loggedIn: 2, page: 8 });
        } else {
            res.render("detail", { loggedIn: 3, page: 8 });
        }
    } else {
        res.render("detail", { loggedIn: 0, page: 8 });
    }
});

app.get("/questionnaire", function (req, res) {
    if (req.isAuthenticated()) {
        if (req.user.Role == "Patient") {
            res.render("questionnaire", { loggedIn: 1, page: 11 });
        }
    } else {
        res.redirect("/");
    }
});

app.get("/Review/:id", async function (req, res) {
    id_product = req.params.id;
    let doctor = await information.find({ _id: req.params.id });
    if (doctor.length != 0) {
        if (req.isAuthenticated()) {
            if (req.user.Role == "Patient") {
                res.render("Review", {
                    product: doctor[0],
                    page: 13,
                    loggedIn: 1,
                });
            } else {
                res.redirect("/");
            }
        } else {
            res.redirect("/login");
        }
    } else {
        res.redirect("/");
    }
});

app.get("/course", function (req, res) {
    if (req.isAuthenticated()) {
        if (req.user.Role == "Patient") {
            res.render("course", { loggedIn: 1, page: 3 });
        } else if (req.user.Role == "Doctor") {
            res.render("course", { loggedIn: 2, page: 3 });
        } else {
            res.render("course", { loggedIn: 3, page: 3 });
        }
    } else {
        res.redirect("/login");
    }
});

app.get("/secrets", function (req, res) {
    if (req.isAuthenticated()) {
        ID = req.user.id;
        User.findById(req.user.id, function (err, foundUser) {
            if (err) {
                console.log(err);
            } else {
                if (foundUser && foundUser.Role == "Patient") {
                    patient.updateOne(
                        { ID: ID },
                        { ID: ID, HasTherapy: false },
                        { upsert: true },
                        function (error) {
                            if (error) {
                                console.log(error);
                            }
                            patient.find({ ID: ID }, function (err, result) {
                                if (err) {
                                    console.log(err);
                                }
                                // else{console.log("Sucessfully updated");}
                                // console.log(result);
                                if (result[0].Result == undefined)
                                    res.redirect("/questionnaire");
                                else res.redirect("/");
                            });
                        }
                    );
                } else {
                    res.redirect("/");
                }
            }
        });
    } else {
        res.redirect("/login");
    }
});

app.get("/doctor", function (req, res) {
    if (req.isAuthenticated()) {
        let found = 0;
        let array = [];
        if (req.user.Role == "Doctor") {
            information.find({ ID: ID }, function (err, foundUser) {
                if (err) {
                    console.log(err);
                } else {
                    if (foundUser.length != 0) {
                        found = 1;
                        array.push(foundUser[0].Name);
                        array.push(foundUser[0].Address);
                        array.push(foundUser[0].tin);
                        array.push(foundUser[0].gmail);
                        array.push(foundUser[0].adhaarNumber);
                        array.push(foundUser[0].imagename);
                        array.push(foundUser[0].about);
                        console.log(foundUser[0]);
                    }
                    res.render("doctor", {
                        loggedIn: 2,
                        page: 9,
                        found: found,
                        array: array,
                    });
                }
            });
        } else {
            res.redirect("/");
        }
    } else {
        res.redirect("/login");
    }
});

app.get("/therapy-patient", (req, res) => {
    if (req.isAuthenticated() && req.user.Role == "Patient") {
        const patientId = req.user._id;
        therapies.find({ PatientId: patientId }, function (err, therapy) {
            if (err) {
                console.log(err);
            } else {
                console.log(therapy);
                if(therapy.length){
                    res.render("therapy-patient", {
                        page: 12,
                        loggedIn: 1,
                        therapy: therapy[0],
                    });
                }
                else{
                    res.redirect('/team');
                }               
            }
        });
    }
});

app.post("/sign-up-therapy/:doctorId", (req, res) => {
    if (req.isAuthenticated()) {
        therapies.find({ PatientId: req.user._id }, function (err, therapy) {
            if (err) {
                console.log(err);
            } else {
                console.log("therapies : ", therapy);
                if (therapy.length == 0) {
                    const patientId = req.user._id;
                    information.find(
                        { ID: req.params.doctorId },
                        function (err, result) {
                            if (err) {
                                console.log(err);
                            } else {
                                doctorId = result[0].ID;
                                therapies.create(
                                    {
                                        PatientId: patientId,
                                        PatientName : req.user.name,
                                        DoctorId: doctorId,
                                        StartDate: new Date(),
                                        Status: "Ongoing",
                                        RoomId: uuidv4()
                                    },
                                    function (error, result) {
                                        if (error) {
                                            console.log(error);
                                        } else {
                                            console.log(
                                                "Successfully created therapy"
                                            );
                                            console.log(
                                                "Patient id : ",
                                                patientId
                                            );
                                            console.log(
                                                "Doctor id : ",
                                                doctorId
                                            );
                                            patient.update({
                                                _id: req.user._id,
                                            });
                                        }
                                        patient.updateOne(
                                            { ID: patientId },
                                            { HasTherapy: true },
                                            { upsert: true },
                                            function (err, result) {
                                                if (err) {
                                                    console.log(
                                                        "Could not update has-therapy field for patient"
                                                    );
                                                }
                                            }
                                        );
                                    }
                                );
                            }
                            res.redirect("/payment");
                        }
                    );
                } else {
                    console.log("Paitient already has a therapy");
                    res.redirect("/");
                }
            }
        });
    } else {
        res.redirect("/login");
    }
});

app.get("/therapies-doctor", (req, res) => {
    const doctorId = req.user._id;
    therapies.find({ DoctorId: doctorId }, function (err, therapyList) {
        if (err) {
            console.log(err);
        }
        if (therapyList) {
            res.render("therapies-doctor", {
                loggedIn: 2,
                page: 12,
                therapyList: therapyList,
            });
        } else {
            res.redirect("/");
        }
    });
});

app.get("/therapy-doctor", (req, res) => {
    const doctorId = req.user._id;
    const patientId = req.query.patientId;
    therapies.find(
        { DoctorId: doctorId, PatientId: patientId },
        function (err, therapy) {
            if (err) {
                console.log(err);
            }
            if (therapy) {
                patient.find({ID : patientId}, function(err, patientResult){
                    patientTherapy = therapy[0]
                    patientTherapy.StressLevel = patientResult[0].Result
                    console.log(therapy)
                    res.render("therapy-doctor", {
                        loggedIn: 2,
                        page: 12,
                        therapy: patientTherapy,
                        patientId: patientId,
                    });
                })
                
            } else {
                res.redirect("/");
            }
        }
    );
});

app.get("/therapy-session-patient", (req, res) => {
    const patientId = req.user._id;
    const sessionId = req.query.sessionId;
    therapies.find({ PatientId: patientId }, function (err, therapy) {
        if (err) {
            console.log(err);
        } else {
            console.log(therapy);
            res.render("therapy-session-patient", {
                page: 12,
                loggedIn: 1,
                session: therapy[0].TherapySessions.find(
                    (session) => session._id.toString() == sessionId
                ),
            });
        }
    });
});

app.get("/payment", (req, res) => {
    if (req.isAuthenticated() && req.user.Role == "Patient")
        res.render("payment", { page: 2, loggedIn: 1 });
    else res.redirect("/");
});

app.post("/payment", (req, res) => {
    if (req.isAuthenticated() && req.user.Role == "Patient")
        res.render("payment-successful", { page: 2, loggedIn: 1 });
    else res.redirect("/");
});

app.get("/payment-successful", (req, res) => {});

app.get("/upload-report", (req, res) => {
    if(req.isAuthenticated() && req.user.Role == "Doctor"){
        res.render("report-upload", { page: 12, loggedIn: 2 });
    }
    else{
        res.redirect('/');
    }
});

app.post("/upload-report", reportUpload, (req, res) => {
    if(req.isAuthenticated() && req.user.Role == "Doctor"){
        file = req.file;
        // console.log('Filename ', fileName)
        if(file != null){
            information.find({ID : req.user._id}, function(err, result){
                // console.log(result)
                therapyReports.create(
                    {
                        DoctorId : req.user._id, 
                        Title : req.body.Title,
                        DoctorName : result[0].Name, 
                        Filename : file.filename
                    }
                )
            })
        }
        res.redirect('/');
    }
});

app.get("/reports", (req, res) => {
    if(req.isAuthenticated() && (req.user.Role == "Student" || req.user.Role == "Doctor")){
        
        const filename = req.query.filename;
        if(req.user.Role == "Doctor"){
            if(filename == null){            
                therapyReports.find({DoctorId : req.user._id}, function(err, result){
                    if(err) console.log(err);
                    else{
                        console.log(result);
                        res.render("reports-doctor", { 
                            loggedIn :  (req.user.Role == "Doctor" ? 2: 3),
                            page : 13,
                            reports : result 
                        })
                    }
                })            
            }
            else{
                res.sendFile(__dirname + '/public/reports/' + filename);
            }
        }
        else if(req.user.Role == "Student"){
            if(filename == null){            
                therapyReports.find({}, function(err, result){
                    if(err) console.log(err);
                    else{
                        console.log(result);
                        res.render("reports-student", { 
                            loggedIn :  (req.user.Role == "Doctor" ? 2: 3),
                            page : 13,
                            reports : result 
                        })
                    }
                })            
            }
            else{
                res.sendFile(__dirname + '/public/reports/' + filename);
            }
        }
        else{
            res.redirect('/');
        }
    }   
    else{
        res.redirect('/');
    }
})

app.get("/therapy-session-doctor", (req, res) => {
    console.log("Inside therapy session doctor GET");
    const doctorId = req.user._id;
    const patientId = req.query.patientId;
    const sessionId = req.query.sessionId;
    console.log("Doctor Id : ", doctorId);
    console.log("Patient Id : ", patientId);
    therapies.find(
        { DoctorId: doctorId, PatientId: patientId },
        function (err, therapy) {
            if (err) {
                console.log(err);
            } else {
                console.log("Therapy : ", therapy);
                const session = therapy[0].TherapySessions.find(
                    (session) => session._id.toString() == sessionId
                );
                console.log(therapy[0].TherapySessions);
                console.log(session);
                res.render("therapy-session-doctor", {
                    page: 12,
                    loggedIn: 2,
                    session: session,
                    patientId: patientId,
                });
            }
        }
    );
});

app.post("/therapy-session-doctor", (req, res) => {
    if (req.isAuthenticated() && req.user.Role == "Doctor") {
        const sessionId = req.query.sessionId;
        const patientId = req.query.patientId;
        const doctorId = req.user._id;

        console.log("Doctor Id : ", doctorId);
        console.log("Patient Id : ", patientId);
        console.log("Session Id : ", sessionId);
        console.log("Body of requeset", req.body);
        const newTherapySession = {
            _id: sessionId,
            Date: req.body.Date,
            Status: "Completed",
            Diagnosis: req.body.Diagnosis,
            Outcome: req.body.Outcome,
            Prescription: req.body.Prescription,
        };
        console.log("Updating details of Therapy Session");
        console.log(newTherapySession);
        const filter = {
            DoctorId: doctorId,
            PatientId: patientId,
            "TherapySessions._id": sessionId,
        };
        therapies.updateOne(
            filter,
            {
                $set: {
                    "TherapySessions.$": newTherapySession,
                },
            },
            function (err, result) {
                if (err) console.log(err);
                else {
                    console.log("Added new session details");
                }
                res.redirect(
                    "/therapy-session-doctor?patientId=" +
                        patientId +
                        "&sessionId=" +
                        sessionId
                );
            }
        );
    } else {
        res.redirect("/");
    }
});

app.post("/schedule-next-session", (req, res) => {
    const patientId = req.query.patientId;
    const newSessionDate = req.body.newSessionDate;
    // const newSessionTinme = req.body.newSessionDate;
    if (!newSessionDate) {
        res.redirect("/therapy-doctor?patientId=" + patientId);
    }
    const newTherapySession = {
        Date: new Date(newSessionDate),
        Outcome: "",
        Prescription: "",
        Diagnosis: "",
        Status: "Pending",
    };
    console.log("New session ");
    console.log(newTherapySession);
    console.log("Doctor : ", req.user._id);
    console.log("Patient : ", patientId);
    therapies.findOne(
        { DoctorId: req.user._id, PatientId: patientId },
        function (err, result) {
            console.log("Found = ", result);
            therapies
                .updateOne(
                    { DoctorId: req.user._id, PatientId: patientId },
                    { $push: { TherapySessions: newTherapySession } }
                )
                .then((result2) => {
                    console.log("New session");
                    console.log("Result = ", result2);
                    res.redirect("/therapy-doctor?patientId=" + patientId);
                });
        }
    );
});

app.get("/logout", (req, res) => {
    req.logout(req.user, (err) => {
        if (err) return next(err);
        res.redirect("/");
    });
});

app.post("/login", function (req, res, next) {
    console.log("Login page");
    const user = new User({
        username: req.body.username,
        password: req.body.password,
    });

    passport.authenticate("local", function (err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.redirect("/login");
        }
        req.logIn(user, function (err) {
            if (err) {
                return next(err);
            }
            return res.redirect("/secrets");
        });
    })(req, res, next);
});

app.post("/register", function (req, res) {
    console.log(req.body.Role);
    User.register(
        { name : req.body.name, username: req.body.username, Role: req.body.Role },
        req.body.password,
        function (err, user) {
            if (err) {
                console.log(err);
                res.redirect("/register");
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/secrets");
                });
            }
        }
    );
});

app.post("/questionnaire", function (req, res) {
    if (req.isAuthenticated()) {
        if (req.user.Role == "Patient") {
            let result = 0;
            if (req.body.AA) result += Number(req.body.AA);
            if (req.body.AB) result += Number(req.body.AB);
            if (req.body.AC) result += Number(req.body.AC);
            if (req.body.AD) result += Number(req.body.AD);
            if (req.body.AE) result += Number(req.body.AE);
            if (req.body.AF) result += Number(req.body.AF);
            if (req.body.AG) result += Number(req.body.AG);
            if (req.body.AH) result += Number(req.body.AH);
            if (req.body.AI) result += Number(req.body.AI);
            if (req.body.AJ) result += Number(req.body.AJ);
            if (req.body.AK) result += Number(req.body.AK);
            if (req.body.AL) result += Number(req.body.AL);
            if (req.body.AM) result += Number(req.body.AM);
            if (req.body.AN) result += Number(req.body.AN);
            if (req.body.AO) result += Number(req.body.AO);
            if (req.body.AP) result += Number(req.body.AP);
            if (req.body.AQ) result += Number(req.body.AQ);
            if (req.body.AR) result += Number(req.body.AR);
            if (req.body.AS) result += Number(req.body.AS);
            if (req.body.AT) result += Number(req.body.AT);
            if (req.body.AU) result += Number(req.body.AU);
            if (req.body.AV) result += Number(req.body.AV);
            if (req.body.AW) result += Number(req.body.AW);
            if (req.body.AX) result += Number(req.body.AX);
            if (req.body.AY) result += Number(req.body.AY);
            if (req.body.AZ) result += Number(req.body.AZ);
            if (req.body.BA) result += Number(req.body.BA);
            if (req.body.BB) result += Number(req.body.BB);
            if (req.body.BC) result += Number(req.body.BC);
            if (req.body.BD) result += Number(req.body.BD);
            console.log(result);
            result = (result - 30) / 90;
            patient.updateOne(
                { ID: ID },
                { Result: result },
                { upsert: true },
                function (error) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log("Sucessfully updated");
                    }
                }
            );
        }
        res.redirect("/");
    } else {
        res.redirect("/");
    }
});

app.post("/doctor", upload, function (req, res) {
    if (req.isAuthenticated()) {
        if (req.user.Role == "Doctor") {
            var name, update;
            if (req.file != null) {
                name = req.file.filename;
                update = {
                    $set: {
                        ID: ID,
                        Name: req.body.username,
                        Address: req.body.Address,
                        tin: req.body.TIN,
                        gmail: req.body.email,
                        adhaarNumber: req.body.Adhaar,
                        about: req.body.self,
                        imagename: name,
                        Rating: 5,
                    },
                };
            } else {
                update = {
                    $set: {
                        ID: ID,
                        Name: req.body.username,
                        Address: req.body.Address,
                        tin: req.body.TIN,
                        gmail: req.body.email,
                        adhaarNumber: req.body.Adhaar,
                        about: req.body.self,
                    },
                };
            }
            var query = { ID: ID };
            var options = { upsert: true };
            information.updateOne(query, update, options, function (error) {
                if (error) {
                    console.log(error);
                } else {
                    console.log("Sucessfully updated");
                }
            });
            res.redirect("/");
        } else {
            res.redirect("/login");
        }
    } else {
        res.redirect("/login");
    }
});

app.post("/video-call", (req, res) => {
    if (req.isAuthenticated()) {
        const room_url = "https://localhost:4000/" + ROOM_ID;
        res.redirect(room_url);
    }
});

app.get("/activities", function (req, res) {
    if (req.isAuthenticated() && req.user.Role != "Student") {
        const activityId = req.query.activityId;
        res.render("activity", {
            activityId: activityId,
            page: 3,
            loggedIn: (req.user.Role == "Doctor" ? 2 : 1),
        });
    } else {
        res.redirect("/login");
    }
});

app.listen(3000, function () {
    console.log("Server started on port 3000.");
    console.log("Go to http://localhost:3000");
});
