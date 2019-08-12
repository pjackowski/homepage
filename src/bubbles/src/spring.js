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
