(function () {
	var testReportApp = angular.module('testReportApp');
	testReportApp.config(["$provide", function ($provide) {
		$provide.value('data', JSON.parse(document.getElementById('data').innerHTML));
	}]);
})();
