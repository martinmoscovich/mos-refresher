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
angular.module('mos.mobile.components')
  .directive('mosAnimatedArrow', ["$interval", function($interval) {
    return {
      restrict: 'A',
      require: ['mosRefresher', 'mosAnimatedArrow'],
      controller: ["$scope", "$element", function($scope, $element) {
        var options = {
          radius: 30
        }
        var intervalPromise;

        this.onDrag = function(e) {
          void 0
          var percentage = ((e.params.percentage / 100 * 80) - 70) * 100 / 10;
          draw(e.params.percentage / 100);
        }

        this.onRefresh = function() {
          intervalPromise = $interval(function() {
            drawLoader();
          }, 15);
        }

        this.onHiding = function() {
          if (intervalPromise) $interval.cancel(intervalPromise);
        }

        var canvas, ctx;
        this.init = function(refresherController) {
          refresherController.addListener(this);
          canvas = $element.find('canvas')[0];
          ctx = canvas.getContext('2d');
        }

        var circ = Math.PI * 2;
        var quart = Math.PI / 2;
        var lastCurrent;

        function getPoint(c1, c2, radius, angle) {
          return [c1 + Math.cos(angle) * radius, c2 + Math.sin(angle) * radius];
        }

        var draw = function(percentage) {
          var center = {
            x: canvas.width / 2,
            y: canvas.height / 2
          };

          // Move registration point to the center of the canvas
          ctx.translate(center.x, center.y);

          // Rotate 1 degree
          ctx.rotate(Math.PI / 2 * (percentage - lastCurrent));

          // Move registration point back to the top left corner of canvas
          ctx.translate(-center.x, -center.y);

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          drawArrow(canvas, Math.min(percentage, 1), center, canvas.width / 2);

          lastCurrent = percentage;
        }

        var drawArrow = function(canvas, percentage, center, radius) {
          var arrowPercentage = percentage * 0.75;
          var d = ((circ) * arrowPercentage) - quart;
          var p = getPoint(center.x, center.y, radius * 0.5, d);

          ctx.beginPath();
          ctx.arc(center.x, center.y, radius - 1, 0, circ, false);
          ctx.strokeStyle = "#CACACA";
          ctx.fillStyle = "#FFFFFF";
          ctx.stroke();
          ctx.fill();

          ctx.beginPath();
          ctx.fillStyle = ctx.strokeStyle = (percentage < 1) ? "rgba(100,100,100,1)" : '#99CC33';

          var arrowWidth = 10;
          ctx.lineWidth = arrowWidth;
          ctx.arc(center.x, center.y, radius * 0.5, -(quart), d, false);
          ctx.stroke();
          ctx.beginPath();

          ctx.lineWidth = 1;
          var l = Math.max(5, 15 * arrowPercentage);
          //p[0] = p[0]+Math.cos(d+Math.PI/2)*(arrowWidth/2-1);
          //p[1] = p[1]+Math.sin(d+Math.PI/2)*(arrowWidth/2-1);
          //ctx.moveTo(p[0], p[1]);

          ctx.lineTo(p[0] + Math.cos(d) * l, p[1] + Math.sin(d) * l);
          ctx.lineTo(p[0] - Math.cos(d) * l, p[1] - Math.sin(d) * l);
          ctx.lineTo(p[0] + Math.cos(d + Math.PI / 2) * l, p[1] + Math.sin(d + Math.PI / 2) * l);
          ctx.lineTo(p[0] + Math.cos(d) * l, p[1] + Math.sin(d) * l);

          ctx.fill();
        }

        var drawLoader = function() {
          var center = {
            x: canvas.width / 2,
            y: canvas.height / 2
          };
          // Move registration point to the center of the canvas
          ctx.translate(center.x, center.y);

          // Rotate 1 degree
          ctx.rotate(Math.PI / 2 * 0.1);

          // Move registration point back to the top left corner of canvas
          ctx.translate(-center.x, -center.y);

          drawArrow(canvas, 1, center, canvas.width / 2);
        }

      }],
      link: function(scope, element, attrs, ctrls) {
        var content = element.find("div");

        content.html('<style>mos-refresher canvas { }</style>');
        content.append('<canvas width="50px" height="50px"></canvas>');

        ctrls[1].init(ctrls[0]);



      }
    }
  }]);
angular.module('mos.mobile.components')
  .directive('mosArrow', function() {
    return {
      restrict: 'A',
      require: ['mosRefresher', 'mosArrow'],
      controller: ["$scope", "$element", function($scope, $element) {
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
      }],
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