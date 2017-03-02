define([
	'ember',
	'ember-data',
	'qunit',
	'pure-uuid',
	'app',
	'app/models/user'
], function(
	Ember,
	EmberData,
	QUnit,
	PureUUid,
	App,
	AppUserModel
) {
	var container = App.lookup ? App : App.__container__;
	var store = container.lookup('service:store');
	
	var generateUuid = function() {
		return (new PureUUid(1)).format();
	};
	
	QUnit.module('rollback-extended-sync', {}, function() {
		var user = store.createRecord('user', {
			id: generateUuid(),
			name: 'Xang',
			picture: store.createRecord('picture', {
				id: generateUuid(),
				url: 'https://test.io/xang.jpg'
			}),
			options: [
				store.createRecord('option', {
					id: generateUuid(),
					name: 'icon',
					value: 'test icon'
				}),
				store.createRecord('option', {
					id: generateUuid(),
					name: 'menu',
					value: 'test menu'
				})
			]
		});
		
		QUnit.test('shallow belongsto update', function(assert) {
			user.get('picture').set('url', 'https://test.io/xang-updated.jpg');
			
			assert.equal(user.get('picture').get('isDirty'), true, 'picture should be dirty');
			assert.equal(user.get('isDirty'), false, 'user should not be dirty');
			
			// number of test expected to run
			assert.expect(2);
		});
	});
});