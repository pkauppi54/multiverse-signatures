/*
THIS "BACKEND" FOLDER DOES NOT AFFECT ANYTHING BECAUSE I HAVE DEPLOYED
EVERYTHING TO HEROKU: https://multiverse-signatures-backend.herokuapp.com/ */




const express = require('express')
var fs = require("fs"); // Helps us read data from files
const https = require("https");
var cors = require("cors");
var bodyParser = require("body-parser");

var app = express();

let transactions = {};

app.use(cors());

app.use(bodyParser.json()); // parses only json types and the Content-Type needs to match that
app.use(bodyParser.urlencoded({ extended: true }));



app.get("/", function (req, res) {
  console.log("/");
  res.status(200).send("Multiverse Signatures backend!");
});

app.get("/:key", function (req, res) {
  let key = req.params.key;
  console.log("/",key);
  res.status(200).send(transactions[key]);
});

app.post("/", function (request, response) {
  console.log("Post to '/' ", request.body);
  response.send(request.body);
  const key = request.body.address + "_" + request.body.chainId;
  console.log("Key: ", key);

  // We create a url from the key which holds all the transactions that a single wallet has received.
  if (!transactions[key]) {
    transactions[key] = {};
  }

  // Then we create a new item to the transactions[key] using the hash of the transaction which is different for every new one
  transactions[key][request.body.hash] = request.body;
  console.log("Transactions: ", transactions);
});


if (fs.existsSync("server.key") && fs.existsSync("server.cert")) {
  https
    .createServer({
      key: fs.readFileSync("server.key"),
      cert: fs.readFileSync("server.cert"),
    }, app)
    .listen(process.env.PORT || 49899, () => {
      console.log("HTTPS Listening on port: 49899");
  });
} else {
  var server = app.listen(process.env.PORT || 49899, "0.0.0.0", function () {
    console.log("HTTPS Listening on port: ", server.address().port);
  });
}

