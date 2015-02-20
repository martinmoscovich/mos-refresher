// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('example', ['ionic', 'mos.mobile.components'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})
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
    console.log("Drag Start");
  }  

  $scope.onDragEnd = function() {
    console.log("Drag End");
  }
  $scope.onDrag = function(distance, percentage) {
   console.log("On Drag %d - %d", distance, percentage);
  }  

  $scope.onEnd = function() {
    console.log("On end");
  }  

  $scope.onRefreshChange = function(willRefresh) {
    console.log("Refresh change: %s", willRefresh);
  }  
  
});
