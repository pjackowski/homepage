function getRandomNumber(a, b) {

    return Math.round( a + ( Math.random() * ( b - a ) ) );

}

/*
//random data generator
//should be replaced with JSON data structure

for( var i= 0; i< 15; i++ ) {

    //add shared nodes only for firs few categories

    //randomize some shared UVs
    var randomSharedStr= '';
    var sharedCounter= getRandomNumber(0, 3);

    var addedSharedIsArr= [];

    for( var j= 0; j< sharedCounter; j++ ) {

        var sharedId= getRandomNumber(0, 10);
        var sharedUv= getRandomNumber(200, 1000);

        if( (addedSharedIsArr.indexOf(sharedId) > -1) || (sharedId == i) ) {
            continue;
        }

        randomSharedStr+= '<shared id="' + sharedId +
                    '" uv_rawvalue="'    + sharedUv +
                    '" uv_value="'       + sharedUv +
                    '"/>';

        addedSharedIsArr.push(sharedId);

    }

    //append shared data
    rowBodyStr+= randomSharedStr

    //close row
    rowBodyStr+= '</row>';

    //append row data
    chartBodyStr+= rowBodyStr;

}

//convert to XML object
chartXmlStr= '<chart>' + chartBodyStr + '</chart>';
*/
