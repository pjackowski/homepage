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

var Vector= $.inherit( {

    //public members and methods

    __constructor: function(x, y) {

        this.x= x;
        this.y= y;

    },

    set: function(x, y) {

        this.x= x;
        this.y= y;

    },

    getDistance: function(v) {

        var xPow= Math.pow( (this.x - v.x), 2 );
        var yPow= Math.pow( (this.y - v.y), 2 );
        var distance= Math.sqrt( xPow + yPow );

        return distance;

    },

    getLength: function(v) {

        return ( this.getDistance(new Vector(0, 0)) );

    },

    getNormalized: function() {

        if( (this.x == 0) && (this.y == 0) )
            return this;

        var vLen= this.getDistance(new Vector(0, 0));
        return( new Vector( (this.x/vLen), (this.y/vLen) ) );

    },

    getMultiplied: function(scalar) {

        return( new Vector(scalar*this.x, scalar*this.y) );

    },

    getRotated: function(angle) {

        var angleInRadians= angle * Math.PI/180;

        var xNew= this.x * Math.cos(angleInRadians) - this.y * Math.sin(angleInRadians);
        var yNew= this.x * Math.sin(angleInRadians) + this.y * Math.cos(angleInRadians);

        return( new Vector(xNew, yNew) );

    },

    getScalarProduct: function(v) {

        return (this.x * v.x) + (this.y * v.y);

    },

    getCrossProduct: function(v) {

        //simplified cross product of 2D vector
        //z axis does not exist

        var retObj= {
            x: this.y * 0 - 0 * v.y,
            y: 0 * v.x - this.x * 0,
            z: this.x * v.y - this.y * v.x
        };

        return retObj;

    },

    addVector: function(v) {

        return( new Vector(this.x + v.x, this.y + v.y) );

    },

    subVector: function(v) {

        return( new Vector(this.x - v.x, this.y - v.y) );

    }

},

{
    //static members and methods
    //

});

