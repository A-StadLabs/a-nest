
(function(document) {
  //'use strict';

  var that = this;

  document.addEventListener('polymer-ready', function() {
    // Perform some behaviour
    console.log('aOS is ready to rock!');
  });

  document.addEventListener('router-go', function(e) {
    // Perform some behaviour
    console.log('Router go: ', e.detail.naarwaar);
    document.getElementById('router').go(e.detail.naarwaar);
  });

  document.addEventListener('show-toast', function(e) {
    // Perform some behaviour
    console.log('Toast: ', e.detail.bericht);
    document.getElementById('toast').text = e.detail.bericht;
    document.getElementById('toast').show();
  });

// wrap document so it plays nice with other libraries
// http://www.polymer-project.org/platform/shadow-dom.html#wrappers
})(wrap(document));


