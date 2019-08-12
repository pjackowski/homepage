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
