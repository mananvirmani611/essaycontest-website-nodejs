const express = require("express");
const app = express();
const Razorpay = require("razorpay");
const bodyParser = require("body-parser");
const https = require("https");
const qs = require("querystring");
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
var XLSX = require('xlsx');
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
//setting ejs as viewengine
app.set('view engine', 'ejs');
//using local files
app.use(express.static("public"));
//allowing app to use body parser
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
  secret: "asdkfajklaksdf",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());





mongoose.connect('mongodb+srv://admin-manan:adminmanan@cluster0.svut7.mongodb.net/razorpay', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
mongoose.set("useCreateIndex", true);





const adminSchema = new mongoose.Schema({
  email: String,
  password: String
});


let mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'monomousumi.contest@gmail.com',
        pass: 'monomousumicontest@2021'
    },
    enableSsl : true
});







const userSchema = new mongoose.Schema({
  password: String,
  fullName: String,
  email: String,
  state : String,
  country : String,
  essay : String,
  key : String,
  paymentMade : Boolean,
  grade1 : Number,
  grade2: Number,
  grade : Number,
  remarks  :String,
  phone : String
});

const referralSchema = new mongoose.Schema({
  referralCode : String,
  nameOfMarketor : String,
  accBalance : Number,
  phoneNumber : Number,
  email : String,
  passwordOfMarketor : String
});


//adding passportLocalMongoose and findOrCreate plugin
adminSchema.plugin(passportLocalMongoose);



const Admin = new mongoose.model("Admin", adminSchema)
const User = new mongoose.model("User",userSchema );
const Referral = new mongoose.model("Referral", referralSchema);





//making Strategy using passport
passport.use(Admin.createStrategy());


// serializing and deserializing user, for local as well as google Strategies
passport.serializeUser(Admin.serializeUser());

passport.deserializeUser(Admin.deserializeUser());




app.get("/admin-login", function (req, res) {

  res.sendFile(__dirname + "/admin-login.html");

})
app.post("/admin/login", function (req, res) {
    console.log(req.isAuthenticated());
    console.log("checking");
    const admin = new Admin({
      username: req.body.username,
      password: req.body.password
    });
    req.login(admin, function (err) {
      if (err) {
        console.log(err);
        //if authentication fails, then coming back to login page
        res.redirect("/admin-login");
      }
      else {
        //checking if credentials are correct or not
        passport.authenticate("local")(req, res, function () {
          //if credentials are correct, redirect to homepage
          // res.send(__dirname + "/please-verify.html");
          Admin.find({ email: req.user.username }, function (err, docs) {
            if (err) {
              console.log(err);
            }
            else {
                res.redirect("/admin/dashboard");

            }
          });
        });
      }
    })

})







const razorpay = new Razorpay({
  key_id: 'rzp_test_RjJi59dIpovzTJ',
  key_secret : 'MT6DjVUAzD0uG91nzxoCQxAB'
})

app.post("/:routeKey/orders", function(req, res){
  console.log("the route key is " + req.params.routeKey);
  console.log("the essay is " + req.body.essay);


  console.log("categeory is " + req.body.categeory);
  User.findOneAndUpdate({ key: req.params.routeKey }, { essay: req.body.essay, state : req.body.categeory} , (err, update) => {
    if (err) {
      console.log(err);
    } else {
      console.log("essay and categeory updated");
    }
  })



  let options = {
    amount : "30000",
    currency : "INR",
  }
  // console.log(req);/
  razorpay.orders.create(options, function(err, order){
    // console.log(order);
    // var orderid = order.id;
    // console.log(orderid);
    res.json(order);
  })
});


