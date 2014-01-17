var macroMap = (function() {
  var stratGeom = {},
      fossilGeom = {},
      timer,
      active,
      currentInterval = 0;

  var width = 950,
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
              d3.select(".controls").style("display", "block");
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

      var graticule = d3.geo.graticule()
          .extent([[-175, -7], [-13, 83]])
          .step([15,15]);

      svg.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("d", path);

      d3.json("js/na.json", function(err, countries) {

        svg.selectAll(".countries")
          .data(topojson.feature(countries, countries.objects.na).features)
          .enter().append("path")
          .attr("class", "land")
          .attr("id", function(d) {return d.properties.continent})
          .attr("d", path)
          .on("click", click);

          console.log(path.bounds(topojson.feature(countries, countries.objects.na)));

        d3.json("js/details.json", function(error, details) {
          svg.selectAll(".details")
            .data(topojson.feature(details, details.objects.details).features)
          .enter().append("path")
            .attr("class", "mesh")
            .attr("d", path);
        });

        /*svg.append("path")
          .datum(topojson.mesh(countries, countries.objects.na, function(a,b) { return a !== b; }))
          .attr("class", "mesh")
          .attr("d", path);*/

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

        var info = d3.select("#map").insert("svg", ":first-child")
            .attr("height", "100px")
            .attr("class", "mapInfo");

        info.append("text")
          .attr("x", 650)
          .attr("y", 60)
          .attr("id", "info");

        info.append("text")
          .attr("x", 650)
          .attr("y", 82)
          .attr("id", "infoYear");

      });
      /* Via Zoom to Bounding Box - Mike Bostock - http://bl.ocks.org/mbostock/4699541 */
      function click(d) {
        if (active === d) return reset();
        d3.selectAll(".mesh").style("display", "block");
        svg.selectAll(".active").classed("active", false);
        d3.select(this).classed("active", active = d);

        var b = path.bounds(d);
        svg.transition().duration(750).attr("transform",
            "translate(" + projection.translate() + ")"
            + "scale(" + .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height) + ")"
            + "translate(" + -(b[1][0] + b[0][0]) / 2 + "," + -(b[1][1] + b[0][1]) / 2 + ")");
      }

      function reset() {
        svg.selectAll(".active").classed("active", active = false);
        svg.transition().duration(750).attr("transform", "");
        d3.selectAll(".mesh").style("display", "none");
      }

      d3.select("#backward").on("click", function(event) {
        d3.event.preventDefault();
        macroMap.stepBack();
      });
      d3.select("#forward").on("click", function(event) {
        d3.event.preventDefault();
        macroMap.stepForward();
      });
      d3.select("#play").on("click", function(event) {
        d3.event.stopPropagation();
        macroMap.startAnimation();
      });
      d3.select("#stop").on("click", function(event) {
        d3.event.preventDefault();
        macroMap.stopAnimation();
      });
    },

    "changeYear": function(index, interval) {
      macroMap.adjustControls();
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
          .attr("d", path)
          .on("click", function(d) {
            console.log(d.properties.col_id);
          });

        strats.enter().append("path")
          .attr("class", "strat")
          .attr("fill", function(d) {
            var mostCommon = d3.max(d.properties.p),
                mostCommonIndex = d.properties.p.indexOf(mostCommon),
                color = palette[d.properties.lith_type[mostCommonIndex]];
            return color;
          })
          .attr("opacity", 0.83)
          .attr("d", path)
          .on("click", function(d) {
            console.log(d.properties.col_id);
          });

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
      d3.select("#play").style("display", "none");
      d3.select("#stop").style("display", "inline");

      if (macroMap.currentInterval === timeScale.level5.length) {
        macroMap.currentInterval = 0;
      }

      timer = setInterval(function() {animate()}, 400);
      function animate() {
        if (macroMap.currentInterval < timeScale.level5.length) {
          var year = timeScale.level5[macroMap.currentInterval].mid,
            interval = timeScale.level5[macroMap.currentInterval].nam.split(' ').join('_');
          macroMap.changeYear(timeScale.level5[macroMap.currentInterval].oid, interval);
          timeScale.highlight(timeScale.level5[macroMap.currentInterval].nam);
          macroMap.currentInterval += 1;
        } else {
          macroMap.stopAnimation();
          macroMap.adjustControls();
        }
      }
    },

    "stopAnimation": function() {
      clearInterval(timer);
      d3.select("#play").style("display", "inline");
      d3.select("#stop").style("display", "none");
    },

    "resetAnimation": function() {
      macroMap.currentInterval = 0;
    },

    "stepBack": function() {
      macroMap.currentInterval = (macroMap.currentInterval > 0) ? macroMap.currentInterval -= 1 : 0;
      var year = timeScale.level5[macroMap.currentInterval].mid,
          interval = timeScale.level5[macroMap.currentInterval].nam.split(' ').join('_');
      macroMap.changeYear(timeScale.level5[macroMap.currentInterval].oid, interval);
      timeScale.highlight(timeScale.level5[macroMap.currentInterval].nam);
      macroMap.adjustControls();
    },

    "stepForward": function() {
      macroMap.currentInterval = (macroMap.currentInterval < timeScale.level5.length - 1) ? macroMap.currentInterval += 1 : 0;
      var year = timeScale.level5[macroMap.currentInterval].mid,
          interval = timeScale.level5[macroMap.currentInterval].nam.split(' ').join('_');
      macroMap.changeYear(timeScale.level5[macroMap.currentInterval].oid, interval);
      timeScale.highlight(timeScale.level5[macroMap.currentInterval].nam);
      macroMap.adjustControls();
    },

    "adjustControls": function() {
      if (macroMap.currentInterval === 0) {
        d3.select("#backward").attr("class", "fa fa-backward fa-lg disabled" );
      } else if (d3.select("#backward").attr("class") === "fa fa-backward fa-lg disabled") {
        d3.select("#backward").attr("class", "fa fa-backward fa-lg");
      }

      if (macroMap.currentInterval === timeScale.level5.length) {
        d3.select("#forward").attr("class", "fa fa-forward fa-lg disabled");
      } else if (d3.select("#forward").attr("class") === "fa fa-forward fa-lg disabled") {
        d3.select("#forward").attr("class", "fa fa-forward fa-lg");
      }
    },

    "currentInterval": currentInterval
  }
})();