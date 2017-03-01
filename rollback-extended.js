define([
	'ember',
	'ember-data',
	'rollback-extended-mixin'
], function(
	Ember,
	EmberData,
	RollbackExtendedMixin
) {
	EmberData.Model.reopen(RollbackExtendedMixin);
	return EmberData.Model;
});
