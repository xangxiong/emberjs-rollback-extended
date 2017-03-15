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
	App.PictureSerializer = EmberData.RESTSerializer.extend(EmberData.EmbeddedRecordsMixin, SerializerExtendedMixin, {
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
	App.register('serializer:picture', App.PictureSerializer, {
		singleton: true,
		instantiate: true
	});
	
	return App.PictureSerializer;
});