app.post("/:referralCode/:routeKey/orders", function(req, res){
  console.log("the route key is " + req.params.routeKey);
  console.log("the details are " +  JSON.stringify(req.body));
  console.log("the referral code is " + req.params.referralCode);



  User.findOneAndUpdate({ key: req.params.routeKey }, { essay: req.body.essay, state : req.body.categeory} , (err, update) => {
    if (err) {
      console.log(err);
    } else {
      console.log("essay and categeory updated");
    }
  })
  let options = {
    amount : "30000",
    currency : "INR",
  }
  // console.log(req);/
  razorpay.orders.create(options, function(err, order){
    // console.log(order);
    // var orderid = order.id;
    // console.log(orderid);
    res.json(order);
  })
});

let port = process.env.PORT;
if (port == null || port == "") {
  port =  '3000';
}


app.post("/payment-complete/:routeKey", function(req, res){
        console.log("req body in payment-complete is " + JSON.stringify(req.body));


        User.findOneAndUpdate({ key: req.params.routeKey }, { paymentMade: true} , (err, update) => {
          if (err) {
            console.log(err);
          } else {
            console.log("data updated");
          }
        })




        // Referral.findOne({referralCode : referralCodeInput }, function(err, data){
        //    if(data){
        //         console.log(data);
        //          prevBalance = data.accBalance;
        //          console.log("Prev balance is " + prevBalance);
        //          Referral.findOneAndUpdate({ referralCode: ref }, { accBalance: prevBalance+10} , (err, update) => {
        //            if (err) {
        //              console.log(err);
        //            } else {
        //              console.log("data updated");
        //            }
        //          })
        //    }
        //    else{
        //      console.log(err);
        //    }
        // });


        let email;
        User.findOne({key : req.params.routeKey }, function(err, data){
           if(data){
                console.log(data);
                email = data.email;
                let mailDetails = {
                    from: 'monomousumi.contest@gmail.com',
                    to: email,
                    subject: "Payment Done!",
                    text:
                    "Dear "+ data.fullName + ",\n"+

"We have received your registration fee and your entry is successfully submitted now.\n\n" +

"You will receive an email once your article (Poem/Story) is published. Let the world see your creativity.\n\n" +

"You will be informed after the announcement of the result. You can check the result and download your certificate through this link\n" +
"https://monomousumicontest.com/findresult/student \n\n"+

"Regards,\n" +
"Team Monomousumi"
                };

                mailTransporter.sendMail(mailDetails, function(err, data) {
                    if(err) {
                        console.log(err);
                    } else {
                        console.log('Email sent successfully');
                    }
                });
           }
           else{
             console.log(err);
           }
        });








        res.sendFile(__dirname + "/payment-done.html");
})

// const referral = new Referral({
//   referralCode : "ppqr",
//   nameOfMarketor : "marketor",
//   accBalance : 0,
//   phoneNumber : "69849849",
//   email : "email@marketor.com"
// })
// referral.save();
// console.log("marketor saved");

app.post("/payment-complete/:userUId/:routeKey", function(req, res){
        console.log(req.body);



        User.findOneAndUpdate({ key: req.params.routeKey }, { paymentMade: true} , (err, update) => {
          if (err) {
            console.log(err);
          } else {
            console.log("data updated");
          }
        })





        Referral.findOne({referralCode : req.params.userUId }, function(err, data){
           if(data){
                console.log(data);
                let prevBalance = data.accBalance;
                 console.log("Prev balance is " + prevBalance);
                 Referral.findOneAndUpdate({ referralCode: req.params.userUId }, { accBalance: prevBalance+10} , (err, update) => {
                   if (err) {
                     console.log(err);
                   } else {
                     console.log("data updated");
                   }
                 })
           }
           else{
             console.log(err);
           }
        });



        let email;
        User.findOne({key : req.params.routeKey }, function(err, data){
           if(data){
                console.log(data);
                email = data.email;
                let mailDetails = {
                    from: 'monomousumi.contest@gmail.com',
                    to: email,
                    subject: "Payment Done!",
                    text:
                    "Dear "+ data.fullName + ",\n"+

"We have received your registration fee and your entry is successfully submitted now.\n\n" +

"You will receive an email once your article (Poem/Story) is published. Let the world see your creativity.\n\n" +

"You will be informed after the announcement of the result. You can check the result and download your certificate through this link\n" +
"https://monomousumicontest.com/findresult/student \n\n"+

"Regards,\n" +
"Team Monomousumi"  };

                mailTransporter.sendMail(mailDetails, function(err, data) {
                    if(err) {
                        console.log('Error Occurs');
                    } else {
                        console.log('Email sent successfully');
                    }
                });

           }
           else{
             console.log(err);
           }
        });




















        res.sendFile(__dirname + "/payment-done.html");
})





