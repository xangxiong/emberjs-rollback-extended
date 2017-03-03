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
		// ##
		// 1. prepare the models to be use for all test cases
		// ##
		
		// ## shallow sync model
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
		
		// ## shallow async model
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
		
		// ## deep sync model
		var deep_user = store.createRecord('user', {
			id: generateUuid(),
			name: 'Xang',
			deep_picture: store.createRecord('picture', {
				id: generateUuid(),
				url: 'https://test.io/xang.jpg'
			}),
			deep_options: [
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
		deep_user.get('deep_picture').save();
		deep_user.get('deep_options').invoke('save');
		deep_user.save();
		
		// ## deep async model
		var deep_async_user_id = generateUuid();
		var deep_async_picture_id = generateUuid();
		var deep_async_option_ids = [generateUuid(), generateUuid()];
		
		store.pushPayload({
			users: [{
				id: deep_async_user_id,
				name: 'Xang Async',
				deep_async_picture: deep_async_picture_id,
				deep_async_options: deep_async_option_ids
			}],
			pictures: [{
				id: deep_async_picture_id,
				url: 'https://test.io/xang-async.jpg',
				deep_async_user: deep_async_user_id
			}],
			options: [{
				id: deep_async_option_ids[0],
				name: 'icon',
				value: 'test icon',
				deep_async_user: deep_async_user_id
			}, {
				id: deep_async_option_ids[1],
				name: 'menu',
				value: 'test menu',
				deep_async_user: deep_async_user_id
			}]
		});
		
		var deep_async_user = store.peekRecord('user', deep_async_user_id);
		
		// ##
		// 2. start queuing up all shallow test cases
		// ##
		
		QUnit.test('shallow sync belongsto', function(assert) {
			// 1. test property update on shallow belongsto relationship
			var picture = user.get('picture');
			picture.set('url', 'https://test.io/xang-updated.jpg');
			
			assert.equal(picture.get('isDirty'), true, 'picture is dirty');
			assert.equal(picture.get('url'), 'https://test.io/xang-updated.jpg', 'picture url has been updated successfully');
			assert.equal(user.get('isDirty'), false, 'user should not be dirty by picture url update');
			
			// rollback the user			
			user.rollback();
			
			assert.equal(picture.get('isDirty'), true, 'picture should still be dirty');
			assert.equal(user.get('isDirty'), false, 'user should not be dirty, rollback successfull');			
			
			// rollback the picture
			picture.rollback();
			
			assert.equal(user.get('picture').get('isDirty'), false, 'picture should not be dirty, rollback successfull');
			assert.equal(user.get('picture').get('url'), 'https://test.io/xang.jpg', 'picture url has been reverted successfully');			
			
			// 2. test shallow belongsto nullify
			user.set('picture', null);
			
			assert.equal(user.get('picture'), null, 'picture has been nullify');
			assert.equal(user.get('isDirty'), true, 'user was dirty by picture being nullify');
			
			// rollback the user and picture
			user.rollback();
			
			assert.equal(user.get('picture'), picture, 'picture has been reverted successfully');
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
		});
		
		QUnit.test('shallow async belongsto', function(assert) {
			// prep for async testing
			var done = assert.async();
			
			Ember.RSVP.Promise.resolve(async_user.get('async_picture')).then(function(async_picture) {
				// 1. test property update on shallow belongsto relationship
				async_picture.set('url', 'https://test.io/xang-async-updated.jpg');
				
				assert.equal(async_user.get('async_picture').get('isDirty'), true, 'async picture is dirty');
				assert.equal(async_user.get('async_picture').get('url'), 'https://test.io/xang-async-updated.jpg', 'async picture url has been updated successfully');
				assert.equal(async_user.get('isDirty'), false, 'user should not be dirty by async picture url update');
				
				// rollback the user
				async_user.rollback();
				
				assert.equal(async_picture.get('isDirty'), true, 'async picture should still be dirty');
				assert.equal(async_user.get('isDirty'), false, 'async user should not be dirty, rollback successfull');
				
				// rollback the picture				
				async_picture.rollback();
				
				assert.equal(async_user.get('async_picture').get('isDirty'), false, 'async picture should not be dirty, rollback successfull');
				assert.equal(async_user.get('async_picture').get('url'), 'https://test.io/xang-async.jpg', 'async picture url has been reverted successfully');
				
				// 2. test shallow belongsto nullify
				async_user.set('async_picture', null);
				
				Ember.RSVP.Promise.resolve(async_user.get('async_picture')).then(function(null_async_picture) {
					assert.equal(null_async_picture, null, 'picture has been nullify');
					assert.equal(async_user.get('isDirty'), true, 'async user was dirty by async picture being nullify');
					
					// rollback the user and picture
					async_user.rollback();
					
					Ember.RSVP.Promise.resolve(async_user.get('async_picture')).then(function(revert_async_picture) {
						assert.equal(revert_async_picture, async_picture, 'async picture has been reverted successfully');
						assert.equal(async_user.get('isDirty'), false, 'async user should not be dirty, rollback successfull');
						
						// 3. test shallow belongsto swap
						var new_picture = store.createRecord('picture', {
							id: generateUuid(),
							url: 'https://test.io/xang2-async.jpg'
						});
						
						async_user.set('async_picture', new_picture);
						
						Ember.RSVP.Promise.resolve(async_user.get('async_picture')).then(function(async_picture) {
							assert.equal(async_picture.get('url'), 'https://test.io/xang2-async.jpg', 'async picture has been swapped');
							assert.equal(async_user.get('isDirty'), true, 'async user was dirty by async picture being swapped');
							
							// rollback the user and picture
							async_user.rollback();
							new_picture.destroyRecord();
							
							assert.equal(async_user.get('isDirty'), false, 'async user should not be dirty, rollback successfull');
							
							done();
						});
					});
				});
			});
		});
		
		QUnit.test('shallow sync hasmany', function(assert) {
			// 1. test property update on shallow hasmany
			var option = user.get('options').findBy('name', 'icon');
			
			option.set('value', 'updated test icon');
			
			assert.equal(option.get('isDirty'), true, 'option should be dirty');
			assert.equal(option.get('value'), 'updated test icon', 'option value has been updated successfully');
			assert.equal(user.get('isDirty'), false, 'user should not be dirty');
			
			option.rollback();
			
			assert.equal(option.get('isDirty'), false, 'option should not be dirty, rollback successfull');
			assert.equal(user.get('isDirty'), false, 'user should not be dirty');
			
			// 2. test shallow hasmany removal
			user.get('options').removeObject(option);
			
			assert.equal(user.get('options').length, 1, 'user should have 1 options');
			assert.equal(option.get('isDirty'), false, 'option should not be dirty');
			assert.equal(user.get('isDirty'), true, 'user should be dirty');
			
			user.rollback();
			
			assert.equal(user.get('options').length, 2, 'user should have 2 options');
			assert.equal(option.get('isDirty'), false, 'deep option should not be dirty');
			assert.equal(user.get('isDirty'), false, 'user should not be dirty, rollback successfully');
			
			// 3. test adding a new option
			var new_option = store.createRecord('option', {
				id: generateUuid(),
				name: 'hidden',
				value: 'yes'
			});
			
			user.get('options').addObject(new_option);
			
			assert.equal(user.get('options').length, 3, 'user should have 3 options');
			assert.equal(user.get('isDirty'), true, 'user should be dirty');
			
			user.rollback();
			new_option.deleteRecord();
			
			assert.equal(user.get('options').length, 2, 'user should have 2 options');
			assert.equal(user.get('isDirty'), false, 'user should not be dirty, rollback successfully');
		});
		
		QUnit.test('shallow async hasmany', function(assert) {
			// prep for async testing
			var done = assert.async();
			
			// 1. test property update on shallow hasmany
			Ember.RSVP.Promise.resolve(async_user.get('async_options')).then(function(async_options) {
				var option = async_options.findBy('name', 'icon');
				option.set('value', 'updated test icon');
				
				assert.equal(option.get('isDirty'), true, 'async option should be dirty');
				assert.equal(option.get('value'), 'updated test icon', 'async option value has been updated successfully');
				assert.equal(async_user.get('isDirty'), false, 'async user should not be dirty');
				
				option.rollback();
				
				assert.equal(option.get('isDirty'), false, 'async option should not be dirty, rollback successfully');
				assert.equal(async_user.get('isDirty'), false, 'async user should not be dirty, rollback successfully');
				
				// 2. test shallow hasmany removal
				async_options.removeObject(option);
				
				assert.equal(async_options.length, 1, 'user should have 1 options');
				assert.equal(option.get('isDirty'), false, 'option should not be dirty');
				assert.equal(async_user.get('isDirty'), true, 'user should be dirty');
				
				async_user.rollback();
				
				assert.equal(async_options.length, 2, 'user should have 2 options');
				assert.equal(option.get('isDirty'), false, 'async option should not be dirty');
				assert.equal(async_user.get('isDirty'), false, 'user should not be dirty, rollback successfully');
				
				// 3. test adding a new option
				var new_option = store.createRecord('option', {
					id: generateUuid(),
					name: 'hidden',
					value: 'yes'
				});
				
				async_options.addObject(new_option);
				
				assert.equal(async_options.length, 3, 'user should have 3 options');
				assert.equal(async_user.get('isDirty'), true, 'user should be dirty');
				
				async_user.rollback();
				new_option.deleteRecord();
				
				assert.equal(async_options.length, 2, 'user should have 2 options');
				assert.equal(async_user.get('isDirty'), false, 'user should not be dirty, rollback successfully');
				
				done();
			});
		});
		
		// ##
		// 3.  start queuing up all deep test cases
		// ##
		QUnit.test('deep sync belongsto', function(assert) {
			// 1. test property update on shallow belongsto relationship
			deep_user.get('deep_picture').set('url', 'https://test.io/xang-updated.jpg');
			
			assert.equal(deep_user.get('deep_picture').get('isDirty'), true, 'deep picture is dirty');
			assert.equal(deep_user.get('deep_picture').get('url'), 'https://test.io/xang-updated.jpg', 'deep picture url has been updated successfully');
			assert.equal(deep_user.get('isDirty'), true, 'deep user should be dirty by deep picture url update');
			
			// rollback the user
			deep_user.rollback();
			
			assert.equal(deep_user.get('deep_picture').get('isDirty'), false, 'deep picture should not be dirty, rollback successfull');
			assert.equal(deep_user.get('deep_picture').get('url'), 'https://test.io/xang.jpg', 'deep picture url has been reverted successfully');
			assert.equal(deep_user.get('isDirty'), false, 'deep user should not be dirty, rollback successfull');
			
			// 2. test shallow belongsto nullify
			deep_user.set('deep_picture', null);
			
			assert.equal(deep_user.get('deep_picture'), null, 'deep picture has been nullify');
			assert.equal(deep_user.get('isDirty'), true, 'deep user was dirty by deep picture being nullify');
			
			// rollback the user and picture
			deep_user.rollback();
			
			assert.equal(deep_user.get('isDirty'), false, 'deep user should not be dirty, rollback successfull');
			
			// 3. test shallow belongsto swap
			var new_picture = store.createRecord('picture', {
				id: generateUuid(),
				url: 'https://test.io/xang2.jpg'
			});
			
			deep_user.set('deep_picture', new_picture);
			
			assert.equal(deep_user.get('deep_picture').get('url'), 'https://test.io/xang2.jpg', 'deep picture has been swapped');
			assert.equal(deep_user.get('isDirty'), true, 'deep user was dirty by deep picture being swapped');
			
			// rollback the user and picture
			deep_user.rollback();
			new_picture.destroyRecord();
			
			assert.equal(deep_user.get('isDirty'), false, 'deep user should not be dirty, rollback successfull');			
		});
		
		QUnit.test('deep async belongsto', function(assert) {
			// prep for async testing
			var done = assert.async();
			
			Ember.RSVP.Promise.resolve(deep_async_user.get('deep_async_picture')).then(function(deep_async_picture) {
				// 1. test property update on deep belongsto relationship
				deep_async_picture.set('url', 'https://test.io/xang-async-updated.jpg');
				
				assert.equal(deep_async_user.get('deep_async_picture').get('isDirty'), true, 'deep async picture is dirty');
				assert.equal(deep_async_user.get('deep_async_picture').get('url'), 'https://test.io/xang-async-updated.jpg', 'deep async picture url has been updated successfully');
				assert.equal(deep_async_user.get('isDirty'), true, 'deep async user should be dirty by deep async picture url update');
				
				// rollback the user and picture
				deep_async_user.rollback();
				
				assert.equal(deep_async_user.get('deep_async_picture').get('isDirty'), false, 'deep async picture should not be dirty, rollback successfull');
				assert.equal(deep_async_user.get('deep_async_picture').get('url'), 'https://test.io/xang-async.jpg', 'deep async picture url has been reverted successfully');
				
				// 2. test deep belongsto nullify
				deep_async_user.set('deep_async_picture', null);
				
				Ember.RSVP.Promise.resolve(deep_async_user.get('deep_async_picture')).then(function(null_deep_async_picture) {
					assert.equal(null_deep_async_picture, null, 'deep async picture has been nullify');
					assert.equal(deep_async_user.get('isDirty'), true, 'deep async user was dirty by deep async picture being nullify');
					
					// rollback the user and picture
					deep_async_user.rollback();
					
					Ember.RSVP.Promise.resolve(deep_async_user.get('deep_async_picture')).then(function(revert_deep_async_picture) {
						assert.equal(revert_deep_async_picture, deep_async_picture, 'deep async picture reverted, rollback successfull');
						assert.equal(deep_async_user.get('isDirty'), false, 'deep async user should not be dirty, rollback successfull');
						
						// 3. test deep belongsto swap
						var new_picture = store.createRecord('picture', {
							id: generateUuid(),
							url: 'https://test.io/xang2-async.jpg'
						});
						
						deep_async_user.set('deep_async_picture', new_picture);
						
						Ember.RSVP.Promise.resolve(deep_async_user.get('deep_async_picture')).then(function(deep_async_picture) {
							assert.equal(deep_async_picture.get('url'), 'https://test.io/xang2-async.jpg', 'deep async picture has been swapped');
							assert.equal(deep_async_user.get('isDirty'), true, 'deep async user was dirty by deep async picture being swapped');
							
							// rollback the user and picture
							deep_async_user.rollback();
							new_picture.destroyRecord();
							
							assert.equal(deep_async_user.get('isDirty'), false, 'deep async user should not be dirty, rollback successfull');
							
							done();
						});
					})					
				});
			});
		});
		
		QUnit.test('deep sync hasmany', function(assert) {
			// 1. test property update on deep hasmany
			var option = deep_user.get('deep_options').findBy('name', 'icon');
			
			option.set('value', 'updated test icon');
			
			assert.equal(option.get('isDirty'), true, 'deep option should be dirty');
			assert.equal(option.get('value'), 'updated test icon', 'deep option value has been updated successfully');
			assert.equal(deep_user.get('isDirty'), true, 'deep user should be dirty');
			
			deep_user.rollback();
			
			assert.equal(option.get('isDirty'), false, 'deep option should not be dirty, rollback successfull');
			assert.equal(deep_user.get('isDirty'), false, 'deep user should not be dirty, rollback successfully');
			
			// 2. test deep hasmany removal
			deep_user.get('deep_options').removeObject(option);
			
			assert.equal(deep_user.get('deep_options').length, 1, 'deep user should have 1 options');
			assert.equal(option.get('isDirty'), true, 'deep option should be dirty');
			assert.equal(deep_user.get('isDirty'), true, 'deep user should be dirty');
			
			deep_user.rollback();
			
			assert.equal(deep_user.get('deep_options').length, 2, 'deep user should have 2 options');
			assert.equal(option.get('isDirty'), false, 'deep option should not be dirty, rollback successfully');
			assert.equal(deep_user.get('isDirty'), false, 'deep user should not be dirty, rollback successfully');
			
			// 3. test adding a new option
			var new_option = store.createRecord('option', {
				id: generateUuid(),
				name: 'hidden',
				value: 'yes'
			});
			
			deep_user.get('deep_options').addObject(new_option);
			
			assert.equal(deep_user.get('deep_options').length, 3, 'deep user should have 3 options');
			assert.equal(deep_user.get('isDirty'), true, 'deep user should be dirty');
			
			deep_user.rollback();
			
			assert.equal(deep_user.get('deep_options').length, 2, 'deep user should have 2 options');
			assert.equal(deep_user.get('isDirty'), false, 'deep user should not be dirty, rollback successfully');
		});
		
		QUnit.test('deep async hasmany', function(assert) {
			// prep for async testing
			var done = assert.async();
			
			// 1. test property update on shallow hasmany
			Ember.RSVP.Promise.resolve(deep_async_user.get('deep_async_options')).then(function(deep_async_options) {
				var option = deep_async_options.findBy('name', 'icon');
				option.set('value', 'updated test icon');
				
				assert.equal(option.get('isDirty'), true, 'deep async option should be dirty');
				assert.equal(option.get('value'), 'updated test icon', 'deep async option value has been updated successfully');
				assert.equal(deep_async_user.get('isDirty'), true, 'deep async user should be dirty');
				
				deep_async_user.rollback();
				
				assert.equal(option.get('isDirty'), false, 'deep async option should not be dirty, rollback successfull');
				assert.equal(deep_async_user.get('isDirty'), false, 'deep async user should not be dirty, rollback successfully');
				
				// 2. test shallow hasmany removal
				deep_async_options.removeObject(option);
				
				assert.equal(deep_async_options.length, 1, 'deep async user should have 1 options');
				assert.equal(option.get('isDirty'), true, 'deep async option should be dirty');
				assert.equal(deep_async_user.get('isDirty'), true, 'deep async user should be dirty');
				
				deep_async_user.rollback();
				
				assert.equal(deep_async_options.length, 2, 'deep async user should have 2 options');
				assert.equal(option.get('isDirty'), false, 'deep async option should not be dirty');
				assert.equal(deep_async_user.get('isDirty'), false, 'deep async user should not be dirty, rollback successfully');
				
				// 3. test adding a new option
				var new_option = store.createRecord('option', {
					id: generateUuid(),
					name: 'hidden',
					value: 'yes'
				});
				
				deep_async_options.addObject(new_option);
				
				assert.equal(deep_async_options.length, 3, 'deep async user should have 3 options');
				assert.equal(deep_async_user.get('isDirty'), true, 'deep async user should be dirty');
				
				deep_async_user.rollback();
				
				assert.equal(deep_async_options.length, 2, 'deep async user should have 2 options');
				assert.equal(deep_async_user.get('isDirty'), false, 'deep async user should not be dirty, rollback successfully');
				
				done();
			});
		});
	});
});