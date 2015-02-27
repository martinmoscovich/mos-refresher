angular.module('mos.mobile.components', [])
  .constant('MOS_REFRESHER_CONFIG', {
    defaults: {
      distance: 60,
      overflow: 80,
      resistance: 2.5,
      startPos: 70
    },
    hidingTime: 300
  })
  .directive('mosRefresher', ["$ionicGesture", "$timeout", "MOS_REFRESHER_CONFIG", function($ionicGesture, $timeout, MOS_REFRESHER_CONFIG) {
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
      controller: ["$scope", function($scope) {
        this.addListener = function(directive) {
          $scope.listener = directive;
        }
      }],
      link: function(scope, $element, attrs, scrollCtrl) {
        var defaults = MOS_REFRESHER_CONFIG.defaults;

        // Internal variabled
        var scrollable;
        var rotableElement;
        var drag;
        var events;
        var elementHeight;
        var hideTimer;
        var scrollOffset = 0;

        var options = {
          distanceToRefresh: parseInt(attrs.distance) || defaults.distance,
          overflow: parseInt(attrs.overflow) || defaults.overflow,
          resistance: parseFloat(attrs.resistance) || defaults.resistance,
          maxStartY: parseInt(attrs.startPos) || defaults.startPos
        }
        options.extraDistance = options.distanceToRefresh * options.overflow / 100;

        /** 
         * Dispatches event to the client's controller and the sub-directives
         */
        function dispatch(eventName, params) {
          if (scope.listener && scope.listener[eventName]) {
            var e = new Event(eventName, {
              cancelable: true
            });
            e.params = params;
            var r = scope.listener[eventName].apply(scope.listener, [e]);
            if (e.defaultPrevented) return r;
          }
          if (scope[eventName]) return scope[eventName].apply(scope, [params]);
        }

        /**
         * Finds the scrollable container
         */
        function findScrollabe(el) {
          if (el[0].localName === 'ion-content') return el;

          var p = el.parent();

          if (!p) return null;

          return findScrollabe(p);
        }

        /** 
         * Executed when the directive and its associated DOM element is removed
         */
        function onDestroy() {
          if (!events) return;

          // Remove controller listener
          scope.listener = null;

          // Cancel pending timer
          if (hideTimer) $timeout.cancel(hideTimer);

          // Remove event listeners
          $ionicGesture.off(events.start, 'dragstart', onDragStart);
          $ionicGesture.off(events.down, 'dragdown', onDragDown);
          $ionicGesture.off(events.end, 'dragend', onDragEnd);

          scrollable.off("scroll",adjustOnScroll);
          $element.off('transitionend', onAnimationEnd);
          $element.off('$destroy', onDestroy);
        }

        /** 
         * Inits the directive
         */
        function init() {
          scrollable = findScrollabe($element);
          if (!scrollable) throw new Error("Refresher must be a child of ion-content");

          var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
          // Fix for mobile chrome
          if(isChrome) $element.css('position', 'fixed');

          rotableElement = angular.element($element[0].querySelector('.mos-rotate'));

          $element.on('$destroy', onDestroy);

          events = {
            start: $ionicGesture.on('dragstart', onDragStart, scrollable),
            down: $ionicGesture.on('dragdown', onDragDown, scrollable),
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

        /**
         * Fired after css animations finish
         */
        function onAnimationEnd(e) {
          if ($element.hasClass('mos-hiding')) {
            // If it's a TransitionEvent and there is a timer, cancel it (otherwise the events will be fired twice)
            if (e && hideTimer) $timeout.cancel(hideTimer);
            
			      cssTransform($element, '');
            $element.addClass('mos-hidden');
            $element.removeClass('mos-hiding mos-refreshed');
            dispatch('onFinish');
          }
          if ($element.hasClass('mos-will-refresh')) {
            $element.removeClass('mos-will-refresh');
          }
        }

        function cssTransform(element, transform) {
          element.css({
            '-webkit-transform': transform,
            '-moz-transform': transform,
            '-ms-transform': transform,
            'transform': transform
          });
        }

        /**
         * Fired when the user starts dragging the scrollable up
         */
        function onDragStart(e) {
          if(!drag.enabled) return;
          var currentTop = (scrollCtrl ? scrollCtrl.getScrollPosition().top : scrollable[0].scrollTop);
          if (currentTop <= options.maxStartY) {
            scrollOffset = (scrollCtrl ? 0: currentTop);
            if (rotableElement.length === 0) rotableElement = angular.element($element[0].querySelector('.mos-rotate'));
            drag.active = true;
            drag.enabled = false;
            
            $element.removeClass('mos-hidden');
            $element.addClass('mos-dragging');
            dispatch('onDragStart');
            elementHeight = $element[0].offsetHeight;

            // Move to top
            move(0);
          }
        }

        /**
         * Fired when the user releases the scrollable
         */
        function onDragEnd(e) {
          if (!drag.active) return;
          e.gesture.preventDefault();
          e.gesture.srcEvent.preventDefault();

          drag.active = false;

          $element.removeClass('mos-dragging');
          cssTransform(rotableElement, '');

          dispatch('onRelease');

          elementHeight = $element[0].offsetHeight;

          if (drag.mustRefresh) {
            refresh();
          } else {
            reset(false);
          }
        }

        /**
         * Fired when the user is dragging the scrollable
         */
        function onDragDown(e) {
          if (!drag.active) return;

          e.gesture.preventDefault();
          e.gesture.srcEvent.preventDefault();

          drag.distance = e.gesture.distance / options.resistance;
          var percentageDone = drag.distance * 100 / options.distanceToRefresh;

          if (drag.distance <= (options.distanceToRefresh + options.extraDistance)) {
            move(drag.distance);
            cssTransform(rotableElement, 'rotate(' + percentageDone * 3.6 + 'deg)');
            dispatch('onDrag', {
              distance: drag.distance,
              percentage: percentageDone
            });
          }
          if (drag.distance > options.distanceToRefresh) {
            if (!drag.mustRefresh) {
              $element.addClass('mos-refresh');
              drag.mustRefresh = true;
              dispatch('onRefreshChange', {
                willRefresh: true
              });
            }
          } else if (drag.mustRefresh) {
            $element.removeClass('mos-refresh');
            drag.mustRefresh = false;
            dispatch('onRefreshChange', {
              willRefresh: false
            });
          }
        }

        function adjustOnScroll(e) {
          scrollOffset = e.target.scrollTop;
          move(options.distanceToRefresh);
        }

        /**
         * Sets the component to its "Refreshing" state and notifies the clients
         */
        function refresh() {
          $element.addClass('mos-refreshing mos-will-refresh');
          scrollable.on("scroll",adjustOnScroll);

          move(options.distanceToRefresh);


          var promise = dispatch('onRefresh');
          if (promise && promise.then) {
            promise.then(function() {
              scrollable.off("scroll",adjustOnScroll);
              reset(true);
            });
          }

        }

        /**
         * Sets the component to its original "hidden" state and notifies the clients
         */
        function reset(fromRefresh) {
          scope.loading = false;
          drag = {
            active: false,
            distance: 0,
            mustRefresh: false,
            enabled: true
          }
          $element.removeClass('mos-refresh mos-refreshing mos-dragging');

          // If it's not hidden, we need to animate.
          if (!$element.hasClass('mos-hidden')) {
            if(fromRefresh) $element.addClass('mos-refreshed');
            $element.addClass('mos-hiding');
            // In some browsers, if the element is not visible, the transitionend event is not fired, so a timer fallback is used
            hideTimer = $timeout(onAnimationEnd, MOS_REFRESHER_CONFIG.hidingTime);
            dispatch('onHiding');
          }
          if(fromRefresh)
            move(options.distanceToRefresh, 'scale(0.1)');
          else
            move(0);
        }

        /**
         * Moves the element to the specified position using CSS3 transformations
         */
        function move(y, extraTransform) {
          var currentHeight = $element[0].offsetHeight;
          // Sometimes if the element is hidden, the offsetHeight is 0, so I used the last known height
          if (currentHeight === 0) currentHeight = elementHeight;

          cssTransform($element, 'translate3d( 0, ' + (y+scrollOffset - elementHeight - 2) + 'px, 0 )' + (extraTransform?' '+extraTransform:''));
        }


        init();
      }
    };
  }]);