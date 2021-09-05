
const http = require("http");
var express = require("express");
var app = express();
const fs = require("fs");
const jwt = require("jsonwebtoken");
const cors = require('cors');
var cookieParser = require('cookie-parser');
const socketClient = require('socket.io-client');

let server = http.createServer(app);
let server1 = http.createServer(app);
let secret = "asdbalkjdjkbaboiaiduaiodfdbfiuodfsndks";


if(process.env.NODE_ENV == "production"){
  app.use(express.static("client/build"));
  const path = require("path")
  app.get("*",(req,res)=>{
    res.sendFile(path.resolve("client","build","index.html"));
  })
}

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  next();
});


  app.use(cors({ origin: '*', credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

// mongoose specific stuff
const mongoose = require("mongoose");
mongoose
  .connect(
    "mongodb://Shiva:Rgukt123@cluster0-shard-00-01.juncu.mongodb.net:27017/shiva?authSource=admin&readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=true",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(console.log("connected successfully"))
  .catch((err) => {
    console.log(err);
  });

const dataSchema = new mongoose.Schema({
  profile: Object,
  id: String,
  bag: Array,
  history: Array,
});
const dataSchema1 = new mongoose.Schema({
  id: String,
  email: String,
  password: String,
});
const deliveryBoy = new mongoose.Schema({
  profile: Object,
  orders: Array,
  status: String,
});
let token;
const mongoData = mongoose.model("item", dataSchema);
const mongoData1 = mongoose.model("admin", dataSchema1);
const mongoData3 = mongoose.model("deliveryBoy", deliveryBoy);

const orderSchema = new mongoose.Schema({
  date: String,
  orders: Object,
  deliveryBoy: String,
  status: String,
});
const mongoData2 = mongoose.model("order", orderSchema);
const food = JSON.parse(fs.readFileSync("main.json", "utf-8"));

/* GET home page. */

//middleware to verify token
const verify1 = (req, res, next) => {
  if (req.cookies.token != null) {
    let decodeToken = jwt.verify(req.cookies.token, secret);

    if (req.body.admin == "true") {
      mongoData1.findOne(
        { email: decodeToken.email, password: decodeToken.password },
        (err, admins) => {
          if (err) console.log(err);
          else {
            if (admins != null) {
              req.body.id = admins._id;
              next();
            } else {
              res.status(202).send("not authenticated");
            }
          }
        }
      );
    } else if (req.body.delivery == "true") {
      mongoData3.findOne(
        {
          "profile.email": decodeToken.email,
          "profile.password": decodeToken.password,
        },
        (err, deliveryBoys) => {
          if (err) console.log(err);
          else {
            if (deliveryBoys != null) {
              req.body.id = deliveryBoys._id;
              next();
            } else {
              res.status(202).send("not authenticated");
            }
          }
        }
      );
    } else {
      mongoData.findOne(
        {
          "profile.email": decodeToken.email,
          "profile.password": decodeToken.password,
        },
        (err, items) => {
          if (err) console.log(err);
          else {
            if (items != null) {
              req.body.id = items._id;
              next();
            } else {
              res.status(202).send("not authenticated");
            }
          }
        }
      );
    }
  } else res.status(202).send("not authenticated");
};

//to check authenticated or not
app.post("/authenticate", function (req, res) {
  if (req.cookies.token != null) {
    let decodeToken = jwt.verify(req.cookies.token, secret);

    if (req.body.admin == "true")
      mongoData1.exists(
        { email: decodeToken.email, password: decodeToken.password },
        (err, admins) => {
          if (err) console.log(err);
          else {
            if (admins == true) {
              req.body.id = admins._id;
              res.status(202).send("authenticated");
            } else {
              res.status(202).send("not authenticated");
            }
          }
        }
      );
    else if (req.body.delivery == "true") {
      mongoData3.exists(
        {
          "peofile.email": decodeToken.email,
          "peofile.password": decodeToken.password,
        },
        (err, deliveryBoys) => {
          if (err) console.log(err);
          else {
            if (deliveryBoys == true) {
              res.status(202).send("authenticated");
            } else {
              res.status(202).send("not authenticated");
            }
          }
        }
      );
    } else {
      mongoData.exists(
        {
          "profile.email": decodeToken.email,
          "profile.password": decodeToken.password,
        },
        (err, items) => {
          if (err) console.log(err);
          else {
            if (items == true) res.status(202).send("authenticated");
            else {
              res.status(202).send("not authenticated");
            }
          }
        }
      );
    }
  } else res.status(202).send("not authenticated");
});



//function for signup
app.post("/signup", function (req, res) {
  let flag = 0,
    flag1 = 0;

  mongoData.exists({ "profile.email": req.body.email }, (err, items) => {
    if (items) flag = 1;
    if (flag == 1) res.send({ message: "Already have an account" });
    else {
      if (req.body.change == "1") {
        delete req.body["change"];
        let temp = {};
        temp.profile = req.body;
        temp.bag = [];

        const userData = new mongoData(temp);

        userData.save(function (err, items) {
          if (err) return console.error(err);
          else console.log("Successfully signed up");
        });

        // console.log(temp);
        //offline or txt based maintainance of profile records
        mydata.data.unshift(temp);
        fs.writeFileSync("./routes/details.json", JSON.stringify(mydata));
      }
      res.status(200).send({ message: "" });
    }
  });
});

app.post("/add-deliveryboy", function (req, res) {
  let flag = 0,
    flag1 = 0;

  mongoData3.exists(
    { "profile.email": req.body.email },
    (err, deliveryBoys) => {
      if (deliveryBoys) flag = 1;
      if (flag == 1) res.send({ message: "Already have an account" });
      else {
        if (req.body.change == "1") {
          delete req.body["change"];
          let temp = {};
          temp.profile = req.body;
          temp.orders = [];
          temp.status = "leave";

          const userData = new mongoData3(temp);

          userData.save(function (err, deliveryBoys) {
            if (err) console.error(err);
            else console.log("Successfully Added");
          });
        }
        res.status(200).send({ message: "" });
      }
    }
  );
});

app.post("/editprofile", verify1, function (req, res) {
  let flag = 0,
    id = 0,
    i = "i";
  // console.log(JSON.parse(req.body));
  mongoData.findOne({ _id: req.body.id }, (err, items) => {
    if (
      req.body.oldPassword == items.profile.password ||
      (req.body.password == "" && req.body.oldPassword == "")
    )
      flag = 1;

    if (req.body.change == "1" && flag == 1) {
      delete req.body["change"];
      delete req.body["oldPassword"];
      let id = req.body.id;
      delete req.body["id"];
      if (req.body.password == "") req.body.password = items.profile.password;
      let temp = {};
      temp = req.body;

      let updatedLogin = {
        email: temp.email,
        password: temp.password,
        withCredentials: true,
      };
      //updating token
      token = jwt.sign(updatedLogin, secret);
      mongoData.updateOne({ _id: id }, { profile: temp }, () => {
        if (err) console.log(err);
        else console.log("successfully updated");
      });
      res
        .status(202)
        .cookie("token", token, {
          sameSite: "lax",
          httpOnly: "true",
          path: "/",
        })
        .send({ message: "" });
    } else {
      res.status(200).send({ message: "please enter correct OLD password" });
    }
  });
});

let details = {};
let bag = [];

//for login
app.post("/login", function (req, res) {
  let flag = 0;
  details = {};

  if (req.body.delivery == "true") {
    mongoData3.findOne(
      {
        "profile.email": req.body.email,
        "profile.password": req.body.password,
      },
      (err, items) => {
        if (err) console.log(err);
        else {
          if (items != null) {
            delete req.body["delivery"];
            token = jwt.sign(req.body, secret);
            details = items.profile;
            delete details["password"];
            details.id = items._id;

            res
              .status(202)
              .cookie("token", token, {
                sameSite: "lax",
                httpOnly: "true",
                path: "/",
                expires: new Date(new Date().getTime() + 315360000 * 1000),
              })
              .send({ message: "", info: details });
          } else res.send({ message: "Please Check Your email or Password" });
        }
      }
    );
  } else
    mongoData.findOne(
      {
        "profile.email": req.body.email,
        "profile.password": req.body.password,
      },
      (err, items) => {
        if (err) console.log(err);
        else {
          if (items != null) {
            token = jwt.sign(req.body, secret);
            details = items.profile;
            delete details["password"];
            details.id = items._id;

            res
              .status(202)
              .cookie("token", token, {
                sameSite: "lax",
                httpOnly: "true",
                path: "/",
                expires: new Date(new Date().getTime() + 315360000 * 1000),
              })
              .send({ message: "", info: details });
          } else res.send({ message: "Please Check Your email or Password" });
        }
      }
    );
});

//for admins
app.post("/admin", function (req, res) {
  let flag = 0;
  details = {};
  mongoData1.findOne(
    { email: req.body.email, password: req.body.password },
    (err, admins) => {
      if (err) console.log(err);
      else {
        if (admins != null) {
          delete req.body["admin"];
          token = jwt.sign(req.body, secret);
          details = req.body;
          delete details["password"];
          details.id = admins._id;

          res
            .status(202)
            .cookie("token", token, {
              sameSite: "lax",
              httpOnly: "true",
              path: "/",
              expires: new Date(new Date().getTime() + 315360000 * 1000),
            })
            .send({ message: "", info: details });
        } else res.send({ message: "Please Check Your email or Password" });
      }
    }
  );
});

//for main content to load
app.post("/main", verify1, function (req, res) {
  details = {};

  mongoData.findOne({ _id: req.body.id }, (err, items) => {
    if (err) console.log(err);
    else {
      if (items != null) {
        details = items.profile;
        delete details["password"];
        details.id = req.body.id;
        bag = items.bag;
        history = items.history;
      }
      res.send({ message: food, info: details, bag: bag, history: history });
    }
  });
});
app.post("/adminmain", verify1, function (req, res) {
  details = {};

  mongoData1.findOne({ _id: req.body.id }, (err, admins) => {
    if (err) console.log(err);
    else {
      if (admins != null) {
        details.email = admins.email;
        details.id = req.body.id;
        let today = req.body.date;
        mongoData2.find({ date: today }, (err, orders) => {
          if (err) console.log(err);
          else {
            details.orders = orders;
            mongoData3.find(
              {},
              "profile.name profile.email profile.phone status -_id",
              function (err, dlvBoys) {
                details.deliveryBoys = dlvBoys;
                res.send({ message: food, info: details });
              }
            );
          }
        });
      } else {
        res.send({ message: food, info: details });
      }
    }
  });
});
app.post("/deliverymain", verify1, function (req, res) {
  details = {};

  mongoData3.findOne({ _id: req.body.id }, (err, deliveryBoys) => {
    if (err) console.log(err);
    else {
      if (deliveryBoys != null) {
        let today = req.body.date;
        console.log(today);
        mongoData3
          .aggregate([
            { $match: { _id: deliveryBoys._id } },
            {
              $project: {
                orders: {
                  $filter: {
                    input: "$orders",
                    cond: { $eq: ["$$this.date", today] },
                  },
                },
              },
            },
          ])
          .then((orders) => {
            details.alldata = deliveryBoys;
            delete details.alldata.orders;
            details.todaysorders = orders;
            res.send({ info: details });
          });
      } else {
        res.send({ info: details });
      }
    }
  });
});

let key = [];
app.post("/bag", verify1, function (req, res) {
  if (req.body.bag.length != 0) {
    mongoData.findOne({ _id: req.body.id }, (err, items) => {
      if (err) console.log(err);
      else {
        let d = new Date();

        let temp = req.body;
        let a = temp.bag[0];
        a["key"] = d.getTime();
        temp.bag[0] = a;
        key = temp.bag;
        mongoData.updateOne({ _id: req.body.id }, { bag: temp.bag }, (err) => {
          if (err) console.log(err);
          else console.log("successfully updated Your bag");
        });
        res.send({ message: key });
      }
    });
  }
});

app.post("/setdeliveryboy", verify1, (req, res) => {
  mongoData2.updateOne(
    { _id: req.body._id },
    { deliveryBoy: req.body.dName },
    (err) => {
      if (err) console.log(err);
      else console.log("successfully set delivery guy");
    }
  );
  mongoData2.findOne({ _id: req.body._id }, (err, item) => {
    if (err) console.log(err);
    else {
      let a = item;
      mongoData3.findOne({ "profile.name": req.body.dName }, (err1, item1) => {
        if (err1) console.log(err1);
        else {
          let arr = [];
          arr = item1.orders;
          arr.unshift(a);
          mongoData3.updateOne(
            { "profile.name": req.body.dName },
            { orders: arr },
            (err) => {
              console.log(err);
            }
          );

          let temp = {};
          temp.name = item1.profile.name;
          temp.phone = item1.profile.phone;
          let tempObj = {};
          tempObj.bag = a.orders.bag;
          tempObj.date = a.date;
          tempObj.totalcost = a.orders.totalcost;
          tempObj.deliveryDetails = temp;
          tempObj.orderId = a._id;
          tempObj.status = "undelivered";
          mongoData.findOne({ _id: a.orders.profile.id }, (err, item) => {
            if (err) console.log(err);
            else {
              let temp = [];
              temp = item.history;
              temp.unshift(tempObj);
              mongoData.updateOne(
                { _id: a.orders.profile.id },
                { history: temp },
                (err) => {
                  if (err) console.log(err);
                }
              );
            }
          });
        }
      });
    }
  });
});

app.post("/setstatus", verify1, (req, res) => {
  let id = mongoose.Types.ObjectId(req.body.orderId);
  let status = req.body.status;
  mongoData3
    .updateOne(
      { _id: req.body.deliveryId },
      { $set: { "orders.$[ele].status": status } },
      { arrayFilters: [{ "ele._id": { $eq: id } }] }
    )
    .then((e) => {
      console.log("statuschanged Successfully");
    })
    .catch((err) => {
      console.log(err);
    });
  mongoData2
    .updateOne({ _id: req.body.orderId }, { status: status })
    .then((e) => {
      console.log("status changed successfully");
    })
    .catch((err) => {
      console.log(err);
    });
  mongoData
    .updateOne(
      { _id: req.body.clientId },
      { $set: { "history.$[ele].status": status } },
      { arrayFilters: [{ "ele.orderId": { $eq: id } }] }
    )
    .then((e) => {
      console.log("Status changed successfully");
    })
    .catch((err) => {
      console.log(err);
    });
  res.send("hello");
});

app.post("/rejectOrder", verify1, (req, res) => {
  mongoData2.updateOne(
    { _id: req.body.orderId },
    { status: "rejected", deliveryBoy: "none" },
    (err) => {
      if (err) console.log(err);
      else console.log("successfully rejected");
    }
  );
  mongoData2.findOne({ _id: req.body.orderId }, (err, item) => {
    if (err) console.log(err);
    else {
      let a = item;
      let tempObj = {};
      tempObj.bag = a.orders.bag;
      tempObj.date = a.date;
      tempObj.totalcost = a.orders.totalcost;
      tempObj.orderId = a._id;
      tempObj.status = "rejected";
      tempObj.reason = req.body.reason;
      mongoData.findOne({ _id: req.body.clientId }, (err, item) => {
        if (err) console.log(err);
        else {
          let temp = [];
          temp = item.history;
          temp.unshift(tempObj);
          mongoData.updateOne(
            { _id: a.orders.profile.id },
            { history: temp },
            (err) => {
              if (err) console.log(err);
            }
          );
        }
      });
    }
  });
  res.send("successfully rejected");
});

app.post("/setworkstatus", verify1, (req, res) => {
  mongoData3.updateOne(
    { _id: req.body.deliveryId },
    { status: req.body.status },
    (err, item) => {
      if (err) {
        console.log(err);
        res.send("failed");
      } else {
        res.send("succeed");
      }
    }
  );
});

app.get("/",(req,res)=>{

  res.send("Helloo..its working")
})


//SOCKET.IO sPECIFIC STUFF


let io = require('socket.io')(server,{
    cors:{
      origin:['*']
    }
  });
  io.on('connection', (socket) => { 
    
    socket.on('client-data',(profile,bill,location,totalcost)=>{
      soc_client.emit('message',profile,bill,location,totalcost);
    })
  
  });






let c = 0;
let io1 = require("socket.io")(server1, {
  cors: {
    origin: ["*"],
  },
});

io1.on("connection", (socket1) => {
  console.log(socket1.id);
  c++;
  console.log(c);
  socket1.on("disconnect", () => {
    console.log(socket1.id);
    c--;
    console.log(c);
  });
  socket1.on("message", (profile, bill, location, totalcost) => {
    let a = {};
    a.date =
      String(("0" + new Date().getDate()).slice(-2)) +
      String(("0" + new Date().getMonth()).slice(-2)) +
      String(new Date().getFullYear());
    let temp = {};
    temp.profile = profile.profile;
    temp.location = location;
    temp.bag = bill;
    temp.totalcost = totalcost;
    a.orders = temp;
    a.status = "undelivered";
    userData = new mongoData2(a);
    userData.save(function (err, orders) {
      if (err) return console.error(err);
      else {
        socket1.broadcast.emit("receive-clientData", a);
      }
    });
  });
  socket1.on("status-change", (status) => {
    console.log(status);
    socket1.broadcast.emit("status-change");
  });
  socket1.on("workstatus-change", (status) => {
    console.log(status);
    socket1.broadcast.emit("workstatus-change", status);
  });
});

let SERVER = 'https://socketserver-ofood.herokuapp.com';
    let soc_client = socketClient (SERVER);
    soc_client.on('connect',() => {
        console.log(`I'm connected with the back-end`);
    });

//to logout or delete cookie
app.get("/deleteCookie", (req, res) => {
  res.clearCookie("token").send("deleted");
});



let port = process.env.PORT || '5000';
server.listen(port)



// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
