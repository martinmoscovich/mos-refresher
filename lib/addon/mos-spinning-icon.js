angular.module('mos.mobile.components')
  .directive('mosSpinningIcon', function() {
    return {
      restrict: 'A',
      require: 'mosRefresher',
      link: function(scope, element, attrs) {
        var content = element.find("div");
        var icon = attrs.mosSpinningIcon || 'ion-ios7-refresh';
        var refreshColor = attrs.iconRefreshColor || '#0D0BA4';
        var size = attrs.iconSize || '#0D0BA4';
        element.addClass('mos-spinning-icon');
        content.html('<style>mos-refresher.mos-spinning-icon .icon { font-size: ' + size + 'px; } mos-refresher.mos-spinning-icon.mos-refresh .icon { color: ' + refreshColor + '; }</style>');
        content.append('<div class="mos-rotate"><i class="icon ' + icon + '"></i></div>');
      }
    }
  });