var Spring= $.inherit( {

    //public members and methods

    __constructor: function(b1, b2, resilienceFactor, dampingFactor, initLen, raphContainer, diagram) {

        //setup basic attributes
        this.b1Ref= b1;                             //bubble 1 reference
        this.b2Ref= b2;                             //bubble 2 reference
        this.resilienceFactor= resilienceFactor;    //strength of spring
        this.dampingFactor= dampingFactor;          //dumping
        this.initLength= initLen;                   //initial length
        this.raphContainer= raphContainer;          //Raphael canvas reference
        this.diagram= diagram;                      //reference to parent diagram

        //add instance to the static array
        Spring.getSpringArr().push(this);

        this.draw();

        //send spring to back, so it does not overlap with bubble
        this.raphRef.toBack();

        //make sure that background does not cover springs
        this.diagram.bgRect.toBack();

    },

    hookeAttraction: function() {

        var b1= this.b1Ref;
        var b2= this.b2Ref;

        //get position and velocity difference vector (for spring damping)
        var positionDiff= b1.p.subVector(b2.p).getNormalized();

        //get velocity diff
        var velocityDiff= b1.v.subVector(b2.v);

        //Hooke's law
        var lengthDiff= b1.p.getDistance(b2.p) - this.initLength;
        var force = this.resilienceFactor * lengthDiff;
            force+= this.dampingFactor * positionDiff.getScalarProduct(velocityDiff);

        //compute acceleration
        var a1= -1 * force / b1.m * this.diagram.p.timeDelta;
        var a2=      force / b2.m * this.diagram.p.timeDelta;

        //save velocity delta
        b1.dV= b1.dV.addVector( positionDiff.getMultiplied(a1) );
        b2.dV= b2.dV.addVector( positionDiff.getMultiplied(a2) );

    },

    draw: function() {

        var that= this;

        //create path string
        var pathStr= 'M' + this.b1Ref.p.x + ',' + this.b1Ref.p.y +
                     'L' + this.b2Ref.p.x + ',' + this.b2Ref.p.y;

        if( this.raphRef === undefined ) {

            //create invisible object if it does not exist
            //spring must be invisible, because it is moved during chart centering process
            this.raphRef= this.raphContainer.path(pathStr).attr({
                'stroke': this.diagram.p.sprStrokeColor,
                'stroke-width': this.diagram.p.sprStrokeWidth,
                'stroke-dasharray': this.diagram.p.sprStrokeType
            });

        } else

        {
            //update it
            this.raphRef.attr('path', pathStr);

            //update label position if necessary
            if( this.labelVisible )
                this.updateLabelPosition();

        }

    },

    applyZoom: function(zoomFactor) {

        //save initial length
        if( !this.initLengthOrg )
            this.initLengthOrg= this.initLength;

        //change length
        this.initLength= this.initLengthOrg * zoomFactor;

    },

    highlight: function() {

        //highlight spring
        this.raphRef.attr('stroke', this.diagram.p.sprSelectionStrokeColor);
        this.raphRef.attr('stroke-width', this.diagram.p.sprSelectionStrokeWidth);
        this.raphRef.attr('stroke-dasharray', this.diagram.p.sprSelectionStrokeType);

        //show label depending on setting
        if( this.diagram.p.showSprLabel )
            this.showLabel();

        //highlight bubbles
        if( !this.b1Ref.highlighted )
            this.b1Ref.highlight();

        if( !this.b2Ref.highlighted )
            this.b2Ref.highlight();

    },

    darklight: function() {

        //darklight spring
        this.raphRef.attr('stroke', this.diagram.p.sprStrokeColor);
        this.raphRef.attr('stroke-width', this.diagram.p.sprStrokeWidth);
        this.raphRef.attr('stroke-dasharray', this.diagram.p.sprStrokeType);

        //remove label depending on setting
        if( this.diagram.p.showSprLabel )
            this.hideLabel();

        //darklight bubbles
        if( this.b1Ref.highlighted )
            this.b1Ref.darklight();

        if( this.b2Ref.highlighted )
            this.b2Ref.darklight();

    },

    showLabel: function() {

        //create and show label

        if( this.labelRef === undefined ) {

            //compute position
            var position= new Vector(0, 0);
                position= position.addVector( this.b1Ref.p.addVector( this.b2Ref.p ) );
                position= position.getMultiplied(0.5);

            //create text label and bring it to front
            this.labelRef= this.raphContainer.text(position.x, position.y, this.raphRef.chartData.value).attr({
                'font': this.diagram.p.lblFont,
                'fill': this.diagram.p.lblFontFill,
                'text-anchor': this.diagram.p.lblTextAnchor

            });

            this.labelRef.toFront();

        } else

        {

            //if label available update position
            this.updateLabelPosition();
            this.labelRef.show();

        }

        this.labelVisible= true;

    },

    hideLabel: function() {

        //hide label
        if( this.labelRef )
            this.labelRef.hide();

        this.labelVisible= false;

    },

    updateLabelPosition: function() {

        //compute position
        var position= new Vector(0, 0);
            position= position.addVector( this.b1Ref.p.addVector( this.b2Ref.p ) );
            position= position.getMultiplied(0.5);

        //update label position
        this.labelRef.attr('x', position.x);
        this.labelRef.attr('y', position.y);

    }

},

{
    //static members and methods
    //

    getSpringArr: function() {

        //create empty, static array if no springs available
        if( this.springArr === undefined )
            this.springArr= [];

        return this.springArr;

    }

});

