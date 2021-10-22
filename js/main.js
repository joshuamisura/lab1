//crime data by city-data.com

function createMap(map){
	getData(map);
};

function getData(map){
    //load the data
    $.ajax("data/murders.geojson", {
        dataType: "json",
        success: function(response){
            var attributes = processData(response)
            createPropSymbols(response, map, attributes);
            createSequenceControls(map, attributes);
            var tableFields = populateTable(response);
            var table = $('#tablecity').DataTable({
                    data: tableFields,
                    dataSrc: "",
                    select:{style:'single'},
                "columns":[
                    {"data": "id"},
                    {"data": "name"},
                    {"data": "2006"},
                    {"data": "2008"},
                    {"data": "2010"},
                    {"data": "2012"},
                    {"data": "2014"},
                    {"data": "2016"},
                    {"data": "2018"}
                ]
            });


            createLegend(map,attributes);
        }
    });

};

function createPropSymbols(data, map, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scaleFactor = 50;
    //area based on attribute value and scale factor
    var area = attValue * scaleFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);

    return radius;
};

function pointToLayer(feature, latlng, attributes){
    //Determine which attribute to visualize with proportional symbols
    var attribute = attributes[0];
    //create marker options
    var options = {
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //build popup content string
    var popupContent = "<p><b>City:</b> " + feature.properties.name + "</p>";

    //add formatted attribute to popup content string
    var year = attribute;
    popupContent += "<p><b>Murder Rate (per 100,000 people) in " + year + ":</b> " + feature.properties[attribute]+"</p>";
    //bind the popup to the circle marker
    layer.bindPopup(popupContent);

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

function createSequenceControls(map, attributes){
        var SequenceControl = L.Control.extend({
            options:{
                position: 'bottomleft'
            },
            onAdd: function(map){
                var container = L.DomUtil.create('div', 'sequence-control-container');
                $(container).append('<input class="range-slider" type="range">');

                $(container).append('<button class="skip" id="reverse" title="Reverse">Reverse</button>');
                $(container).append('<button class="skip" id="forward" title="Forward">Skip</button>');
                $(container).on('mousedown dbclick', function(e){

                            L.DomEvent.stopPropagation(e);
                        });

                return container;
            }
        });
        map.addControl(new SequenceControl());
                $('.range-slider').attr({
                    max: 6,
                    min: 0,
                    value: 0,
                    step: 1
                });

                        $('.skip').click(function(){
                            //get the old index value
                            var index = $('.range-slider').val();

                            if ($(this).attr('id') == 'forward'){
                                index++;
                                index = index > 6 ? 0 : index;
                            } else if ($(this).attr('id') == 'reverse'){
                                index--;
                                index = index < 0 ? 6 : index;
                            };

                            $('.range-slider').val(index);
                            updatePropSymbols(map, attributes[index]);
                        });

                $('.range-slider').on('input', function(){
                    var index = $(this).val();
                    updatePropSymbols(map, attributes[index]);
                });

};


function populateTable(data){
    var tablePop = [];
    for (var i=0; i<15; i++){
        var place = data.features[i].properties;
        tablePop.push(place);
    }
    return tablePop;
}

function processData(data){
    //empty array to hold attributes
    var attributes = [];
    //properties of the first feature in the dataset
    var properties = data.features[0].properties;
    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("20") > -1){
            attributes.push(attribute);
        };
    };

    return attributes;
};

function updatePropSymbols(map, attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
        	if (layer.feature && layer.feature.properties[attribute]){
    	            //access feature properties
    	            var props = layer.feature.properties;

    	            //update each feature's radius based on new attribute values
    	            var radius = calcPropRadius(props[attribute]);
    	            layer.setRadius(radius);

    	            //add city to popup content string
    	            var popupContent = "<p><b>City:</b> " + props.name + "</p>";

    	            popupContent += "<p><b>Murder Rate (per 100,000 people) in " + attribute + ":</b> " + props[attribute] + "</p>";

    	            //replace the layer popup
    	            layer.bindPopup(popupContent, {
    	                offset: new L.Point(0,-radius)
                });
            };
        };
    });updateLegend(map,attribute);
};

function createLegend(map, attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

            //add temporal legend div to container
            $(container).append('<div id="temporal-legend">')

            var svg = '<svg id="attribute-legend" width="170px" height="60px">';

            //array of circle names to base loop on
            var circles = {max:20, mean:40, min:60};

        for (var circle in circles){
            //circle string
            svg += '<circle class="legend-circle" id="' + circle + '" fill="#F47821" fill-opacity="0.8" stroke="#000000" cx="30"/>';

            //text string
            svg += '<text id="' + circle + '-text" x="65" y="' + circles[circle] + '"></text>';
        };

            //close svg string
            svg += "</svg>";

            //add attribute legend svg to container
            $(container).append(svg);

            return container;
        }
    });

    map.addControl(new LegendControl());
    updateLegend(map, attributes[0]);
};

function updateLegend(map, attribute){
    //create content for legend
    var year = attribute.split("_")[1];
    var content = "Murder Rate in " + attribute;

    //replace legend content
    $('#temporal-legend').html(content);

    var circleValues = getCircleValues(map, attribute);

    for (var key in circleValues){
        //get the radius
        var radius = calcPropRadius(circleValues[key]);

        $('#'+key).attr({
            cy: 59 - radius,
            r: radius
        });

        $('#'+key+'-text').text(Math.round(circleValues[key]*100)/100 + " Murder Rate");
    };

};

function getCircleValues(map, attribute){
    //start with min at highest possible and max at lowest possible number
    var min = Infinity,
        max = -Infinity;

    map.eachLayer(function(layer){
        //get the attribute value
        if (layer.feature){
            var attributeValue = Number(layer.feature.properties[attribute]);

            //test for min
            if (attributeValue < min){
                min = attributeValue;
            };

            //test for max
            if (attributeValue > max){
                max = attributeValue;
            };
        };
    });

    //set mean
    var mean = (max + min) / 2;

    //return values as an object
    return {
        max: max,
        mean: mean,
        min: min
    };
};

$(document).ready(createMap);
