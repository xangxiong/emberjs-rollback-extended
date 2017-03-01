define([
	'ember',
	'app'
], function(
	Ember,
	App
) {
	App.IndexRoute = Ember.Route.extend({		
		model: function(params) {
			return null;
		}
	});
	
	return App.IndexRoute;
});