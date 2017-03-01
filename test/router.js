define([
	'ember',
	'jquery',
	'app',
	'app/routes/index'
], function(
	Ember,
	jQuery,
	App,
	AppIndexRoute
) {
	App.Router = Ember.Router.extend({});
	App.Router.map(function() {
		this.route('index');
	});
	
	return App.Router;
});