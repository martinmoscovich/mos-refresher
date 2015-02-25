angular.module('mos.mobile.components')
.factory('ionicSupport', function($ionicGesture) {

	function findContent(el) {
	    if(el[0].localName ==='ion-content') return el;

	    var p = el.parent();

	    if(!p) return null;

	    return findContent(p);
  	}

  	function addEventListeners(scrollable, events) {
  		events = {
	      start: $ionicGesture.on('dragstart', events.start, scrollable),
	      down: $ionicGesture.on('dragdown', events.down, scrollable),
	      //up: $ionicGesture.on('dragup', onDragUp, scrollable),
	      end: $ionicGesture.on('dragend', events.end, scrollable)
	    }	
  	}

  	



	return {
		init: function(element, scrollCtrl, events) {

		},
		getScrollableTop: function() {
			return (scrollCtrl? scrollCtrl.getScrollPosition().top : scrollable[0].scrollTop);
		}
	}
});