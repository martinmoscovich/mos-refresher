angular.module('mos.mobile.components', [])
.directive('mosSpinningIcon', function() {
  return {
    restrict: 'A',
    require: 'mosRefresher',
    link: function(scope, element, attrs){
      var content = element.find("div");
      var icon = attrs.mosSpinningIcon || 'ion-ios7-refresh';
      var refreshColor = attrs.iconRefreshColor || '#0D0BA4';
      var size = attrs.iconSize || '#0D0BA4';
      content.html('<style>mos-refresher .icon { font-size: '+size+'px; } mos-refresher.mos-refresh .icon { color: '+refreshColor+'; }</style>');
      content.append('<div class="mos-rotate"><i class="icon ' + icon + '"></i></div>');
    }
  }  
})
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
        textElement.html(e.params.willRefresh? $scope.releaseText: $scope.pullText);
      }
      this.onRefresh = function() {
        icon.toggleClass('ion-arrow-down-a ion-load-c');
        iconContainer.addClass('mos-rotate');
        textElement.html($scope.loadingText); 
      }
      this.onFinish = function(e) {
        iconContainer.removeClass('mos-rotate');
        icon.toggleClass('ion-arrow-down-a ion-load-c');
        textElement.html($scope.pullText); 
      }
      this.onRelease = function() {
       textElement.html($scope.pullText); 
      }
    },
    link: function(scope, element, attrs, ctrls){
      var content = element.find("div");
      
      scope.pullText = attrs.pullText || 'Pull To Refresh';
      scope.releaseText = attrs.releaseText || 'Release To Refresh';
      scope.loadingText = attrs.loadingText || 'Loading';
      var iconSize = attrs.iconSize || 50;
      
      element.addClass('mos-arrow');

      content.html('<div class="mos-icon"><i style="font-size: '+ iconSize +'px;" class="icon ion-arrow-down-a"></i></div><span class="mos-refresher-text">' + scope.pullText + '</span>');
      
      ctrls[1].init(ctrls[0]);
    }
  }  
})
.directive('mosAnimatedArrow', function($interval) {
  return {
    restrict: 'A',
    require: ['mosRefresher', 'mosAnimatedArrow'],
    controller: function($scope, $element) {
      var options = {
        radius: 30
      }
      var intervalPromise;
      
      this.onDrag = function(e) {
        console.log(e.params.percentage)
        var percentage = ((e.params.percentage/100*80) - 70)*100/10;
        draw(e.params.percentage/100);
      }

      this.onRefresh = function() {
        intervalPromise = $interval(function() { drawLoader();}, 15);
      }

      this.onHiding = function() {
        if(intervalPromise) $interval.cancel(intervalPromise);
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
      function getPoint(c1,c2,radius,angle){
          return [c1+Math.cos(angle)*radius,c2+Math.sin(angle)*radius];
      }

      var draw = function(percentage) {
        var center = {x: canvas.width/2, y: canvas.height/2};
    
        // Move registration point to the center of the canvas
        ctx.translate(center.x, center.y);
          
        // Rotate 1 degree
        ctx.rotate(Math.PI/2 * (percentage - lastCurrent));
          
        // Move registration point back to the top left corner of canvas
        ctx.translate(-center.x, -center.y);
    
        ctx.clearRect ( 0 , 0 , canvas.width, canvas.height );
          
        drawArrow(canvas, Math.min(percentage, 1), center, canvas.width/2);
    
        lastCurrent = percentage;
      }

      var drawArrow = function(canvas, percentage, center, radius) {
        var arrowPercentage = percentage*0.75;
        var d = ((circ) * arrowPercentage) - quart;
        var p = getPoint(center.x, center.y, radius*0.5, d);
         
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius-1, 0, circ, false);
        ctx.strokeStyle = "#CACACA";
        ctx.fillStyle="#FFFFFF";
        ctx.stroke();
        ctx.fill();
        
        ctx.beginPath();
        ctx.fillStyle = ctx.strokeStyle = (percentage < 1)?"rgba(100,100,100,1)":'#99CC33';  
         
        var arrowWidth = 10;
        ctx.lineWidth = arrowWidth;
        ctx.arc(center.x, center.y, radius*0.5, -(quart), d, false);
        ctx.stroke();
        ctx.beginPath();
          
        ctx.lineWidth = 1;
        var l = Math.max(5,15*arrowPercentage);
        //p[0] = p[0]+Math.cos(d+Math.PI/2)*(arrowWidth/2-1);
        //p[1] = p[1]+Math.sin(d+Math.PI/2)*(arrowWidth/2-1);
        //ctx.moveTo(p[0], p[1]);
            
        ctx.lineTo(p[0]+Math.cos(d)*l,p[1]+Math.sin(d)*l);
        ctx.lineTo(p[0]-Math.cos(d)*l,p[1]-Math.sin(d)*l);
        ctx.lineTo(p[0]+Math.cos(d+Math.PI/2)*l,p[1]+Math.sin(d+Math.PI/2)*l);
        ctx.lineTo(p[0]+Math.cos(d)*l,p[1]+Math.sin(d)*l);
        
        ctx.fill();
      }

      var drawLoader = function() {
        var center = {x: canvas.width/2, y: canvas.height/2};
        // Move registration point to the center of the canvas
        ctx.translate(center.x, center.y);
        
        // Rotate 1 degree
        ctx.rotate(Math.PI/2 * 0.1);
        
        // Move registration point back to the top left corner of canvas
        ctx.translate(-center.x, -center.y);

        drawArrow(canvas, 1, center, canvas.width/2);
    }

    },
    link: function(scope, element, attrs, ctrls){
      var content = element.find("div");
      
      content.html('<style>mos-refresher canvas { }</style>');
      content.append('<canvas width="50px" height="50px"></canvas>');
     
      ctrls[1].init(ctrls[0]);



    }
  }  
})
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
        rotableElement.css('-webkit-transform', '');

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
          rotableElement.css('-webkit-transform', 'rotate('+ percentageDone*3.6 +'deg)');
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
        $element.css('-webkit-transform', 'translate3d( 0, ' + ( y - $element[0].offsetHeight - 2) + 'px, 0 )');
      }


      init();
    }
  };
});