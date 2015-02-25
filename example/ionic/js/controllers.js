angular.module('example.controllers', [])
.controller('MainController', function($scope, $q, $timeout) {
  $scope.items = [];
   
  for(var i=50;i>0;i--) {
    $scope.items.push(i);
  }

  $scope.refresh = function() {

    var defer = $q.defer();

    $timeout(function() {
      for(var i=0;i<10;i++) { 
        $scope.items.unshift($scope.items.length+1) 
      }
      defer.resolve();
    }, 2000);
    return defer.promise;
  }

  $scope.onDragStart = function() {
    console.log("[mos-refresher] Drag Start");
  }  

  $scope.onRelease = function() {
    console.log("[mos-refresher] Released");
  }
  $scope.onDrag = function(distance, percentage) {
   console.log("[mos-refresher] On Drag - Distance: %d (%d%)", distance, percentage);
  }  

  $scope.onFinish = function() {
    console.log("[mos-refresher] On Finish");
  }  

  $scope.onRefreshChange = function(willRefresh) {
    console.log("[mos-refresher] Refresh change: %s", willRefresh);
  }  
  
});