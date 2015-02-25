angular.module('mos.mobile.components', [])
.directive('mosRefresher', function($ionicGesture) {
  return {
    restrict: 'E',
    template: '<div ng-transclude></div>',
    require: '?^$ionicScroll',
    transclude: true,
    scope: {
      onRefresh: '&',
      onDragStart: '&',
      onDrag: '&',
      onRelease: '&',
      onRefreshChange: '&',
      onHiding: '&',
      onFinish: '&'
    },
    controller: function($scope) {
      this.addListener = function(directive) {
        $scope.listener = directive;
      }
    },
    link: function(scope, $element, attrs, scrollCtrl) {
      var defaults = {
        distance: 60,
        overflow: 80,
        resistance: 2.5,
        startPos: 70
      }

      var scrollable;
      var rotableElement;
      var drag;
      var events;

      var options = {
        distanceToRefresh: parseInt(attrs.distance) || defaults.distance,
        overflow: parseInt(attrs.overflow) || defaults.overflow,
        resistance: parseFloat(attrs.resistance) || defaults.resistance,
        maxStartY: parseInt(attrs.startPos) || defaults.startPos
      }
      options.extraDistance = options.distanceToRefresh * options.overflow / 100;

      function dispatch(eventName, params) {
        
       if(scope.listener && scope.listener[eventName]) {
          var e = new Event(eventName, {cancelable: true});
          e.params = params;
          var r = scope.listener[eventName].apply(scope.listener, [e]);
          if(e.defaultPrevented) return r;
        }
        if(scope[eventName]) return scope[eventName].apply(scope, [params]);
      }

      function findContent(el) {
        if(el[0].localName ==='ion-content') return el;

        var p = el.parent();

        if(!p) return null;

        return findContent(p);
      }
     
      function onDestroy() {
        if(!events) return;
        scope.listener = null;
        
        $ionicGesture.off(events.start, 'dragstart', onDragStart);
        $ionicGesture.off(events.down, 'dragdown', onDragDown);
        //$ionicGesture.off(events.up, 'dragup', onDragUp);
        $ionicGesture.off(events.end, 'dragend', onDragEnd);

        $element.off('transitionend', onAnimationEnd);
        $element.off('$destroy', onDestroy);
      }

      function init() {
        scrollable = findContent($element);
        if(!scrollable) throw new Error("Refresher must be a child of ion-content");

        rotableElement = angular.element($element[0].querySelector('.mos-rotate'));
        
        $element.on('$destroy', onDestroy);

        events = {
          start: $ionicGesture.on('dragstart', onDragStart, scrollable),
          down: $ionicGesture.on('dragdown', onDragDown, scrollable),
          //up: $ionicGesture.on('dragup', onDragUp, scrollable),
          end: $ionicGesture.on('dragend', onDragEnd, scrollable),
          transitionEnd: $element.on('transitionend', onAnimationEnd)
        }

        initDOM();
      }

      function initDOM() {
        $element.children().addClass('mos-content');
        $element.addClass('mos-hidden');
        reset();
      }

      
      function onAnimationEnd(e) {
        if($element.hasClass('mos-hiding')) {
          $element.addClass('mos-hidden');
          $element.removeClass('mos-hiding');
          dispatch('onFinish');
        } 
      }

      function cssTransform(element, transform) {
        element.css({'-webkit-transform': transform, '-moz-transform': transform, '-ms-transform': transform, 'transform': transform});
      }

      /*function onDragUp(e) {
        if ( ! drag.enabled ) return;
      }*/

	  function onDragStart(e) {
        var currentTop = (scrollCtrl? scrollCtrl.getScrollPosition().top : scrollable[0].scrollTop);
    		if(currentTop <= options.maxStartY) {
          if(rotableElement.length === 0) rotableElement = angular.element($element[0].querySelector('.mos-rotate'));
    		  drag.enabled = true;
    		  $element.removeClass('mos-hidden');
    		  $element.addClass('mos-dragging');
          dispatch('onDragStart');
    		}
      }

      function onDragEnd(e) {
        if (!drag.enabled) return;
        e.gesture.preventDefault();
        e.gesture.srcEvent.preventDefault();

        drag.enabled = false;

        $element.removeClass('mos-dragging');
        cssTransform(rotableElement, '');

        dispatch('onRelease');

        if (drag.mustRefresh) {
          refresh();
        } else {
          reset();
        }
      }

      function onDragDown(e) {
        if (!drag.enabled) return;

        e.gesture.preventDefault();
        e.gesture.srcEvent.preventDefault();

        drag.distance = e.gesture.distance / options.resistance;
        var percentageDone = drag.distance * 100 / options.distanceToRefresh;
        
        if ( drag.distance <= (options.distanceToRefresh + options.extraDistance) ) {
          move(drag.distance);
          cssTransform(rotableElement, 'rotate('+ percentageDone*3.6 +'deg)');
          dispatch('onDrag', {distance: drag.distance, percentage: percentageDone });
        }
        if ( drag.distance > options.distanceToRefresh ) {
          if(!drag.mustRefresh) {
            $element.addClass('mos-refresh');
            drag.mustRefresh = true;
            dispatch('onRefreshChange', {willRefresh: true});
          }
        } else if(drag.mustRefresh) {
          $element.removeClass('mos-refresh');
          drag.mustRefresh = false;
          dispatch('onRefreshChange', {willRefresh: false});
        }
      }

      function refresh() {
        $element.addClass('mos-refreshing');
        move(options.distanceToRefresh);

        var promise = dispatch('onRefresh');
        if(promise && promise.then) {
          promise.then(function() { 
            //if(scope.refreshChange) scope.refreshChange({isRefreshing: false});
            reset(); 
          });
        }
        //if(scope.refreshChange) scope.refreshChange({isRefreshing: true});
      }

      function reset() {
        scope.loading = false;
        drag = {
          enabled: false,
          distance: 0,
          mustRefresh: false
        }
        $element.removeClass('mos-refresh mos-refreshing mos-dragging');

        if(!$element.hasClass('mos-hidden')) {
          $element.addClass('mos-hiding');
          dispatch('onHiding');
        }

        move(0);
      }

      function move(y) {
        cssTransform($element, 'translate3d( 0, ' + ( y - $element[0].offsetHeight - 2) + 'px, 0 )');
      }


      init();
    }
  };
});