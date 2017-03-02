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
		// 1. prepare the models to be use for all test cases
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
		
		// save these records so that we start with a fresh state		
		user.get('picture').save();
		user.get('options').invoke('save');
		user.save();
		
		var async_user_id = generateUuid();
		var async_picture_id = generateUuid();
		var async_option_ids = [generateUuid(), generateUuid()];
		
		store.pushPayload({
			users: [{
				id: async_user_id,
				name: 'Xang Async',
				async_picture: async_picture_id,
				async_options: async_option_ids
			}],
			pictures: [{
				id: async_picture_id,
				url: 'https://test.io/xang-async.jpg',
				async_user: async_user_id
			}],
			options: [{
				id: async_option_ids[0],
				name: 'icon',
				value: 'test icon',
				async_user: async_user_id
			}, {
				id: async_option_ids[1],
				name: 'menu',
				value: 'test menu',
				async_user: async_user_id
			}]
		});		
		
		var async_user = store.peekRecord('user', async_user_id);
		
		// 2. start queuing up all test cases		
		QUnit.test('shallow sync belongsto update', function(assert) {
			// 1. test property update on shallow belongsto relationship
			user.get('picture').set('url', 'https://test.io/xang-updated.jpg');
			
			assert.equal(user.get('picture').get('isDirty'), true, 'picture is dirty');
			assert.equal(user.get('picture').get('url'), 'https://test.io/xang-updated.jpg', 'picture url has been updated successfully');
			assert.equal(user.get('isDirty'), false, 'user should not be dirty by picture url update');
			
			// rollback the user and picture
			user.get('picture').rollback();
			user.rollback();			
			
			assert.equal(user.get('picture').get('isDirty'), false, 'picture should not be dirty, rollback successfull');
			assert.equal(user.get('picture').get('url'), 'https://test.io/xang.jpg', 'picture url has been reverted successfully');
			
			// 2. test shallow belongsto nullify
			user.set('picture', null);
			
			assert.equal(user.get('picture'), null, 'picture has been nullify');
			assert.equal(user.get('isDirty'), true, 'user was dirty by picture being nullify');
			
			// rollback the user and picture
			user.rollback();
			
			assert.equal(user.get('isDirty'), false, 'user should not be dirty, rollback successfull');
			
			// 3. test shallow belongsto swap
			var new_picture = store.createRecord('picture', {
				id: generateUuid(),
				url: 'https://test.io/xang2.jpg'
			});
			
			user.set('picture', new_picture);
			
			assert.equal(user.get('picture').get('url'), 'https://test.io/xang2.jpg', 'picture has been swapped');
			assert.equal(user.get('isDirty'), true, 'user was dirty by picture being swapped');
			
			// rollback the user and picture
			user.rollback();
			new_picture.destroyRecord();
			
			assert.equal(user.get('isDirty'), false, 'user should not be dirty, rollback successfull');
			
			// we expect this many assertion to run
			assert.expect(11);
		});
		
		QUnit.test('shallow async belongsto update', function(assert) {
			// 1. test property update on shallow belongsto relationship
			var done = assert.async();
			Ember.RSVP.Promise.resolve(async_user.get('async_picture')).then(function(async_picture) {
				async_picture.set('url', 'https://test.io/xang-async-updated.jpg');
				
				assert.equal(async_user.get('async_picture').get('isDirty'), true, 'async picture is dirty');
				assert.equal(async_user.get('async_picture').get('url'), 'https://test.io/xang-async-updated.jpg', 'async picture url has been updated successfully');
				assert.equal(async_user.get('isDirty'), false, 'user should not be dirty by async picture url update');
				
				// rollback the user and picture
				async_picture.rollback();
				async_user.rollback();
				
				assert.equal(async_user.get('async_picture').get('isDirty'), false, 'async picture should not be dirty, rollback successfull');
				assert.equal(async_user.get('async_picture').get('url'), 'https://test.io/xang-async.jpg', 'async picture url has been reverted successfully');
				
				// 2. test shallow belongsto nullify
				async_user.set('async_picture', null);
				
				Ember.RSVP.Promise.resolve(async_user.get('async_picture')).then(function(async_picture) {
					assert.equal(async_picture, null, 'picture has been nullify');
					assert.equal(async_user.get('isDirty'), true, 'user was dirty by async picture being nullify');
					
					// rollback the user and picture
					async_user.rollback();
					
					assert.equal(async_user.get('isDirty'), false, 'user should not be dirty, rollback successfull');
					
					// 3. test shallow belongsto swap
					var new_picture = store.createRecord('picture', {
						id: generateUuid(),
						url: 'https://test.io/xang2-async.jpg'
					});
					
					async_user.set('async_picture', new_picture);
					
					Ember.RSVP.Promise.resolve(async_user.get('async_picture')).then(function(async_picture) {
						assert.equal(async_picture.get('url'), 'https://test.io/xang2-async.jpg', 'async picture has been swapped');
						assert.equal(async_user.get('isDirty'), true, 'user was dirty by async picture being swapped');
						
						// rollback the user and picture
						async_user.rollback();
						new_picture.destroyRecord();
						
						assert.equal(async_user.get('isDirty'), false, 'user should not be dirty, rollback successfull');
						
						// we expect this many assertion to run
						assert.expect(11);
						
						done();
					});
				});
			});
		});
		
		QUnit.test('shallow sync hasmany update', function(assert) {
			// prevent other test from running until done is trigger
			var option = user.get('options').findBy('name', 'icon');
			
			option.set('value', 'updated test icon');
			
			assert.equal(option.get('isDirty'), true, 'option is dirty');
			assert.equal(option.get('value'), 'updated test icon', 'option value has been updated successfully');
			assert.equal(user.get('isDirty'), true, 'user is dirty');
			
			// we expect this many assertion to run
			assert.expect(3);
		});
	});
});