app.get("/", (req, res) => {
  //user comes to the homepage and then is going to fill the form.
  res.sendFile(__dirname + "/home-signup.html");
});
app.get('/:userUId', function (req, res) {
  //user has came to the site using a refferal and is going to fill the form
  //the userUId is the referral code attached along with the url

  res.render("home-signup-referral", {referralCode : req.params.userUId});

});


app.post("/", function(req, res){
  //user has filled the form of the normal website
   var nameEntered = req.body.name;
   var emailEntered = req.body.email;
   var passwordEntered = req.body.password;
   var stateEntered = req.body.state;
   var countryEntered = req.body.country;
   //key is been generated.
   const key = makeid(4) + (Math.floor(Math.random()*10000) + 1);
   // console.log("the key is " + key);
   //new user object is being created with payment done = false
   //and essay as an empty string
   var newuser = new User({
     password: passwordEntered,
     fullName: nameEntered,
     email: emailEntered,
     phone : stateEntered,
     country : countryEntered,
     essay : "",
     key : key,
     paymentMade : false,
     grade1 : 0,
     grade2 : 0,
     grade: 0,
     remarks:"-"
   })
   //saving user
   newuser.save();

   let mailDetails = {
       from: 'monomousumi.contest@gmail.com',
       to: emailEntered,
       subject: "Registration Done!",
       text: "Dear " + nameEntered +"\n\n"+

"Thank you for registering to submit your creative writing for the Quarterly Creative Writing Contest.\n\n" +
"Your Unique Key is " + key +
" and Password is" + passwordEntered + "\n\n" +
"You can login later using these credentials to see the result when announced.\n"+
"You can check the result and download your certificate through this link\n" +
"https://monomousumicontest.com/findresult/student \n\n\n"+

"To know the detailed process and FAQ please click this link\n"+
"https://monomousumi.com/description-of-creative-writing-contest/ \n\n\n"

+ "Regards,\n"
+ "Team Monomousumi"
};

   mailTransporter.sendMail(mailDetails, function(err, data) {
       if(err) {
           console.log('Error Occurs');
       } else {
           console.log('Email sent successfully');
       }
   });














   //directing to the dashboard passing key as the parameters.
   res.redirect("/dashboard/" + dashboardNumber +"/" + key);
})


app.post("/:userUId/", function(req, res){

  //user has filled the form using some refferal code website
   var nameEntered = req.body.name;
   var emailEntered = req.body.email;
   var passwordEntered = req.body.password;
   var stateEntered = req.body.state;
   var countryEntered = req.body.country;

   //unique key for user is generated
   const key = makeid(4) + (Math.floor(Math.random()*10000) + 1);
   // new user creation
   var newuser = new User({
     password: passwordEntered,
     fullName: nameEntered,
     email: emailEntered,
     phone : stateEntered,
     country : countryEntered,
     essay : "",
     key : key,
     paymentMade : false,
     grade1 : 0,
     grade2 : 0,
     grade : 0,
     remarks:"-"
   })
   newuser.save();



   let mailDetails = {
       from: 'monomousumi.contest@gmail.com',
       to: emailEntered,
       subject: "Registration Done!",
       text: "Dear " + nameEntered +"\n\n"+

"Thank you for registering to submit your creative writing for the Quarterly Creative Writing Contest.\n\n" +
"Your Unique Key is " + key +
"and Password is" + passwordEntered + "\n\n" +
"You can login later using these credentials to see the result when announced.\n"+
"You can check the result and download your certificate through this link\n" +
"https://monomousumicontest.com/findresult/student \n\n\n"+

"To know the detailed process and FAQ please click this link\n"+
"https://monomousumi.com/description-of-creative-writing-contest/ \n\n\n"

+ "Regards,\n"
+ "Team Monomousumi"   };

   mailTransporter.sendMail(mailDetails, function(err, data) {
       if(err) {
           console.log('Error Occurs');
       } else {
           console.log('Email sent successfully');
       }
   });

   //user is now redirected to dashboard with paramters as 1.) the referral code
   // 2.) the unique key of the user.
   res.redirect("/" + req.params.userUId + "/dashboard/" + dashboardNumber + "/" + key);
})
var dashboardNumber = 1;

