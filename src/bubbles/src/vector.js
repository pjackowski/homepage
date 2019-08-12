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

    getLength: function() {

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
