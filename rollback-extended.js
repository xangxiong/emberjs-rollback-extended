define([
	'ember',
	'ember-data',
	'application/models/rollback-extended-mixin'
], function(
	Ember,
	EmberData,
	RollbackExtendedMixin
) {
	EmberData.Model.reopen(RollbackExtendedMixin);
	return EmberData.Model;
});