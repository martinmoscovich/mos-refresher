angular.module('mos.mobile.components')
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

      },
      link: function(scope, element, attrs, ctrls) {
        var content = element.find("div");

        content.html('<style>mos-refresher canvas { }</style>');
        content.append('<canvas width="50px" height="50px"></canvas>');

        ctrls[1].init(ctrls[0]);



      }
    }
  });