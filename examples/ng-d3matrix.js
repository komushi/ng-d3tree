( function () {
  'use strict';

  angular.module('ngD3matrix',[])
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
            left : 80
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
            x.domain(orders.name);
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

            // d3.select("#order").on("change", function() {
            //   clearTimeout(timeout);
            //   order(this.value);
            // });

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
            
            // var timeout = setTimeout(function() {
            //   order("group");
            //   d3.select("#order").property("selectedIndex", 2)
            //       .node().focus();
            // }, 1000);

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