app.get("/dashboard/"  + 1 + "/:key", function(req, res){
  //once user comes here, we show two options
  // 1.) refer to friend
  //2.) fill the esssay form
  //and these both things are included in the same form
  //route key is passed because when user will make post request on ordre page,
  //this routeKey(uniqueKey will be attached there also)
  //(this routeKey is used in axios post request )
  setTimeout(myFunc, 2000, 'funky');
  function myFunc(){
    User.findOne({key : req.params.key }, function(err, data){
       if(data){
            // console.log("the data is " + data);
            let paymentMade  = data.paymentMade;
            let password = data.password;
            let sendingData = "";
            for(var i = 0; i<password.length - 3; i++){
                sendingData = sendingData + "*";
            }
            sendingData = sendingData + password.substr(password.length-3, password.length);
            // console.log(sendingData);
            // console.log(password);
            // console.log(paymentMade);
            res.render("dashboard", {routeKey : req.params.key, password : sendingData, paymentMade : paymentMade });
       }
       else{
              res.render("dashboard", {routeKey : req.params.key, password : "*******", paymentMade : paymentMade });
       }
    });

  }



})



app.get("/dashboard/"  + 2 + "/:key", function(req, res){
  //once user comes here, we show two options
  // 1.) refer to friend
  //2.) fill the esssay form
  //and these both things are included in the same form
  //route key is passed because when user will make post request on ordre page,
  //this routeKey(uniqueKey will be attached there also)
  //(this routeKey is used in axios post request )
  setTimeout(myFunc, 2000, 'funky');
  function myFunc(){
    User.findOne({key : req.params.key }, function(err, data){
       if(data){
            console.log("the data is " + data);
            let paymentMade  = data.paymentMade;
            let password = data.password;
            let sendingData = "";
            for(var i = 0; i<password.length - 3; i++){
                sendingData = sendingData + "*";
            }
            sendingData = sendingData + password.substr(password.length-3, password.length);
            console.log(sendingData);
            console.log(password);
            // console.log(paymentMade);
            res.render("dashboard2", {routeKey : req.params.key, password : sendingData, paymentMade : paymentMade });
       }
       else{
              res.render("dashboard2", {routeKey : req.params.key, password : "*******", paymentMade : paymentMade });
       }
    });

  }



})
app.get("/:userUId/dashboard/" + 1 + "/:key", function(req, res){
  User.findOne({key : req.params.key }, function(err, data){
     if(data){
          console.log(data);
          let paymentMade  = data.paymentMade;
          let password = data.password;
          let sendingData = "";
          for(var i = 0; i<password.length - 3; i++){
              sendingData = sendingData + "*";
          }
          sendingData = sendingData + password.substr(password.length-3, password.length);

          res.render("dashboard-referral", {routeKey :req.params.key, referralCode : req.params.userUId, password : sendingData, paymentMade : paymentMade  });
     }
     else{
       console.log(err);
     }
  });

})




