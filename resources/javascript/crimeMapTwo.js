console.log("Javascript linked!");
var areaFill;
var areaOutlines;
var map;
var view;
var graphicsLayer;
var heatMap;
var crimeData;
require([
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/layers/CSVLayer",
  "esri/layers/GraphicsLayer",
  "esri/Graphic"
], function (Map, MapView, FeatureLayer, CSVLayer, GraphicsLayer, Graphic) {
  var areaUrl = "https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/LAPD_Division/FeatureServer/0/query?where=APREC%20%3D%20'MISSION'&outFields=*&outSR=4326&f=json"
  //var crimeDataUrl = "https://services9.arcgis.com/2ynJbr9BE17vXxR8/arcgis/rest/services/arrest_data_from_2010_to_2019/FeatureServer"
  var crimeDataUrl = "https://services9.arcgis.com/2ynJbr9BE17vXxR8/arcgis/rest/services/crimemaptwofixed/FeatureServer"

  var trailheadsLabels = {
    symbol: {
      type: "text",
      color: "#3d6da2",
      haloColor: "#FFFFFF",
      haloSize: "0.5px",
      font: {
        size: "10px",
        family: "Noto Sans",
        weight: "bold"
      }
    },
    labelPlacement: "always-horizontal",
    labelExpressionInfo: {
      expression: "$feature.APREC"
    }
  };

  map = new Map({
    //basemap: "topo-vector"
    basemap: "gray-vector"
  });

  view = new MapView({
    container: "viewDiv",
    map: map,
    center: [-118.2437, 34.0522], // longitude, latitude
    zoom: 9.5
  });

  areaOutlines = new FeatureLayer({
    url: areaUrl,
    renderer: {
      type: "simple",
      symbol: {
        type: "simple-line",
        color: "#FFC300",
        width: "2px",
      }
    },
    id: "outline"

  });

  areaFill = new FeatureLayer({
    url: areaUrl,
    renderer: {
      type: "simple",
      symbol: {
        type: "simple-fill",
        color: "#571845",
      }
    },
    opacity: 0,
    outFields: ["*"], //Put all fields as outfields
    popupTemplate: {  // Enable a popup
      title: "{APREC}", // Show attribute value
      content: "PREC: {PREC} </br> Area: {AREA} miles squared"  // Display in pop-up
    },
    labelingInfo: [trailheadsLabels],
    id: "fill"
  });

  const colors = ["#4e4400", "#7a6a00", "#a79100", "#d3b700", "#ffdd00"];
  const heatMapColors = ["#d9351a", "#ffc730", "#144d59", "#2c6954", "#ed9310", "#8c213f", "#102432", "#a64f1b", "#18382e", "#661510", "#b31515", "#4a0932"];
  heatMap = new FeatureLayer({
    url: crimeDataUrl,
    renderer: {
      type: "heatmap",
      colorStops: [
        { color: "rgba(63, 40, 102, 0)", ratio: 0 },
        { color: "#4e4400", ratio: 0.2 },
        { color: "#7a6a00", ratio: 0.4},
        { color: "#a79100", ratio: 0.6},
        { color: "#d3b700", ratio: 0.8},
        { color: "#ffdd00", ratio: 1 }
      ],
      maxPixelIntensity: 25,
      minPixelIntensity: 0
    },
  });

  graphicsLayer = new GraphicsLayer({
    opacity: 0.75
  });


  map.add(areaFill);
  //areaFill.definitionExpression = `APREC = 'Pacific'`
  map.add(areaOutlines);
  map.add(graphicsLayer);

  //var zoomWidget = new Zoom({
  //  view: view
  //});

  const template = {
    title: "1",
    content: "Magnitude hit on."
  };

  //view.ui.add(zoomWidget, "top-right");
  view.ui.move("zoom", "bottom-right");

  //const foo = new CSVLayer("Arrest_Data_from_2010_to_2019.csv", {fields: [{name: "LON", type: "double"}, {name: "LAT", type: "double"}]});

  crimeData = new FeatureLayer(crimeDataUrl);

  //map.add(crimeData)
  /*
  var sum;
  var query = crimeData.createQuery();
  var sumPopulation = {
    onStatisticField: "AREA",  // service field for 2015 population
    outStatisticFieldName: "AREA_sum",
    statisticType: "sum"
  };
  query.where = "'STATUS' = 'AO'";
  query.outStatistics = [sumPopulation]
  sum = query.count;
  crimeData.queryFeatures(query).then(function(response){
    console.log(response.features[0].attributes.AREA_sum);
 });*/

  /*
  var countStatDef = new StatisticDefinition();
  countStatDef.statisticType = "count";
  countStatDef.onStatisticField = "'AREA' = '03'";
  countStatDef.outStatisticFieldName = "numBlockGroups";*/


  var currentStartDate = '01/01/2020';
  var currentEndDate = '09/30/2020';
  var currentCrimeType = '';
  heatMap.definitionExpression = `Date_Rptd > '${currentStartDate}' AND Date_Rptd < '${currentEndDate}'`;
  createAreaMap();


  function createAreaMap() {
    var crimeCount = {
      onStatisticField: "Area_Name",  // service field for 2015 population
      outStatisticFieldName: "areaCount",
      statisticType: "count"
    };
  
    var getAreaName = {
      onStatisticField: "Area_Name",  // service field for 2015 population
      outStatisticFieldName: "name",
      statisticType: "max"
    };

    var areaNames = ["77th Street", "Central", "Southwest", "Pacific", "Southeast", "Newton", "Hollywood", "Olympic", "Wilshire", "Rampart", "Van Nuys", "Harbor", "Northeast", "Mission", "Topanga", "West Valley", "Hollenbeck", "Devonshire", "Foothill", "West LA", "N Hollywood"];
    var areaDict = {};
    var index = 0;
    var max = 0;
    var min = 0;

    for (areaName of areaNames) {
      var query = crimeData.createQuery();
      query.where = `AREA_NAME = '${areaName}' AND Date_Rptd > '${currentStartDate}' AND Date_Rptd < '${currentEndDate}'` + currentCrimeType;
      query.outStatistics = [crimeCount, getAreaName];

      var total = 0;
      crimeData.queryFeatures(query).then(function (response) {
        var stats = response.features[0].attributes;
        var name = stats.name;
        if (name == "West LA") { name = "West Los Angeles" };
        if (name == "N Hollywood") { name = "North Hollywood" };
        areaDict[name] = stats.areaCount;
        if (max == 0) {
          max = stats.areaCount;
          min = stats.areaCount;
        } else {
          if (stats.areaCount > max) { max = stats.areaCount; }
          if (stats.areaCount < min) { min = stats.areaCount; }
        }
        index++;
        total += stats.areaCount;
        if (index == 21) {
          console.log(total, "total")
          document.querySelector("#totalCount").innerHTML = `Total Crime Count: ${total}`;
          areaNames.splice(19, 2, 'West Los Angeles', 'North Hollywood');
          createGraphics(max, min, areaDict, areaNames);
        }
      });
    }
  }

  function wee() {
    console.log("wee");
  }

  var areaFillView;

  view.whenLayerView(areaFill).then(function (layerView) {
    areaFillView = layerView;
    //areaFillView.filter = {where: "APREC = 'PACIFIC'"};

    /*areaFillView.effect = {
      filter: {
        where: "APREC = 'PACIFIC'"
      },
      //includedEffect: "color(#FFFFFF)",
      excludedLabelsVisible: "true"
    }
    console.log(areaFill.fields[0].name)*/
  });

  //crimeData.filter = {where: "APREC = 'PACIFIC'"};

  //Print 
  /*
  featureLayer.when(() => {
   console.log(featureLayer);
   console.log(featureLayer.fields);
 });*/

  //layer.labelingInfo = [];

  //console.log(foo.load().toJson())
  //map.add(layer)


  function createGraphics(max, min, areaDict, areaNames) {
    console.log("foo")
    //If any area has no values
    for (area of areaNames) {
      if (!areaDict.hasOwnProperty(area)) {
        areaDict[area] = 0;
      }
    }
    var difference = max - min;
    var sectionSize = Math.round(difference / 5);
    var upperBoundArray = [];
    var currentBound = min;
    var colorDict = {}
    for (var i = 0; i < 5; i++) {
      currentBound += sectionSize;
      upperBoundArray.push(currentBound);

      if (i == 0) { document.querySelector("#rangeOneNumbers").innerHTML = `< ${currentBound}`; }
      else if (i == 1) { document.querySelector("#rangeTwoNumbers").innerHTML = `${currentBound} - ${currentBound - sectionSize}`; }
      else if (i == 2) { document.querySelector("#rangeThreeNumbers").innerHTML = `${currentBound} - ${currentBound - sectionSize}`; }
      else if (i == 3) { document.querySelector("#rangeFourNumbers").innerHTML = `${currentBound} - ${currentBound - sectionSize}`; }
      else { document.querySelector("#rangeFiveNumbers").innerHTML = `> ${currentBound - sectionSize}`; }
    }
    if (max < 5){
      document.querySelector("#rangeOneNumbers").innerHTML = `< 0`; 
      document.querySelector("#rangeTwoNumbers").innerHTML = `< 0`; 
      document.querySelector("#rangeThreeNumbers").innerHTML = `< 0`; 
      document.querySelector("#rangeFourNumbers").innerHTML = `< 0`; 
      document.querySelector("#rangeFiveNumbers").innerHTML = `>= 1`; 
      upperBoundArray = [1,1,1,1,1]
    }

    //map.removeAll();
    //console.log(map.findLayerById("fill").renderer.symbol.color)
    graphicsLayer.removeAll();


    for (key in areaDict) {
      if (key === 'null') {
        continue;
      }
      //Getting color
      //const colors = [ "#3a4d6b", "#3d6da2", "#799a96", "#ccbe6a", "#ffec99" ];
      const colors = ["#4e4400", "#7a6a00", "#a79100", "#d3b700", "#ffdd00"];
      var color;
      var count = areaDict[key];
      if (count < upperBoundArray[0]) { color = colors[4] }
      else if (count < upperBoundArray[1]) { color = colors[3] }
      else if (count < upperBoundArray[2]) { color = colors[2] }
      else if (count < upperBoundArray[3]) { color = colors[1] }
      else { color = colors[0] }
      colorDict[key.toUpperCase()] = color;

      var geoQuery = {
        where: `APREC = '${key}'`,
        returnGeometry: true,
      }

      areaFill.queryFeatures(geoQuery).then(function (result) {
        var geo = result.features[0].geometry;
        var graphic = new Graphic({
          geometry: geo,
          symbol: {
            type: "simple-fill",
            color: colorDict[result.features[0].attributes.APREC]
          },
        });
        graphicsLayer.add(graphic);

      });
      //console.log(colorDict);

      /*var areaGeometry = new FeatureLayer({
        url: "https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/LAPD_Division/FeatureServer/0/query?where=APREC%20%3D%20'MISSION'&outFields=*&outSR=4326&f=json",
        definitionExpression: `APREC = '${key}'`,
        
        renderer:{
          type: "simple",
          symbol: {
            type: "simple-fill",
            color: color,
            }
          },
        outFields: ["*"], //Put all fields as outfields
        popupTemplate: {  // Enable a popup
          title: "{APREC}", // Show attribute value
          content: "PREC: {PREC} </br> Area: {AREA} miles squared"  // Display in pop-up
        },
        opacity: 0.5,
        labelingInfo: [trailheadsLabels]
      });

      map.add(areaGeometry);*/
    }
    //map.add(areaOutlines);
    //JSON.stringify(map.layers, null, 4);
  }


  /////CRIME TYPE INTERACTION/////
  //Display Crime Options - Function that creates interaction with showing crime type options/arrow movement
  var displayCrimeType = false;
  document.querySelector("#crimeHeaderWrapper").addEventListener("click", () => {
    var crimeForm = document.querySelector("#crimeOptions");
    if (displayCrimeType) {
      crimeForm.style.height = "0px";
      crimeForm.style.opacity = "0%";
      document.querySelector("#crimeArrow").style.transform = "rotateZ(180deg)";
      displayCrimeType = false;
    } else {
      crimeForm.style.height = "270px"; //260
      crimeForm.style.opacity = "100%";
      crimeForm.style.transform = "translateY(0)";
      displayCrimeType = true;
      document.querySelector("#crimeArrow").style.transform = "rotateZ(270deg)";
    }
  });


  //Attach click function to radio elements
  var crimeTypeSelection = document.getElementsByName("crimeType");
  for (let i = 0; i < crimeTypeSelection.length; i++) {
    crimeTypeSelection[i].addEventListener("click", crimeSelectionChange);
  }

  //Change of crime type
  function crimeSelectionChange(event) {
    document.querySelector("#crimeSelected").innerHTML = event.target.value;
    var crimeType = event.target.value;
    if (crimeType == "all"){currentCrimeType = '';}
    else{
      if(crimeType == "assault"){currentCrimeType = " AND Charge_Type = 'Assault'";}
      if(crimeType == "domestic"){currentCrimeType = " AND Charge_Type = 'Domestic'";}
      if(crimeType == "fraud"){currentCrimeType = " AND Charge_Type = 'Fraud/Money'";}
      if(crimeType == "homicide"){currentCrimeType = " AND Charge_Type = 'Homicide'";}
      if(crimeType == "kidnapping"){currentCrimeType = " AND Charge_Type = 'Kidnapping'";}
      if(crimeType == "miscellaneous"){currentCrimeType = " AND Charge_Type = 'Misc'";}
      if(crimeType == "property"){currentCrimeType = " AND Charge_Type = 'Property Related'";}
      if(crimeType == "sexual acts"){currentCrimeType = " AND Charge_Type = 'Sex Related'";}
      if(crimeType == "sexual assault"){currentCrimeType = " AND Charge_Type = 'Sexual Assault'";}
      if(crimeType == "theft"){currentCrimeType = " AND Charge_Type = 'Theft'";}
    }
    if(currentMapType == "heat"){
      heatMap.definitionExpression = `Date_Rptd > '${currentStartDate}' AND Date_Rptd < '${currentEndDate}' ${currentCrimeType}`;
    }
    else{
      createAreaMap();
    }
  }


  ////LEGEND INTERACTION//////
  //Display Legend - Function that creates interaction with showing legend/arrow movement
  var displayLegend = true;
  document.querySelector("#legendHeaderWrapper").addEventListener("click", () => {
    var legend = document.querySelector("#legendContent");
    if (displayLegend) {
      legend.style.height = "0px";
      legend.style.opacity = "0%";
      document.querySelector("#legendArrow").style.transform = "rotateZ(180deg)";
      displayLegend = false;
    } else {
      legend.style.height = "180px";
      legend.style.opacity = "100%";
      legend.style.transform = "translateY(0)";
      displayLegend = true;
      document.querySelector("#legendArrow").style.transform = "rotateZ(270deg)";
    }
  });

  ////MAP TYPE INTERACTION//////////
  var displayMapType = false;
  document.querySelector("#mapTypeHeaderWrapper").addEventListener("click", () => {
    var mapOptions = document.querySelector("#mapOptions");
    if (displayMapType) {
      mapOptions.style.height = "0px";
      mapOptions.style.opacity = "0%";
      document.querySelector("#mapTypeArrow").style.transform = "rotateZ(180deg)";
      displayMapType = false;
    } else {
      mapOptions.style.height = "70px"; //260
      mapOptions.style.opacity = "100%";
      mapOptions.style.transform = "translateY(0)";
      displayMapType = true;
      document.querySelector("#mapTypeArrow").style.transform = "rotateZ(270deg)";
    }
  });

  //Attach click function to radio elements
  var mapTypeSelection = document.getElementsByName("mapType");
  for (let i = 0; i < mapTypeSelection.length; i++) {
    mapTypeSelection[i].addEventListener("click", mapSelectionChange);
  }

  //Change of map type
  var currentMapType = 'area';
  function mapSelectionChange(event) {
    var mapType = event.target.value;
    document.querySelector("#mapTypeSelected").innerHTML = mapType;
    map.removeAll();
    if (mapType == "Heat Map") {
      heatMap.definitionExpression = `Date_Rptd > '${currentStartDate}' AND Date_Rptd < '${currentEndDate}' ${currentCrimeType}`;
      map.add(heatMap);
      currentMapType = "heat";

      document.querySelector("#totalCount").innerHTML = "Heat Map Range:"
      document.querySelector("#rangeOneNumbers").innerHTML = `Sparse`; 
      document.querySelector("#rangeTwoNumbers").innerHTML = ``; 
      document.querySelector("#rangeThreeNumbers").innerHTML = ``; 
      document.querySelector("#rangeFourNumbers").innerHTML = ``; 
      document.querySelector("#rangeFiveNumbers").innerHTML = `Dense`; 


    } else if (mapType == "Area Map") {
      createAreaMap();
      map.add(areaOutlines);
      map.add(areaFill);
      map.add(graphicsLayer);
      currentMapType = "area";
    }
  }

  ////DATE RANGE INTERACTION//////////
  var displayDateRange = false;
  document.querySelector("#dateHeaderWrapper").addEventListener("click", () => {
    var dateRange = document.querySelector("#dateContent");
    if (displayDateRange) {
      dateRange.style.height = "0px";
      dateRange.style.opacity = "0%";
      document.querySelector("#dateArrow").style.transform = "rotateZ(180deg)";
      displayDateRange = false;
    } else {
      dateRange.style.height = "150px"; //260
      dateRange.style.opacity = "100%";
      dateRange.style.transform = "translateY(0)";
      displayDateRange = true;
      document.querySelector("#dateArrow").style.transform = "rotateZ(270deg)";
    }
  });

  //Attach click function to select elements
  var dateSelection = document.getElementsByTagName("select");
  for (let i = 0; i < dateSelection.length; i++) {
    dateSelection[i].addEventListener("click", dateSelectionChange);
  }

  var startDate = "January 2020";
  var endDate = "September 2020";
  var monthArray = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var yearArray = ["2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020"];
  var startMonthDict = {
    "January": "01/01/", 
    "February": "02/01/", 
    "March": "03/01/", 
    "April": "04/01/", 
    "May": "05/01/", 
    "June": "06/01/", 
    "July": "07/01/", 
    "August": "08/01/",
    "September": "09/01/", 
    "October": "10/01/", 
    "November": "11/01/", 
    "December": "12/01/"
  }
  var endMonthDict =  {
    "January": "01/31/", 
    "February": "02/28/", 
    "March": "03/31/", 
    "April": "04/30/", 
    "May": "05/31/", 
    "June": "06/30/", 
    "July": "07/31/", 
    "August": "08/31/",
    "September": "09/30/", 
    "October": "10/31/", 
    "November": "11/30/", 
    "December": "12/31/"
  }
  function dateSelectionChange(event) {
    var selectArray = document.getElementsByTagName("select");
    var newStartDate = "";
    var newEndDate = "";

    for (var i = 0; i < selectArray.length; i++) {
      var selectionValue = selectArray[i].options[selectArray[i].selectedIndex].text;
      if (i == 0) { newStartDate += selectionValue + " "; } //start month
      else if (i == 1) { newStartDate += selectionValue; }
      else if (i == 2) { newEndDate += selectionValue + " "; } //end month
      else { newEndDate += selectionValue; }
    }
    //Detect if the date has changed
    if (startDate != newStartDate || endDate != newEndDate) {
      startDate = newStartDate;
      endDate = newEndDate;
      var changedClass = event.target.className;
      var startYear = startDate.split(" ")[1];
      var startMonth = startDate.split(" ")[0];
      var endYear = endDate.split(" ")[1];
      var endMonth = endDate.split(" ")[0];


      //Changing Possible Selections based on what new selection is
      //Wipe clean selection options and add new options from arrays above
      //If years are different, we can safely add all months back to selection
      if (startYear != endYear) {
        //Adding all months for start
        selectArray[0].options.length = 0;
        for (month of monthArray) {
          var option = document.createElement("option")
          option.text = month;
          if (month == startMonth) { option.setAttribute('selected', 'selected'); }
          selectArray[0].add(option);
        }
        //Adding all months for End
        selectArray[2].options.length = 0;
        for (month of monthArray) {
          var option = document.createElement("option")
          option.text = month;
          if (month == endMonth) { option.setAttribute('selected', 'selected'); }
          selectArray[2].add(option);
        }

      }

      //If start date changed, need to add options for end date
      //Iterate through arrays until we hit the year/month for start date
      if (changedClass == "startDate") {
        //Adding years to end selection
        selectArray[3].options.length = 0; //set end year selection to empty
        for (var i = 10; i > -1; i--) {
          var option = document.createElement("option")
          option.text = yearArray[i];
          //Check if this is selected option and set it to selected
          if (yearArray[i] == endYear) { option.setAttribute('selected', 'selected'); }
          selectArray[3].add(option, 0);
          if (yearArray[i] == startYear) { break; }
        }

        //Adding Months to end selection if years are the same
        if (startYear == endYear) {
          //Iterate through array, if we hit the start month but haven't hit the end month that was selected
          //Means end month was before start month after change. Set the new end month to the start month
          var selectedAdded = false;
          selectArray[2].options.length = 0;
          for (var i = 11; i > 0; i--) {
            var option = document.createElement("option")
            option.text = monthArray[i];
            if (monthArray[i] == endMonth) { option.setAttribute('selected', 'selected'); selectedAdded = true; }
            if (monthArray[i] == startMonth) {
              if (selectedAdded) { selectArray[2].add(option, 0); }
              else {
                endMonth = startMonth;
                option.setAttribute('selected', 'selected');
                selectArray[2].add(option, 0);
              }
              break;
            } else { selectArray[2].add(option, 0); }
          }

          selectArray[0].options.length = 0;
          for (var i = 0; i < 12; i++) {
            var option = document.createElement("option")
            option.text = monthArray[i];
            if (monthArray[i] == startMonth) { option.setAttribute('selected', 'selected'); }
            selectArray[0].add(option);
            if (monthArray[i] == endMonth) { break; }
          }
        }
      } else {
        //If the end date has changed
        selectArray[1].options.length = 0; //set start year selection to empty
        for (var i = 0; i < 11; i++) {
          var option = document.createElement("option")
          option.text = yearArray[i];
          if (yearArray[i] == startYear) { option.setAttribute('selected', 'selected'); }
          selectArray[1].add(option);
          if (yearArray[i] == endYear) { break; }
        }
        //adding months to start selection
        if (startYear == endYear) {
          var selectedAdded = false;
          selectArray[0].options.length = 0;
          for (var i = 0; i < 12; i++) {
            var option = document.createElement("option")
            option.text = monthArray[i];
            if (monthArray[i] == startMonth) { option.setAttribute('selected', 'selected'); selectedAdded = true; }
            if (monthArray[i] == endMonth) {
              if (selectedAdded) { selectArray[0].add(option); }
              else {
                startMonth = endMonth;
                option.setAttribute('selected', 'selected');
                selectArray[0].add(option);
              }
              break;
            } else { selectArray[0].add(option); }
          }

          selectArray[2].options.length = 0;
          for (var i = 11; i > -1; i--) {
            var option = document.createElement("option")
            option.text = monthArray[i];
            if (monthArray[i] == endMonth) { option.setAttribute('selected', 'selected'); }
            selectArray[2].add(option, 0);
            if (monthArray[i] == startMonth) { break; }
          }
        }
      }
      
      currentStartDate = startMonthDict[startMonth] + startYear;
      currentEndDate = endMonthDict[endMonth] + endYear;

      if(currentMapType == "heat"){
        heatMap.definitionExpression = `Date_Rptd > '${currentStartDate}' AND Date_Rptd < '${currentEndDate}' ${currentCrimeType}`;
      }
      else{
        createAreaMap();
      }


      /*
      console.log(startYear);
      console.log(startMonth);
      console.log(endYear);
      console.log(endMonth);*/
    }
  }


});



