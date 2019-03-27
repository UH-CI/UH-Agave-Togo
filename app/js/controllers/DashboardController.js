angular.module('AgaveToGo').controller('DashboardController',
  function($rootScope, $scope, $http, $timeout, $filter, $localStorage, Commons, MonitorsController, AppsController, JobsController, SystemsController, StatusIoController, moment, amMoment, Jira, Preferences) {
    $scope.$on('$viewContentLoaded', function () {
      // initialize core components
      App.initAjax();
    });

    // set sidebar closed and body solid layout mode
    $rootScope.settings.layout.pageContentWhite = true;
    $rootScope.settings.layout.pageBodySolid = false;
    $rootScope.settings.layout.pageSidebarClosed = false;
    $scope.jobHistory = [];

    var usergen = function (count) {
      var users = [];
      for (var i = 0; i < count; i++) {
        var firstName = faker.name.firstName(),
            lastName = faker.name.lastName();


        users.push({
          img: '../assets/pages/media/users/avatar' + (i % 10 + 1) + '.jpg',
          name: firstName + ' ' + lastName,
          firstName: firstName,
          lastName: lastName,
          username: faker.internet.userName(),
          created: faker.date.recent(14)
        });
      }

      return users;
    };

    $scope.fakeUsers = usergen(20);

    var projectStatGen = function (count, numberOfDays) {
      var leaders = [];
      var result = {};
      angular.forEach(usergen(count), function (leader, i) {
        leader.comments = Commons.randomInt(5, 200) * numberOfDays;
        leader.jobs = Commons.randomInt(5, 200) * numberOfDays;
        leader.documents = Commons.randomInt(5, 200) * numberOfDays;
        leader.karma = Commons.randomInt(60, 99);
        leaders.push(leader);

        var userCount = 0;
        var userSignups = [];
        var dataPoints = 12;

        for (var i = 0; i < numberOfDays; i++) {
          var dailyUsers = Commons.randomInt(1, 20);
          //if (numberOfDays > 30) {
          //    userSignups[Math.ceil(i / dataPoints)] = dailyUsers;
          //} else if (numberOfDays > 7) {
          //    userSignups[Math.ceil(i / dataPoints)] = dailyUsers;
          //} else {
          //    userSignups.push(dailyUsers);
          //}
          userCount += dailyUsers;
        }

        for (var i = 0; i < dataPoints; i++) {
          userSignups.push(Commons.randomInt(1, 20));
        }

        var totals = {
          users: userCount,
          signups: userSignups,
          comments: Math.ceil(Commons.sum(leaders, 'comments') * userCount / 10),
          jobs: Math.ceil(Commons.sum(leaders, 'jobs') * userCount / 10),
          documents: Math.ceil(Commons.sum(leaders, 'documents') * userCount / 10),
          karma: Commons.randomInt(60, 99)
        };

        result = {totals: totals,leaders: leaders};
      })
      return result;
    };

    $scope.projectStatsTimeframe = 'daily';

    $scope.projectLeaders = {
      daily: projectStatGen(4, 1),
      weekly: projectStatGen(4, 7),
      monthly: projectStatGen(4, 30),
      alltime: projectStatGen(4, 365)
    };

    $("#project_sparkline_total").sparkline($scope.projectLeaders.alltime.totals.signups, {
      type: 'bar',
      width: '100',
      barWidth: 5,
      height: '55',
      barColor: '#ffb848',
      negBarColor: '#e02222'
    });

    $("#project_sparkline_day").sparkline($scope.projectLeaders.daily.totals.signups, {
      type: 'bar',
      width: '100',
      barWidth: 5,
      height: '55',
      barColor: '#35aa47',
      negBarColor: '#e02222'
    });

    $("#project_sparkline_week").sparkline($scope.projectLeaders.weekly.totals.signups, {
      type: 'bar',
      width: '100',
      barWidth: 5,
      height: '55',
      barColor: '#ffb848',
      negBarColor: '#e02222'
    });

    $("#project_sparkline_month").sparkline($scope.projectLeaders.monthly.totals.signups, {
      type: 'bar',
      width: '100',
      barWidth: 5,
      height: '55',
      barColor: '#35aa47',
      negBarColor: '#e02222'
    });

      StatusIoController.listStatuses().then(function(data) {
          $timeout(function () {
              $scope.platformStatuses = data.result;
          }, 50);
      },
      function(error) {
          $timeout(function () {
            $scope.platfomStatues = [];
          }, 0);
      });

      MonitorsController.listMonitoringTasks()
      .then(
        function(response) {
            $timeout(function () {
                $scope.monitors = response;
            }, 50);
        },
        function(response) {
            $timeout(function () {
                $scope.monitors = [];
            }, 50);
        }
      );

      $scope.systems = [];
      SystemsController.listSystems(9999999).then(
          function(response) {
              var systemCount = response.result.length;
              $timeout(function () {
                  if (systemCount) {
                      var systems = $filter('orderBy')(response.result, 'lastUpdated', true);
                      for (var i =0; i<Math.min(systemCount, 10); i++) {
                          $scope.systems.push(systems[i]);
                      }
                  }
                  else {
                      $scope.systems = [];
                  }

                  $scope.systemCount = systemCount;
              }, 50);
          },
          function(response) {
              $timeout(function () {
                  $scope.systems = [];
                  $scope.systemCount = 0;
              }, 50);
          });

      AppsController.listApps(9999999, 0, { filter: 'id' }).then(
          function(data) {
              var appCount = data.result.length;
              $timeout(function () {
                  $scope.apps = data.result;
                  $scope.appCount = appCount;
              }, 50);
          },
          function(response) {
              $timeout(function () {
                  $scope.apps = [];
                  $scope.appCount = 0;
              }, 50);
          });

      JobsController.listJobs(null, null, null, null, null, null, null, null, 999999).then(
          function(data) {
              var jobCount = data.result.length;
              $scope.jobCount = jobCount;
          },
          function (data) {
              $scope.jobCount = 0;
          });

    JobsController.listJobs(null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null).then(
        function (data) {
          $timeout(function () {
              $scope.jobListing = data.result;

          }, 50);
        },
        function (data) {
            $scope.jobListing = [];
        });

    // Jira.search('open').then(
    //     function (response) {
    //       if (response.total > 0) {
    //         $timeout(function () {
    //           $scope.jiraIssues = response.issues;
    //         }, 50);
    //       } else {
    //         $timeout(function () {
    //           $scope.jiraIssues = [];
    //         }, 50);
    //       }
    //     },
    //     function (response) {
    //       $timeout(function () {
    //         $scope.jiraIssues = [];
    //       }, 50);
    //     });
  })