app.get("/:userUId/dashboard/" + 2 + "/:key", function(req, res){
  User.findOne({key : req.params.key }, function(err, data){
     if(data){
          console.log(data);
          let paymentMade  = data.paymentMade;
          let password = data.password;
          let sendingData = "";
          for(var i = 0; i<password.length - 3; i++){
              sendingData = sendingData + "*";
          }
          sendingData = sendingData + password.substr(password.length-3, password.length);

          res.render("dashboard-referral2", {routeKey :req.params.key, referralCode : req.params.userUId, password : sendingData, paymentMade : paymentMade  });
     }
     else{
       console.log(err);
     }
  });

})

app.get("/referral/signup", function(req,res){
  res.sendFile(__dirname + "/signup-marketor.html");
})
app.post("/referral/signup", function(req,res){
  console.log(req.body.email);
  User.findOne({email : req.body.email }, function(err, data){
     if(data){
        Referral.findOne({email : req.body.email}, function(err, data2){
          if(data2){
              var link =  'https://monomousumicontest.com/' + data2.referralCode;
              res.render('already-generated-referral', {link : link});
          }
          else{
            const referralCodeGenerated = makeid(6);
            // console.log(data);
            const newMarketor = new Referral({
              referralCode : referralCodeGenerated,
              nameOfMarketor : req.body.name,
              accBalance : 0,
              email : data.email,
              passwordOfMarketor : data.password
            })
            newMarketor.save();
            let mailDetails = {
                from: 'monomousumi.contest@gmail.com',
                to: data.email,
                subject: "Referral Link generated!",
                text: "Dear " + req.body.name + "\n"+

"Thank you for creating a referral link.\n\n" +
"Your Referral Link is https://monomousumicontest.com/" + referralCodeGenerated +
" and Password is" + data.password + "\n\n"+
"You can check your earning amount using these credentials through this link\n" +
"https://monomousumicontest.com/login/marketor \n\n\n"+

"You are one step away to start earning through this link. For every participation from this link, you will be rewarded with cash, which will be paid weekly. \nFor more details about the earning amount and details please click this link."
+ "\nhttps://monomousumi.com/refer-and-earn/ \n\n\n"

+ "Regards,\n"
+ "Team Monomousumi"  };

            mailTransporter.sendMail(mailDetails, function(err, data) {
                if(err) {
                    console.log('Error Occurs');
                } else {
                    console.log('Email sent successfully');
                }
            });
            var link =  'https://monomousumicontest.com/' + referralCodeGenerated;
            res.render('referral-signup-done', {link : link});
          }
        })
     }
     else{
       res.send("NO SUCH DATA FOUND");
     }
  });

})



app.get("/login/marketor", function(req, res){
  res.sendFile(__dirname + "/login-marketor.html");
})

app.post("/login/marketor" , function(req, res){
  Referral.findOne({referralCode : (req.body.referralLink).substr(req.body.referralLink.length-6,req.body.referralLink.length ), passwordOfMarketor : req.body.password}, function(err, data){
     if(data){
           var currentbalance = data.accBalance;
           res.render('balance-check', {balance : currentbalance});
     }
     else{
       console.log(err);
     }
  });
})


app.get("/login/person", function(req, res){
  res.sendFile(__dirname + "/home-login.html");
})
app.post("/login/person", function(req, res){
  User.findOne({email : req.body.email }, function(err, data){
     if(data){
          if(data.password == req.body.password){
            console.log(dashboardNumber);
              res.redirect("/dashboard/" + dashboardNumber + "/"+ data.key );
          }

     }
     else{
       res.send("NO SUCH DATA FOUND");
     }
  });
});




app.get("/login/person/:userUId", function(req, res){
  res.render("home-login-referral" , {userUId : req.params.userUId});
})
app.post("/login/person/:userUId", function(req, res){
  console.log(req.body.email);
  console.log(req.body.password);
  User.findOne({email : req.body.email }, function(err, data){
     if(data){
          console.log(data);
          if(data.password == req.body.password){
            console.log(dashboardNumber);
            console.log("good");
            res.redirect("/"+ req.params.userUId + "/dashboard/"  + dashboardNumber + "/"+  data.key );
          }
          else{
            res.send("WRONG PASSWORD");
          }

     }
     else{
       res.send("NO SUCH DATA FOUND");
     }
  });
});

