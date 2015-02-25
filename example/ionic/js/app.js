angular.module('example', ['ionic', 'example.controllers', 'mos.mobile.components'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  var examples = ['spinning', 'custom'];

  

  $stateProvider.state('refresher', {
    url: "/refresher",
    abstract: true,
    templateUrl: "templates/tabs.html"
  });

  examples.forEach(function(name) {
      var views = {};
      views['refresher-' + name] = {
          templateUrl: 'templates/refresher-' + name + '.html',
          controller: 'MainController'
      }
      $stateProvider.state('refresher.' + name, {
        url: '/' + name,
        views: views
      });
  });

  $urlRouterProvider.otherwise('/refresher/' + examples[0]);

});

