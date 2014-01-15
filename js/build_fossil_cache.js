var http = require('http'),
    fs = require('fs');
    exec = require('child_process').exec;

// Keep track of the year
var i = 0,
  intervals = [];

checkTempjson();

function checkTempjson() {
  fs.exists('tempjson', function(exists) { 
    if(exists) {
      checkFossils();
    } else {
      fs.mkdir('tempjson', function(e) {
        checkFossils();
      });
    }
  });
}

function checkFossils() {
  fs.exists('fossils', function(exists) { 
    if(exists) {
      getIntervals();
    } else {
      fs.mkdir('fossils', function(e) {
        getIntervals();
      });
    }
  });
}

function getIntervals() {
  var url = 'http://paleobiodb.org/data1.1/intervals/list.json?scale=1&order=older&max_ma=4000';

  http.get(url, function(res) {
    var body = '';

    res.on('data', function(chunk) {
      body += chunk;
    });

    res.on('end', function() {
      var response = JSON.parse(body);
      console.log("Got time intervals from Paleodb");

      var i = 0;
      response.records.forEach(function(d) {
        intervals.push(d.nam);
        i += 1;
      });

      if (i === response.records.length) {
        getJSON();
      }

    });
  });
}

function getJSON() {
  var url = 'http://strata.geology.wisc.edu/readonly/getmap/geojson_fossils.php?interval_name=' + intervals[i];

  // Make the GET request
  http.get(url, function(res) {
      var body = '';
      res.on('data', function(chunk) {
          body += chunk;
      });

      res.on('end', function() {
          var response= JSON.parse(body);
           console.log("Got response for interval ", intervals[i]);
          // Save result to a temp file
          var filename = intervals[i].split(' ').join('_');

          fs.writeFile("tempjson/fossils_" + filename + ".json", JSON.stringify(response), function(err) {
              if(err) {
                  console.log(err);
              } else {
                  console.log("The file for year ", intervals[i], "was saved");
                  // Convert to Topojson
                  exec('topojson -o fossils/fossils_' + filename +'.json -p occ -- tempjson/fossils_' + filename + '.json', function(err, result) {
                    if (err) {
                      console.log(err);
                    } else {
                      // Delete the original GeoJSON
                      fs.unlink('tempjson/fossils_' + filename + '.json');
                      console.log("Interval " , intervals[i], " was converted to TopoJSON");
                      i += 1;
                      if (i < intervals.length) {
                        getJSON();
                      } else {
                        fs.rmdir("tempjson", function(e) {
                          console.log("Done");
                        });
                      }
                    }
                  });
              }
          }); 
      });
  }).on('error', function(err) {
        console.log(err);
  });
} // End getJSON()