//https://data.lacity.org/resource/2nrs-mtv8.csv
/*
var map;




function initMap() {
  map = new google.maps.Map(document.getElementById("viewDiv"), {
    center: { lat: 34.0522, lng: -118.2437 },
    zoom: 10,

    //Control Settings
    zoomControl: true,
    mapTypeControl: false,
    scaleControl: true,
    streetViewControl: false,
    rotateControl: true,
    fullscreenControl: true,

    //Style Set Two
    styles: [
            {elementType: 'geometry', stylers: [{color: '#242f3e'}]},
            {elementType: 'labels.text.stroke', stylers: [{color: '#242f3e'}]},
            {elementType: 'labels.text.fill', stylers: [{color: '#746855'}]},
            {
              featureType: 'administrative.locality',
              elementType: 'labels.text.fill',
              stylers: [{color: '#d59563'}]
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{color: '#38414e'}]
            },
            {
              featureType: 'road',
              elementType: 'geometry.stroke',
              stylers: [{color: '#212a37'}]
            },
            {
              featureType: 'road',
              elementType: 'labels.text.fill',
              stylers: [{color: '#9ca5b3'}],
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry',
              stylers: [{color: '#746855'} ]
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry.stroke',
              stylers: [{color: '#1f2835'}]
            },
            {
              featureType: 'road.highway',
              elementType: 'labels.text.fill',
              stylers: [{visibility: 'off'}]
            },
            {
              featureType: 'transit',
              elementType: 'geometry',
              stylers: [{color: '#2f3948'}]
            },
            {
              featureType: 'transit.station',
              elementType: 'labels.text.fill',
              stylers: [{color: '#d59563'}]
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{color: '#17263c'}]
            },
            {
              featureType: 'water',
              elementType: 'labels.text.fill',
              stylers: [{color: '#515c6d'}]
            },
            {
              featureType: 'water',
              elementType: 'labels.text.stroke',
              stylers: [{color: '#17263c'}]
            },
            {
              "featureType": "road.highway",
            elementType: "labels",
            stylers:[{visibility: "off"}]
            },
            {
              "featureType": "poi",
            stylers:[{visibility: "off"}]
            }
            ],

     Style Set One
    styles: [
            {elementType: 'geometry', stylers: [{color: '#242f3e'}]},
            {elementType: 'labels.text.stroke', stylers: [{color: '#242f3e'}]},
            {elementType: 'labels.text.fill', stylers: [{color: '#746855'}]},
            {
              featureType: 'administrative.locality',
              elementType: 'labels.text.fill',
              stylers: [{color: '#d59563'}]
            },
            {
              featureType: 'poi',
              elementType: 'labels.text.fill',
              stylers: [{"visibility": "off"}]
            },
            {
              featureType: 'poi.park',
              elementType: 'geometry',
              stylers: [{color: '#263c3f'}]
            },
            {
              featureType: 'poi.park',
              elementType: 'labels.text.fill',
              stylers: [ {"visibility": "off"}]
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{color: '#38414e'}]
            },
            {
              featureType: 'road',
              elementType: 'geometry.stroke',
              stylers: [{color: '#212a37'}]
            },
            {
              featureType: 'road',
              elementType: 'labels.text.fill',
              stylers: [{color: '#9ca5b3'}],
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry',
              stylers: [{color: '#746855'} ]
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry.stroke',
              stylers: [{color: '#1f2835'}]
            },
            {
              featureType: 'road.highway',
              elementType: 'labels.text.fill',
              stylers: [{visibility: 'off'}]
            },
            {
              featureType: 'transit',
              elementType: 'geometry',
              stylers: [{color: '#2f3948'}]
            },
            {
              featureType: 'transit.station',
              elementType: 'labels.text.fill',
              stylers: [{color: '#d59563'}]
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{color: '#17263c'}]
            },
            {
              featureType: 'water',
              elementType: 'labels.text.fill',
              stylers: [{color: '#515c6d'}]
            },
            {
              featureType: 'water',
              elementType: 'labels.text.stroke',
              stylers: [{color: '#17263c'}]
            },
            {
              "featureType": "road.highway",
            elementType: "labels",
            stylers:[{visibility: "off"}]
          }
          ]
  });
  });
  var coords = [{lng: -118.50735928314,lat: 34.3346403905959},{lng: -118.503812576348,lat: 34.3373091633768},{lng: -118.495855297834,lat: 34.3325108375691},{lng: -118.492733723482,lat: 34.3306137827955},{lng: -118.484933037394,lat: 34.330310354148},{lng: -118.48100751883,lat: 34.3302404734839},{lng: -118.469317481495,lat: 34.3301107826966},{lng: -118.469135387176,lat: 34.3301087535194},{lng: -118.458144942846,lat: 34.3300164708368},{lng: -118.458063437504,lat: 34.330015782798},{lng: -118.451267970042,lat: 34.3299701811137},{lng: -118.448141053252,lat: 34.3299532774692},{lng: -118.441004509999,lat: 34.3299224441493},{lng: -118.440957667351,lat: 34.329922272051},{lng: -118.429321764145,lat: 34.3298788751267},{lng: -118.429277443691,lat: 34.3298788870127},{lng: -118.419995971447,lat: 34.3298809902565},{lng: -118.420002325369,lat: 34.3291696079809},{lng: -118.419480640064,lat: 34.3291693543302},{lng: -118.419472654943,lat: 34.3298865814634},{lng: -118.419023825881,lat: 34.3298843561508},{lng: -118.418856930108,lat: 34.3296293791245},{lng: -118.418773600539,lat: 34.3295255910649},{lng: -118.418624065697,lat: 34.3294295883889},{lng: -118.418441903642,lat: 34.3294322785426},{lng: -118.418231881149,lat: 34.3294938006088},{lng: -118.418575791131,lat: 34.3290505463073},{lng: -118.419276799387,lat: 34.3281543714858},{lng: -118.419451217549,lat: 34.3279294708565},{lng: -118.419717412961,lat: 34.3278423341517},{lng: -118.42065091985,lat: 34.3277350206505},{lng: -118.42074691177,lat: 34.3277226653503},{lng: -118.420756027683,lat: 34.3255906144717},{lng: -118.419043983082,lat: 34.3256563144442},{lng: -118.417116215347,lat: 34.3249465631433},{lng: -118.416704621324,lat: 34.3247950202421},{lng: -118.415886705489,lat: 34.324497966881},{lng: -118.414353053108,lat: 34.3244671556974},{lng: -118.414340967156,lat: 34.3247011106348},{lng: -118.413603977936,lat: 34.3246916068221},{lng: -118.413597810184,lat: 34.3251175507424},{lng: -118.412199122677,lat: 34.3259257316359},{lng: -118.412454248205,lat: 34.3262786542781},{lng: -118.413587640557,lat: 34.3274079508659},{lng: -118.413599953936,lat: 34.3298906267781},{lng: -118.40520127076,lat: 34.3298228291943},{lng: -118.404903672587,lat: 34.3220826791719},{lng: -118.40272390326,lat: 34.3212982099496},{lng: -118.401533302768,lat: 34.3202768553865},{lng: -118.400676952576,lat: 34.3195422266902},{lng: -118.3962770533,lat: 34.3198806052337},{lng: -118.396290088396,lat: 34.3180934059543},{lng: -118.39652185679,lat: 34.3180806246952},{lng: -118.396540332684,lat: 34.3174389327754},{lng: -118.397550102739,lat: 34.3170220661119},{lng: -118.398295502893,lat: 34.317073544912},{lng: -118.399696733482,lat: 34.3164537467392},{lng: -118.400754921857,lat: 34.3164698294596},{lng: -118.400766493461,lat: 34.3161211526217},{lng: -118.400789540651,lat: 34.3154038779968},{lng: -118.400844597463,lat: 34.3137669843199},{lng: -118.400919464272,lat: 34.3097070741976},{lng: -118.401831052469,lat: 34.3098991534224},{lng: -118.401938141123,lat: 34.3097878523347},{lng: -118.402439062526,lat: 34.309627842386},{lng: -118.40247791808,lat: 34.3094449781199},{lng: -118.403022464159,lat: 34.3094046972248},{lng: -118.403080270658,lat: 34.3097174210572},{lng: -118.403323572334,lat: 34.3100405189248},{lng: -118.403891543252,lat: 34.3100499615344},{lng: -118.404116876237,lat: 34.3090555046791},{lng: -118.403586719146,lat: 34.3089892611604},{lng: -118.40364411375,lat: 34.3088743457676},{lng: -118.403687998253,lat: 34.3087048611773},{lng: -118.403669830469,lat: 34.3083720833733},{lng: -118.403758828712,lat: 34.3079451768617},{lng: -118.405477443428,lat: 34.3079411535872},{lng: -118.405476831638,lat: 34.3074747013828},{lng: -118.405476365865,lat: 34.3073788858042},{lng: -118.405475090138,lat: 34.3071164508979},{lng: -118.405460800334,lat: 34.304517338169},{lng: -118.405516594605,lat: 34.3027121311042},{lng: -118.405586382902,lat: 34.3007210513457},{lng: -118.401048297168,lat: 34.3006880745491},{lng: -118.401219753673,lat: 34.2970956710267},{lng: -118.403459700497,lat: 34.2971064348148},{lng: -118.403543424206,lat: 34.2935380200393},{lng: -118.409084915583,lat: 34.2936935761987},{lng: -118.408983010622,lat: 34.2918167673065},{lng: -118.410211502546,lat: 34.2918548612086},{lng: -118.410371154456,lat: 34.2920040810267},{lng: -118.410315089302,lat: 34.2910387307471},{lng: -118.409394729186,lat: 34.2890211142947},{lng: -118.408248759069,lat: 34.2879096828205},{lng: -118.40754352817,lat: 34.2872402018572},{lng: -118.407900015499,lat: 34.2870019928733},{lng: -118.408154070298,lat: 34.2868259582501},{lng: -118.408313718397,lat: 34.286976898195},{lng: -118.408413515515,lat: 34.2870747985982},{lng: -118.408426824954,lat: 34.2870884931419},{lng: -118.408628055046,lat: 34.2872801663326},{lng: -118.408792696551,lat: 34.2874365845734},{lng: -118.409015577754,lat: 34.2876546324406},{lng: -118.409120350786,lat: 34.2877542328882},{lng: -118.409512842101,lat: 34.2881283371446},{lng: -118.409735725952,lat: 34.288346384588},{lng: -118.410314500466,lat: 34.2888994989154},{lng: -118.411295703244,lat: 34.289822896954},{lng: -118.413236409609,lat: 34.2916484247265},{lng: -118.414444007691,lat: 34.2927843519416},{lng: -118.415672340689,lat: 34.293939747677},{lng: -118.415805070687,lat: 34.2938431214396},{lng: -118.416683332301,lat: 34.2946819885011},{lng: -118.417278754608,lat: 34.295235699462},{lng: -118.417959037562,lat: 34.295873955692},{lng: -118.418253548016,lat: 34.2961545135243},{lng: -118.418413153101,lat: 34.2963065546935},{lng: -118.418577784235,lat: 34.2964536856392},{lng: -118.421411434199,lat: 34.2943784742561},{lng: -118.423490704256,lat: 34.2963404298364},{lng: -118.42640348621,lat: 34.2990835994401},{lng: -118.429356383115,lat: 34.3018636528524},{lng: -118.431601625366,lat: 34.3038320948777},{lng: -118.432582906327,lat: 34.3046910893794},{lng: -118.432867998811,lat: 34.304436519656},{lng: -118.433644221147,lat: 34.3037433931991},{lng: -118.436613810415,lat: 34.3010940602354},{lng: -118.438762622358,lat: 34.2991799438826},{lng: -118.438812261098,lat: 34.2991356797311},{lng: -118.441291953223,lat: 34.2969243509244},{lng: -118.441797586328,lat: 34.2964716986609},{lng: -118.442458508805,lat: 34.2958800169642},{lng: -118.443486036865,lat: 34.295158370854},{lng: -118.443577305477,lat: 34.2948880555615},{lng: -118.444709212594,lat: 34.2938761142617},{lng: -118.445058532716,lat: 34.2941904958354},{lng: -118.445412775876,lat: 34.2944962711475},{lng: -118.447071950182,lat: 34.2930282767076},{lng: -118.448828822606,lat: 34.2914640275918},{lng: -118.448941896625,lat: 34.2913633483445},{lng: -118.450014423027,lat: 34.2904116871757},{lng: -118.449454402375,lat: 34.2897034353051},{lng: -118.449845177569,lat: 34.2894168898351},{lng: -118.450488233322,lat: 34.2889480441164},{lng: -118.451165896359,lat: 34.2884519306044},{lng: -118.451649008412,lat: 34.2881008032744},{lng: -118.456019840794,lat: 34.28491025881},{lng: -118.455179627361,lat: 34.2841209957159},{lng: -118.454495760954,lat: 34.2834675033629},{lng: -118.453344469971,lat: 34.2823874303769},{lng: -118.452522574403,lat: 34.2816094145654},{lng: -118.452360477835,lat: 34.2814520750434},{lng: -118.45224302991,lat: 34.2813380732428},{lng: -118.451981862436,lat: 34.2810975773699},{lng: -118.451595864133,lat: 34.2807290817115},{lng: -118.451005288614,lat: 34.2801765512526},{lng: -118.450171768509,lat: 34.2793831060177},{lng: -118.449747579751,lat: 34.2789889850057},{lng: -118.449238487368,lat: 34.2785027796941},{lng: -118.448691167615,lat: 34.2779858001394},{lng: -118.448223711745,lat: 34.2775454634839},{lng: -118.447483452991,lat: 34.2768495482609},{lng: -118.447003774578,lat: 34.276395991363},{lng: -118.446525264951,lat: 34.2759435317538},{lng: -118.445044786151,lat: 34.2745461811931},{lng: -118.44382047848,lat: 34.2733831630213},{lng: -118.443426451323,lat: 34.2736703873292},{lng: -118.442823049957,lat: 34.2741119155496},{lng: -118.442161913006,lat: 34.2745907481083},{lng: -118.441538723339,lat: 34.2750484859883},{lng: -118.440879226638,lat: 34.2755273054994},{lng: -118.440618735642,lat: 34.2757188894909},{lng: -118.440191697765,lat: 34.2760275203493},{lng: -118.439608066857,lat: 34.2764583115525},{lng: -118.43938547119,lat: 34.2766181545419},{lng: -118.438973290854,lat: 34.2769212304684},{lng: -118.438503374845,lat: 34.2772616114942},{lng: -118.438140648695,lat: 34.2775277533291},{lng: -118.437637764631,lat: 34.2778950421801},{lng: -118.437002936899,lat: 34.2783524550813},{lng: -118.436457175421,lat: 34.2787514944537},{lng: -118.435599781113,lat: 34.279379384145},{lng: -118.434195860547,lat: 34.2780396752125},{lng: -118.433803720586,lat: 34.2776908672337},{lng: -118.433932610162,lat: 34.2775925379904},{lng: -118.433764245693,lat: 34.2774324888596},{lng: -118.433940452849,lat: 34.2772962922583},{lng: -118.434185702465,lat: 34.2770932989763},{lng: -118.434528277264,lat: 34.2767948310286},{lng: -118.434927158629,lat: 34.2763594812024},{lng: -118.435283516302,lat: 34.2759293288292},{lng: -118.435530970699,lat: 34.2755954322693},{lng: -118.435772081389,lat: 34.2752111034126},{lng: -118.436061153107,lat: 34.2747004616624},{lng: -118.4366330758,lat: 34.2736539707124},{lng: -118.437042289357,lat: 34.2728754797325},{lng: -118.437553940794,lat: 34.2719301128864},{lng: -118.438354544175,lat: 34.2704589609473},{lng: -118.438797532526,lat: 34.2695952552492},{lng: -118.439391999905,lat: 34.2684841613941},{lng: -118.439804838892,lat: 34.2677814193071},{lng: -118.440270811181,lat: 34.2670658691428},{lng: -118.44053477899,lat: 34.2667012750001},{lng: -118.440642082767,lat: 34.2665530654731},{lng: -118.440999163632,lat: 34.2660768021266},{lng: -118.441383870938,lat: 34.26558028399},{lng: -118.441842372029,lat: 34.2650399600002},{lng: -118.44207392535,lat: 34.264756315434},{lng: -118.441490713977,lat: 34.2638194320268},{lng: -118.441172625153,lat: 34.2633106486075},{lng: -118.440879730357,lat: 34.2628569008305},{lng: -118.440728989141,lat: 34.2626024782043},{lng: -118.440578248844,lat: 34.2623480553893},{lng: -118.440344003269,lat: 34.2619974597469},{lng: -118.440118204916,lat: 34.2616743984063},{lng: -118.439800786278,lat: 34.2612896490437},{lng: -118.439291394244,lat: 34.2606988609824},{lng: -118.438957637318,lat: 34.2603624064631},{lng: -118.438490622182,lat: 34.2599368496406},{lng: -118.438273751442,lat: 34.2597309012443},{lng: -118.435012438925,lat: 34.2566905924495},{lng: -118.42930479483,lat: 34.2512659074658},{lng: -118.428721961079,lat: 34.2507159825528},{lng: -118.425568867357,lat: 34.2477407539894},{lng: -118.422083384775,lat: 34.2444338375232},{lng: -118.420356792846,lat: 34.2428181477991},{lng: -118.418787179659,lat: 34.2413408943086},{lng: -118.417284893683,lat: 34.2399282560228},{lng: -118.416117876388,lat: 34.23879992186},{lng: -118.41466151335,lat: 34.2374398577299},{lng: -118.413294221645,lat: 34.2362213111101},{lng: -118.4120838579,lat: 34.2351412177198},{lng: -118.411501116725,lat: 34.2346242570516},{lng: -118.410951489802,lat: 34.234033046771},{lng: -118.410394623296,lat: 34.2334319443521},{lng: -118.410241957131,lat: 34.2329915015775},{lng: -118.410064680835,lat: 34.2324800494053},{lng: -118.409896982336,lat: 34.2320335726571},{lng: -118.409824298621,lat: 34.2317031048464},{lng: -118.409784668589,lat: 34.2314285015833},{lng: -118.409741988783,lat: 34.2309993074513},{lng: -118.40974030127,lat: 34.2306554610807},{lng: -118.409788057025,lat: 34.2303441965749},{lng: -118.409825635539,lat: 34.229967469762},{lng: -118.409932088048,lat: 34.2295659490479},{lng: -118.410184696824,lat: 34.22882008174},{lng: -118.410532786665,lat: 34.2279143402824},{lng: -118.41067115498,lat: 34.2275248967103},{lng: -118.410826598952,lat: 34.227065899929},{lng: -118.410894263302,lat: 34.2267955017167},{lng: -118.410951868593,lat: 34.2264842023776},{lng: -118.410999254744,lat: 34.2260992558947},{lng: -118.411007620708,lat: 34.2257963106175},{lng: -118.411006048993,lat: 34.2254770253534},{lng: -118.410984764416,lat: 34.2251578070402},{lng: -118.410963964638,lat: 34.2249368304086},{lng: -118.410933550882,lat: 34.2247650076365},{lng: -118.410913214679,lat: 34.2246381788687},{lng: -118.410892777822,lat: 34.2244908846188},{lng: -118.410872542461,lat: 34.2243845222241},{lng: -118.410120100602,lat: 34.2216894792734},{lng: -118.410059480085,lat: 34.2213867678583},{lng: -118.409818486953,lat: 34.2204788346206},{lng: -118.409648336638,lat: 34.2198610105163},{lng: -118.410243514548,lat: 34.2198727732417},{lng: -118.410699736711,lat: 34.2198711138475},{lng: -118.412997097815,lat: 34.2198701642875},{lng: -118.414394699722,lat: 34.2198695079139},{lng: -118.415420160006,lat: 34.2198690831153},{lng: -118.416688230896,lat: 34.2198685113069},{lng: -118.416799569623,lat: 34.2198684614199},{lng: -118.420211663789,lat: 34.2198587212309},{lng: -118.420689655068,lat: 34.2198574038476},{lng: -118.422737241297,lat: 34.2198512982183},{lng: -118.423121036759,lat: 34.2198577100216},{lng: -118.423299669902,lat: 34.2192142241063},{lng: -118.423846058989,lat: 34.2173739692992},{lng: -118.424086508434,lat: 34.2165212790194},{lng: -118.424410999327,lat: 34.2152835888473},{lng: -118.424687108554,lat: 34.2142906289341},{lng: -118.424963408077,lat: 34.213336139065},{lng: -118.425178087332,lat: 34.2126236803521},{lng: -118.42545125017,lat: 34.211704922927},{lng: -118.42559748532,lat: 34.2111933000992},{lng: -118.425876945562,lat: 34.2102140650358},{lng: -118.425997038085,lat: 34.2097657352062},{lng: -118.42624068098,lat: 34.2088992897898},{lng: -118.426364204437,lat: 34.2084756794115},{lng: -118.426702392253,lat: 34.2073423535321},{lng: -118.427028456748,lat: 34.2073971913731},{lng: -118.429822874655,lat: 34.2079664149116},{lng: -118.429940407825,lat: 34.2079893543737},{lng: -118.430963449899,lat: 34.2081894028746},{lng: -118.431138884754,lat: 34.2082162567479},{lng: -118.4313805206,lat: 34.2082528354503},{lng: -118.431717492597,lat: 34.2083174575778},{lng: -118.431804299127,lat: 34.2083341039429},{lng: -118.432090718007,lat: 34.2083962828699},{lng: -118.432410278463,lat: 34.208471052575},{lng: -118.432608946432,lat: 34.2085132781711},{lng: -118.434088833756,lat: 34.2087896364295},{lng: -118.435277429001,lat: 34.2090199682076},{lng: -118.435591974393,lat: 34.2090834116158},{lng: -118.436159832766,lat: 34.2092019295792},{lng: -118.436928051007,lat: 34.2093688409531},{lng: -118.437593578839,lat: 34.2095052042304},{lng: -118.437891556255,lat: 34.2095621753519},{lng: -118.438590104212,lat: 34.209687422078},{lng: -118.438818556303,lat: 34.209731590446},{lng: -118.439586747846,lat: 34.2098912718554},{lng: -118.439851621325,lat: 34.2099425191595},{lng: -118.439999950438,lat: 34.2099685887607},{lng: -118.440364767702,lat: 34.2100327069391},{lng: -118.440806764262,lat: 34.2101155950866},{lng: -118.4409905204,lat: 34.2101509915465},{lng: -118.441319979901,lat: 34.2102184884736},{lng: -118.443563270432,lat: 34.2106733058956},{lng: -118.446670743717,lat: 34.2112914855504},{lng: -118.448419030908,lat: 34.2116398412715},{lng: -118.448783288798,lat: 34.2117178361295},{lng: -118.449140923784,lat: 34.2117944805323},{lng: -118.449813033085,lat: 34.2119170128399},{lng: -118.450508345829,lat: 34.2120526725023},{lng: -118.45255299623,lat: 34.2124515671702},{lng: -118.453961912489,lat: 34.2127293222283},{lng: -118.458104326276,lat: 34.2135538796574},{lng: -118.458323257278,lat: 34.2135982438584},{lng: -118.458355836532,lat: 34.213604845033},{lng: -118.458437120652,lat: 34.2136213165478},{lng: -118.460046259352,lat: 34.2139109520315},{lng: -118.460349256578,lat: 34.2139730011753},{lng: -118.461682079296,lat: 34.2142382479059},{lng: -118.462359234607,lat: 34.2143692785807},{lng: -118.463960191317,lat: 34.2146695414774},{lng: -118.464466827099,lat: 34.214768582866},{lng: -118.465248351272,lat: 34.2149294235688},{lng: -118.465791464695,lat: 34.2150444630407},{lng: -118.466106061707,lat: 34.2151088584549},{lng: -118.466399131293,lat: 34.2151685263169},{lng: -118.467718751897,lat: 34.2154320392496},{lng: -118.468253539185,lat: 34.2155357657124},{lng: -118.469207184731,lat: 34.2157148064617},{lng: -118.470751952888,lat: 34.2160138236148},{lng: -118.472709082313,lat: 34.216406013223},{lng: -118.473134606004,lat: 34.216488847877},{lng: -118.473246648002,lat: 34.2165106200718},{lng: -118.473188664368,lat: 34.2213919570992},{lng: -118.473154279924,lat: 34.2231969031075},{lng: -118.473139608639,lat: 34.2245242339974},{lng: -118.473124571278,lat: 34.2257870448402},{lng: -118.473112738939,lat: 34.2283205999551},{lng: -118.473083574979,lat: 34.2310091390324},{lng: -118.473088433726,lat: 34.2318665844191},{lng: -118.473088089208,lat: 34.2319586438901},{lng: -118.473084924867,lat: 34.232804679182},{lng: -118.473080088104,lat: 34.2335082586444},{lng: -118.473047632496,lat: 34.235566972524},{lng: -118.473055111873,lat: 34.2368869133316},{lng: -118.473061341125,lat: 34.2379862033293},{lng: -118.47302083279,lat: 34.2386239636629},{lng: -118.473023179176,lat: 34.2405953894874},{lng: -118.472991721594,lat: 34.2428307832446},{lng: -118.472941407632,lat: 34.2448537169294},{lng: -118.47291858722,lat: 34.2454987366812},{lng: -118.472920580191,lat: 34.2458505091311},{lng: -118.472895433225,lat: 34.2460851278375},{lng: -118.472852719403,lat: 34.2463344724108},{lng: -118.472800973959,lat: 34.2465472082276},{lng: -118.472758052088,lat: 34.2467599104604},{lng: -118.472715088492,lat: 34.2469652833147},{lng: -118.472619879238,lat: 34.2472954485577},{lng: -118.472507682975,lat: 34.2477429407086},{lng: -118.472455977264,lat: 34.2479630057373},{lng: -118.472396316106,lat: 34.2483370046775},{lng: -118.472336405596,lat: 34.2486670328196},{lng: -118.472311380542,lat: 34.2489236367808},{lng: -118.472295098661,lat: 34.2491655493759},{lng: -118.472296964691,lat: 34.2494953364382},{lng: -118.472304540687,lat: 34.2500711685913},{lng: -118.472301847222,lat: 34.2511427772008},{lng: -118.472247406553,lat: 34.2535464442627},{lng: -118.472249737243,lat: 34.2573460089705},{lng: -118.472166028814,lat: 34.2645971452798},{lng: -118.472171596306,lat: 34.264597191182},{lng: -118.472160077137,lat: 34.2660043458089},{lng: -118.472149374003,lat: 34.2673118571821},{lng: -118.472137666898,lat: 34.2695872588466},{lng: -118.472132189423,lat: 34.2707912808852},{lng: -118.472133690333,lat: 34.2710565622599},{lng: -118.472122554357,lat: 34.2712606738205},{lng: -118.472099244294,lat: 34.2714852392106},{lng: -118.472092063263,lat: 34.271837352922},{lng: -118.472063585131,lat: 34.2721692749276},{lng: -118.472016989995,lat: 34.2724329262974},{lng: -118.471960688201,lat: 34.2726806483047},{lng: -118.471894948413,lat: 34.2729603432264},{lng: -118.47181934378,lat: 34.2731961643313},{lng: -118.471677344333,lat: 34.2735959150589},{lng: -118.471059536296,lat: 34.2753230133086},{lng: -118.470863243131,lat: 34.2758984617284},{lng: -118.470754287906,lat: 34.2761903000912},{lng: -118.470599587597,lat: 34.2766117196031},{lng: -118.470545900564,lat: 34.2767579705231},{lng: -118.470408629184,lat: 34.2771457252562},{lng: -118.470214686185,lat: 34.2777173309928},{lng: -118.469987055779,lat: 34.27828507514},{lng: -118.469817017026,lat: 34.2788326362093},{lng: -118.469740132498,lat: 34.279092150677},{lng: -118.469276520831,lat: 34.2807055050182},{lng: -118.468943198586,lat: 34.2820405425592},{lng: -118.468530758089,lat: 34.2837396349352},{lng: -118.468214247399,lat: 34.2851823825226},{lng: -118.468062854832,lat: 34.2858488234209},{lng: -118.467913294681,lat: 34.2865071882496},{lng: -118.467795116094,lat: 34.2871408376523},{lng: -118.467596761732,lat: 34.2879499350376},{lng: -118.467541803788,lat: 34.2882802153398},{lng: -118.467527385296,lat: 34.2886036037114},{lng: -118.467513078843,lat: 34.288947199658},{lng: -118.467522930966,lat: 34.2892570217169},{lng: -118.467541124405,lat: 34.289607228496},{lng: -118.467600010633,lat: 34.2899774870711},{lng: -118.467658556468,lat: 34.2902871210928},{lng: -118.467749528717,lat: 34.2905898935448},{lng: -118.467816795484,lat: 34.2908160166424},{lng: -118.467940201065,lat: 34.2911296543328},{lng: -118.468063355813,lat: 34.2913984178298},{lng: -118.46836893057,lat: 34.291870504198},{lng: -118.470453878712,lat: 34.2939550039971},{lng: -118.472186735501,lat: 34.2956757259268},{lng: -118.479110631238,lat: 34.3027063167776},{lng: -118.479680382219,lat: 34.3033185765871},{lng: -118.480874276393,lat: 34.30460151297},{lng: -118.482196907109,lat: 34.3060011669279},{lng: -118.483563294425,lat: 34.3074497144302},{lng: -118.484726628587,lat: 34.3086445654492},{lng: -118.485666966838,lat: 34.309729575223},{lng: -118.486383975036,lat: 34.3106493911856},{lng: -118.487751646111,lat: 34.3125446376075},{lng: -118.488603650578,lat: 34.3137222503336},{lng: -118.489052009896,lat: 34.3143294178367},{lng: -118.489650121974,lat: 34.3151475059174},{lng: -118.489832525613,lat: 34.3151782340615},{lng: -118.490210438231,lat: 34.3152419678788},{lng: -118.490245244891,lat: 34.3152476663006},{lng: -118.490407719796,lat: 34.3152817008392},{lng: -118.490543686524,lat: 34.3153130946095},{lng: -118.490809095868,lat: 34.3153930824636},{lng: -118.490926906353,lat: 34.3154345104796},{lng: -118.490996608908,lat: 34.315461019958},{lng: -118.491199163384,lat: 34.3155522541761},{lng: -118.491315423671,lat: 34.3156115494128},{lng: -118.491355268885,lat: 34.3156292491181},{lng: -118.491504781696,lat: 34.3157114229096},{lng: -118.491694258708,lat: 34.315831217861},{lng: -118.491837215704,lat: 34.3159247529161},{lng: -118.491918702298,lat: 34.3159838461669},{lng: -118.49196862266,lat: 34.3160252053462},{lng: -118.492115116003,lat: 34.316156509258},{lng: -118.492200042408,lat: 34.316237227112},{lng: -118.492306547701,lat: 34.3163267878718},{lng: -118.492388140467,lat: 34.3164037416893},{lng: -118.492454853037,lat: 34.3164845333947},{lng: -118.492520017388,lat: 34.3165835361566},{lng: -118.494272332091,lat: 34.3188825740765},{lng: -118.494327372755,lat: 34.3189489859353},{lng: -118.494419035668,lat: 34.3190478795579},{lng: -118.494440735468,lat: 34.3190769873716},{lng: -118.494547354747,lat: 34.3191847514128},{lng: -118.494640576302,lat: 34.3192671511414},{lng: -118.494737089479,lat: 34.3193461024889},{lng: -118.494830258415,lat: 34.3194195716314},{lng: -118.49494167826,lat: 34.3194988054166},{lng: -118.495084606449,lat: 34.3195858114393},{lng: -118.495116199271,lat: 34.3196076654817},{lng: -118.495270745735,lat: 34.3196990882298},{lng: -118.495298969704,lat: 34.3197113383673},{lng: -118.495347152375,lat: 34.319738276825},{lng: -118.49556304484,lat: 34.3198421573685},{lng: -118.495651032963,lat: 34.319879580964},{lng: -118.495760580768,lat: 34.3199224120606},{lng: -118.495790440383,lat: 34.3199312205229},{lng: -118.495913256105,lat: 34.3199774320513},{lng: -118.496084139686,lat: 34.3200310042465},{lng: -118.49659505796,lat: 34.3201790147761},{lng: -118.497218779654,lat: 34.3203598784647},{lng: -118.49744773802,lat: 34.3204327891274},{lng: -118.497714827294,lat: 34.3205127550344},{lng: -118.49785088213,lat: 34.320557192781},{lng: -118.49799858401,lat: 34.3206108566435},{lng: -118.498146404109,lat: 34.3206840985889},{lng: -118.498334031485,lat: 34.3207681681977},{lng: -118.498476850415,lat: 34.3208359345242},{lng: -118.498659567197,lat: 34.3209292988816},{lng: -118.498699447318,lat: 34.3209521483438},{lng: -118.498724354175,lat: 34.3209633808804},{lng: -118.498833999488,lat: 34.321022009201},{lng: -118.498902119038,lat: 34.3210595122517},{lng: -118.499001833063,lat: 34.3211188682919},{lng: -118.499081640973,lat: 34.3211724669797},{lng: -118.499168148827,lat: 34.3212387470226},{lng: -118.500023466558,lat: 34.3218220297475},{lng: -118.501373029734,lat: 34.3227423620632},{lng: -118.501504384554,lat: 34.3228304380062},{lng: -118.501604176922,lat: 34.3229021571196},{lng: -118.501674052344,lat: 34.3229557952328},{lng: -118.5017506179,lat: 34.3230203971785},{lng: -118.501853811548,lat: 34.3231068719359},{lng: -118.501897104776,lat: 34.3231461944838},{lng: -118.502132009721,lat: 34.3233794791587},{lng: -118.502223750882,lat: 34.3234890146876},{lng: -118.502278845343,lat: 34.3235629794499},{lng: -118.502379073778,lat: 34.3237068292621},{lng: -118.502422531037,lat: 34.3237732855033},{lng: -118.50243921928,lat: 34.3237945124813},{lng: -118.502471023663,lat: 34.3238507124249},{lng: -118.502482710832,lat: 34.3238664643486},{lng: -118.50254645833,lat: 34.3240022207349},{lng: -118.502600220352,lat: 34.3241297757295},{lng: -118.502660726626,lat: 34.3242772240549},{lng: -118.50269273316,lat: 34.3243670848131},{lng: -118.502724895062,lat: 34.3244827073332},{lng: -118.502755808968,lat: 34.3246660010307},{lng: -118.502771769173,lat: 34.324841113091},{lng: -118.50278237829,lat: 34.3249527031906},{lng: -118.502791451521,lat: 34.3250842209981},{lng: -118.502788893276,lat: 34.3252092608246},{lng: -118.502786308101,lat: 34.3253298354334},{lng: -118.502770057015,lat: 34.3256558727815},{lng: -118.502766439079,lat: 34.3258798421115},{lng: -118.502763280245,lat: 34.3259052732451},{lng: -118.502760999415,lat: 34.3260763391512},{lng: -118.502757925473,lat: 34.3261158528922},{lng: -118.502758610897,lat: 34.3262295441879},{lng: -118.502764167135,lat: 34.3263270722919},{lng: -118.502769319572,lat: 34.3263576212385},{lng: -118.502774668742,lat: 34.3264208006168},{lng: -118.502791846339,lat: 34.3265230884068},{lng: -118.502795365529,lat: 34.3265574224851},{lng: -118.502827789366,lat: 34.3267163223243},{lng: -118.502848107298,lat: 34.3267900885682},{lng: -118.502853247367,lat: 34.3268185766414},{lng: -118.502882009252,lat: 34.3269194423912},{lng: -118.502914126824,lat: 34.3270275074284},{lng: -118.502952837649,lat: 34.3271303927852},{lng: -118.502974648191,lat: 34.327177017353},{lng: -118.5030583972,lat: 34.3273332996425},{lng: -118.503083565568,lat: 34.3273874660575},{lng: -118.503120423833,lat: 34.3274577278055},{lng: -118.503222467852,lat: 34.3276269874111},{lng: -118.50335970034,lat: 34.3278641102346},{lng: -118.503475126686,lat: 34.3280552962864},{lng: -118.503625763864,lat: 34.3283177820339},{lng: -118.50370607127,lat: 34.3284524385154},{lng: -118.503727774684,lat: 34.328481201178},{lng: -118.503746209509,lat: 34.3285171906495},{lng: -118.503826463351,lat: 34.3286429175189},{lng: -118.503911806093,lat: 34.3287885445046},{lng: -118.503973791489,lat: 34.3289057591824},{lng: -118.503995528327,lat: 34.3289400174475},{lng: -118.50407600096,lat: 34.3291018093583},{lng: -118.505546959193,lat: 34.3321564981103},{lng: -118.505724299733,lat: 34.3325488818578},{lng: -118.505931391342,lat: 34.333007085182},{lng: -118.506020356827,lat: 34.3332025020538},{lng: -118.50608054826,lat: 34.3333138983019},{lng: -118.506130909417,lat: 34.3334071019332},{lng: -118.506169397828,lat: 34.3334722045504},{lng: -118.506279800988,lat: 34.3336520738699},{lng: -118.50635164188,lat: 34.3337544762275},{lng: -118.506438366747,lat: 34.3338533814667},{lng: -118.506513333626,lat: 34.3339252012406},{lng: -118.506678206938,lat: 34.3340742721659},{lng: -118.50735928314,lat: 34.3346403905959}];
  map.data.add({geometry: new google.maps.Data.Polygon([coords])});
}; */

/*
var map;
function initMap() {
  map = new google.maps.Map(document.getElementById("viewDiv"), {
    center: { lat: 34.0522, lng: -118.2437 },
    zoom: 10,

    //Control Settings
    zoomControl: true,
    mapTypeControl: false,
    scaleControl: true,
    streetViewControl: false,
    rotateControl: true,
    fullscreenControl: true,
  });
}*/