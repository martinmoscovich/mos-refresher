angular.module('mos.mobile.components')
  .directive('mosArrow', function() {
    return {
      restrict: 'A',
      require: ['mosRefresher', 'mosArrow'],
      controller: function($scope, $element) {
        var icon, iconContainer, textElement;
        this.init = function(refresherController) {
          refresherController.addListener(this);
          icon = angular.element($element[0].querySelector('.icon'));
          iconContainer = angular.element($element[0].querySelector('.mos-icon'));
          textElement = angular.element($element[0].querySelector('.mos-refresher-text'));
        }

        this.onRefreshChange = function(e) {
          textElement.html(e.params.willRefresh ? $scope.releaseText : $scope.pullText);
        }
        this.onRefresh = function() {
          icon.addClass('ion-load-c').removeClass('ion-arrow-down-a');
          iconContainer.addClass('mos-rotate');
          textElement.html($scope.loadingText);
        }
        this.onFinish = function(e) {
          iconContainer.removeClass('mos-rotate');
          icon.removeClass('ion-load-c').addClass('ion-arrow-down-a');
          textElement.html($scope.pullText);
        }
        this.onRelease = function() {
          textElement.html($scope.pullText);
        }
      },
      link: function(scope, element, attrs, ctrls) {
        var content = element.find("div");

        scope.pullText = attrs.pullText || 'Pull To Refresh';
        scope.releaseText = attrs.releaseText || 'Release To Refresh';
        scope.loadingText = attrs.loadingText || 'Loading';
        var iconSize = attrs.iconSize || 50;

        element.addClass('mos-arrow');

        content.html('<div class="mos-icon"><i style="font-size: ' + iconSize + 'px;" class="icon ion-arrow-down-a"></i></div><span class="mos-refresher-text">' + scope.pullText + '</span>');

        ctrls[1].init(ctrls[0]);
      }
    }
  });