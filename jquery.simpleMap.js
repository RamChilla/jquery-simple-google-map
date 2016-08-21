/*
 *  jQuery Simple Map - v1.0
 *  A simple Google Maps jQuery plugin.
 *  Made by ramchilla - http://sgm.ramihassan.net
 *  Under WTFPL License - http://www.wtfpl.net/
 */
;(function ( $, window, document, undefined ) {

	"use strict";

		var pluginName = "simpleMap";

		// The actual plugin constructor
		function Plugin ( element, options ) {
			this.element = element;
			this.$element = $(this.element);
			if(options && options.isApiLoaded) {
				$.fn.simpleMap.defaults.isApiLoaded = true;
			};
			this._defaults = $.fn.simpleMap.defaults;
			this.settings = $.extend(true, {}, this._defaults, options);
			this._name = pluginName;
			this.init();
		}

		// Avoid Plugin.prototype conflicts
		$.extend(Plugin.prototype, {
			
			init: function () {
				this.bindEvents();
				
				if(this.settings.autoLoad) {
					this.$element.css('position', 'relative').trigger('click').unbind('click');
				}
			},
			
			loadMapApi: function () {
				
				var plugin = this;
				var googleMapApiUrl = 'https://maps.googleapis.com/maps/api/js?key=' + plugin.settings.googleApiKey;
				
				$.getScript(googleMapApiUrl, function(){
					plugin.geoCodeAddr()
				});
				
				$.fn.simpleMap.defaults.isApiLoaded = true;
				
			},
			
			geoCodeAddr: function() {
				var plugin = this,
					settings = plugin.settings;
				this.geocoder = new google.maps.Geocoder();
                //Todo: will need to rethink this in case we don't want to geocode, move create map out and into plugin scope
				this.geocoder.geocode({ 'address': settings.theAddress }, function(results, status) {
					if (status == google.maps.GeocoderStatus.OK) {
						plugin.address = results[0].geometry.location;
						plugin.appendOverlay();
						createMap();
					};
					// Creates the google map object and draws the map
					function createMap() {
						
						var mapOptions = $.extend( {}, {
							center: plugin.address,
							zoom: settings.mapSetup.zoom,
							mapTypeId: google.maps.MapTypeId.ROADMAP
						}, settings.mapSetup);
						
						if(settings.autoLoad) {
							plugin.map = new google.maps.Map(plugin.element, mapOptions);
						} else {
							plugin.map = new google.maps.Map(document.getElementById(settings.mapElementId), mapOptions);
						}
                        
						plugin.map.myMarker = new google.maps.Marker({
							position: plugin.address,
							map: plugin.map,
							title: settings.markerConfig.title,
							icon: settings.markerConfig.icon
						});
						
						if(settings.infoWindowConfig.html) {
							
							plugin.map.myInfoWindow = new google.maps.InfoWindow({
								content: settings.infoWindowConfig.html,
								maxWidth: settings.infoWindowConfig.maxWidth
							});

							google.maps.event.addListener(plugin.map.myMarker, 'click', function() {
								plugin.map.myInfoWindow.open(plugin.map, plugin.map.myMarker);
							});
							
							if(settings.infoWindowConfig.autoShow) {
								plugin.map.myInfoWindow.open(plugin.map, plugin.map.myMarker);
							}
							
						};

						google.maps.event.addListenerOnce(plugin.map, 'tilesloaded', function(){
							$('.sm_loading').fadeOut(settings.transSpeed, function(){
								$('#'+settings.mapElementId).animate({
									opacity: 0,
									opacity:1
								}, settings.transSpeed);
							});
						});

					};
				});
			},
			
			appendOverlay: function () {
				if(this.settings.useOverlay) {
					$('body').append('<div class="sm_gMapOverlay">'+
										'<div class="sm_gMapWrapper">'+
											'<span class="sm_closeMap">'+this.settings.overlayCloseText+'</span>'+
											'<div class="sm_gMapPanel">'+
												'<span class="sm_loading" />'+
											'</div>'+
										'</div>'+
									 '</div>');
					$('.sm_gMapPanel').append('<div id="'+this.settings.mapElementId+'" class="sm_map_canvas" />');
					$('.sm_gMapOverlay').fadeIn(this.settings.transSpeed);
				}
			},
			
			closeMap: function() {
				var plugin = this,
					settings = plugin.settings;
				$('.sm_gMapPanel').fadeOut(settings.transSpeed).promise().done(function(){
					$(this).remove();
					$('.sm_gMapOverlay').fadeOut(settings.transSpeed, function(){
						$(this).remove();
					});
				});
			},
			
			bindEvents: function() {
				var plugin = this,
					settings = plugin.settings;
				
				this.$element.on('click'+'.'+plugin._name, function() {
					
					$('#'+settings.mapElementId).html('<span class="sm_loading" />');
					
					if( $(this).data('sm_address') ) {
						settings.theAddress = $(this).data('sm_address');
					}
					
					if( !plugin._defaults.isApiLoaded ) {
						plugin.loadMapApi.call(plugin);
					} else {
						plugin.geoCodeAddr.call(plugin);
					}
					
				});
				
				$('body').on("click", ".sm_closeMap", function(){
					plugin.closeMap.call(plugin);
				});
				
			},
			
			unbindEvents: function() {
				this.$element.off('.'+this._name);
			},
			
			destroy: function(){
				this.unbindEvents();
				this.$element.removeData();
			}
		});

		// Plugin wrapper
		$.fn[pluginName] = function ( options ) {
			return this.each(function() {
				if ( !$.data( this, "plugin_" + pluginName ) ) {
					$.data( this, "plugin_" + pluginName, new Plugin( this, options ) );
				}
			});
		};
		
		// Plugin defaults
		$.fn.simpleMap.defaults = {
			isApiLoaded: false, //bool:set to true if maps api loaded by other means
			googleApiKey: "", //string: your Google API key
			autoLoad: false, //gool: load the map (invoked on map container element)
			useOverlay: false, //bool: use the built in overlay
			overlayCloseText: "Close", //string: the close overlay text
			transSpeed: 220, //int: overlay transition speed
			mapElementId: "sm_panel", //string: the default map element id to draw to (not needed if useOverlay or autoLoad set to true)
			theAddress: "Toledo, Ohio", //string: The default address
            latitude: null, //Coming soon: the latitude coordinate
            longitude: null, //Coming soon: the longitude coordinate
			markerConfig : {
				title: null, //string: the title of the marker as a string
				icon: null //string: the URL of the marker icon as a string
			},
			infoWindowConfig: {
				autoShow: false, //bool: auto show the map info window
				maxWidth: 240, //int: set the info window max width
				html: null//string or $(element).html(): The HTML to display in the info window
			},
			mapSetup: { //some basic Google Maps options
				scrollwheel: true, //bool: enable disable scroll zooming on mousewheel
				streetViewControl: false,//bool: enable street view controls UI
				panControl: false, //bool: enable the pan controls UI
				zoom: 10, //int: the map zoom level
				zoomControlOptions: {
					//position: google.maps.ControlPosition.RIGHT_TOP
				}
			}
		};

})( jQuery, window, document );