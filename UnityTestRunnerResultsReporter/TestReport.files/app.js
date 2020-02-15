var app = angular.module("TreeTestReportApp", ['treeGrid', 'ui.bootstrap', 'angular-clipboard'])
.directive('selectOnClick', ['$window', function ($window) {
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
    };
}])
.directive('preEx', function () {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        scope: {
            title: '@',
            text: '=',
            textArray: '=',
        },
        template: "<div compile=\"temp\"></div>",
        link: function (scope, elm, attrs, ctrl) {
            if (!scope.text && !scope.textArray) {
                console.log('No data was defined for the directive!');
                return;
            }

            var singleTextRowTemplate = "<div><div class=\"pre-ex-div\"><span>{{::title}}</span><button type=\"button\" class=\"btn btn-default btn-xs pre-ex-button\" clipboard text=\"value\" on-copied=\"success()\" on-error=\"fail(err)\"><span class=\"glyphicon glyphicon-copy\"></span> Copy to Clipboard</button></div><pre select-on-click class='pre-callstack'>{{::value}}</pre></div>";

            if(scope.text) {
            	scope.temp = singleTextRowTemplate;
            	scope.value = scope.text;
        	}

            else if(scope.textArray) {
            	if(scope.textArray.length === 1) {
            		scope.value = scope.textArray[0];
            		scope.temp = singleTextRowTemplate;
            	}
            	else {
            		scope.temp = "<div><p><span>{{::title}}</span></p><div ng-class=\"!$last ? 'pre-ex-div-default' : ''\" ng-repeat=\"text in ::value\"><div class=\"pre-ex-div\"><button type=\"button\" class=\"btn btn-default btn-xs pre-ex-button-default\" clipboard text=\"::text\" on-copied=\"success()\" on-error=\"fail(err)\"><span class=\"glyphicon glyphicon-copy\"></span> Copy to Clipboard</button></div><pre select-on-click class='pre-callstack'>{{::text}}</pre></div></div>";
            		scope.value = scope.textArray;
            	}
            }

            scope.success = function() {
                console.log('copied');
            }
            scope.fail = function () {
                console.log('copy failed');
            }
        }
    };
})
.directive('detailsWrapper', function () {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        scope: {
            iconClass: '@'
        },
        template: "<div><table class=\"details-table\"><tr><td class=\"details-image-cell\"><i ng-class=\"::iconClass\"></i></td><td><div ng-transclude></div></td></tr></table></div>",
        link: function (scope, elm, attrs, ctrl) {
        }
    };
})
.controller("TreeController", function($scope, $timeout){
	angular.element(function () {
    	$timeout(function() {
			$scope.my_tree.expand_all_error();
	    }, 0);
	});

	$scope.today = new Date();

	var data = JSON.parse(document.getElementById("data").innerHTML);

	//$scope.expand_to = {};
	$scope.row_filter = {filtered: true};

	$scope.filter = {};
	$scope.filter.info = {value: false, type: 'Info'};
	$scope.filter.warning = {value: false, type: 'Warning'};
	$scope.filter.error = {value: true, type: 'Error'};
	$scope.filter.artifact = {value: false, type: 'ArtifactPublish'};

	$scope.filters = ['Info', 'InfoPartial', 'Warning', 'ArtifactPublish'];

	$scope.filterSelected = function(model){
		if(!model.value) {
			$scope.filters.push(model.type);
		}
		else {
			var index = $scope.filters.indexOf(model.type);
			if(index !== -1)
				$scope.filters.splice(index, 1);
		}
	}

	$scope.additionalFilter = {
		filterPropertyKey: 'type',
		filterPropertyValue: 'TestStatus',
		filterAttribute: 'state',
		filterAttributeValues: ['1', '2', '3', '4', '7'],
		hideSuccessfulSuites: true // temporary property, should be changed to something more generic as the other properties
	};

	$scope.testStatusFilter = {};
	$scope.testStatusFilter.ignored = {selected: false, values: ['1', '2', '3', '7']}; // NotRunnable = 1, Skipped = 2, Ignored = 3, Cancelled = 7
	$scope.testStatusFilter.passed = {selected: false, values: ['4']};
	$scope.testStatusFilter.failed = {selected: true, values: ['5','6']}; // Failure = 5, Error = 6
	$scope.testStatusFilter.inconclusive = {selected: true, values: ['0']};
	$scope.testStatusFilter.hideSuccessfulSuites = true;

	$scope.testStatusFilterChanged = function(model){
		if(!model.selected) {
			for(var i=0; i<model.values.length; i++) {
				$scope.additionalFilter.filterAttributeValues.push(model.values[i]);
			}
		}
		else {
			for(var i=0; i<model.values.length; i++) {
				var index = $scope.additionalFilter.filterAttributeValues.indexOf(model.values[i]);
				if(index !== -1)
					$scope.additionalFilter.filterAttributeValues.splice(index, 1);
			}
		}
	}

	// $scope.$watch('filter', function(){
	// 	if($scope.filter.info){
	// 		//$scope.filters
	// 	}
	// }, true);

	$scope.my_tree = {};

	$scope.tree_data = [
		data
	];

	$scope.summary = {};
	$scope.summary = data != null && data.type === "TestSession" && data.summary != null ? data.summary : undefined;


	$scope.convertTestStateToString = function(state) {
		switch(state)
			{
				case 5:
					return "Failure";
				case 6:
					return "Error";
				case 1:
					return "NotRunnable";
				case 2:
					return "Skipped";
				case 3:
					return "Ignored";
				case 7:
					return "Cancelled";
				case 0:
					return "Inconclusive";
				case 4:
					return "Passed";
			}
	}

	$scope.onExpandTo = function(branch){
		return branch['rootCause']; //branch['errors'].length > 0 && branch.children.length === 0;
	}

	$scope.getIconByTestState = function(state) {
		switch(state)
			{
				case 5:
				case 6:
					return "glyphicon glyphicon-minus-sign icon-red";
				case 1:
				case 2:
				case 3:
				case 7:
					return "glyphicon glyphicon-question-sign icon-gray";
				case 0:
					return "glyphicon glyphicon-exclamation-sign icon-yellow";
				case 4:
					return "glyphicon glyphicon-ok-sign icon-green";
			}
	}

	$scope.onLeafNodeCreate = function(branch){
		var type = branch['type'];
		if(type === 'TestStatus') {
			return $scope.getIconByTestState(branch['state']) + " leaf-icon";
			//return branch['state'] === 5 || branch['state'] === 6 ? "glyphicon glyphicon-remove-sign icon-red" : "glyphicon glyphicon-ok-sign icon-green";
		}

		if(type === 'Info' || type === 'InfoPartial') {
			return "glyphicon glyphicon-file icon-blue leaf-icon";
		}

		if(type === 'Warning') {
			return "glyphicon glyphicon-file icon-yellow leaf-icon";
		}

		if(type === 'Error') {
			return "glyphicon glyphicon-file icon-red leaf-icon";
		}

		if(type === 'TestPlan') {
			return "glyphicon glyphicon-list-alt icon-black leaf-icon";
		}

		if(type === 'AssemblyCompilationErrors') {
			return "glyphicon glyphicon-remove-sign icon-red leaf-icon";
		}

		return "glyphicon glyphicon-file leaf-icon";

		//return $scope.icons_defs[branch['type']] ? $scope.icons_defs[branch['type']] : $scope.icons_defs['default'];
	}

	//var errorsMarkup = "<p ng-if=\"row.branch['errors'].length > 0\">Errors ({{row.branch['errors'].length}}):</p>" +
	// 		"<ul ng-if=\"row.branch['errors'].length > 0\"><li ng-repeat=\"error in row.branch['errors']\" ng-class=\"!$last ? 'list-item-padding' : ''\"><pre class='pre-callstack'>{{error}}</pre></li></ul>";

	var errorsMarkup = "<p ng-if=\"row.branch['errors'].length > 0\"><pre-ex title=\"Errors ({{::row.branch['errors'].length}}):\" text-array=\"row.branch['errors']\"></pre-ex></p>";
	var artifactsMarkup = "<p ng-if=\"row.branch['artifacts'].length > 0\"><span>Artifacts ({{::row.branch['artifacts'].length}}):</span><ul><li ng-repeat=\"link in ::row.branch['artifacts']\"><a href=\"{{::link}}\" target=\"_blank\"><i class=\"glyphicon glyphicon-paperclip icon-black icon-artifact\"></i>{{::link}}</a></li></ul></p>";

	$scope.details_defs = {
		default: "<div><pre class='pre-callstack'>{{::row.branch['message'] ? row.branch['message'] : row.branch['description']}}</pre></div>" +
			"<p/>" +
			errorsMarkup,
		ArtifactPublish: "<div><pre class='pre-callstack'>{{::row.branch['destination']}}</pre></div>",
		ProcessInfo: "<div>" +
			"<details-wrapper icon-class=\"{{::row.branch['errors'].length === 0 ? 'glyphicon glyphicon-ok-sign icon-green details-icon' : 'glyphicon glyphicon-remove-sign icon-red details-icon'}}\">" +
			"<p>Process Id: <b>{{::row.branch['processId']}}</b></p>"+
			"<p><pre-ex title=\"Path:\" text=\"row.branch['path']\"/></p>"+
			"<p><pre-ex title=\"Arguments:\" text=\"row.branch['arguments']\"/></p>"+
			errorsMarkup +
			artifactsMarkup +
			"</details-wrapper>" +
			"</div>",
		TestGroup: "<div>" +
			"<details-wrapper icon-class=\"{{::row.branch['errors'].length === 0 ? 'glyphicon glyphicon-ok-sign icon-green details-icon' : 'glyphicon glyphicon-remove-sign icon-red details-icon'}}\">" +
			artifactsMarkup +
			errorsMarkup +
			"</details-wrapper>" +
			"</div>",
		TestPlan: "<div>"+
			"<details-wrapper icon-class=\"glyphicon glyphicon-list-alt icon-black details-icon\">" +
			"<p>Ready to run <b>{{::row.branch['tests'].length}}</b> tests:</p><ul><li ng-repeat=\"t in ::row.branch['tests']\">{{::t}}</li></ul>" +
			"</details-wrapper>" +
			"</div>",
		TestSuite: "<div>" +
			"<details-wrapper icon-class=\"{{::row.branch['errors'].length === 0 ? 'glyphicon glyphicon-ok-sign icon-green details-icon' : 'glyphicon glyphicon-remove-sign icon-red details-icon'}}\">" +
			"<p>Name: <b>{{::row.branch['name']}}</b></p>" +
			"<p>Scope: <b>{{::row.branch['scope']}}</b></p>" +
			"<p>Platform: <b>{{::row.branch['platform']}}</b></p>" +
			"<p><pre-ex title=\"Command to run locally:\" text=\"$parent.$parent.$parent.$parent.$parent.formatCommandLine(row.branch['minimalCommandLine'])\"></pre-ex></p>"+
			artifactsMarkup +
			errorsMarkup +
			"</details-wrapper>" +
			"</div>",
		TestStatus: "<div>" +
			"<details-wrapper icon-class=\"{{::$parent.$parent.$parent.getIconByTestState(row.branch['state']) + ' details-icon'}}\">" +
			//"<table class=\"details-table\"><tr><td class=\"details-image-cell\"><i ng-class=\"$parent.$parent.$parent.getIconByTestState(row.branch['state']) + ' details-icon'\"></i></td><td>" +
			"<p>Test Name: <b>{{::row.branch['name']}}</b></p>" +
			"<p>Test Fixture: <b>{{::row.branch['fixture']}}</b></p>" +
			"<p>Test Status: <b>{{::row.branch['state'] ? $parent.$parent.$parent.$parent.$parent.convertTestStateToString(row.branch['state']) : $parent.$parent.$parent.$parent.$parent.convertTestStateToString(0)}}</b></p>" +
			"<p>Test Execution Time: <b>{{::row.branch['durationMicroseconds'] ? (row.branch['durationMicroseconds']/1000).toHHMMSS() : (row.branch['duration']).toHHMMSS()}}</b></p>" +
			"<p ng-if=\"row.branch['message'] != null && row.branch['message'] != ''\"><pre-ex title=\"Message:\" text=\"row.branch['message']\"></pre-ex></p>"+
			"<p><pre-ex title=\"Command to run locally:\" text=\"$parent.$parent.$parent.$parent.$parent.formatCommandLine(row.branch['minimalCommandLine'])\"></pre-ex></p>"+
			artifactsMarkup +
			errorsMarkup +
			//"</td></tr></table>"+
			"</details-wrapper>" +
			"</div>",
		AssemblyCompilationErrors: "<div>" +
			"<details-wrapper icon-class=\"{{::row.branch['errors'].length === 0 ? 'glyphicon glyphicon-ok-sign icon-green details-icon' : 'glyphicon glyphicon-remove-sign icon-red details-icon'}}\">" +
			"<p>Assembly: <b>{{::row.branch['assembly']}}</b></p>" +
			errorsMarkup +
			"</details-wrapper>" +
			"</div>",
		TestSession: "<div>" +
			"<details-wrapper icon-class=\"{{::row.branch['summary'].success ? 'glyphicon glyphicon-ok-sign icon-green details-icon' : 'glyphicon glyphicon-remove-sign icon-red details-icon'}}\">" +
			//"<table class=\"details-table\"><tr><td class=\"details-image-cell\"><i ng-class=\"row.branch['summary'].success ? 'glyphicon glyphicon-ok-sign icon-green details-icon' : 'glyphicon glyphicon-remove-sign icon-red details-icon'\"\"></i></td><td>" +
			"<p>Run <b>{{::row.branch['summary'].testsCount}}</b> test(s). Passed: <b>{{::row.branch['summary'].successCount}}</b>, Failed: <b>{{::row.branch['summary'].failedCount + row.branch['summary'].errorCount}}</b>, Inconclusive: <b>{{::row.branch['summary'].inconclusiveCount}}</b>, Ignored: <b>{{::row.branch['summary'].ignoredCount}}</b>, Skipped: <b>{{::row.branch['summary'].skippedCount}}</b>, Not Runnable: <b>{{::row.branch['summary'].notRunCount}}</b></p>" +
			"<p>Overall result: <b><span ng-class=\"row.branch['summary'].success ? 'pass-color' : 'fail-color'\">{{::row.branch['summary'].success ? 'PASS' : 'FAIL'}}</span></b></p>" +
			"<p>Suites count: <b>{{::row.branch['summary'].suitesCount}}</b></p>" +
			"<p><pre-ex title=\"Command to run locally:\" text=\"$parent.$parent.$parent.$parent.$parent.formatCommandLine(row.branch['minimalCommandLine'])\"></pre-ex></p>"+
			artifactsMarkup +
			errorsMarkup +
			//"</td></tr></table>"+
			"</details-wrapper>" +
			"</div>",
		Action: "<div>" +
			"<details-wrapper icon-class=\"{{::row.branch['errors'].length === 0 ? 'glyphicon glyphicon-ok-sign icon-green details-icon' : 'glyphicon glyphicon-remove-sign icon-red details-icon'}}\">" +
			"<p>Name: <b>{{::row.branch['name']}}</b></p>" +
			artifactsMarkup +
			errorsMarkup +
			"</details-wrapper>" +
			"</div>",
	};

	$scope.formatCommandLine = function(cmdParams) {
		if(cmdParams == null || cmdParams.length === 0) {
			return "";
		}

		var cmdLine = "perl utr.pl ";
		for(var i=0; i<cmdParams.length; i++) {
			cmdLine += cmdParams[i] + " ";
		}
		return cmdLine;
	}

	$scope.expanding_property = {
		field: "type",
  		displayName: "Action",
  		cellCustomTemplate:
  		{
  		 		ArtifactPublish: "<div class=\"clipped\">{{::row.branch['destination']}}</div>",
  		 		ProcessInfo: "<div class=\"clipped\">{{::row.branch['path']}}</div>",
  		 		TestPlan: "<div>Ready to run <b>{{::row.branch['tests'].length}}</b> tests</div>",
  		 		TestStatus: "<div class=\"clipped\">{{::row.branch['name']}}</div>",
  		 		TestSuite: "<div ng-if=\"row.branch['errors'].length === 0\" class=\"clipped\">Run <b>{{::row.branch['name']}}</b> tests for <b>{{::row.branch['scope']}}</b>: <b><span class=\"pass-color\">PASS</span></b> (<b>{{::row.branch['summary'].successCount}}</b> test(s) passed)</div>" +
  		 			"<div ng-if=\"row.branch['errors'].length > 0\" class=\"clipped\">Run <b>{{::row.branch['name']}}</b> tests for <b>{{::row.branch['scope']}}</b>: <b><span class=\"fail-color\">FAIL</span></b> (<b>{{::row.branch['summary'].successCount}}</b> test(s) passed, <b>{{::row.branch['summary'].failedCount + row.branch['summary'].errorCount + row.branch['summary'].inconclusiveCount}}</b> test(s) failed, <b>{{::row.branch['summary'].compilationErrorsCount}}</b> compilation errors)</div>",
  		 		Info: "<div class=\"clipped\">{{::row.branch['message']}}</div>",
  		 		Warning: "<div class=\"clipped\">{{::row.branch['message']}}</div>",
  		 		Error: "<div class=\"clipped\">{{::row.branch['message']}}</div>",
  		 		InfoPartial: "<div class=\"clipped\">{{::row.branch['message']}}</div>",
  		 		AssemblyCompilationErrors: "<div class=\"clipped\">Assembly compilation failed: {{::row.branch['assembly']}}</div>",
  		 		TestSession: "<div class=\"clipped\">{{::row.branch['summary'].success ? 'Test Session Passed' : 'Test Session Failed'}}: <b>{{::row.branch['summary'].successCount}}</b> test(s) passed, <b>{{::row.branch['summary'].failedCount + row.branch['summary'].errorCount + row.branch['summary'].inconclusiveCount}}</b> test(s) failed, <b>{{::row.branch['summary'].compilationErrorsCount}}</b> compilation error(s)</div>",
  		 		TestGroup: "<div class=\"clipped\">{{::row.branch['name']}}</div>",

  		 		default: "<div class=\"clipped\">{{::row.branch['name']}} {{::row.branch['description']}}</div>",

  		 },
  		filterable: true,
  		width: "65%"
	}

	$scope.col_defs = [
  		{
  			field: "time",
  			displayName: "Time",
  			cellCustomTemplate: {
  				default: "<div>{{::row.branch[col.field] | date : \"HH:mm:ss\"}}</div>"
  			},
  			width: "5%",
  			class: "text-right",
  		},
  		{
  			displayName: "Artifacts",
    		cellCustomTemplate: {
  				//default: "<div><ul><li ng-repeat=\"item in row.branch['children']\" ng-if=\"item['type'] === 'ArtifactPublish'\"><a href=\"{{item.destination}}\" ng-click=\"on_click_with_no_propagation($event)\" target=\"_blank\">{{item.destination}}</a></li></ul></div>"
  				//default: "<ul><li ng-repeat=\"item in row.branch['artifacts']\"><div class=\"clipped\"><a href=\"{{item}}\" ng-click=\"on_click_with_no_propagation($event)\" target=\"_blank\">{{item}}</a></div></li></ul>"
  				default: "<div ng-if=\"row.branch['artifacts'].length > 0\"><i class=\"glyphicon glyphicon-paperclip icon-black\"></i> {{::row.branch['artifacts'].length}}</div>"
  			},
  			width: "23%"
  		},
  		{
  			field: "duration",
  			displayName: "Duration",
  			width: "7%",
  			cellCustomTemplate: {
  				default: "<div>{{::row.branch['durationMicroseconds'] ? (row.branch['durationMicroseconds']/1000).toHHMMSS() : (row.branch['duration']).toHHMMSS()}}</div>"
  			},
  			class: "text-right",
  			//sortable : true,
			//filterable : true
  		},
		];
});

Number.prototype.toHHMMSS = function () {
    //var sec_num = parseInt(this, 10);
    sec_num = this / 1000;
    if(sec_num < 0.0005)
    	return "0";

    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds.toFixed(3);} else {seconds = seconds.toFixed(3);}
    return hours+':'+minutes+':'+seconds;
};
