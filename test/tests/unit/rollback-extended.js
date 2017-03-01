define([
	'ember',
	'ember-data',
	'qunit'
], function(
	Ember,
	EmberData,
	QUnit
) {
	QUnit.module('rollback-extended', {}, function() {
		console.log('modules');
		
		QUnit.test('simple rollback test', function(assert) {
			console.log('testing simple rollback');
		});
	});
});