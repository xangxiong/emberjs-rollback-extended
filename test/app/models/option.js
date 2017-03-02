define([
	'ember',
	'ember-data',
	'app',
	'app/serializers/option'
], function(
	Ember,
	EmberData,
	App,
	AppOptionSerializer
) {
	App.OptionModel = EmberData.Model.extend({
		name: EmberData.attr('string'),
		value: EmberData.attr('string'),
		
		user: EmberData.belongsTo('user', {
			inverse: 'options',
			async: false
		}),
		
		async_user: EmberData.belongsTo('user', {
			inverse: 'async_options',
			async: true
		})
	});
	
	// register this model
	App.register('model:option', App.OptionModel, {
		singleton: false,
		instantiate: false
	});
	
	return App.OptionModel;
});