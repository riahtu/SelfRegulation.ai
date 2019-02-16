"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const firebase = require("firebase");
const stats = require("stats-lite");

const server = express();
server.use(bodyParser.json());

var config = {
  apiKey: "AIzaSyC9SEhQV-_TRFoSDomQPQga0ms2l607h6c",
  authDomain: "SelfRegulation-ai.firebaseapp.com",
  databaseURL: "https://SelfRegulation-ai.firebaseio.com",
  projectId: "SelfRegulation-ai",
  storageBucket: "SelfRegulation-ai.appspot.com",
  messagingSenderId: "49236414526"
};

// Get a reference to the database service
var database;

server.post("/", function (req, res) {
  console.log("webhook request");
  try {
    if (req.body) {
//        console.log("req.body -->",req.body);
        if (req.body.result && Object.keys(req.body.result.parameters).length == 0) {
          functions[req.body.result.action](res);
        }
      else {
        functions[req.body.result.action](res, req.body.result.parameters);
      }
    }
  }
  catch (err) {
    console.log("error in server endpoint!!!!!");
    console.error("Cannot process request", err);
    return res.status(400).json({
      status: {
        code: 400,
        errorType: err.message
      }
    });
  }
});

var functions = {sensorAverage,sensorCurrent,peopleCount};

function sensorAverage(rez, paramz) {
  database.ref('/sensors').once('value').then(function(snapshot) {
    var average = 0;
    var numEntries = 0;
    var sensorData = snapshot.val();
    sensorPredict(paramz["sensor"], sensorData);
    for (var entry in sensorData) {
      if(sensorData[entry][paramz["sensor"]] != null && sensorData[entry][paramz["sensor"]] != undefined) {
        average += sensorData[entry][paramz["sensor"]];
        numEntries += 1;
      }
    }
    average = average/numEntries;
    return rez.json({
      "speech": "The average "+paramz["sensor"]+" is "+average.toFixed(2)+" degrees"
    });
  });
}

function sensorCurrent(rez, paramz) {
  database.ref('/sensors').once('value').then(function(snapshot) {
    var num = 0;
    var sensorData = snapshot.val();
    sensorPredict(paramz["sensor"], sensorData);
    for (var entry in sensorData) {
      if (sensorData[entry][paramz["sensor"]] != null && sensorData[entry][paramz["sensor"]] != undefined) {
        num = sensorData[entry][paramz["sensor"]];
      }
      break;
    }
    return rez.json({
      "speech": "The current "+paramz["sensor"]+" is "+num.toFixed(2)+" degrees"
    });
  });
}

function peopleCount(rez) {
  database.ref('/sensors').once('value').then(function(snapshot) {
      var num = 0;
      var count = 0;
      var sensorData = snapshot.val();
//      sensorPredict("target", sensorData);
      for (var entry in sensorData) {
        if(sensorData[entry]["target"] != null && sensorData[entry]["target"] != undefined) {
          num += sensorData[entry]["target"];
          count += 1;
        }
      }
      num = Math.round(num/count);
      return rez.json({
        "speech": "The latest number of people is "+num
      });
    });
}

function sensorPredict(typz, data) {
  var array = [];
  for (var entry in data) {
    array.push(data[entry][typz]);
  }
  var flip = Math.floor(Math.random() * 2);
  var val = flip == 1 ? stats.mean(array) + stats.stdev(array) : stats.mean(array) - stats.stdev(array);
  var obj = {};
  obj[typz] = parseFloat(val.toFixed(2));
  database.ref("predict").update(obj);
}

server.listen((process.env.PORT || 8000), function () {
  console.log("chatbot server is up!!!!!!!!!!!!!!!!!!!!");
  firebase.initializeApp(config);
  database = firebase.database();
});
