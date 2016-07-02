( function () {
  'use strict';

  var hasPropertiesOtherThan = function(obj, propertyNames) {

    var propertyName, key;

    if (!propertyNames)
    {
      propertyNames = [];
    }

    if (obj) {

      for (key in obj) {
        if (propertyNames.indexOf(key) == -1)
        {
          propertyName = key;
          break;
        }
      }
      
    }

    return propertyName;
  };

  var getNodeText = function(d, labelMap) {

    var text;

    if (d.label) 
    {
      var nodeKey;

      if (labelMap)
      {
        if (labelMap.hasOwnProperty(d.label))
        {
          nodeKey = labelMap[d.label];
        }        
      }

      if (d.hasOwnProperty(nodeKey))
      {
        text = d.label.concat(":", d[nodeKey]);
      }
      else if (hasPropertiesOtherThan(d, ["id", "label"]))
      {
        nodeKey = hasPropertiesOtherThan(d, ["id", "label"]);
        text = d.label.concat(":", d[nodeKey]);
      }
      else 
      {
        nodeKey = hasPropertiesOtherThan(d);
        text = d.label.concat(":", d[nodeKey]);
      }
    }
    else
    {
      if (hasPropertiesOtherThan(d, "id"))
      {
        nodeKey = hasPropertiesOtherThan(d, ["id"]);
        text = d[nodeKey];
      }
      else 
      {
        nodeKey = hasPropertiesOtherThan(d);
        text = d[nodeKey];
      }
    }
    
    return text;


  };

  angular.module('ngD3tree',[])
  .directive('reingoldTilfordTree', function($parse, $window){
     return{
        restrict:'EA',
        scope: {
          data: '=',
          labelMap: '=',
          jsonPath: '@',
          width: '@',
          height: '@',
          id: '@'
        },
        template:"<svg></svg>",
        link: function(scope, elem, attrs){
          var width = scope.width,
              height = scope.height;

          var labelMap = scope.labelMap;

          var d3 = $window.d3;

          var tree = d3.layout.tree()
              .size([height, width - 160]);


          var rawSvg=elem.find('svg');
          var svg = d3.select(rawSvg[0])
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(40,0)");

          var diagonal = d3.svg.diagonal()
              .projection(function(d) { return [d.y, d.x]; });

          // define render function
          var render = function(json){
            // remove all previous items before render
            svg.selectAll("*").remove();

            var nodes = tree.nodes(json),
                links = tree.links(nodes);

            var link = svg.selectAll("path.link")
                .data(links)
              .enter().append("path")
                .attr("class", "link")
                .attr("d", diagonal);

            var node = svg.selectAll("g.node")
                .data(nodes)
                .enter().append("g")
                .attr("class", "node")
                .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })

            node.append("circle")
                .attr("r", 4.5);

            node.append("text")
                .attr("dx", function(d) { return d.children ? -8 : 8; })
                .attr("dy", 3)
                .attr("text-anchor", function(d) { return d.children ? "end" : "start"; })
                .text(function(d) 
                {
                  return getNodeText(d, labelMap);
                });

          }

          if (scope.jsonPath) 
          {
            // load graph (nodes,links) json from /graph endpoint
            d3.json(scope.jsonPath, function(error, json) {
                if (error) 
                  {
                    console.error(error);
                    return;
                  }

                  render(json);
            });
          }
          else
          {
            // watch for data changes and re-render
            scope.$watch('data', function(newVals, oldVals) {

              if (newVals) 
              {
                return render(newVals);
              }
            }, true);

// watch for data changes and re-render
// scope.$watch(watchNode, function() {

//   if (scope.data) {
//     return render(scope.data);  
//   }

// }, true);

// function watchNode() {
//   return scope.data;
// };              

          }

          d3.select(self.frameElement).style("height", height + "px");

        }
     };
  })
  .directive('stickyForceLayout', function($parse, $window){
     return{
        restrict:'EA',
        scope: {
          data: '=',
          labelMap: '=',
          jsonPath: '@',
          width: '@',
          height: '@',
          id: '@'
        },
        template:"<svg></svg>",
        link: function(scope, elem, attrs){
          var width = scope.width,
              height = scope.height;

          var labelMap = scope.labelMap;

          var d3 = $window.d3;

          var rawSvg=elem.find('svg');
          var svg = d3.select(rawSvg[0])
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(40,0)");

          // define render function
          var render = function(json){

            // remove all previous items before render
            svg.selectAll("*").remove();

            var force = d3.layout.force()
                .nodes(json.nodes)
                .links(json.links)                
                .size([width, height])
                .charge(-200)
                .linkDistance(width/10)
                .start();

            var drag = force.drag()
                .on("dragstart", dragstart);

            // render relationships as lines
            var link = svg.selectAll("line.link")
                    .data(json.links).enter()
                    .append("line").attr("class", "link");

            var node = svg.selectAll("g.node")
                    .data(json.nodes).enter().append("g")
                    .attr("class", "stickynode")
                    .on("dblclick", dblclick)
                    .call(drag);

            node.append("text")
              .attr("class", "stickynodetext")
              .attr("dx", 18)
              .attr("dy", ".35em")
              .text(function(d) 
              {
                return getNodeText(d, labelMap);
              });
                    
            node.append("circle")
                    .attr("r", 10);

            // force feed algo ticks for coordinate computation
            force.on("tick", function() {
                link.attr("x1", function(d) { return d.source.x; })
                        .attr("y1", function(d) { return d.source.y; })
                        .attr("x2", function(d) { return d.target.x; })
                        .attr("y2", function(d) { return d.target.y; });


                node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
            });
          };

          var dblclick = function(d) {
            d3.select(this).classed("fixed", d.fixed = false);
          };

          var dragstart = function(d) {
            d3.select(this).classed("fixed", d.fixed = true);
          };

          if (scope.jsonPath) 
          {
            // load graph (nodes,links) json from /graph endpoint
            d3.json(scope.jsonPath, function(error, json) {
                if (error) 
                  {
                    console.error(error);
                    return;
                  }

                  render(json);
            });
          }
          else
          {
            // watch for data changes and re-render
            scope.$watch('data', function(newVals, oldVals) {

              if (newVals) 
              {
                return render(newVals);
              }
            }, true);              
          }

        }
     };
  })
  .directive('collapsibleTree', function($parse, $window){
     return{
        restrict:'EA',
        scope: {
          data: '=',
          labelMap: '=',
          jsonPath: '@',
          width: '@',
          height: '@',
          id: '@'
        },
        template:"<svg></svg>",
         link: function(scope, elem, attrs){

            var margin = {top: 20, right: 120, bottom: 20, left: 120},
                width = 960 - margin.right - margin.left,
                height = 800 - margin.top - margin.bottom;

            var labelMap = scope.labelMap;

            var d3 = $window.d3;
                
            var i = 0,
                duration = 500,
                root;

            var tree = d3.layout.tree()
                .size([height, width]);

            var diagonal = d3.svg.diagonal()
                .projection(function(d) { return [d.y, d.x]; });

            var rawSvg=elem.find('svg');
            var svg = d3.select(rawSvg[0])
              .attr("width", width + margin.right + margin.left)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var update = function (source) {

              // Compute the new tree layout.
              var nodes = tree.nodes(root).reverse(),
                  links = tree.links(nodes);

              // Normalize for fixed-depth.
              nodes.forEach(function(d) { d.y = d.depth * 180; });

              // Update the nodes…
              var node = svg.selectAll("g.node")
                  .data(nodes, function(d) { return d.id || (d.id = ++i); });

              // Enter any new nodes at the parent's previous position.
              var nodeEnter = node.enter().append("g")
                  .attr("class", "node")
                  .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
                  .on("click", click);

              nodeEnter.append("circle")
                  .attr("r", 1e-6)
                  .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

              nodeEnter.append("text")
                  .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
                  .attr("dy", ".35em")
                  .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
                  .text(function(d) { return getNodeText(d, labelMap); })
                  .style("fill-opacity", 1e-6);

              // Transition nodes to their new position.
              var nodeUpdate = node.transition()
                  .duration(duration)
                  .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

              nodeUpdate.select("circle")
                  .attr("r", 4.5)
                  .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

              nodeUpdate.select("text")
                  .style("fill-opacity", 1);

              // Transition exiting nodes to the parent's new position.
              var nodeExit = node.exit().transition()
                  .duration(duration)
                  .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
                  .remove();

              nodeExit.select("circle")
                  .attr("r", 1e-6);

              nodeExit.select("text")
                  .style("fill-opacity", 1e-6);

              // Update the links…
              var link = svg.selectAll("path.link")
                  .data(links, function(d) { return d.target.id; });

              // Enter any new links at the parent's previous position.
              link.enter().insert("path", "g")
                  .attr("class", "link")
                  .attr("d", function(d) {
                    var o = {x: source.x0, y: source.y0};
                    return diagonal({source: o, target: o});
                  });

              // Transition links to their new position.
              link.transition()
                  .duration(duration)
                  .attr("d", diagonal);

              // Transition exiting nodes to the parent's new position.
              link.exit().transition()
                  .duration(duration)
                  .attr("d", function(d) {
                    var o = {x: source.x, y: source.y};
                    return diagonal({source: o, target: o});
                  })
                  .remove();

              // Stash the old positions for transition.
              nodes.forEach(function(d) {
                d.x0 = d.x;
                d.y0 = d.y;
              });
            }

            // Toggle children on click.
            var click = function(d) {
              if (d.children) {
                d._children = d.children;
                d.children = null;
              } else {
                d.children = d._children;
                d._children = null;
              }
              update(d);
            };

            var collapse = function(d) {
              if (d.children) {
                d._children = d.children;
                d._children.forEach(collapse);
                d.children = null;
              }
            };

          // define render function
          var render = function(json){
            root = json;
            root.x0 = height / 2;
            root.y0 = 0;

            json.children.forEach(collapse);
            update(json);
          }

          if (scope.jsonPath) 
          {
            // load graph (nodes,links) json from /graph endpoint
            d3.json(scope.jsonPath, function(error, json) {
                if (error) 
                  {
                    console.error(error);
                    return;
                  }

                  render(json);
            });
          }
          else
          {
            // watch for data changes and re-render
            scope.$watch('data', function(newVals, oldVals) {
              if (newVals) 
              {
                return render(newVals);
              }
            }, true);              
          }
            
          d3.select(self.frameElement).style("height", height + "px");

        }
     };
  })
  .directive('radialCluster', function($parse, $window){
     return{
        restrict:'EA',
        scope: {
          data: '=',
          labelMap: '=',
          jsonPath: '@',
          radius: '@',
          id: '@'
        },
        template:"<svg></svg>",
        link: function(scope, elem, attrs){
          var radius = scope.radius;

          var labelMap = scope.labelMap;

          var d3 = $window.d3;

          var cluster = d3.layout.cluster()
              .size([360, radius - 120]);


          var rawSvg=elem.find('svg');
          var svg = d3.select(rawSvg[0])
            .attr("width", radius * 2)
            .attr("height", radius * 2)
            .append("g")
            .attr("transform", "translate(" + radius + "," + radius + ")");

          var diagonal = d3.svg.diagonal.radial()
              .projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });

          // define render function
          var render = function(json){
            // remove all previous items before render
            svg.selectAll("*").remove();

            var nodes = cluster.nodes(json),
                links = cluster.links(nodes);

            var link = svg.selectAll("path.link")
                .data(links)
              .enter().append("path")
                .attr("class", "link")
                .attr("d", diagonal);

            var node = svg.selectAll("g.node")
                .data(nodes)
              .enter().append("g")
                .attr("class", "node")
                .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; });


            node.append("circle")
                .attr("r", 4.5);

            node.append("text")
                .attr("dy", ".31em")
                .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
                .attr("transform", function(d) { return d.x < 180 ? "translate(8)" : "rotate(180)translate(-8)"; })
                .text(function(d) { return getNodeText(d, labelMap); });

          }

          if (scope.jsonPath) 
          {
            // load graph (nodes,links) json from /graph endpoint
            d3.json(scope.jsonPath, function(error, json) {
                if (error) 
                  {
                    console.error(error);
                    return;
                  }

                  render(json);
            });
          }
          else
          {
            // watch for data changes and re-render
            scope.$watch('data', function(newVals, oldVals) {

              if (newVals) 
              {
                return render(newVals);
              }
            }, true);              
          }

          d3.select(self.frameElement).style("height", radius * 2 + "px");

        }
     };
  })
  .directive('forceLayout', function($parse, $window){
     return{
        restrict:'EA',
        scope: {
          data: '=',
          labelMap: '=',
          jsonPath: '@',
          width: '@',
          height: '@',
          id: '@'
        },
        template:"<svg></svg>",
        link: function(scope, elem, attrs){
          var width = scope.width,
              height = scope.height;

          var labelMap = scope.labelMap;

          var d3 = $window.d3;

          var rawSvg=elem.find('svg');
          var svg = d3.select(rawSvg[0])
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("pointer-events", "all");
          
          // define render function
          var render = function(json){
            console.log("json");
            console.log(json);

            // remove all previous items before render
            svg.selectAll("*").remove();

            var force = d3.layout.force()
                .nodes(json.nodes)
                .links(json.links)
                .gravity(.05)
                .linkDistance(width/10)
                .charge(-100)
                .size([width, height])
                .start();

            // render relationships as lines
            var link = svg.selectAll("line.link")
                    .data(json.links).enter()
                    .append("line").attr("class", "link");


            // render nodes as circles, css-class from label
            var node = svg.selectAll("g.node")
                    .data(json.nodes).enter().append("g")
                    .attr("class", "node")
                    .call(force.drag);

            node.append("text")
                  .attr("class", "nodetext")
                  .attr("dx", 12)
                  .attr("dy", ".35em")
                  .text(function(d) { return getNodeText(d, labelMap); });
                    
            node.append("circle")
                    .attr("r", 4.5);

            // force feed algo ticks for coordinate computation
            force.on("tick", function() {
                link.attr("x1", function(d) { return d.source.x; })
                        .attr("y1", function(d) { return d.source.y; })
                        .attr("x2", function(d) { return d.target.x; })
                        .attr("y2", function(d) { return d.target.y; });

                node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
            });
          };

          if (scope.jsonPath) 
          {
            // load graph (nodes,links) json from /graph endpoint
            d3.json(scope.jsonPath, function(error, json) {
                if (error) 
                  {
                    console.error(error);
                    return;
                  }
                  render(json);
            });
          }
          else
          {
            // watch for data changes and re-render
            scope.$watch('data', function(newVals, oldVals) {
              if (newVals) 
              {
                return render(newVals);
              }
            }, true);              

          }

          d3.select(self.frameElement).style("height", height + "px");
        }
     };
  })
  .directive('adjacencyMatrix', function($parse, $window){
     return{
        restrict:'EA',
        scope: {
          data: '=',
          labelMap: '=',
          jsonPath: '@',
          width: '@',
          height: '@',
          id: '@'
        },
        template:"<svg></svg>",
        link: function(scope, elem, attrs){


          var margin = {
            top : 80,
            right : 160,
            bottom : 160,
            left : 280
          };

          var width = scope.width,
              height = scope.height;

          var d3 = $window.d3;

          var x = d3.scale.ordinal().rangeBands([ 0, width ]);
          var cellSize = 12;
          var gapSize = 10;
          var z = d3.scale.linear().domain([ 0, 4 ]).clamp(true);
          var c = d3.scale.category10().domain(d3.range(10));

          var rawSvg=elem.find('svg');

          var svg = d3.select("body").append("svg").attr("width",
              width + margin.left + margin.right).attr("height",
              height + margin.top + margin.bottom).style("margin-left",
              -margin.left + "px").append("g").attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

          var svg = d3.select(rawSvg[0])
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .style("margin-left", -margin.left + "px")
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          var render = function(matrixJson){

            var matrix = [], nodes = matrixJson.nodes, n = nodes.length;
            // Compute index per node.
            nodes.forEach(function(node, i) {
              node.index = i;
              node.count = 0;
              matrix[i] = d3.range(n).map(function(j) {
                return {
                  x : j,
                  y : i,
                  z : 0
                };
              });
            });
            cellSize = width / n;
            // Convert links to matrix; count character occurrences.
            matrixJson.links.forEach(function(link) {
              matrix[link.source][link.target].z += link.value;
              matrix[link.target][link.source].z += link.value;
              matrix[link.source][link.source].z += link.value;
              matrix[link.target][link.target].z += link.value;
              nodes[link.source].count += link.value;
              nodes[link.target].count += link.value;
            });
            // Precompute the orders.
            var orders = {
              name : d3.range(n).sort(
                  function(a, b) {
                    return d3.ascending(nodes[a].name,
                        nodes[b].name);
                  }),
              count : d3.range(n).sort(function(a, b) {
                return nodes[b].count - nodes[a].count;
              }),
              group : d3.range(n).sort(function(a, b) {
                return nodes[b].group - nodes[a].group;
              })
            };
            var groupRange = [];
            var last = 0;
            groupRange.push(last);
            for (var i = 1, nnodes = nodes.length; i < nnodes; i++) {
              var a = nodes[orders.group[i - 1]];
              var b = nodes[orders.group[i]];
              if (a.group !== b.group) {
                last = last + cellSize + gapSize;
              } else {
                last += cellSize;
              }
              groupRange.push(last);
            }
            // The default sort order.
            x.domain(orders.count);
            //            svg.append("rect").attr("class", "background").attr(
            //                "width", width).attr("height", height);
            var row = svg.selectAll(".row").data(matrix).enter()
                .append("g").attr("class", "row").attr(
                    "transform", function(d, i) {
                      return "translate(0," + x(i) + ")";
                    }).each(row);
            //  row.append("line").attr("x2", width);
            row.append("text").attr("x", -6).attr("y",
                function(d, i) {
                  return 0;
                }).attr("dy", ".9em")
                .attr("text-anchor", "end").text(
                    function(d, i) {
                      return nodes[i].name;
                    }); // .style("fill", function(d, i) {
            //  return c(nodes[i].group);
            //})
            var column = svg.selectAll(".column").data(matrix)
                .enter().append("g").attr("class", "column")
                .attr(
                    "transform",
                    function(d, i) {
                      return "translate(" + x(i)
                          + ")rotate(-90)";
                    });
            //column.append("line").attr("x1", -width);
            column.append("text").attr("x", 6).attr("dy", ".9em")
                .attr("text-anchor", "start").text(
                    function(d, i) {
                      return nodes[i].name;
                    });
            function row(row) {
              var cell = d3
                  .select(this)
                  .selectAll(".cell")
                  .data(row)
                  .enter()
                  .append("rect")
                  .attr("class", "cell")
                  .attr("x", function(d) {
                    return x(d.x);
                  })
                  .attr("width", cellSize)
                  .attr("height", cellSize)
                  .style("fill-opacity", function(d) {
                    return z(d.z);
                  })
                  .style(
                      "fill",
                      function(d) {
                        return nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group)
                            : null;
                      }).on("mouseover", mouseover).on(
                      "mouseout", mouseout);
            }
            function mouseover(p) {
              d3.selectAll(".row text").classed("active",
                  function(d, i) {
                    return i == p.y;
                  });
              d3.selectAll(".column text").classed("active",
                  function(d, i) {
                    return i == p.x;
                  });
            }
            function mouseout() {
              d3.selectAll("text").classed("active", false);
            }
            d3.select("#order").on("change", function() {
              clearTimeout(timeout);
              order(this.value);
            });
            function order(value) {
              if (value === 'group') {
                x = d3.scale.ordinal().range(groupRange);
              } else {
                x = d3.scale.ordinal().rangeBands([ 0, width ]);
              }
              x.domain(orders[value]);
              var t = svg.transition().duration(2500);
              t.selectAll(".row").delay(function(d, i) {
                return x(i);
              }).attr("transform", function(d, i) {
                return "translate(0," + x(i) + ")";
              }).selectAll(".cell").delay(function(d) {
                return x(d.x);
              }).attr("x", function(d) {
                return x(d.x);
              });
              t.selectAll(".column").delay(function(d, i) {
                return x(i);
              }).attr("transform", function(d, i) {
                return "translate(" + x(i) + ")rotate(-90)";
              });
            }
            var timeout = setTimeout(function() {
              order("group");
              d3.select("#order").property("selectedIndex", 2)
                  .node().focus();
            }, 1000);

          }

          if (scope.jsonPath) 
          {
            // load graph (nodes,links) json from /graph endpoint
            d3.json(scope.jsonPath, function(error, json) {
                if (error) 
                  {
                    console.error(error);
                    return;
                  }
                  render(json);
            });
          }
          else
          {
            // watch for data changes and re-render
            scope.$watch('data', function(newVals, oldVals) {
              if (newVals) 
              {
                return render(newVals);
              }
            }, true);  
          }

          d3.select(self.frameElement).style("height", height + "px");
        }
     };
  });
}() );