.filter("jobStatusIcon", [function() {
  return function(status) {
    if (status === "PENDING") {
      return 'hourglass-half';
    } else if (status === "PROCESSING_INPUTS") {
      return 'list';
    } else if (status === "STAGING_INPUTS") {
      return 'exchange';
    } else if (status === "STAGING_COMPLETE") {
      return 'check';
    } else if (status === "STAGED") {
      return 'check';
    } else if (status === "SUBMITTING") {
      return 'terminal'
    } else if (status === "STAGING_JOB") {
      return 'terminal'
    } else if (status === "QUEUED") {
      return 'clock-o'
    } else if (status === "RUNNING") {
      return 'rocket'
    } else if (status === "CLEANING_UP") {
      return 'exclaimation';
    } else if (status === "ARCHIVING") {
      return 'exchange';
    } else if (status === "ARCHIVING_FINISHED") {
      return 'check';
    } else if (status === "ARCHIVING_FAILED") {
      return 'exclaimation';
    } else if (status === "FINISHED") {
      return 'check';
    } else if (status === "FAILED") {
      return 'exclaimation';
    } else if (status === "STOPPED") {
      return 'hand-stop-o';
    } else if (status === "PAUSED") {
      return 'exclaimation';
    } else {
      return 'rocket';
    }
  }
}]);
