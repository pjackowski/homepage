var config= {

    //default parameters

    //data
    dataType: 'xml',            //allowed: 'xml', 'json' (not supported yet)
    maxRowNumber: 50,
    logarythmic: true,

    //background
    width: 600,
    height: 600,
    bgRectFill: 'none',
    bgRectStroke: 'none',
    bgRectStrokeWidth: 1,
    bgRectStrokeType: '---',    //alowed: '', '-', '.', '-.', '-..', '. ', '- ', '--', '- .', '--.', '--..'
    bgRectRadius: 0,

    //bubbles
    minBblRadius: 5,
    maxBblRadius: 25,
    bblColorType: 'heatmap',    //alowed: 'fixed', 'heatmap'
    bblHueRangeMin: 0.8,        //min and max are inverted intentionally in this case
    bblHueRangeMax: 0.0,
    bblStrokeColor: '#000000',
    bblStrokeWidth: 1,
    bblSelectionStroke: '#000000',
    bblSelectionStrokeWidth: 4,
    bblFillColor: 'orange',

    //spring
    sprStrokeColor: '#999999',
    sprStrokeWidth: 2,
    sprStrokeType: "-",
    sprSelectionStrokeColor: '#000000',
    sprSelectionStrokeWidth: 4,
    sprSelectionStrokeType: "",

    //labels
    lblFont: '11px Sans, Arial',
    lblFontFill: '#000000',
    lblTextAnchor: 'middle',
    lblBackgroundFill: '#eeeeee',
    lblBackgroundStroke: '#000000',
    showSprLabel: false,
    showBblLabel: true,
    quickLblFontFill: '#666666',

    //zoom
    zoomStep: 0.05,
    zoomMin: 0.1,
    zoomMax: 1.55,

    //physics
    timerDelay: 30,
    timeDelta: 0.01,
    friction: 0.98,
    kineticStop: 0.1,
    simulationStep: 0.01,
    mouseMoveTimerDelay: 60,

    bblMassMin: 1,
    bblMassMax: 100,
    bblCharge: 1,
    springResilience: 1,
    springDamping: 1,
    gravityMass: 1000000

};

//if empty "" attribute is not populated in IE properly
//put any value if you want to get solid line on mouse move over
//for FF and other browser for solid line put ""
if( $.browser.msie && config.sprSelectionStrokeType == "" ) {

    config.sprSelectionStrokeType= "1";

}
