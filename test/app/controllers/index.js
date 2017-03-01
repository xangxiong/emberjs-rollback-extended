define([
	'ember',
	'app'
], function(
	Ember,
	App
) {
	App.IndexController = Ember.Controller.extend({
		actions: {
			
		},
		
		load: function() {
			// summary:
			console.log('init');
		}.on('init')
	});
	
	return App.IndexController;
});