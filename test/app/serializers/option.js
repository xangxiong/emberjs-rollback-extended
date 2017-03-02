define([
	'ember',
	'ember-data',
	'app'
], function(
	Ember,
	EmberData,
	App
) {
	App.OptionSerializer = EmberData.RESTSerializer.extend(EmberData.EmbeddedRecordsMixin, {
		attrs: {
			user: {
				serialize: 'ids',
				deserialize: 'ids'
			},
			async_user: {
				serialize: 'ids',
				deserialize: 'ids'
			}
		}
	});
	
	// register this serializer
	App.register('serializer:option', App.OptionSerializer, {
		singleton: true,
		instantiate: true
	});
	
	return App.OptionSerializer;
});