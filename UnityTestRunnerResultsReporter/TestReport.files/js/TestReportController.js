(function () {
	 var testReportApp = angular.module('testReportApp');
	 testReportApp.controller('TestReportController', function ($scope, data) {
		$scope.data = data;
		$scope.isCollapsed = true;
		$scope.isSuiteCommandLineCollapsed = true;

		$scope.formatDuration = function (value) {
			return moment.duration(value, "milliseconds").format("m[m] s[s] S[ms]", { forceLength: true });
		};

		$scope.cleanupRevision = function (revision) {
			return revision.replace('revision_','');
		};

		$scope.formatLink = function (filename) {
			return filename.replace('\\', '/');
		}

		$scope.formatArtifactName = function (filename) {
			return filename.split('\\').pop().split('/').pop();
		};

		$scope.formatTestState = function(state) {
			switch(state) {
				case 0:
					return 'Inconclusive';
				case 1:
					return 'NotRunnable';
				case 2:
					return 'Skipped';
				case 3:
					return 'Ignored';
				case 4:
					return 'Success';
				case 5:
					return 'Failure';
				case 6:
					return 'Error';
				case 7:
					return  'Cancelled';
				default:
					return 'Unknown';
			}
		};

		$scope.styleForTest = function (state) {
			switch(state) {
				case 1:
				case 2:
				case 3:
					return 'notrun';
				case 4:
					return 'success';
				case 5:
				case 6:
					return 'fail';
				default:
					return 'inconclusive';
			}
		};

		$scope.statesFilter = {
			0: true, // Inconclusive
			2: false, // Skipped
			3: false, // Ignored
			4: false, //Success
			5: true, // Failure
			6: true, // Error
			7: true // Cancelled
		};

		$scope.states = [
			{name:'Inconclusive', value:0},
			{name:'Skipped', value:2},
			{name:'Ignored', value:3},
			{name:'Success', value:4},
			{name:'Failure', value:5},
			{name:'Error', value:6},
			{name:'Cancelled', value:7}
		];
		
		$scope.showEmpties = false;

		$scope.isImage = function(artifact) {
			return /png$/.test(artifact);
		}

		$scope.testFilter = function (test) {
			return $scope.statesFilter[test.state];
		};

		$scope.suiteCommandLine  = function (suite) {
			var result = data.utrPrefix;
			if (suite.minimalCommandLine) {
				suite.minimalCommandLine.forEach ( function (arg) { result += (" " + arg); } )
			}
			return result;
		};

		$scope.testCommandLine = function (suite, test) {
			var suiteCommandLine = $scope.suiteCommandLine (suite);
			suiteCommandLine = suiteCommandLine.replace (/[-]{1,2}testfilter=.*\s/g, '');
			var result = suiteCommandLine + " --testfilter=" + test.name;
			return result;
		};

		$scope.isPerformanceData = function (suite) {
			if (suite.tests[0].data.performanceTestResults !== undefined) {
				return true;
			}
			return false;
		};

		$scope.formatNumber = function (number) {
			return number.toFixed(2);
		};
		
		$scope.hasAnyVisibleTests = function (suite) {
			return suite.tests.some($scope.testFilter);
		}
	});

	testReportApp.directive('selectOnClick', function ($window) {
	return {
		link: function (scope, element) {
			element.on('click', function () {
				var selection = $window.getSelection();
				var range = document.createRange();
				range.selectNodeContents(element[0]);
				selection.removeAllRanges();
				selection.addRange(range);
			});
		}
	}
	});
})();