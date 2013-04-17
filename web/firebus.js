var buses = { };
var map;

function initialize() {
  var mapOptions = {
    center: new google.maps.LatLng(37.7789, -122.3917),
    zoom: 15,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
}
      
var f = new Firebase("https://firebus.firebaseio.com/sf-muni");

function newBus(bus, firebaseId) {
    var busLatLng = new google.maps.LatLng(bus.lat, bus.lon);
    var contentString = "Route " + bus.routeTag;
    var infowindow = new google.maps.InfoWindow({ content: contentString });
    var marker = new google.maps.Marker({ icon: 'muni.png', position: busLatLng, map: map, title: contentString });
    buses[firebaseId] = marker;
    google.maps.event.addListener(marker, 'click', function() {
      infowindow.open(map,marker);
    });
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