var referrals;
var users;
app.get("/admin/dashboard", function(req, res){
  if(req.isAuthenticated()){
    User.find().exec(function (err, results) {
    users = (results.length);
    console.log("total users are "  + users);
            Referral.find().exec(function (err, results) {
            referrals = results.length;
            console.log("total referrals are "  + referrals);
            User.find({paymentMade : true }, function(err, data){
               if(data){
                    console.log(data.length);
                    res.render("admin-dashboard-main", {referrals : referrals, registrations : users, submissions: data.length});
               }
               else{
                 res.send("NO SUCH DATA FOUND");
               }
            });

            });


    });
  }
  else{
    res.redirect("/admin-login");
  }

})

app.get("/admin/dashboard/qwertyuiop/grading1", function(req, res){
  User.find().exec(function (err, results) {
  users = (results.length);
  console.log("total users are "  + users);
          Referral.find().exec(function (err, results) {
          referrals = results.length;
          console.log("total referrals are "  + referrals);
          User.find({paymentMade : true }, function(err, data){
             if(data){
                  console.log(data.length);
                  res.render("admin-dashboard-1", {referrals : referrals, registrations : users, submissions: data.length});
             }
             else{
               res.send("NO SUCH DATA FOUND");
             }
          });

          });


  });
})




app.get("/admin/dashboard/zxcvbnm/grading2", function(req, res){
  User.find().exec(function (err, results) {
  users = (results.length);
  console.log("total users are "  + users);
          Referral.find().exec(function (err, results) {
          referrals = results.length;
          console.log("total referrals are "  + referrals);
          User.find({paymentMade : true }, function(err, data){
             if(data){
                  console.log(data.length);
                  res.render("admin-dashboard-2", {referrals : referrals, registrations : users, submissions: data.length});
             }
             else{
               res.send("NO SUCH DATA FOUND");
             }
          });

          });


  });
})








app.get("/admin/grading1/qwertyuiop", function(req, res){
  User.find({paymentMade : true }, function(err, data){
     if(data){
          console.log(data.length);
          res.render("admin-grading-1", {dataArray : data});
     }
     else{
       res.send("NO SUCH DATA FOUND");
     }
  });
})

app.post("/admin/grading1/:routeKey/qwertyuiop", function(req, res){
  User.findOneAndUpdate({ key: req.params.routeKey }, { grade1 : req.body.grade1} , (err, update) => {
    if (err) {
      console.log(err);
    } else {
      console.log("grade updated");
      User.find({paymentMade : true }, function(err, data){
         if(data){
              console.log(data.length);
              res.render("admin-grading-1", {dataArray : data});
         }
         else{
           res.send("NO SUCH DATA FOUND");
         }
      });
    }
  })

})












app.get("/admin/grading2/zxcvbnm", function(req, res){
  User.find({paymentMade : true }, function(err, data){
     if(data){
          console.log(data.length);
          res.render("admin-grading-2", {dataArray : data});
     }
     else{
       res.send("NO SUCH DATA FOUND");
     }
  });
})

app.post("/admin/grading2/:routeKey/zxcvbnm", function(req, res){
  User.findOneAndUpdate({ key: req.params.routeKey }, { grade2 : req.body.grade2} , (err, update) => {
    if (err) {
      console.log(err);
    } else {
      console.log("grade updated");
      User.find({paymentMade : true }, function(err, data){
         if(data){
              console.log(data.length);
              res.render("admin-grading-2", {dataArray : data});
         }
         else{
           res.send("NO SUCH DATA FOUND");
         }
      });
    }
  })

})





app.get("/admin/grading/asdfghjkl", function(req, res){
  console.log(req.isAuthenticated());
  if (req.isAuthenticated()) {
    User.find({paymentMade : true }, function(err, data){
       if(data){
            console.log(data.length);
            res.render("admin-grading-main", {dataArray : data});
       }
       else{
         res.send("NO SUCH DATA FOUND");
       }
    });
  }
  else{
    res.redirect("/admin-login");
  }
})

