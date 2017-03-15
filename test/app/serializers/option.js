define([
	'ember',
	'ember-data',
	'app',
	'serializer-extended-mixin'
], function(
	Ember,
	EmberData,
	App,
	SerializerExtendedMixin
) {
	App.OptionSerializer = EmberData.RESTSerializer.extend(EmberData.EmbeddedRecordsMixin, SerializerExtendedMixin, {
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