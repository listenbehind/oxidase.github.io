define(['leaflet', 'knockout', 'nds/tileid'], function(L, ko, tileid) {

    var colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'cyan', 'magenta', 'lime', 'olive', 'maroon', 'purple'];

    function pickColor() {
        return colors[Math.floor((Math.random() * colors.length))];
    }

    function round8(x) {
        return Math.abs(Math.round(100000000. * x)) / 100000000.;
    }

    function Coordinate(layer, lat, lon, color) {
        var self = this;

        self.lat = ko.observable(lat);
        self.lon = ko.observable(lon);
        self.color = color;

        self.text = ko.pureComputed({owner: self,
            read: function () { return tileid.coord2text(self.lat()) + ", " + tileid.coord2text(self.lon()); }
        });

        self.wgs = ko.pureComputed({owner: self,
            read: function () { return round8(self.lon()) + ", " + round8(self.lat()); }
        });

        self.nds = ko.pureComputed({owner: self,
            read: function () { return tileid.lon2nds(self.lon()) + ", " + tileid.lat2nds(self.lat()); }
        });

        self.morton = ko.pureComputed({owner: self,
            read: function () { return tileid.morton64string(tileid.wgs2morton64(self.lon(), self.lat())); }
        });

        self.remove = function (layer) {
            layer.removeLayer(self._marker);
        }

        self._icon = L.divIcon({className: 'marker-icon icon-' + self.color, iconSize: [32, 32], iconAnchor: [12, 41]});
        self._marker = L.marker([lat, lon], { icon: self._icon, draggable: true }).addTo(layer);
        //self._marker.on('dragstart', function (e) { e.target.isDragging = true; });
        //self._marker.on('dragend', function (e) { e.target.isDragging = false; });
        self._marker.on('drag', function (e) { var ll = e.target.getLatLng(); self.lat(ll.lat); self.lon(ll.lng); });
    }

    function CoordinatesViewModel(map) {
        var self = this;

        self._map = map;
        self._markers = new L.FeatureGroup();

        self.coordinates = ko.observableArray([new Coordinate(self._markers, 48.137270, 11.575506, pickColor())]);

        self.add = function(e) {
            var coordinate = new Coordinate(self._markers, e.latlng.lat, e.latlng.lng, pickColor());
            self.coordinates.push(coordinate);
        }

        self.remove = function(coordinate) {
            coordinate.remove(self._markers);
            self.coordinates.remove(coordinate);
        };

        self.activate = function () {
            self._map.on('dblclick', self.add);
            self._map.addLayer(self._markers);
            self._map.doubleClickZoom.disable();
        }

        self.deactivate = function () {
            self._map.off('dblclick', self.add);
            self._map.removeLayer(self._markers);
            self._map.doubleClickZoom.enable();
        }
    }

    return CoordinatesViewModel;

});