app.post("/admin/grading/:routeKey/asdfghjkl", function(req, res){
  User.findOneAndUpdate({ key: req.params.routeKey }, { grade : req.body.grade} , (err, update) => {
    if (err) {
      console.log(err);
    } else {
      console.log("grade updated");
      User.find({paymentMade : true }, function(err, data){
         if(data){
              console.log(data.length);
              res.render("admin-grading-main", {dataArray : data});
         }
         else{
           res.send("NO SUCH DATA FOUND");
         }
      });
    }
  })

})




app.get("/essay/reading/:routeKey", function(req, res){
  User.find({key : req.params.routeKey }, function(err, data){
     if(data){

          res.render("essay-full", {data : data});
     }
     else{
       res.send("NO SUCH DATA FOUND");
     }
  });
})


app.get("/findresult/student", function(req, res){
      res.render("find-result", {data : null});
})

app.post("/findresult/student", function(req, res){
  User.find({email : req.body.email }, function(err, data){
     if(data){
          console.log(data.length);
          res.render("find-result", {data : data, overAllGrade :(data[0].grade) });
     }
     else{
       res.send("NO SUCH DATA FOUND");
     }
  });
})


app.post("/announce/result/done", function(req, res){
    if(req.isAuthenticated()){
      dashboardNumber = 2;
      console.log("done");


      var length;
      User.find({paymentMade  :true}).exec(function (err, results) {
          length = results.length;
          var i;

            User.find({paymentMade : true}, function(err, data){
      for(i = 0; i<length; i++){
        console.log(length);
                    console.log(data[i].grade);
                    var grade = data[i].grade;
                    var email = data[i].email;
                    if(grade < 100  && grade >= 95){
                      User.findOneAndUpdate({ email: email }, { remarks : "FIRST"} , (err, update) => {
                        if (err) {
                          console.log(err);
                        } else {
                          console.log("remarks updated!!");
                        }
                      })
                    }
                    else if(grade < 95  && grade >= 90){
                      User.findOneAndUpdate({ email: email }, { remarks : "SECOND"} , (err, update) => {
                        if (err) {
                          console.log(err);
                        } else {
                          console.log("remarks updated!!");
                        }
                      })
                    }
                    else if(grade <  90 && grade >= 85){
                      User.findOneAndUpdate({ email: email }, { remarks : "THIRD"} , (err, update) => {
                        if (err) {
                          console.log(err);
                        } else {
                          console.log("remarks updated!!");
                        }
                      })
                    }
                    else if(grade < 85  && grade >= 80){
                      User.findOneAndUpdate({ email: email }, { remarks : "OUTSTANDING"} , (err, update) => {
                        if (err) {
                          console.log(err);
                        } else {
                          console.log("remarks updated!!");
                        }
                      })
                    }
                    else if(grade < 80  && grade >= 70){
                      User.findOneAndUpdate({ email: email }, { remarks : "PRAISEWORTHY"} , (err, update) => {
                        if (err) {
                          console.log(err);
                        } else {
                          console.log("remarks updated!!");
                        }
                      })
                    }
                    else{
                      User.findOneAndUpdate({ email: email }, { remarks : "GOOD"} , (err, update) => {
                        if (err) {
                          console.log(err);
                        } else {
                          console.log("remarks updated!!");
                        }
                      })
                    }


      }
            });


      });



      res.send("done");
    }
    else{
      res.redirect("/admin-login");
    }
})

app.get("/announce/result", function(req, res){
  if(req.isAuthenticated()){
  res.sendFile(__dirname + "/announce.html");

}
else{
    res.redirect("/admin-login");
}
})





