const battery = require("battery");
const chalk = require("chalk");
var moment = require('moment'); // require
moment().format(); 
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017";


setInterval(() => {
  (async () => {
    const { level, charging } = await battery();

    if (level > 0.5) {
      levelColour = "greenBright"
    } else if (level > 0.2) {
      levelColour = "yellowBright"
    }

    console.log(`${charging ? chalk.greenBright("Charging") : chalk.redBright("Not charging")}, ${chalk[levelColour](`${Math.round(level * 100)}%`)}`)
    
    
    MongoClient.connect(url, function (err, db) {

      if (err) throw err;
      const dbo = db.db("electricCity");

      dbo.collection('bijlistatus').findOne(
        {},
        { sort: { _id: -1 } },
        (err, data) => {
          // console.log(data.charging);
         
          if (err) throw err;

          if (data.charging !== charging) {
            console.log(data.time);
   
            const currentDate  = moment().format("DD/MM/YYYY HH:mm:ss");
            const followedDate = data.time;
            const shortFallHours = data.loadShedding;
            
            const ms = moment(currentDate,"DD/MM/YYYY HH:mm:ss").diff(moment(followedDate,"DD/MM/YYYY HH:mm:ss"));
            const d = moment.duration(ms);
            const timeGap = Math.floor(d.asHours()) + moment.utc(ms).format(":mm:ss");
           if(shortFallHours.length !== 0){
            var TotalHours = moment.duration(shortFallHours).add(moment.duration(timeGap));
            console.log(TotalHours);
           }


            let bijliStatus = { level: level, charging: charging, time: currentDate , loadShedding : data.charging == false ? timeGap : ''  , TotalShortFalltime : TotalHours };
            console.log(charging);
            dbo.collection("bijlistatus").insertOne(bijliStatus, function (err, res) {
              if (err) throw err;
              console.log("Record Entered ...");
          
              db.close();
            });
          }
        },
      );

    });

  })();

}, 1000);
