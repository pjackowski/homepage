$(document).ready(function() {

    "use strict";

    var scrollSpeed = 750,
        onePageNavSetup = {
            currentClass: 'current',
            changeHash: false,
            scrollSpeed: scrollSpeed,
            scrollOffset: 60,
            scrollThreshold: 0.5,
            filter: '',
            easing: 'swing'
        },
        scrollToSetup = {
            offset: {
                top: -100
            }
        };

    $('#navigation').onePageNav(onePageNavSetup);

    $('.go-top').on('click', function(event) {
        event.preventDefault();
        $.scrollTo('#motto', scrollSpeed, scrollToSetup);
    });

    $('.gallery a').touchTouch();

});