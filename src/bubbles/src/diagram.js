var Diagram= $.inherit( {

    //public members and methods

    __constructor: function(config, data, parameters) {

        var that= this;

        //merge the config parameters with those passed as argument
        this.p= this.mergeParameters(config, parameters);

        //min and max needed for scaling
        this.minValue= Number.MAX_VALUE;
        this.maxValue= 0;

        //related min/max are necessary to define springs
        this.relatedMinValue= Number.MAX_VALUE;
        this.relatedMaxValue= 0;

        //total kinetic energy, used to stop simulation
        this.totalKineticEnergy= 0;

        //global zoom
        this.globalZoom= 1.0;

        //load data, XML and JSON supported
        this.dataArr= this.loadData(data);

        //no data, exit as there is nothing to draw
        if( !this.dataArr.length )
            return;

        //preapare Raphael container
        this.r= Raphael(parameters.target, parameters.width, parameters.height);

        //draw background
        this.bgRect= this.r.rect( 0, 0, this.r.width, this.r.height, this.p.bgRectRadius ).attr({
            'stroke': this.p.bgRectStroke,
            'stroke-width': this.p.bgRectStrokeWidth,
            'stroke-dasharray': this.p.bgRectStrokeType,
            'fill': this.p.bgRectFill
        });

        //create bubbles and springs
        this.createBubbles();

        //center entire system
        this.centerChart();

        //get all bubbles and springs
        var bubbleArr= Bubble.getBubbleArr();
        var springArr= Spring.getSpringArr();

        //init system
        this.systemTimer= setTimeout(function() {
            that.resolveChart();
        }, this.p.timerDelay);

        //IE work around
        if( $.browser.msie )
            var selector= this.p.target;
        else
            var selector= 'svg';

        //setup move events
        this.setupOnMouseDownHandler(selector);
        this.setupOnMouseMoveHandler(selector);
        this.setupOnMouseUpHandler(selector);
        this.setupOnMouseOutHandler(selector);
        this.setupOnMouseWheelHandler(selector);

        //disable context menu for SVG
        $(selector).bind('contextmenu', function(e){
              return false;
        });

    },

    mergeParameters: function(config, parameters) {

        var p= config;

        //merge parameters
        for( var i in parameters )
            p[i]= parameters[i];

        return p;

    },

    loadData: function(data) {

        var idArr= [];

        //two types of data supported
        if( this.p.dataType.toLowerCase() == 'xml' ) {

            //XML data
            var arr= $(data).find('node');

        } else

        if( this.p.dataType.toLowerCase() == 'json' ) {

            //JSON data
            var arr= data;

        } else

        {
            //missing type
            return [];
        }

        //limit data
        arr= arr.slice(0, this.p.maxRowNumber);

        //create one dimensional array for data
        var retArr= new Array(arr.length);

        //process data

        //read rows and find max / min value
        for( var i= 0; i< arr.length; i++ ) {

            //get attributes
            retArr[i]= getAllXMLAttributes( arr[i] );

            //save id for debug purpose
            idArr.push( parseInt(retArr[i].id, 10) );

            //get related nodes
            var relatedArr= $(arr[i]).find('related');

            //add related nodes
            retArr[i].relatedArr= [];

            //add all related nodes
            for( var j= 0; j< relatedArr.length; j++ ) {

                var relatedNode= getAllXMLAttributes(relatedArr[j]);

                retArr[i].relatedArr.push( relatedNode );

                //save max and min values for related nodes
                var parsedRelatedValue= parseInt( relatedNode.value, 10 );

                if( this.p.logarythmic )
                    this.setMinAndMax( Math.log(parsedRelatedValue), false );
                else
                    this.setMinAndMax( parsedRelatedValue, false );

            }

            //find max and min value
            var parsedValue= parseInt( retArr[i].value, 10 );

            //skip for NAN value
            if( isNaN(parsedValue) || parsedValue <= 0 )
                continue;

            //save max and min values
            if( this.p.logarythmic )
                this.setMinAndMax( Math.log(parsedValue), true );
            else
                this.setMinAndMax( parsedValue, true );

        }

        //display number of nodes and ids
        //console.log( 'Debug:', idArr.sort( function(a,b) {return a - b} ), idArr.length );

        return retArr;

    },

    setMinAndMax: function(value, parent) {

        if( parent == true || parent === undefined ) {

            if( value < this.minValue )
                this.minValue= value;

            if( value > this.maxValue )
                this.maxValue= value;

        } else

        {

            if( value < this.relatedMinValue )
                this.relatedMinValue= value;

            if( value > this.relatedMaxValue )
                this.relatedMaxValue= value;

        }

    },

    getConvertedValue: function(value, range) {

        //implementation according to:
        //stackoverflow.com/questions/929103/convert-a-number-range-to-another-range-maintaining-ratio

        var oldRange= range.oldMax - range.oldMin;
        var newRange= range.newMax - range.newMin;

        if( oldRange == 0 )
            oldRange= 1;

        return (((value - range.oldMin) * newRange) / oldRange) + range.newMin;

    },

    getRandomPosition: function(radius) {

        //random position within available space
        var x= radius + Math.random() * (this.p.width  - 2 * radius);
        var y= radius + Math.random() * (this.p.height - 2 * radius);

        return ( new Vector(x, y) );

    },

    getRelatedPosition: function(parent, angleShift) {

        //get random vector and normilize it
        var v= new Vector(0, -100);

        //rotate vectory by angle
        v= v.getRotated(angleShift);

        return v;

    },

    getGeometricMassCenter: function() {

        var bubbleArr= Bubble.getBubbleArr();

        //get geometric and mass centers
        var geometricCenter= new Vector(0, 0);
        var massCenter= new Vector(0, 0);
        var massSum= 0;

        for( var i= 0; i< bubbleArr.length; i++ ) {

            //geometric
            geometricCenter= geometricCenter.addVector(bubbleArr[i].p);

            //mass
            massCenter= massCenter.addVector( bubbleArr[i].p.getMultiplied(bubbleArr[i].m) );
            massSum+= bubbleArr[i].m;

        }

        geometricCenter= geometricCenter.getMultiplied(1/bubbleArr.length);
        massCenter= massCenter.getMultiplied(1/massSum);

        var retObj= {

            geometric: geometricCenter,
            mass: massCenter

        };

        return retObj

    },

    doesBubbleExist: function(data) {

        var bubbleArr= Bubble.getBubbleArr();

        if( bubbleArr === undefined )
            return false;

        for( var i=0; i< bubbleArr.length; i++ ) {

            if( bubbleArr[i].raphRef.chartData.id == data.id )
                return bubbleArr[i];

        }

        return false;

    },

    createBubbles: function() {

        //for each data node
        for( var i= 0; i< this.dataArr.length; i++ ) {

            //check if bubble exist for processed node
            var bubbleExist= this.doesBubbleExist(this.dataArr[i]);

            //create main bubble
            if( bubbleExist == false )
                var parentBubble= this.createBubble(this.dataArr[i]);
            else
                var parentBubble= bubbleExist;

            if( parentBubble.raphRef.chartData.relatedArr.length > 0 ) {

                //create related bubbles
                this.createRelatedBubbles(parentBubble);

            }

        }

    },

    createRelatedBubbles: function(parentBubble) {

        //simplify data reference
        var dataNode= parentBubble.raphRef.chartData;

        //create related bubbles
        for( var i= 0; i< dataNode.relatedArr.length; i++ ) {

            var nodeArrIndex= -1;
            var relatedData= dataNode.relatedArr[i];

            //find proper data node
            for( var k= 0; k< this.dataArr.length; k++ ) {

                if( relatedData.id == this.dataArr[k].id ) {

                    nodeArrIndex= k;
                    break;

                }

            }

            if( nodeArrIndex > -1 ) {

                //check if related bubble exist for processed node and
                //create bubble if necessary
                var relatedBubbleExist= this.doesBubbleExist(this.dataArr[nodeArrIndex]);

                if( relatedBubbleExist == false )
                    var relatedBubble= this.createBubble(this.dataArr[nodeArrIndex], parentBubble, i);
                else
                    var relatedBubble= relatedBubbleExist;

                //is related bubble the same as parent?
                //do not create spring in such case
                var bubblesTheSame= (parentBubble == relatedBubble);

                //create spring
                if( !parentBubble.doesSpringExist(relatedBubble) && !bubblesTheSame ) {

                    this.createSpring( parentBubble,
                                       relatedBubble,
                                       relatedData );

                }

            }

        }

    },

    createBubble: function(data, parentBubble, shift) {

        var that= this;

        //parse value
        var parsedValue= parseInt( data.value, 10 );

        if( isNaN(parsedValue) || parsedValue <= 0 )
            return;

        //compute bubble size
        //logarythmic scale included depending on settings
        var sizeRange= {
            oldMin: this.minValue,
            oldMax: this.maxValue,
            newMin: this.p.minBblRadius,
            newMax: this.p.maxBblRadius
        };

        if( this.p.logarythmic )
            var bubbleRadius= this.getConvertedValue(Math.log(parsedValue), sizeRange);
        else
            var bubbleRadius= this.getConvertedValue(parsedValue, sizeRange);

        //find proper position for bubble
        if( parentBubble === undefined ) {

            var bblPosition= this.getRandomPosition(bubbleRadius);

        } else

        {

            var relatedArrLength= parentBubble.raphRef.chartData.relatedArr.length;
            var angleShift= shift * 360 / relatedArrLength;

            var bblPosition= this.getRelatedPosition(parentBubble, angleShift);
                bblPosition= bblPosition.addVector(parentBubble.p);

        }

        //get color
        //does not work with logarythmic scale, as colors would be similar
        if( this.p.bblColorType.toLowerCase() == 'heatmap' ) {

            var colorRange= {
                oldMin: this.minValue,
                oldMax: this.maxValue,
                newMin: this.p.bblHueRangeMin,
                newMax: this.p.bblHueRangeMax
            };

            var bblColor= "hsb(" + [this.getConvertedValue(parsedValue, colorRange), 1, 1] + ")";

        } else

        if( this.p.bblColorType.toLowerCase() == 'fixed' ) {

            var bblColor= this.p.bblFillColor;

        }

        //apply style
        var styleObj= {
            'stroke': this.p.bblStrokeColor,
            'stroke-width': this.p.bblStrokeWidth,
            'fill': bblColor
        };

        //compute mass of bubble and create instance
        var massRange= {
            oldMin: this.minValue,
            oldMax: this.maxValue,
            newMin: this.p.bblMassMin,
            newMax: this.p.bblMassMax
        };

        var bubble= new Bubble( bblPosition,
                                bubbleRadius,
                                this.getConvertedValue(parsedValue, massRange),
                                this.p.bblCharge,
                                styleObj,
                                this.r,
                                this );

        //create tooltip label (avoid 'title' attribute)
        var nameDefined= (typeof(data.name) != 'undefined');
        var valueDefined= (typeof(data.value) != 'undefined');

        if( nameDefined )
            var tipStr= '<b>' + data.name + '</b>';
        else
            this.p.showBblLabel= false;

        //save tooltip and chart data
        bubble.raphRef.tooltipLbl= tipStr;
        bubble.raphRef.chartData= data;

        //check if bubble does not collide with other bubbles
        bubble.avoidInitialCollision();

        //apply zoom
        bubble.applyZoom(this.globalZoom);

        //setup mouse events
        $(bubble.raphRef[0]).mouseover(function(event) {

            //do not fire event when dragging or rotating
            if( that.dragging || that.rotating )
                return;

            bubble.doOnMouseOver();

        });

        $(bubble.raphRef[0]).mouseout(function(event) {

            //do not fire event when dragging or rotating
            if( that.dragging || that.rotating )
                return;

            bubble.doOnMouseOut();

        });

        $(bubble.raphRef[0]).mousedown(function(event) {

            //force darklight to avoid event issues
            bubble.doOnMouseOut();

            //block dragging
            return false;

        });

        return bubble;

    },

    createSpring: function(b1, b2, data) {

        //compute length of spring and create instance
        var lengthRange= {
            oldMin: this.relatedMinValue,
            oldMax: this.relatedMaxValue,
            newMin: this.p.bblMassMin,
            newMax: this.p.bblMassMax
        };

        var spring= new Spring( b1, b2,
                                this.p.springResilience,
                                this.p.springDamping,
                                this.getConvertedValue(data.value, lengthRange),
                                this.r,
                                this );

        //add spring to the bubble's arrays
        b1.addSpring(spring);
        b2.addSpring(spring);

        //display in tooltip related value
        var tipStr= "";

        if( typeof(data.value) != 'undefined' )
            tipStr+= "<b>related value:</b> " + data.value;

        //add tooltip
        spring.raphRef.tooltipLbl= tipStr;
        spring.raphRef.chartData= data;

        //apply zoom
        spring.applyZoom(this.globalZoom);

    },

    translateChart: function(translationVector) {

        //translate mass center as well
        if( this.massCenter === undefined ) {

            var center= this.getGeometricMassCenter();
            this.massCenter= center.mass;

        }

        this.massCenter= this.massCenter.addVector(translationVector);

        //get all bubbles and springs
        var bubbleArr= Bubble.getBubbleArr();
        var springArr= Spring.getSpringArr();

        //translate bubbles
        for( var i= 0; i< bubbleArr.length; i++ )
            bubbleArr[i].translate(translationVector);

        //redraw springs (it will update position automatically)
        for( var i= 0; i< springArr.length; i++ )
            springArr[i].draw();

    },

    rotateChart: function(angle) {

        //do not compute mass center
        //it is calculated in mouse event handler

        var bubbleArr= Bubble.getBubbleArr();
        var springArr= Spring.getSpringArr();

        //translate bubbles
        for( var i= 0; i< bubbleArr.length; i++ )
            bubbleArr[i].rotate(angle, this.massCenter);

        //redraw springs (it will translate them automatically)
        for( var i= 0; i< springArr.length; i++ )
            springArr[i].draw();

    },

    zoomChart: function(zoomFactor) {

        //it is not real zoom, it does not zoom chart, instead
        //method changes bubble radius, electric charge, spring initial length
        //and gravity force, so chart semms to be spaller in result

        //position of bubbles is not changed

        var bubbleArr= Bubble.getBubbleArr();
        var springArr= Spring.getSpringArr();

        //do not exceed zoom limits
        var newZoom= this.globalZoom + zoomFactor;

        if( (newZoom < this.p.zoomMin) || (newZoom > this.p.zoomMax) )
            return;


        //update global zoom
        this.globalZoom+= zoomFactor;

        //bubbles
        for( var i= 0; i< bubbleArr.length; i++ )
            bubbleArr[i].applyZoom(this.globalZoom);

        //springs
        for( var i= 0; i< springArr.length; i++ )
            springArr[i].applyZoom(this.globalZoom);


        //global gravity force
        if( !this.p.gravityFactorOrg )
            this.p.gravityFactorOrg= this.p.gravityFactor;

        this.p.gravityFactor= this.p.gravityFactorOrg / this.globalZoom;


        //work around for event scoping issue
        var that= this;

        //initialize simulation again if animation stopped
        if( this.totalKineticEnergy <= this.p.kineticStop ) {

            this.systemTimer= setTimeout(function() {
                that.resolveChart();
            }, this.p.timerDelay);

        }

    },

    centerChart: function() {

        //center chart, so mass center is equal to geometrix center

        //get chart center
        var center= this.getGeometricMassCenter();

        //get the center of the screen and compute translation vector
        var screenCenter= new Vector(this.p.width/2, this.p.height/2);
        var translationVector= screenCenter.subVector(center.geometric);

        this.translateChart(translationVector);

    },

    resolveChart: function() {

        //work around for event scoping issue
        var that= this;

        //get arrays for simplicity sake
        var bubbleArr= Bubble.getBubbleArr();
        var springArr= Spring.getSpringArr();

        //reset kinetic energy
        this.totalKineticEnergy= 0;

        //compute electric forces, collisions and apply gravity
        for( var i= 0; i< bubbleArr.length; i++ ) {

            //this means that we compute force for each bubble only once
            //forces for both bubbles are "resolved" at the same time
            //no need to double cycles
            for( var j= i+1; j< bubbleArr.length; j++ ) {

                //all bubbles must be compared agains all other
                //compute coulomb force
                bubbleArr[i].coulombRepulsion(bubbleArr[j]);

                //resolve collision if happened
                bubbleArr[i].resolveSingleCollision(bubbleArr[j]);

            }

            //apply gravity that keeps not related pieces together
            bubbleArr[i].applyGravity();

        }

        //compute spring forces
        for( var i= 0; i< springArr.length; i++ )
            springArr[i].hookeAttraction();

        //translate bubbles and redraw springs
        for( var i= 0; i< bubbleArr.length; i++ ) {

            //update velocity, apply friction and reset velocity delta
            bubbleArr[i].v= bubbleArr[i].v.addVector(bubbleArr[i].dV);
            bubbleArr[i].v= bubbleArr[i].v.getMultiplied(this.p.friction);
            bubbleArr[i].dV= new Vector(0, 0);

            //increase total kinetic energy
            this.totalKineticEnergy+= bubbleArr[i].getKineticEnergy();

            //translate bubble
            bubbleArr[i].translate(bubbleArr[i].v);

        }

        //redraw springs
        for( var i= 0; i< springArr.length; i++ )
            springArr[i].draw();

        //restart timer
        if( this.totalKineticEnergy > this.p.kineticStop ) {

            this.systemTimer= setTimeout(function() {
                that.resolveChart();
            }, this.p.systemTimerDelay);

        }

    },

    setupOnMouseDownHandler: function(selector) {

        //work around for event scoping issue
        var that= this;

        $(selector).mousedown(function(event) {

            var leftMouseButton= 1;
            var rightMouseButton= 3;

            if( event.which == rightMouseButton ) {

                //dragging

                //save state
                that.dragging= true;
                that.rotating= false;

            } else

            if( event.which == leftMouseButton ) {

                //rotating

                //save state
                that.dragging= false;
                that.rotating= true;

            }

            //different container for IE and FF
            if( $.browser.msie )
                var offset= $(event.currentTarget).offset();
            else
                var offset= $(event.currentTarget.parentNode).offset();

            //save mouse position
            //position over page - position over object
            //(currentTarget.parentNode, points allways to DIV container)
            that.previousX= event.pageX - offset.left;
            that.previousY= event.pageY - offset.top;

        });

    },

    setupOnMouseMoveHandler: function(selector) {

        //work around for event scoping issue
        var that= this;

        $(selector).mousemove(function(event) {

            //save mouse coordinates for another purpose
            that.mousePositionX= event.pageX;
            that.mousePositionY= event.pageY;

            var now= new Date();

            //avoid handling too many events per second
            //it is not required to do calculation and translation/rotation that often
            if( that.lastMouseMove ) {

                if( now - that.lastMouseMove >= that.p.mouseMoveTimerDelay )
                    that.lastMouseMove= now;
                else
                    return;

            } else

            {

                that.lastMouseMove= now;

            }

            //handle event
            if( that.dragging ) {

                //different container for IE and FF
                if( $.browser.msie )
                    var offset= $(event.currentTarget).offset();
                else
                    var offset= $(event.currentTarget.parentNode).offset();

                //get current mouse position
                var currentX= event.pageX - offset.left;
                var currentY= event.pageY - offset.top;

                //translate entire chart
                var translationVector= new Vector(currentX - that.previousX, currentY - that.previousY);
                that.translateChart(translationVector);

                //save mouse position
                //position over page - position over object (currentTarget, points allways SVG)
                that.previousX= event.pageX - offset.left;
                that.previousY= event.pageY - offset.top;

            } else

            if( that.rotating ) {

                //different container for IE and FF
                if( $.browser.msie )
                    var offset= $(event.currentTarget).offset();
                else
                    var offset= $(event.currentTarget.parentNode).offset();

                //get current mouse position
                var currentX= event.pageX - offset.left;
                var currentY= event.pageY - offset.top;

                //track mouse pointer
                var startVector= new Vector(that.previousX, that.previousY);
                var endVector= new Vector(currentX, currentY);

                //translate mouse coordinates and rotate chart around mass center
                //mass center has to be updated everytime when chart rotates
                var center= that.getGeometricMassCenter();
                that.massCenter= center.mass;

                startVector= startVector.subVector(that.massCenter);
                endVector= endVector.subVector(that.massCenter);


                //get angle between vectors
                var scalarProduct= startVector.getScalarProduct(endVector);
                var cosAlfa= scalarProduct / (startVector.getLength() * endVector.getLength());
                var alfa= Math.acos(cosAlfa) * 180/Math.PI;
                var crossProduct= startVector.getCrossProduct(endVector);

                //rotate chart
                if( crossProduct.z < 0 )
                    that.rotateChart(-1 * alfa);
                else
                    that.rotateChart(alfa);


                //save mouse position
                //position over page - position over object (currentTarget, points allways SVG)
                that.previousX= event.pageX - offset.left;
                that.previousY= event.pageY - offset.top;

            }

        });

    },

    setupOnMouseUpHandler: function(selector) {

        //work around for event scoping issue
        var that= this;

        $(selector).mouseup(function(event) {

            //save state
            that.dragging= false;
            that.rotating= false;

        });

    },

    setupOnMouseOutHandler: function(selector) {

        //work around for event scoping issue
        var that= this;

        $(selector).mouseout(function(event) {

            if( event.relatedTarget == null ) {

                that.dragging= false;
                that.rotating= false;

            } else

            {

                var tagName= event.relatedTarget.tagName;

                if( $.browser.msie ) {

                    var notDiv= (tagName.toLowerCase() != 'div');
                    var notOval= (tagName.toLowerCase() != 'oval');
                    var notShape= (tagName.toLowerCase() != 'shape');
                    var notSpan= (tagName.toLowerCase() != 'span');

                    var condition= (notDiv && notOval && notShape && notSpan);

                } else

                {

                    var notSvg= (tagName.toLowerCase() != 'svg');
                    var notCircle= (tagName.toLowerCase() != 'circle');
                    var notPath= (tagName.toLowerCase() != 'path');
                    var notRect= (tagName.toLowerCase() != 'rect');
                    var notText= (tagName.toLowerCase() != 'text');

                    var condition= (notSvg && notCircle && notPath && notRect && notText);

                }

                if( condition ) {

                    //mouse went off the svg object, save state
                    that.dragging= false;
                    that.rotating= false;

                }

            }

        });

    },

    setupOnMouseWheelHandler: function(selector) {

        //work around for event scoping issue
        var that= this;

        $(selector).mousewheel(function(event, delta) {

            //zoom in/out
            if( delta > 0 )
                that.zoomChart(that.p.zoomStep);
            else
                that.zoomChart(-1 * that.p.zoomStep);

            //prevent default
            return false;

        });

    }

},

{
    //static members and methods
    //

});
