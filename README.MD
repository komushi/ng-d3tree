# Angular Directives for d3 tree and graph

![Tree](https://raw.githubusercontent.com/komushi/ng-d3tree/master/image/tree.png)

----------
Local Demo
-------------
###Download & Installation
```
git clone https://github.com/komushi/ng-d3tree.git
cd ng-d3tree/examples
live-server
```
###Access the local server
http://localhost:8080

----------
Online Demo
-------------

###Access plunker
http://localhost:8080

----------
Quick Start
-------------
### Install via Bower
```bash
bower install --save ng-d3tree
```

### Usage
```
<!DOCTYPE html>
<html>

<head>
  <title>tree</title>

    <script src="https://code.angularjs.org/1.5.5/angular.js" data-semver="1.5.5" data-require="angularjs@1.5.5"></script>
    <script data-require="d3@*" data-semver="3.5.3" src="//cdnjs.cloudflare.com/ajax/libs/d3/3.5.3/d3.js"></script>
    <script type="text/javascript" src="https://rawgit.com/komushi/ng-d3tree/master/src/ng-d3tree.js"></script>

    <link rel="stylesheet" href="https://rawgit.com/komushi/ng-d3tree/master/src/css/ng-d3tree.css" />

</head>


<body ng-app="d3treeApp">

<script>
var app = angular.module("d3treeApp", ['ngD3tree']); 
app.controller("treeCtrl", ['$scope', '$http', function($scope, $http) {

  $http.get('data/data2.json')
       .success(function(res){
          $scope.d3json = res;
        });

}]);
</script>

<div ng-controller="treeCtrl">
  <h2>Reingold-Tilford Tree Static</h2>
  <reingold-tilford-tree
    data="d3json"
    width="550"
    height="500"
    json-path="">
  </reingold-tilford-tree>
</div>


</body>
</html>
```