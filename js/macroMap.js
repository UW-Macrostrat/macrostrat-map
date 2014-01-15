var macroMap = (function() {
  var stratGeom = {},
      fossilGeom = {},
      timer;

  var width = 800,
      height = 600;

  var projection = d3.geo.conicConformal()
      .rotate([100, 0])
      .center([0, 43])
      .parallels([29.5, 45.5])
      .scale(325)
      .translate([width / 2, height / 2 + 20])
      .precision(.1);

  var path = d3.geo.path()
     .projection(projection);

  var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g");

  var palette = {"carbonate":"#A5A9FF", "siliciclastic": "#777", "evaporite": "#EB6D9A", "organic": "#000", "chemical": "#FDAE6B", "volcanic": "#3D815A", "plutonic": "#C04939", "metamorphic": "#7B4036"};

  return {
    "buildCache": function() {
      var interval_hash_length = 0,
          fossilCounter = 0,
          geomCounter = 0;

      for (interval in timeScale.interval_hash) {
        interval_hash_length += 1;

        if (timeScale.interval_hash[interval].oid != 0) {
          var time = timeScale.interval_hash[interval].nam;
          d3.json("js/macro/macro_" + timeScale.interval_hash[interval].nam.split(' ').join('_') + ".json", function(error, data) {
            var key = Object.keys(data.objects);
            key = key[0];
            var name = data.objects[key].interval_name.split(' ').join('_'),
                boundaries = topojson.feature(data, data.objects[key]);
            stratGeom[name] = boundaries;
            geomCounter += 1;
          });

          d3.json("js/fossils/fossils_" + time.split(' ').join('_') + ".json", function(error, data) {
            var key = Object.keys(data.objects);
            key = key[0];
            var name = data.objects[key].interval_name.split(' ').join('_'),
                boundaries = topojson.feature(data, data.objects[key]);
            fossilGeom[name] = boundaries;
            fossilCounter += 1;
            if (geomCounter === interval_hash_length - 1 && fossilCounter === interval_hash_length - 1) {
              d3.select("#map").style("display","block");
              d3.select(".timeScale").style("visibility", "visible");
              d3.select("#start").style("display", "block");
              d3.select("#waiting").style("display", "none");
            }
          });

        }
      }
      macroMap.init();
    },

    "init": function() {
      d3.select("#start")
        .on("click", function() { macroMap.startAnimation(); });

      var legendData = [
        {"carbonate":"#A5A9FF"},
        {"siliciclastic": "#777"},
        {"evaporite": "#EB6D9A"},
        {"organic": "#000"},
        {"chemical": "#FDAE6B"},
        {"volcanic": "#3D815A"},
        {"plutonic": "#C04939"},
        {"metamorphic": "#7B4036"}
      ];

      d3.json("js/na.json", function(err, countries) {
        var boundaries = topojson.feature(countries, countries.objects.na);

        svg.selectAll(".countries")
          .data(boundaries.features)
          .enter().append("path")
          .attr("class", "land")
          .attr("id", function(d) {return d.properties.continent})
          .attr("d", path);

        var y = 400;

        svg.append("circle")
          .attr("r", 1.2)
          .attr("cx", 32)
          .attr("cy", 410);

        svg.append("text")
          .attr("class", "legendText")
          .attr("x", 45)
          .attr("y", 415)
          .text("fossil collection");

        var legend = svg.selectAll(".legend")
          .data(legendData);

        legend.enter().append("rect")
          .attr("x", 20)
          .attr("y", function() {
            y = y + 20;
            return y;
          })
          .attr("fill", function(d) {
            var keys = Object.keys(d),
                key = keys[0];
            return d[key];
          })
          .attr("opacity", 0.83)
          .attr("height", 20)
          .attr("width", 20);

        y = 414;

        legend.enter().append("text")
          .attr("class", "legendText")
          .attr("x", 45)
          .attr("y", function() {
            y = y + 20;
            return y;
          })
          .text(function(d) {
            var keys = Object.keys(d),
                key = keys[0];
            return key;
          });

        svg.append("text")
          .attr("x", 650)
          .attr("y", 60)
          .attr("id", "info");

        svg.append("text")
          .attr("x", 650)
          .attr("y", 82)
          .attr("id", "infoYear");

      });
    },

    "changeYear": function(index, interval) {

      d3.select("#info").text(timeScale.interval_hash[index].nam);
      d3.select("#infoYear").text(timeScale.interval_hash[index].eag + " - " + timeScale.interval_hash[index].lag + " Ma");
      
      var strats = svg.selectAll(".strat")
          .data(stratGeom[interval].features)
          .attr("class", "strat")
          .attr("fill", function(d) {
            var mostCommon = d3.max(d.properties.p),
                mostCommonIndex = d.properties.p.indexOf(mostCommon),
                color = palette[d.properties.lith_type[mostCommonIndex]];
            return color;
          })
          .attr("opacity", 0.83)
          .attr("d", path);

        strats.enter().append("path")
          .attr("class", "strat")
          .attr("fill", function(d) {
            var mostCommon = d3.max(d.properties.p),
                mostCommonIndex = d.properties.p.indexOf(mostCommon),
                color = palette[d.properties.lith_type[mostCommonIndex]];
            return color;
          })
          .attr("opacity", 0.83)
          .attr("d", path);

        strats.exit().remove();

      var fossils = svg.selectAll(".fossil")
        .data(fossilGeom[interval].features)
        .attr("class", "fossil")
        .attr("r", 1.2)
        .attr("cx", function(d) {
          var coords = projection(d.geometry.coordinates);
          // A few points have an invalid location, so this is needed
          if (!isNaN(coords[0])) {
            return coords[0];
          }
        })
        .attr("cy", function(d) {
          var coords = projection(d.geometry.coordinates);
          if (!isNaN(coords[1])) {
            return coords[1];
          }
        });

      fossils.enter().append("circle")
        .attr("class", "fossil")
        .attr("r", 1.2)
        .attr("cx", function(d) {
          var coords = projection(d.geometry.coordinates);
          return coords[0];
        })
        .attr("cy", function(d) {
          var coords = projection(d.geometry.coordinates);
          return coords[1];
        });

      fossils.exit().remove();
    },

    "startAnimation": function() {
      d3.select("#start")
        .attr("class", "btn btn-danger")
        .html("Stop animation")
        .on("click", function() { macroMap.stopAnimation(); });

      timer = setInterval(function() {animate()}, 400);
      var i = 0;
      function animate() {
        if (i < timeScale.level5.length) {
          var year = timeScale.level5[i].mid,
            interval = timeScale.level5[i].nam.split(' ').join('_');
          macroMap.changeYear(timeScale.level5[i].oid, interval);
          timeScale.highlight(timeScale.level5[i].nam);
          i += 1;
        } else {
          d3.select("#start")
            .attr("class", "btn btn-success")
            .html("Start animation")
            .on("click", function() { macroMap.stopAnimation(); });
        }
      }
    },

    "stopAnimation": function() {
      clearInterval(timer);
      d3.select("#start")
        .attr("class", "btn btn-success")
        .html("Start animation")
        .on("click", function() { macroMap.startAnimation(); });
    }
  }
})();