var Bubble= $.inherit( {

    //public members and methods

    __constructor: function(position, radius, mass, charge, styleObj, raphContainer, diagram) {

        //setup basic attributes
        this.p= new Vector(position.x, position.y); //position
        this.v= new Vector(0, 0);                   //velocity
        this.dV= new Vector(0, 0);                  //velocity delta vector
        this.r= radius;                             //radius
        this.m= mass;                               //mass
        this.q= charge;                             //charge
        this.styleObj= styleObj;                    //styling
        this.raphContainer= raphContainer;          //Raphael canvas reference
        this.diagram= diagram;                      //reference to parent diagram

        this.springArr= [];                         //array for springs connected with the bubble

        //add instance to the static array
        Bubble.getBubbleArr().push(this);

        //apply style and draw
        this.applyDefaultStyle();
        this.draw();

    },

    getKineticEnergy: function() {

        //calculate kinetic energy of bubble
        var vLength= this.v.getLength();
        var kineticEnergy= 1/2 * this.m * vLength * vLength;

        return kineticEnergy;

    },

    coulombRepulsion: function(bubble) {

        var b1= this;
        var b2= bubble;

        //get position and velocity difference vectors
        var positionDiffB1B2= b1.p.subVector(b2.p).getNormalized();
        var positionDiffB2B1= positionDiffB1B2.getMultiplied(-1);

        //Coulomb's law
        var k= 1 / (36 * Math.PI * Math.pow(10, -9));
        var distance= b1.p.getDistance(b2.p);
        var force= (k * b1.q * b2.q) / (distance * distance);

        //compute acceleration
        var a1= force / b1.m * this.diagram.p.timeDelta;
        var a2= force / b2.m * this.diagram.p.timeDelta;

        //save velocity delta
        b1.dV= b1.dV.addVector( positionDiffB1B2.getMultiplied(a1) );
        b2.dV= b2.dV.addVector( positionDiffB2B1.getMultiplied(a2) );

    },

    testCollision: function(bubble) {

        //detect collision between two bubbles
        var distance= this.p.getDistance(bubble.p);

        var retObj= {
            collision: ( (distance < this.r + bubble.r) == true ),
            distance: distance
        };

        return retObj;

    },

    avoidInitialCollision: function() {

        //repeat until all collisions are resolved

        //get array of all created bubbles
        var bubbleArr= Bubble.getBubbleArr();

        //flag used to repeat process of resolving collisions
        var collisionFound= false;

        for( var i= 0; i< bubbleArr.length; i++) {

            //get ids
            var b1Id= this.raphRef.chartData.id;
            var b2Id= bubbleArr[i].raphRef.chartData.id;

            if( b1Id == b2Id )
                continue;

            //test collision
            var result= this.testCollision(bubbleArr[i]);

            if( result.collision ) {

                //mark flag
                collisionFound= true;

                //resolve
                if( result.distance > 0.5 ) {

                    //substract positions
                    var positionDiff= bubbleArr[i].p.subVector(this.p).getNormalized();

                    //distance to move, multiplied by 2 just in case
                    var distanceToMove= 2 * (this.r + bubbleArr[i].r - result.distance);

                    //multiply vector
                    positionDiff= positionDiff.getMultiplied(distanceToMove);

                    //move bubble to avoid collision
                    this.translate(positionDiff);

                } else

                {

                    //the same center point of circle, can not build vector
                    //move in random direction

                    //get random values: range: [-1.0 -> 1.0, -1.0 -> 1.0]
                    var randomPosition= new Vector(
                        (Math.random() * 2) - 1,
                        (Math.random() * 2) - 1
                    );

                    //normalize it
                    randomPosition= randomPosition.getNormalized();

                    //get biggest radius and multiply by 2 just in case
                    var distanceToMove= 2 * Math.max(this.r, bubbleArr[i].r);

                    //multiply vector
                    var randomPosition= randomPosition.getMultiplied(distanceToMove);

                    //move bubble to avoid collision
                    this.translate(randomPosition);

                }

            }

        }

        //repeat process if collision has been found
        //moved bubble might collide with something else
        if( collisionFound )
            this.avoidInitialCollision();

    },

    resolveSingleCollision: function(bubble) {

        //simplify bubble references to make code clean
        var b1= this;
        var b2= bubble;

        //test agains collision
        var result= this.testCollision(b2);

        if( result.collision ) {

            //collision detected, resolve it (simple collision, no energy lost, etc.)

            //get base collision axes
            var xAxisB1B2= b2.p.subVector(b1.p).getNormalized();
            var xAxisB2B1= xAxisB1B2.getMultiplied(-1);

            //find projections for bubble 1
            var dotProduct1= xAxisB1B2.getScalarProduct(b1.v);
            var v1x= xAxisB1B2.getMultiplied(dotProduct1);
            var v1y= b1.v.subVector(v1x);

            //find projections for bubble 2
            var dotProduct2= xAxisB2B1.getScalarProduct(b2.v);
            var v2x= xAxisB2B1.getMultiplied(dotProduct2);
            var v2y= b2.v.subVector(v2x);

            //compute equation components
            var v1xM1= v1x.getMultiplied(b1.m);
            var v2xM2= v2x.getMultiplied(b2.m);
            var v1xV2xM2= v1x.subVector(v2x).getMultiplied(b2.m);
            var v2xV1xM1= v2x.subVector(v1x).getMultiplied(b1.m);

            //compute new x components
            var u1x= v1xM1.addVector(v2xM2).subVector(v1xV2xM2).getMultiplied( 1/(b1.m + b2.m) );
            var u2x= v1xM1.addVector(v2xM2).subVector(v2xV1xM1).getMultiplied( 1/(b1.m + b2.m) );

            //new velocity complete vectors
            var u1= u1x.addVector(v1y);
            var u2= u2x.addVector(v2y);

            //do not apply collision resilience
            //

            //get delta velocity vectors and add them to dV
            var dV1= u1.subVector(b1.v);
            var dV2= u2.subVector(b2.v);

            b1.dV= b1.dV.addVector(dV1);
            b2.dV= b2.dV.addVector(dV2);

        }

    },

    applyGravity: function() {

        //translate mass center as well
        if( this.diagram.massCenter === undefined ) {

            var center= this.diagram.getGeometricMassCenter();
            this.diagram.massCenter= center.mass;

        }

        //get G constant
        var G= 6.6742867 * Math.pow(10, -11);

        //get distance from mass center
        var leadVector= this.diagram.massCenter.subVector(this.p);
        var distance= leadVector.getLength();

        //normalize vector
        leadVector= leadVector.getNormalized();

        //compute force - this is not proper equation, as
        //force gets stronger further off, it is not typical gravity behaviour ;)
        var force= (G * this.m * this.diagram.p.gravityMass) * (distance * distance);

        //compute acceleration
        var a= force / this.m * this.diagram.p.simulationStep;

        //save velocity delta
        this.dV= this.dV.addVector( leadVector.getMultiplied(a) );

    },

    translate: function(v) {

        //move Raphael object
        this.raphRef.translate(v.x, v.y);

        //update position vector
        this.p.set(this.p.x + v.x, this.p.y + v.y);

        //update label position if necessary
        if( this.labelVisible )
            this.updateLabelPosition();

        //update quick label position if necessary
        if( this.quickLabelVisible )
            this.updateQuickLabelPosition();

    },

    rotate: function(angle, rotationCenter) {

        //do not use Raphael rotation, it does not rotate objects in obvious way
        //need to compute rotation anyway to get new position and velocity vectors

        //translate position vector, center of rotation is (0,0)
        var centeredPosition= this.p.subVector(rotationCenter);

        //rotate position and velocity vectors (relative rotation)
        //velocity does not require centering, it is relative always
        var rotatedPosition= centeredPosition.getRotated(angle);
        var rotatedVelocity= this.v.getRotated(angle);

        //reverse position translation
        var newPosition= rotatedPosition.addVector(rotationCenter);

        //translate bubble and apply velocity vectors
        this.translate( newPosition.subVector(this.p) );
        this.v= rotatedVelocity;

    },

    applyZoom: function(zoomFactor) {

        //save original radius
        if( !this.rOrg )
            this.rOrg= this.r;

        //zoom radius
        this.r= this.rOrg * zoomFactor;
        this.raphRef.attr('r', this.r);


        //save original electric charge
        if( !this.qOrg )
            this.qOrg= this.q;

        //zoom charge
        this.q= this.qOrg * zoomFactor;

    },

    doesSpringExist: function(bubble) {

        var springArr= Spring.getSpringArr();

        for( var i= 0; i< springArr.length; i++ ) {

            var condition1= ( (springArr[i].b1Ref == this) && (springArr[i].b2Ref == bubble) );
            var condition2= ( (springArr[i].b1Ref == bubble) && (springArr[i].b2Ref == this) );

            if( condition1 || condition2 )
                return true;

        }

        return false;

    },

    addSpring: function(spring) {

        this.springArr.push(spring);

    },

    draw: function() {

        if( this.raphRef === undefined ) {

            //create Raphael circle
            this.raphRef= this.raphContainer.circle(this.p.x, this.p.y, this.r).attr({
                'stroke': this.styleObj.stroke,
                'stroke-width': this.styleObj['stroke-width'],
                'fill': this.styleObj.fill
            });

            //save reference to root level of class instace
            this.raphRef.classroot= this;

        }

    },

    applyDefaultStyle: function() {

        //set some default styling
        if( this.styleObj['stroke'] ===  undefined )
            this.styleObj['stroke']= 'none';

        if( this.styleObj['stroke-width'] ===  undefined )
            this.styleObj['stroke-width']= this.diagram.p.bblStrokeWidth;

        if( this.styleObj['fill'] ===  undefined )
            this.styleObj['fill']= 'none';

    },

    highlight: function() {

        //stroke bubble
        this.raphRef.attr('stroke-width', this.diagram.p.bblSelectionStrokeWidth);

        //set highlighted flag
        this.highlighted= true;

    },

    darklight: function() {

        //restore stroke
        this.raphRef.attr('stroke-width', this.diagram.p.bblStrokeWidth);


        //disable highlighted flag
        this.highlighted= false;

    },

    doOnMouseOver: function() {

        //be careful, spring can highlight bubbles
        if( this.highlighted )
            return;

        //highlight bubble
        this.highlight();

        //highlight springs
        var springArr= this.raphRef.classroot.springArr;

        for( var i= 0; i< springArr.length; i++) {

            //highlight spring
            springArr[i].highlight();

            //show quick labels of related nodes (depending on setting)
            if( this == springArr[i].b1Ref )
                var relatedBubble= springArr[i].b2Ref;
            else

            if( this == springArr[i].b2Ref )
                var relatedBubble= springArr[i].b1Ref;

            if( this.diagram.p.showBblLabel )
                relatedBubble.showQuickLabel();

        }

        //show label depending on setting
        if( this.diagram.p.showBblLabel )
            this.showLabel();

    },

    doOnMouseOut: function() {

        //be careful, spring can darklight bubbles
        if( this.darklighted )
            return;

        //darklight bubble
        this.darklight();

        //darklight springs
        var springArr= this.raphRef.classroot.springArr;

        for( var i= 0; i< springArr.length; i++) {

            //darklight springs
            springArr[i].darklight();

            //hide quick labels of related categories (depending on setting)
            if( this == springArr[i].b1Ref )
                var relatedBubble= springArr[i].b2Ref;
            else

            if( this == springArr[i].b2Ref )
                var relatedBubble= springArr[i].b1Ref;

            if( this.diagram.p.showBblLabel )
                relatedBubble.hideQuickLabel();

        }

        //hide label depending on setting
        if( this.diagram.p.showBblLabel )
            this.hideLabel();

    },

    showLabel: function() {

        if( this.labelNameRef === undefined ) {

            //compute position
            var offset= new Vector(0, this.r + (1/2 * this.diagram.p.bblSelectionStrokeWidth) );
            var position= this.p.subVector(offset);

            var name= this.raphRef.chartData.name;
            var value= this.raphRef.chartData.value;

            //create text label
            this.labelNameRef= this.raphContainer.text( position.x + this.r + this.diagram.p.bblSelectionStrokeWidth,
                                                        position.y + 12,
                                                        name).attr({
                'font': this.diagram.p.lblFont,
                'font-weight': 'bold',
                'fill': this.diagram.p.lblFontFill,
                'text-anchor': 'start'

            });

            //bring text to front
            this.raphRef.toFront();
            this.labelNameRef.toFront();

        } else

        {

            //update label position if necessary
            this.updateLabelPosition();

            //show label
            this.labelNameRef.show();

            //bring text to front
            this.raphRef.toFront();

            this.labelNameRef.toFront();

        }

        //set flag
        this.labelVisible= true;

    },

    hideLabel: function() {

        if( this.labelNameRef ) {

            //hide label
            this.labelNameRef.hide();

            //set flag
            this.labelVisible= false;

        }

    },

    updateLabelPosition: function() {

        //compute position
        var offset= new Vector(0, this.r + (1/2 * this.diagram.p.bblSelectionStrokeWidth) );
        var position= this.p.subVector(offset);

        //update label position
        this.labelNameRef.attr('x', position.x + this.r + this.diagram.p.bblSelectionStrokeWidth);
        this.labelNameRef.attr('y', position.y + 12);

    },

    showQuickLabel: function() {

        if( this.quickLabelRef === undefined ) {

            //compute position
            var offset= new Vector(0, this.r + 2 * this.diagram.p.bblSelectionStrokeWidth);
            var position= this.p.subVector(offset);

            //create text label
            this.quickLabelRef= this.raphContainer.text(position.x, position.y, this.raphRef.chartData.name).attr({
                'font': this.diagram.p.lblFont,
                'fill': this.diagram.p.quickLblFontFill,
                'text-anchor': this.diagram.p.lblTextAnchor
            });

            //bring text to front
            this.quickLabelRef.toFront();

        } else

        {

            //update label position if necessary
            this.updateQuickLabelPosition();

            //show label
            this.quickLabelRef.show();

        }

        //set flag
        this.quickLabelVisible= true;

    },

    hideQuickLabel: function() {

        //hide label
        if( this.quickLabelRef ) {

            this.quickLabelRef.hide();

        }

        //set flag
        this.quickLabelVisible= false;

    },

    updateQuickLabelPosition: function() {

        //compute position
        var offset= new Vector(0, this.r + 2 * this.diagram.p.bblSelectionStrokeWidth);
        var position= this.p.subVector(offset);

        //update label position
        this.quickLabelRef.attr('x', position.x);
        this.quickLabelRef.attr('y', position.y);

    }

},

{
    //static members and methods
    //

    getBubbleArr: function() {

        //create empty, static array if no bubbles available
        if( this.bubbleArr === undefined )
            this.bubbleArr= [];

        return this.bubbleArr;

    }

});

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
