define([
	'ember',
	'ember-data',
	'app',
	'app/models/picture',
	'app/models/option'
], function(
	Ember,
	EmberData,
	App,
	AppPictureModel,
	AppOptionModel
) {
	App.UserModel = EmberData.Model.extend({
		deepRelationships: ['options'],
		
		name: EmberData.attr('string'),
		picture: EmberData.belongsTo('picture', {
			inverse: 'user',
			async: false
		}),
		options: EmberData.hasMany('option', {
			inverse: 'user',
			async: false
		})
	});
	
	// register this model
	App.register('model:user', App.UserModel, {
		singleton: false,
		instantiate: false
	});
	
	return App.UserModel;
});