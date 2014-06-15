var buses = {};
var busesRoutes = {};
var routes = {};
var filteredRoutes = [];
var map;

function initialize() {
  var mapOptions = {
    center: new google.maps.LatLng(37.761513, -122.476919),
    zoom: 15,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
  //get the previously selected options from local storage
  filteredRoutes = localStorage.getItem('filteredRoutes') || [];
}
      
var f = new Firebase("https://publicdata-transit.firebaseio.com/sf-muni/data");

function newBus(bus, firebaseId) {
  var busLatLng = new google.maps.LatLng(bus.lat, bus.lon);
  var directionColor = bus.dirTag && bus.dirTag.indexOf('OB') > -1 ? "7094FF" : "FF6262";
  var iconType = bus.vtype == 'bus' ? 'bus' : 'locomotive'; // 'train' looks nearly identical to bus at rendered size
  var marker = new google.maps.Marker({ icon: 'http://chart.googleapis.com/chart?chst=d_bubble_icon_text_small&chld=' + iconType + 
    '|bbT|'+bus.routeTag+'|' + directionColor + '|eee', position: busLatLng});
  if(filteredRoutes.length === 0 || filteredRoutes.indexOf(bus.routeTag) >= 0) {
    marker.setMap(map);
  }
  buses[firebaseId] = marker;
  busesRoutes[firebaseId] = bus.routeTag;
  if(!routes[bus.routeTag]) {
    routes[bus.routeTag] = bus.routeTag;
    updateRouteSelections(bus.routeTag);
  }
}

f.once("value", function(s) {
  s.forEach(function(b) {
    newBus(b.val(), b.name());
  });
});

f.on("child_changed", function(s) {
  var busMarker = buses[s.name()];
  if(typeof busMarker === 'undefined') {
    newBus(s.val(), s.name());
  }
  else {
    busMarker.animatedMoveTo(s.val().lat, s.val().lon);
  }
});

f.on("child_removed", function(s) {
  var busMarker = buses[s.name()];
  if(typeof busMarker !== 'undefined') {
    busMarker.setMap(null);
    delete buses[s.name()];
  }
});

// UI additons
$('#routes').on('change', function(e){
  var $selected = $('#routes option:selected');
  var routeIds = [];
  if($selected.length === 0) {
    updateRouteDisplay('all');
    localStorage.setItem('filteredRoutes', []);
  } else {
    //collect route ids and pass them on for diplay
    for(var i = 0; i < $selected.length; i++) {
      routeIds.push($selected[i].value);
    }
    filteredRoutes = routeIds;
    localStorage.setItem('filteredRoutes', routeIds);
    updateRouteDisplay(routeIds);
  }
});

var updateRouteSelections = function (routeId) {
  var $selectBox = $('#routes');
  var $options;
  var selected;
  $selectBox.append($("<option></option>")
              .attr("value",routeId)
              .text(routeId));
  // resort options
  $options = $('#routes option');
  $options = $options.sort(function($a, $b){
    return ($a.text > $b.text) ? 1 : -1;
  });
  $selectBox.empty()
  $selectBox.append($options);
  if(filteredRoutes.indexOf('' + routeId) >= 0) {
    selected = $selectBox.val() || [];
    selected.push('' + routeId);
    $selectBox.val(selected);
  }
}

var updateRouteDisplay = function (routeIds){
  if (typeof routeIds === 'string') {
    showAllRoutes();
  } else {
    hideAllRoutes();
    routeIds.forEach(function(routeId){
      showRouteFor(routeId);
    });
  }
};

var showAllRoutes = function (){
  for(var bus in buses) {
    buses[bus].setMap(map);
  }
};

var hideAllRoutes = function (){
  for(var bus in buses) {
    buses[bus].setMap(null);
  }
};

var showRouteFor = function (routeId) {
  for(var bus in buses) {
    if(('' + busesRoutes[bus]) === routeId ){
      buses[bus].setMap(map);
    }
  }
};