app.get("/forgot/password", function(req, res){
  res.sendFile(__dirname + "/forgot-password.html");
})
app.post("/forgot/password", function(req, res){
  User.findOne({email : req.body.email}, function(err, data){
     if(data.length != 0){
       console.log(data);
       let mailDetails = {
           from: 'monomousumi.contest@gmail.com',
           to: req.body.email,
           subject: "Forgot Password?",
           text: 'Here is your unique key :' + data.key +" and password is " + data.password + "\nYou can login now"
       };

       mailTransporter.sendMail(mailDetails, function(err, data) {
           if(err) {
               console.log('Error Occurs');
           } else {
               console.log('Email sent successfully');
           }
       });
          res.sendFile(__dirname + "/email-sent-for-password.html");
     }
     else{
       res.send("NO SUCH DATA FOUND");
     }
  });
})


app.get("/download/newcertificate", function(req, res){
  res.sendFile(__dirname + "/download-certificate.html");
})
app.post("/download/certificate/:key", function(req, res){
  User.find({key : req.params.key }, function(err, data){
     if(data){
          console.log(data);
          console.log(data[0].fullName);
          var grade = data[0].grade;
          if(grade < 100  && grade >= 95){
              res.render("download-certificate", {name : data[0].fullName, remarks : "FIRST"});
          }
          else if(grade < 95  && grade >= 90){
            res.render("download-certificate", {name : data[0].fullName, remarks : "SECOND"});
          }
          else if(grade <  90 && grade >= 85){
            res.render("download-certificate", {name : data[0].fullName, remarks : "THIRD"});
          }
          else if(grade < 85  && grade >= 80){
            res.render("download-certificate", {name : data[0].fullName, remarks : "OUTSTANDING"});
          }
          else if(grade < 80  && grade >= 70){
            res.render("download-certificate", {name : data[0].fullName, remarks : "PRAISEWORTHY"});
          }
          else{
            res.render("download-certificate", {name : data[0].fullName, remarks : "GOOD"});
          }

        }
     else{
       res.send("NO SUCH DATA FOUND");
     }
  });

})








app.post('/export/data/user',(req,res)=>{
    var wb = XLSX.utils.book_new(); //new workbook
    User.find((err,data)=>{
        if(err){
            console.log(err)
        }else{
            var temp = JSON.stringify(data);
            temp = JSON.parse(temp);
            var ws = XLSX.utils.json_to_sheet(temp);
            var down = __dirname+'/public/exportdata.xlsx'
           XLSX.utils.book_append_sheet(wb,ws,"sheet1");
           XLSX.writeFile(wb,down);
           res.download(down);
        }
    });
});
app.post('/export/data/referral',(req,res)=>{
    var wb = XLSX.utils.book_new(); //new workbook
    Referral.find((err,data)=>{
        if(err){
            console.log(err)
        }else{
            var temp = JSON.stringify(data);
            temp = JSON.parse(temp);
            var ws = XLSX.utils.json_to_sheet(temp);
            var down = __dirname+'/public/exportdata.xlsx'
           XLSX.utils.book_append_sheet(wb,ws,"sheet1");
           XLSX.writeFile(wb,down);
           res.download(down);
        }
    });
});

app.get("/result/reset", function (req, res) {
    if(req.isAuthenticated()){
      res.sendFile(__dirname + '/confirmation.html');
    }
    else{
        res.redirect("/admin-login");
    }
})
app.post("/result/reset", function (req, res) {
  if (req.isAuthenticated()) {
    if(req.body.password === "987654321"){

      dashboardNumber = 1;
      console.log("done");
      User.deleteMany({}).then(function(){
    console.log("Data deleted"); // Success
    }).catch(function(error){
    console.log(error); // Failure
    });

    Referral.deleteMany({}).then(function(){
  console.log("Data deleted"); // Success
  }).catch(function(error){
  console.log(error); // Failure
  });
      res.send("everything reset");
    }
    else{
      res.send("Wrong password")

    }
  }
  else{
    res.redirect("/admin-login");
  }
})

app.listen(port, function() {
  console.log("Server started succesfully");
});


function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() *
      charactersLength));
   }
   return result;
}
