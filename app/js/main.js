'use strict';

/***
 Agave ToGo AngularJS App Main Script
 ***/

/* Metronic App */
var AgaveToGo = angular.module('AgaveToGo', [
  'AgavePlatformScienceAPILib',
  'angular-cache',
  'angularMoment',
  'angularUtils.directives.dirPagination',
  'checklist-model',
  'CommonsService',
  'ds.objectDiff',
  'jsonFormatter',
  'JiraService',
  'ChangelogParserService',
  'ngCookies',
  'ngFileUpload',
  'ngSanitize',
  'ngStorage',
  'ngMd5',
  'ng.jsoneditor',
  'oc.lazyLoad',
  'pascalprecht.translate',
  'schemaForm',
  'schemaFormWizard',
  'angular-underscore/filters',
  'TagsService',
  'timer',
  'toastr',
  'ui.bootstrap',
  'ui.router',
  'ui.select',
  'emguo.poller',
  'togo.preferences',
  'FileManagerApp',
  'ngclipboard',
]);

AgaveToGo.config(function(fileManagerConfigProvider) {
  fileManagerConfigProvider.set({
    tplPath: '../bower_components/angular-filebrowser/src/templates',
    allowedActions: {
      rename: true,
      copy: true,
      edit: true,
      changePermissions: true,
      compress: false,
      compressChooseName: true,
      extract: false,
      download: true,
      preview: true,
      remove: true,
      postits: true,
      publish: false,
      notifications: true
    },
  });
});

AgaveToGo.config(function ($locationProvider, $translateProvider, $translatePartialLoaderProvider ) {

  $locationProvider.html5Mode({
    enabled: false,
    //hashPrefix: '!',
    required: false
  });

  /**
   * Angular translate config
   */
  $translatePartialLoaderProvider.addPart('shared');
  $translateProvider
      .useSanitizeValueStrategy(null)// for prevent from XSS vulnerability but this has problem with utf-8 language
      .fallbackLanguage('en-us') //Registering a fallback language
      .registerAvailableLanguageKeys(['en-us', 'es-419'], { // register your language key and browser key find
        'en_*': 'en-us',
        'es_*': 'es-419'
      })
      .useLoader('$translatePartialLoader', { // for lazy load we use this service
        // urlTemplate: 'app/{part}/lang/locale_{lang}.json',// in this section we define our structure
        urlTemplate: 'js/lang/{part}/local_{lang}.json',// in this section we define our structure
        loadFailureHandler: 'MyErrorHandler'//it's a factory to error handling
      })
      .useLoaderCache(true)//use cache to loading translate file
      .useMissingTranslationHandlerLog() // you can remove in production
      // .useLocalStorage(true)
      //.determinePreferredLanguage();// define language by browser language
      .preferredLanguage('en-us');

});

AgaveToGo.config(function ($provide) {
  $provide.decorator('$q', function ($delegate) {

    /**
     * $q.allSettled returns a promise that is fulfilled with an array of promise state snapshots,
     * but only after all the original promises have settled, i.e. become either fulfilled or rejected.
     *
     * This method is often used in order to execute a number of operations concurrently and be
     * notified when they all finish, regardless of success or failure.
     *
     * @param promises array or object of promises
     * @returns {Promise} when resolved will contain an an array or object of resolved or rejected promises.
     * A resolved promise have the form { status: 'fulfilled', value: value }.  A rejected promise will have
     * the form { status: 'rejected', reason: reason }.
     */
    function allSettled(promises) {
      var deferred = $delegate.defer(),
          counter = 0,
          results = angular.isArray(promises) ? [] : {};

      angular.forEach(promises, function (promise, key) {
        counter++;
        $delegate.when(promise).then(function (value) {
          if (results.hasOwnProperty(key)) {
            return;
          }
          results[key] = {status: 'fulfilled', value: value};
          if (!(--counter)) {
            deferred.resolve(results);
          }
        }, function (reason) {
          if (results.hasOwnProperty(key)) {
            return;
          }
          results[key] = {status: 'rejected', reason: reason};
          if (!(--counter)) {
            deferred.resolve(results);
          }
        });
      });

      if (counter === 0) {
        deferred.resolve(results);
      }

      return deferred.promise;
    }

    $delegate.allSettled = allSettled;
    return $delegate;
  });
});


AgaveToGo.constant('angularMomentConfig', {
  timezone: 'America/Chicago' // optional
})
.constant('amTimeAgoConfig', {
    fullDateThreshold: 1,
    fullDateFormat: 'MMM D, YYYY'
});

AgaveToGo.config(['$controllerProvider', function ($controllerProvider) {
  // this option might be handy for migrating old apps, but please don't use it
  // in new ones!
  $controllerProvider.allowGlobals();
}]);


/* Setup global settings */
AgaveToGo.factory('settings', ['$rootScope', function ($rootScope) {
  // supported languages
  var settings = {
    layout: {
      pageSidebarClosed: false, // sidebar menu state
      pageContentWhite: true, // set page content layout
      pageBodySolid: false, // solid body color state
      pageAutoScrollOnLoad: 1000 // auto scroll to top on page load
    },
    assetsPath: '../assets',
    globalPath: '../assets/global',
    layoutPath: '../assets/layouts/layout',
  };

  $rootScope.settings = settings;

  return settings;
}]);

/* Setup App Main Controller */
AgaveToGo.controller('AppController', ['$scope', '$rootScope', function ($scope) {
  $scope.$on('$viewContentLoaded', function () {
    // App.initComponents(); // init core components
    // Layout.init(); //  Init entire layout(header, footer, sidebar, etc) on page load if the partials included in server side instead of loading with ng-include directive
  });
}]);

/***
 Layout Partials.
 By default the partials are loaded through AngularJS ng-include directive. In case they loaded in server side(e.g: PHP include function) then below partial
 initialization can be disabled and Layout.init() should be called on page load complete as explained above.
 ***/

/* Setup Layout Part - Header */
AgaveToGo.controller('HeaderController', ['$scope', '$localStorage', 'StatusIoController', 'poller', 'moment', function ($scope, $localStorage, StatusIoController, poller, moment) {
  $scope.showTokenCountdown = false;
  $scope.loggedIn = false;

  // get token countdown time
  if (typeof $localStorage.token !== 'undefined') {
    var currentDate = new Date();
    var expirationDate = Date.parse($localStorage.token.expires_at);
    var diff = Math.abs((expirationDate - currentDate) / 60000);
    $scope.tokenCountdown = diff * 60;
    $scope.loggedIn = (diff > 0);
    $scope.tenant = $localStorage.tenant;
  }

  $scope.authenticatedUser = $localStorage.activeProfile;
  $scope.platformStatus = {status: 'Up', statusCode: 100, incidents: [], issues: []};

  /**
   * Start a poller to check the statusio feed since we do not
   * receive events on it when running client-side.
   */
  $scope.statusioPoller = poller.get(StatusIoController, {
    action: 'listStatuses',
    delay: 1800000, // check every half hour when active
    idleDelay: 3600000, // Default value is 60 minutes
    smart: true
  });

  $scope.statusioPoller.promise.then(null, null, updateStatusMenu);

  var updateStatusMenu = function (data) {
    var issues = [];
    for (var i = 0; i < data.result.status.length; i++) {
      if (data.result.status[i].status_code !== 100) {
        issues.push({
          'component': data.result.status[i].name,
          'container': data.result.status[i].containers[0].name,
          'status': data.result.status[i].status,
          'statusCode': data.result.status[i].status_code,
          'updated': data.result.status[i].updated
        });
      }
    }

    setTimeout(function () {
      $scope.lastStatusCheckedAt = moment();
      $scope.platformStatus.incidents = data.result.incidents;
      $scope.platformStatus.status = data.result.status_overall.status;
      $scope.platformStatus.statusCode = data.result.status_overall.status_code;
      $scope.platformStatus.issues = issues;

    }, 0);
  };

  $scope.$on('$includeContentLoaded', function () {
    Layout.initHeader(); // init header
  });
}]);

/* Setup Layout Part - Sidebar */
AgaveToGo.controller('SidebarController', ['$scope', function ($scope) {
  $scope.$on('$includeContentLoaded', function () {
    Layout.initSidebar(); // init sidebar
  });
}]);

/* Setup Layout Part - Quick Sidebar */
AgaveToGo.controller('QuickSidebarController', ['$scope', '$localStorage', 'ChangelogParser', function ($scope, $localStorage, ChangelogParser) {
  $scope.$on('$includeContentLoaded', function () {
    $scope.changelog = {};

    $scope.tenant = $localStorage.tenant;
    $scope.alerts = [];

    $scope.isDevEnvironment = function () {
      return settings.environment == 'development' || settings.environemnt == 'devel' || settings.environment == 'dev';
    };

    $scope.isOnline = function() {
      return settings.online;
    };

    $scope.toggleOnline = function() {
      settings.online = !settings.online;
    };


    // ChangelogParser.latest().then(function (data) {
    //   if (data) {
    //
    //     for (var version in data) {
    //       break;
    //     }
    //     $scope.changelog = data[version];
    //     $scope.changelog.version = version;
    //
    //   }
    // });

    setTimeout(function () {
      QuickSidebar.init(); // init quick sidebar

    }, 2000)


  });
}]);

/* Setup Layout Part - Theme Panel */
AgaveToGo.controller('ThemePanelController', ['$scope', function ($scope) {
  $scope.$on('$includeContentLoaded', function () {
    Demo.init(); // init theme panel
  });
}]);

/* Setup Layout Part - Footer */
AgaveToGo.controller('FooterController', ['$scope', function ($scope) {
  $scope.$on('$includeContentLoaded', function () {
    Layout.initFooter(); // init footer
  });
}]);


/**
 * ToGo custom config
 */
/* Setup Rounting For All Pages */
AgaveToGo.config(['$stateProvider', '$urlRouterProvider', '$urlMatcherFactoryProvider', function ($stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider) {
  function valToString(val) {
    return val != null ? val.toString() : val;
  }

  function valFromString(val) {
    return val != null ? val.toString() : val;
  }

  function regexpMatches(val) { /*jshint validthis:true */
    return this.pattern.test(val);
  }

  // Redirect any unmatched url
  $urlRouterProvider.otherwise('/dashboard');

  $urlRouterProvider.rule(function ($injector, $location) {
    // var path = $location.path().replace(/\/\/+/g, '/');
    // $location.replace().path(path);
  });

  $urlMatcherFactoryProvider.type('systemId', {
    encode: function(system) {
      // Represent the list item in the URL using its corresponding index
      if (angular.isObject(system)) {
        return system.id
      }
      else {
        return system;
      }
    },
    decode: function(system) {
      // Look up the list item by index
      return SystemsController.getSystemDetails(system).then(
          function(response) {
            return response.result;
          },
          function(err) {
            return null;
          });
    },
    is: function(system) {
      // Ensure the item is valid by checking to see that it appears
      // in the list
      return !angular.isUndefined(system);
    }
  });

  $urlMatcherFactoryProvider.type('filePath', {
    encode: function(filePath) {
      return filePath;
    },
    decode: function(filePath) {
      return decodeURIComponent(filePath);
    },
    is: function(filePath) {
      // Ensure the item is valid by checking to see that it appears
      // in the list
      return true;
    }
  });

  // Make trailing slashed options
  $urlMatcherFactoryProvider.strictMode(false);
  $stateProvider
  // Dashboard
      .state('dashboard', {
        url: '/dashboard',
        templateUrl: 'views/dashboard.html',
        data: {pageTitle: 'Admin Dashboard Template'},
        controller: 'DashboardController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              name: 'AgaveToGo',
              insertBefore: '#ng_load_plugins_before', // load the above css files before a LINK element with this ID. Dynamic CSS files must be loaded between core and theme css files
              files: [
                '../assets/global/plugins/morris/morris.css',
                '../assets/global/plugins/morris/morris.min.js',
                '../assets/global/plugins/morris/raphael-min.js',
                '../assets/global/plugins/jquery.sparkline.min.js',
                '../assets/pages/scripts/dashboard.min.js',
                '../bower_components/faker/build/build/faker.min.js',
                'js/controllers/DashboardController.js',
              ]
            });
          }]
        }
      })

      /**********************************************************************/
      /**********************************************************************/
      /***                                                                ***/
      /***                       Jobs Routes                              ***/
      /***                                                                ***/
      /**********************************************************************/
      /**********************************************************************/
      .state('jobs-manage', {
        url: '/jobs',
        templateUrl: 'views/jobs/manager.html',
        data: {pageTitle: 'Jobs Manager'},
        controller: 'JobsDirectoryController',
        resolve: {
          // deps: ['$ocLazyLoad', function (trans, $ocLazyLoad) {
          //   return $ocLazyLoad.load(['angular-moment', 'ui-bs-modal', 'ActionService', 'MessageService', 'PermissionService', 'RolesService', 'QueryBuilder']).then(
          //       function () {
          //         return $ocLazyLoad.load(['js/controllers/jobs/JobsDirectoryController.js']);
          //       }
          //   );
          // }],
          deps: ['$ocLazyLoad', function($ocLazyLoad) {
              return $ocLazyLoad.load({
                  serie: true,
                  name: 'AgaveToGo',
                  insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
                  files: [
                      // '../bower_components/holderjs/holder.js',
                      'js/services/ActionsService.js',
                      'js/services/MessageService.js',
                      'js/services/PermissionsService.js',
                      'js/services/RolesService.js',
                      'js/controllers/QueryBuilderController.js',
                      'js/controllers/jobs/JobsDirectoryController.js'
                  ]
              });
          }]
          // resolvedJobs: function (deps, JobsController) {
          //   return JobsController.getJobDetails($stateParams.id)
          //       .then(
          //           function (response) {
          //             return response.result;
          //             $scope.requesting = false;
          //           },
          //           function (response) {
          //             MessageService.handle(response, $translate.instant('error_jobs_list'));
          //             $scope.requesting = false;
          //           }
          //       );
          // }
        }
      })

      .state('jobs', {
        abtract: true,
        url: '/jobs/:id',
        templateUrl: 'views/jobs/resource/resource.html',
        controller: 'JobsResourceController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                name: 'AgaveToGo',
                files: [
                  'js/controllers/jobs/resource/JobsResourceController.js'
                ]
              }
            ]);
          }]

        }
      })

      .state('jobs.details', {
        url: '',
        templateUrl: 'views/jobs/resource/details.html',
        controller: 'JobsResourceDetailsController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                name: 'AgaveToGo',
                files: [
                  'js/services/ActionsService.js',
                  'js/services/MessageService.js',
                  'js/services/PermissionsService.js',
                  'js/controllers/jobs/resource/JobsResourceDetailsController.js'
                ]
              }
            ]);
          }]
        }
      })

      .state('jobs.history', {
        url: '/history',
        controller: 'JobsResourceHistoryController',
        templateUrl: 'views/jobs/resource/history.html',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                name: 'AgaveToGo',
                files: [
                  'js/services/ActionsService.js',
                  'js/controllers/jobs/resource/JobsResourceHistoryController.js'
                ]
              }
            ]);
          }]
        }
      })

      .state('jobs.stats', {
        url: '/jobs',
        controller: 'JobsResourceStatsController',
        templateUrl: 'views/jobs/resource/stats.html',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                name: 'AgaveToGo',
                files: [
                  'js/controllers/jobs/resource/JobsResourceStatsController.js'
                ]
              }
            ]);
          }]
        }
      })

      /**********************************************************************/
      /**********************************************************************/
      /***                                                                ***/
      /***                       Jobs Routes                              ***/
      /***                                                                ***/
      /**********************************************************************/
      /**********************************************************************/
      .state('clients-manage', {
        url: '/clients',
        templateUrl: 'views/clients/manager.html',
        data: {pageTitle: 'Clients Manager'},
        controller: 'ClientsDirectoryController',
        resolve: {
          deps: ['$ocLazyLoad', function($ocLazyLoad) {
            return $ocLazyLoad.load({
              serie: true,
              name: 'AgaveToGo',
              insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
              files: [
                '../bower_components/sjcl/sjcl.js',
                'js/services/ActionsService.js',
                'js/services/MessageService.js',
                'js/services/PermissionsService.js',
                'js/services/RolesService.js',
                'js/services/EncryptionService.js',
                'js/controllers/QueryBuilderController.js',
                'js/controllers/clients/ClientsDirectoryController.js'
              ]
            });
          }]
        }
      })

      .state('clients', {
        abtract: true,
        url: '/clients/:id',
        templateUrl: 'views/clients/resource/resource.html',
        controller: 'ClientsResourceController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                name: 'AgaveToGo',
                files: [
                  'js/controllers/clients/resource/ClientsResourceController.js'
                ]
              }
            ]);
          }]

        }
      })

      .state('clients.details', {
        url: '',
        templateUrl: 'views/clients/resource/details.html',
        controller: 'ClientsResourceDetailsController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                name: 'AgaveToGo',
                files: [
                  'js/services/ActionsService.js',
                  'js/services/MessageService.js',
                  'js/services/PermissionsService.js',
                  'js/controllers/clients/resource/ClientsResourceDetailsController.js'
                ]
              }
            ]);
          }]
        }
      })

      .state('clients.subscriptions', {
        url: '/history',
        controller: 'ClientsResourceHistoryController',
        templateUrl: 'views/clients/resource/subscriptions.html',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                name: 'AgaveToGo',
                files: [
                  'js/services/ActionsService.js',
                  'js/controllers/clients/resource/ClientsResourceHistoryController.js'
                ]
              }
            ]);
          }]
        }
      })

      .state('clients.stats', {
        url: '/stats',
        controller: 'ClientsResourceStatsController',
        templateUrl: 'views/clients/resource/stats.html',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                name: 'AgaveToGo',
                files: [
                  'js/controllers/clients/resource/ClientsResourceStatsController.js'
                ]
              }
            ]);
          }]
        }
      })

      /**********************************************************************/
      /**********************************************************************/
      /***                                                                ***/
      /***                         Metadata Routes                        ***/
      /***                                                                ***/
      /**********************************************************************/
      /**********************************************************************/

      .state('meta-schema-manager', {
        url: '/meta/schema',
        templateUrl: 'views/meta/schema-manager.html',
        data: {pageTitle: 'Metadata Schema Manager'},
        controller: 'SchemaManagerDirectoryController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              serie: true,
              name: 'AgaveToGo',
              insertBefore: '#ng_load_plugins_before',
              files: [
                'js/services/ActionsService.js',
                'js/services/ActionsBulkService.js',
                'js/services/MessageService.js',
                'js/controllers/meta/SchemaManagerDirectoryController.js'
              ]
            });
          }]
        }
      })

      .state('meta-schema-add', {
        url: '/meta/schema/add',
        data: {pageTitle: 'Metadata Schema Add'},
        templateUrl: 'views/meta/schema-add.html',
        controller: 'SchemaAddController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                serie: true,
                name: 'AgaveToGo',
                files: [
                  'js/services/ActionsService.js',
                  'js/services/MessageService.js',
                  'js/controllers/meta/SchemaAddController.js'
                ]
              }
            ]);
          }]
        }
      })

      .state('meta-schema-edit', {
        url: '/meta/schema/edit/:uuid',
        params: {
          uuid: '',
        },
        data: {pageTitle: 'Metadata Schema Edit'},
        templateUrl: 'views/meta/schema-edit.html',
        controller: 'SchemaEditController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                serie: true,
                name: 'AgaveToGo',
                files: [
                  'js/services/ActionsService.js',
                  'js/services/MessageService.js',
                  'js/controllers/meta/SchemaEditController.js'
                ]
              }
            ]);
          }]
        }
      })


      .state('meta-manager', {
        url: '/meta',
        templateUrl: 'views/meta/meta-manager.html',
        data: {pageTitle: 'Metadata Manager'},
        controller: 'MetaManagerDirectoryController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              serie: true,
              name: 'AgaveToGo',
              insertBefore: '#ng_load_plugins_before',
              files: [
                'js/services/ActionsService.js',
                'js/services/ActionsBulkService.js',
                'js/services/MessageService.js',
                'js/services/PermissionsService.js',
                'js/controllers/meta/MetaManagerDirectoryController.js'
              ]
            });
          }]
        }
      })


      .state('meta-add', {
        url: '/meta/add',
        data: {pageTitle: 'Metadata Add'},
        templateUrl: 'views/meta/meta-add.html',
        controller: 'MetaAddController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                serie: true,
                name: 'AgaveToGo',
                files: [
                  '../bower_components/ng-file-upload/ng-file-upload.min.js',
                  'js/services/ActionsService.js',
                  'js/services/MessageService.js',
                  'js/controllers/meta/MetaAddController.js'
                ]
              }
            ]);
          }]
        }
      })

      .state('meta-edit', {
        url: '/meta/edit/:id',
        params: {
          uuid: '',
        },
        data: {pageTitle: 'Metadata Edit'},
        templateUrl: 'views/meta/meta-edit.html',
        controller: 'MetaEditController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                serie: true,
                name: 'AgaveToGo',
                files: [
                  'js/services/ActionsService.js',
                  'js/services/MessageService.js',
                  'js/controllers/meta/MetaEditController.js'
                ]
              }
            ]);
          }]
        }
      })



      /**********************************************************************/
      /**********************************************************************/
      /***                                                                ***/
      /***                       Notifications Routes                     ***/
      /***                                                                ***/
      /**********************************************************************/
      /**********************************************************************/

      .state('notifications-noslash', {
        url: '/notifications',
        templateUrl: 'views/notifications/manager.html',
        data: {pageTitle: 'Notifications Manager'},
        controller: 'NotificationsManagerDirectoryController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              serie: true,
              name: 'AgaveToGo',
              insertBefore: '#ng_load_plugins_before',
              files: [
                'js/services/ActionsService.js',
                'js/services/ActionsBulkService.js',
                'js/services/MessageService.js',
                'js/controllers/QueryBuilderController.js',
                'js/controllers/notifications/NotificationsManagerDirectoryController.js'
              ]
            });
          }]
        }
      })

      .state('notifications-manager-noslash', {
        url: '/notifications/manager',
        templateUrl: 'views/notifications/manager.html',
        data: {pageTitle: 'Notifications Manager'},
        controller: 'NotificationsManagerDirectoryController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              serie: true,
              name: 'AgaveToGo',
              insertBefore: '#ng_load_plugins_before',
              files: [
                'js/services/ActionsService.js',
                'js/services/ActionsBulkService.js',
                'js/services/MessageService.js',
                'js/controllers/QueryBuilderController.js',
                'js/controllers/notifications/NotificationsManagerDirectoryController.js'
              ]
            });
          }]
        }
      })

      .state('notifications-manager', {
        url: '/notifications/manager/:associatedUuid',
        params: {
          associatedUuid: '',
          resourceType: ''
        },
        templateUrl: 'views/notifications/manager.html',
        data: {pageTitle: 'Notifications Manager'},
        controller: 'NotificationsManagerDirectoryController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              serie: true,
              name: 'AgaveToGo',
              insertBefore: '#ng_load_plugins_before',
              files: [
                'js/services/ActionsService.js',
                'js/services/ActionsBulkService.js',
                'js/services/MessageService.js',
                'js/controllers/QueryBuilderController.js',
                'js/controllers/notifications/NotificationsManagerDirectoryController.js'
              ]
            });
          }]
        }
      })

      .state('notifications-edit', {
        url: '/notifications/edit/:notificationId',
        templateUrl: 'views/notifications/resource/edit.html',
        controller: 'NotificationsResourceEditController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                serie: true,
                name: 'AgaveToGo',
                files: [
                  'js/services/RequestBin.js',
                  'js/services/ActionsService.js',
                  'js/services/MessageService.js',
                  'js/controllers/notifications/resource/NotificationsResourceEditController.js'
                ]
              }
            ]);
          }]
        }
      })

      .state('notifications-add-noslash', {
        url: '/notifications/add',
        params: {
          associatedUuid: '',
          resourceType: ''
        },
        templateUrl: 'views/notifications/resource/add.html',
        controller: 'NotificationsResourceAddController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                serie: true,
                name: 'AgaveToGo',
                files: [
                  'js/services/RequestBin.js',
                  'js/services/ActionsService.js',
                  'js/services/MessageService.js',
                  'js/controllers/notifications/resource/NotificationsResourceAddController.js'
                ]
              }
            ]);
          }]
        }
      })

      .state('notifications-add', {
        url: '/notifications/add/:associatedUuid',
        params: {
          associatedUuid: '',
          resourceType: ''
        },
        templateUrl: 'views/notifications/resource/add.html',
        controller: 'NotificationsResourceAddController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                serie: true,
                name: 'AgaveToGo',
                files: [
                  'js/services/RequestBin.js',
                  'js/services/ActionsService.js',
                  'js/services/MessageService.js',
                  'js/controllers/notifications/resource/NotificationsResourceAddController.js'
                ]
              }
            ]);
          }]
        }
      })

      .state('notifications-alerts-id', {
        url: '/notifications/alerts/:id',
        templateUrl: 'views/notifications/alerts.html',
        data: {pageTitle: 'Notifications Alerts'},
        controller: 'NotificationsAlertsDirectoryController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              serie: true,
              name: 'AgaveToGo',
              insertBefore: '#ng_load_plugins_before',
              files: [
                'js/services/ActionsService.js',
                'js/services/ActionsBulkService.js',
                'js/services/MessageService.js',
                'js/controllers/QueryBuilderController.js',
                'js/controllers/notifications/NotificationsAlertsDirectoryController.js'
              ]
            });
          }]
        }
      })

      .state('notifications-history', {
        url: '/notifications/alerts',
        templateUrl: 'views/notifications/alerts.html',
        data: {pageTitle: 'Notifications History'},
        controller: 'NotificationsAlertsDirectoryController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              serie: true,
              name: 'AgaveToGo',
              insertBefore: '#ng_load_plugins_before',
              files: [
                'js/services/ActionsService.js',
                'js/services/ActionsBulkService.js',
                'js/services/MessageService.js',
                'js/controllers/QueryBuilderController.js',
                'js/controllers/notifications/NotificationsAlertsDirectoryController.js'
              ]
            });
          }]
        }
      })

      .state('notifications', {
        abtract: true,
        url: '/notifications/:id',
        templateUrl: 'views/notifications/resource/resource.html',
        controller: 'NotificationsResourceController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                name: 'AgaveToGo',
                files: [
                  'js/controllers/notifications/resource/NotificationsResourceController.js'
                ]
              }
            ]);
          }]
        }
      })

      .state('notifications.details', {
        url: '',
        templateUrl: 'views/notifications/resource/details.html',
        controller: 'NotificationsResourceDetailsController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                serie: true,
                name: 'AgaveToGo',
                files: [
                  'js/services/ActionsService.js',
                  'js/services/PermissionsService.js',
                  'js/controllers/notifications/resource/NotificationsResourceDetailsController.js'
                ]
              }
            ]);
          }]
        }
      })

      /**********************************************************************/
      /**********************************************************************/
      /***                                                                ***/
      /***                       Monitors Routes                          ***/
      /***                                                                ***/
      /**********************************************************************/
      /**********************************************************************/

      .state('monitors-noslash', {
        url: '/monitors',
        templateUrl: 'views/monitors/manager.html',
        data: {pageTitle: 'Monitors Manager'},
        controller: 'MonitorsManagerDirectoryController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              serie: true,
              name: 'AgaveToGo',
              insertBefore: '#ng_load_plugins_before',
              files: [
                'js/services/ActionsService.js',
                'js/services/MessageService.js',
                'js/controllers/QueryBuilderController.js',
                'js/controllers/monitors/MonitorsManagerDirectoryController.js'
              ]
            });
          }]
        }
      })

      .state('monitors-manager-noslash', {
        url: '/monitors/manager',
        templateUrl: 'views/monitors/manager.html',
        data: {pageTitle: 'Monitors Manager'},
        controller: 'MonitorsManagerDirectoryController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              serie: true,
              name: 'AgaveToGo',
              insertBefore: '#ng_load_plugins_before',
              files: [
                'js/services/ActionsService.js',
                'js/services/MessageService.js',
                'js/controllers/QueryBuilderController.js',
                'js/controllers/monitors/MonitorsManagerDirectoryController.js'
              ]
            });
          }]
        }
      })

      .state('monitors-manager', {
        url: '/monitors/manager/:systemId',
        params: {
          systemId: ''
        },
        templateUrl: 'views/monitors/manager.html',
        data: {pageTitle: 'Monitors Manager'},
        controller: 'MonitorsManagerDirectoryController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              serie: true,
              name: 'AgaveToGo',
              insertBefore: '#ng_load_plugins_before',
              files: [
                'js/services/ActionsService.js',
                'js/services/MessageService.js',
                'js/controllers/QueryBuilderController.js',
                'js/controllers/monitors/MonitorsManagerDirectoryController.js'
              ]
            });
          }]
        }
      })

      .state('monitors-edit', {
        url: '/monitors/edit/:monitorId',
        templateUrl: 'views/monitors/resource/edit.html',
        controller: 'MonitorsResourceEditController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                serie: true,
                name: 'AgaveToGo',
                files: [
                  'js/services/ActionsService.js',
                  'js/services/MessageService.js',
                  'js/controllers/monitors/resource/MonitorsResourceEditController.js'
                ]
              }
            ]);
          }]
        }
      })

      .state('monitors-add-noslash', {
        url: '/monitors/add',
        params: {
          associatedUuid: '',
          resourceType: ''
        },
        templateUrl: 'views/monitors/resource/add.html',
        controller: 'MonitorsResourceAddController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                serie: true,
                name: 'AgaveToGo',
                files: [
                  'js/services/ActionsService.js',
                  'js/services/MessageService.js',
                  'js/controllers/monitors/resource/MonitorsResourceAddController.js'
                ]
              }
            ]);
          }]
        }
      })

      .state('monitors-add', {
        url: '/monitors/add/:systemId',
        params: {
          systemId: ''
        },
        templateUrl: 'views/monitors/resource/add.html',
        controller: 'MonitorsResourceAddController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                serie: true,
                name: 'AgaveToGo',
                files: [
                  'js/services/ActionsService.js',
                  'js/services/MessageService.js',
                  'js/controllers/monitors/resource/MonitorsResourceAddController.js'
                ]
              }
            ]);
          }]
        }
      })

      .state('monitors-checks', {
        url: '/monitors/checks',
        templateUrl: 'views/monitors/checks.html',
        data: {pageTitle: 'Monitors Checks'},
        controller: 'MonitorsChecksDirectoryController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              serie: true,
              name: 'AgaveToGo',
              insertBefore: '#ng_load_plugins_before',
              files: [
                'js/services/ActionsService.js',
                'js/services/MessageService.js',
                'js/controllers/QueryBuilderController.js',
                'js/controllers/monitors/MonitorsChecksDirectoryController.js'
              ]
            });
          }]
        }
      })

      .state('monitors-checks-id', {
        url: '/monitors/checks/:monitorId',
        templateUrl: 'views/monitors/checks.html',
        data: {pageTitle: 'Monitors Checks'},
        controller: 'MonitorsChecksDirectoryController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              serie: true,
              name: 'AgaveToGo',
              insertBefore: '#ng_load_plugins_before',
              files: [
                'js/services/ActionsService.js',
                'js/services/MessageService.js',
                'js/controllers/QueryBuilderController.js',
                'js/controllers/monitors/MonitorsChecksDirectoryController.js'
              ]
            });
          }]
        }
      })

      .state('monitors', {
        abtract: true,
        url: '/monitors/:id',
        templateUrl: 'views/monitors/resource/resource.html',
        controller: 'MonitorsResourceController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                name: 'AgaveToGo',
                files: [
                  'js/controllers/monitors/resource/MonitorsResourceController.js'
                ]
              }
            ]);
          }]
        }
      })

      .state('monitors.details', {
        url: '',
        templateUrl: 'views/monitors/resource/details.html',
        controller: 'MonitorsResourceDetailsController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                serie: true,
                name: 'AgaveToGo',
                files: [
                  'js/services/ActionsService.js',
                  'js/services/MessageService.js',
                  'js/services/PermissionsService.js',
                  'js/controllers/monitors/resource/MonitorsResourceDetailsController.js'
                ]
              }
            ]);
          }]
        }
      })

      /**********************************************************************/
      /**********************************************************************/
      /***                                                                ***/
      /***                       Applications Routes                      ***/
      /***                                                                ***/
      /**********************************************************************/
      /**********************************************************************/

      .state('apps-edit', {
        url: '/apps/edit/:appId',
        templateUrl: 'views/apps/edit-wizard.html',
        data: {pageTitle: 'App Edit Wizard'},
        controller: 'AppEditWizardController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
                  serie: true,
                  name: 'AgaveToGo',
                  files: [
                    '../bower_components/codemirror/lib/codemirror.css',
                    '../bower_components/codemirror/theme/neo.css',
                    '../bower_components/codemirror/lib/codemirror.js',
                    '../bower_components/angular-ui-codemirror/ui-codemirror.min.js',

                    'js/services/MessageService.js',
                    'js/controllers/apps/AppEditWizardController.js'
                  ]
                },
                'ui.codemirror'
            );
          }]
        }
      })


      .state('apps-new', {
        url: '/apps/new',
        templateUrl: 'views/apps/wizard.html',
        data: {pageTitle: 'App Builder Wizard'},
        controller: 'AppBuilderWizardController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
                  serie: true,
                  name: 'AgaveToGo',
                  files: [
                    '../bower_components/codemirror/lib/codemirror.css',
                    '../bower_components/codemirror/theme/neo.css',
                    '../bower_components/codemirror/lib/codemirror.js',
                    '../bower_components/angular-ui-codemirror/ui-codemirror.min.js',

                    'js/services/MessageService.js',
                    'js/controllers/apps/AppBuilderWizardController.js'
                  ]
                },
                'ui.codemirror'
            );
          }]
        }
      })

      .state('apps-manage', {
        url: '/apps',
        templateUrl: 'views/apps/manager.html',
        data: {pageTitle: 'App Manager'},
        controller: 'AppDirectoryController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              serie: true,
              name: 'AgaveToGo',
              insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
              files: [
                'js/services/ActionsService.js',
                'js/services/MessageService.js',
                'js/services/PermissionsService.js',
                'js/controllers/QueryBuilderController.js',
                'js/controllers/apps/AppDirectoryController.js',
                'js/controllers/modals/ModalConfirmResourceActionController.js',
                'js/controllers/modals/ModalPermissionEditorController.js'
              ]
            });
          }]
        }
      })

      .state('apps-manage-slash', {
        url: '/apps/',
        templateUrl: 'views/apps/manager.html',
        data: {pageTitle: 'App Manager'},
        controller: 'AppDirectoryController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              serie: true,
              name: 'AgaveToGo',
              insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
              files: [
                // '../assets/global/scripts/datatable.js',
                '../bower_components/holderjs/holder.js',
                'js/services/ActionsService.js',
                'js/services/PermissionsService.js',
                'js/controllers/QueryController.js',
                'js/controllers/apps/AppDirectoryController.js',
                'js/controllers/modals/ModalConfirmResourceActionController.js',
                'js/controllers/modals/ModalPermissionEditorController.js'
              ]
            });
          }]
        }
      })


      .state('apps', {
        abtract: true,
        url: '/apps/:appId',
        templateUrl: 'views/apps/resource/resource.html',
        controller: 'AppsResourceController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                name: 'AgaveToGo',
                files: [
                  'js/controllers/apps/resource/AppsResourceController.js'
                ]
              }
            ]);
          }]
        }
      })

      .state('apps.details', {
        url: '',
        templateUrl: 'views/apps/resource/details.html',
        controller: 'AppsResourceDetailsController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                serie: true,
                name: 'AgaveToGo',
                files: [
                  'js/services/ActionsService.js',
                  'js/services/MessageService.js',
                  'js/services/PermissionsService.js',
                  'js/controllers/apps/resource/AppsResourceDetailsController.js',
                  'js/controllers/modals/ModalConfirmResourceActionController.js',
                  'js/controllers/modals/ModalPermissionEditorController.js'
                ]
              }
            ]);
          }]
        }
      })

      .state('apps.history', {
          url: '/history',
          controller: 'AppsResourceHistoryController',
          templateUrl: 'views/apps/resource/history.html',
          resolve: {
              deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                  return $ocLazyLoad.load([
                      {
                          name: 'AgaveToGo',
                          files: [
                              'js/services/ActionsService.js',
                              'js/services/MessageService.js',
                              'js/services/PermissionsService.js',
                              'js/controllers/apps/resource/AppsResourceHistoryController.js'
                          ]
                      }
                  ]);
              }]
          }
      })

      .state('apps.stats', {
        url: '/stats',
        controller: 'AppsResourceStatsController',
        templateUrl: 'views/apps/resource/stats.html',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                name: 'AgaveToGo',
                files: [
                  'js/controllers/apps/resource/AppsResourceStatsController.js'
                ]
              }
            ]);
          }]
        }
      })

      .state('apps.run', {
        url: '/run',
        controller: 'AppsResourceRunController',
        templateUrl: 'views/apps/resource/job-form.html',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                serie: true,
                name: 'AgaveToGo',
                insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
                files: [
                  '../bower_components/bootstrap-timepicker/js/bootstrap-timepicker.js',
                  'js/directives/runtimepicker.js',
                  'js/services/NotificationService.js',
                  'js/services/MessageService.js',
                  'js/controllers/apps/resource/AppsResourceRunController.js'
                ]
              }
            ]);
          }]
        }
      })

      /**********************************************************************/
      /**********************************************************************/
      /***                                                                ***/
      /***                       Container Browsing Routes                  ***/
      /***                                                                ***/
      /**********************************************************************/
      /**********************************************************************/


      .state('containers-manage', {
        url: '/library',
        templateUrl: 'views/containers/manager.html',
        data: {pageTitle: 'Application Exchange'},
        controller: 'ContainersDirectoryController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
                  serie: true,
                  name: 'AgaveToGo',
                  insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
                  files: [
                    '../bower_components/showdown/compressed/Showdown.min.js',
                    '../bower_components/angular-markdown-directive/markdown.js',
                    '../assets/global/plugins/jquery-knob/js/jquery.knob.js',
                    'js/services/ActionsService.js',
                    'js/services/MessageService.js',
                    'js/services/PermissionsService.js',
                    'js/services/QuayRepositoryService.js',
                    'js/controllers/QueryBuilderController.js',
                    'js/controllers/containers/ContainersDirectoryController.js',
                    'js/controllers/modals/ModalConfirmResourceActionController.js'
                  ]
                },
                'btford.markdown');
          }]
        }
      })

      .state('containers-browse', {
        url: '/imgagegallery',
        templateUrl: 'views/containers/gallery.html',
        data: {pageTitle: 'Application Exchange'},
        controller: 'ContainersGalleryController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              serie: true,
              name: 'AgaveToGo',
              insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
              files: [
                '../assets/global/plugins/cubeportfolio/css/cubeportfolio.min.css',
                '../bower_components/showdown/compressed/Showdown.min.js',
                '../bower_components/angular-markdown-directive/markdown.js',
                '../assets/global/plugins/jquery-knob/js/jquery.knob.js',
                'js/services/ActionsService.js',
                'js/services/MessageService.js',
                'js/services/PermissionsService.js',
                'js/services/QuayRepositoryService.js',
                'js/controllers/containers/ContainersGalleryController.js',
                'js/controllers/modals/ModalConfirmResourceActionController.js',
                '../assets/global/plugins/cubeportfolio/js/jquery.cubeportfolio.min.js'
              ]
            });
          }]
        }
      })

      .state('containers', {
        url: '/library/:id',
        data: {pageTitle: 'Application Exchange'},
        templateUrl: 'views/containers/resource/resource.html',
        controller: 'ContainerResourceController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                name: 'AgaveToGo',
                files: [
                  'js/services/QuayRepositoryService.js',
                  'js/controllers/containers/resource/ContainerResourceController.js'
                ]
              }
            ]);
          }]
        }
      })

      .state('containers.details', {
        url: '',
        templateUrl: 'views/containers/resource/details.html',
        controller: 'ContainerResourceDetailsController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load(
                {
                  serie: true,
                  name: 'AgaveToGo',
                  files: [
                    '../bower_components/showdown/compressed/Showdown.min.js',
                    '../bower_components/angular-markdown-directive/markdown.js',
                    '../assets/global/plugins/jquery-knob/js/jquery.knob.js',
                    'js/services/ActionsService.js',
                    'js/services/MessageService.js',
                    'js/services/PermissionsService.js',
                    'js/services/QuayRepositoryService.js',
                    'js/controllers/containers/resource/ContainerResourceDetailsController.js'
                  ]
                },
                'btford.markdown'
            );
          }]
        }
      })

      .state('containers.run', {
        url: '/run',
        controller: 'ContainerResourceRunController',
        templateUrl: 'views/containers/resource/job-form.html',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              '../bower_components/bootstrap-timepicker/js/bootstrap-timepicker.js',
              'js/services/NotificationService.js',
              'js/services/QuayRepositoryService.js',
              'js/services/MessageService.js',
              'js/controllers/containers/resource/ContainerResourceRunController.js'])
          }]
        }
      })

      .state('containers.history', {
        url: '/history',
        controller: 'ContainerResourceHistoryController',
        templateUrl: 'views/containers/resource/history.html',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                serie: true,
                name: 'AgaveToGo',
                files: [
                  '../assets/global/plugins/flot/jquery.flot.all.min.js',
                  '../assets/global/plugins/flot/jquery.flot.time.min.js',
                  'js/services/MessageService.js',
                  'js/services/QuayRepositoryService.js',
                  'js/controllers/containers/resource/ContainerResourceHistoryController.js'
                ]
              }
            ]);
          }]
        }
      })

      .state('containers.tags', {
        url: '/tags',
        controller: 'ContainerResourceTagsController',
        templateUrl: 'views/containers/resource/tags.html',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                serie: true,
                name: 'AgaveToGo',
                files: [
                  'js/services/MessageService.js',
                  'js/services/QuayRepositoryService.js',
                  'js/controllers/containers/resource/ContainerResourceTagsController.js'
                ]
              }
            ]);
          }]
        }
      })

      /**********************************************************************/
      /**********************************************************************/
      /***                                                                ***/
      /***                       Data Management Routes                   ***/
      /***                                                                ***/
      /**********************************************************************/
      /**********************************************************************/

      // TO-DO: need to improve this with redirect
      .state('data-explorer', {
        url: '/data/explorer/:systemId/*path',
        templateUrl: 'views/data/explorer.html',
        data: {pageTitle: 'File Explorer'},
        params: {
          path: {
            squash: true,
            raw: true,
            value: ''
          },
          systemId: {
            squash: true,
            value: null
          }
        },
        controller: 'FileExplorerController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                serie: true,
                name: 'AgaveToGo',
                insertBefore: '#ng_load_plugins_before',
                files: [
                  'js/services/MessageService.js',
                  'js/controllers/data/FileExplorerController.js'
                ]
              }]
            );
          }],
          resolvedPath: ['deps', '$stateParams', '$location', 'resolvedSystem', 'SystemsController',
            function(deps, $stateParams, $location, resolvedSystem, SystemsController) {
              if (resolvedSystem) {
                return $stateParams.path;
              }
              else {
                return "/" + $stateParams.path;
              }
            }],
          resolvedSystem: ['deps', '$state', '$stateParams', '$localStorage', '$location', 'SystemsController',
            function(deps, $state, $stateParams, $localStorage, $location, SystemsController) {
              if ($stateParams.systemId) {
                return SystemsController.getSystemDetails($stateParams.systemId).then(function(data) {
                      return data.result;
                    },
                    function(err) {
                      return null;
                    });
              }
              else {
                // if no system was given, route them to their default system
                return SystemsController.searchSystems('default=true&type=STORAGE&filter=*').then(
                    function (data) {
                      if (data.result && data.result.length > 0) {

                        // if the default system is public, and no path was given,
                        // redirect to their public folder on the system
                        if (! $stateParams.path) {
                          if (data.result[0].public) {
                            $stateParams.path = data.result[0].storage.homeDir + '/' + $localStorage.activeProfile.username;
                          }
                          // otehrwise, take them to the system home directory
                          else {
                            $stateParams.path = data.result[0].storage.homeDir;
                          }
                        }

                        $location.path("/data/explorer/" + data.result[0].id + '/' + $stateParams.path);
                      }
                      else {
                        return null;
                        $scope.requesting = false;
                        MessageService.handle(response, $translate.instant('error_systems_list'));
                        App.unblockUI('#agave-filemanager');
                      }
                    },
                    function(err) {
                      return null;
                      $scope.requesting = false;
                      MessageService.handle(response, $translate.instant('error_systems_list'));
                      App.unblockUI('#agave-filemanager');
                    });
              }
            }]
        }
      })

      // Main route for all file browsing
      .state('default-system-data-explorer', {
        url: '/data/explorer/:systemId',
        templateUrl: 'views/data/explorer.html',
        data: {pageTitle: 'File Explorer'},
        controller: function($scope, $state, $stateParams, $translate, SystemsController,MessageService) {

          $scope.error = true;
          $scope.requesting = true;

          if ($stateParams.systemId) {
            $state.go('data-explorer', {systemId: systemId, path: null});
          }
          else {
            SystemsController.searchSystems('globaldefault=true&type=STORAGE').then(
                function (data) {
                  if (data.result && data.result.length > 0) {
                    $state.go('data-explorer', {systemId: data[0].id, path: null});
                  }
                  else {
                    $state.go('data-explorer', {systemId: '', path: null});
                  }
                },
                function(err) {
                  $scope.requesting = false;
                  MessageService.handle(response, $translate.instant('error_systems_list'));
                  App.unblockUI('#agave-filemanager');
                });
          }
        }
      })


      /**********************************************************************/
      /**********************************************************************/
      /***                                                                ***/
      /***                       User Profile Routes                      ***/
      /***                                                                ***/
      /**********************************************************************/
      /**********************************************************************/

      // User Profile
      .state('profile', {
        url: '/profile/:username',
        templateUrl: 'views/profile/main.html',
        data: {pageTitle: 'User Profile'},
        controller: 'UserProfileController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              name: 'AgaveToGo',
              insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
              files: [
                '../assets/global/plugins/bootstrap-fileinput/bootstrap-fileinput.css',
                '../assets/pages/css/profile.css',
                '../assets/pages/css/search.css',

                '../assets/global/plugins/jquery.sparkline.min.js',
                '../assets/global/plugins/bootstrap-fileinput/bootstrap-fileinput.js',

                '../assets/pages/scripts/profile.min.js',
                '../bower_components/faker/build/build/faker.min.js',

                'js/services/MessageService.js',
                'js/controllers/profiles/UserProfileController.js'
              ]
            });
          }]
        }
      })

      // User Profile Dashboard
      .state('profile.dashboard', {
        url: '/dashboard',
        templateUrl: 'views/profile/dashboard.html',
        data: {pageTitle: 'User Profile'}
      })

      // User Profile Account
      .state('profile.account', {
        url: '/account',
        templateUrl: 'views/profile/account.html',
        data: {pageTitle: 'User Account'}
      })

      // User Profile Help
      .state('profile.help', {
        url: '/help',
        templateUrl: 'views/profile/help.html',
        data: {pageTitle: 'User Help'}
      })

      // User Profile Search
      .state('profile.search', {
        url: '/search',
        templateUrl: 'views/profile/search.html',
        data: {pageTitle: 'Directory Search'}
      })

      /**********************************************************************/
      /**********************************************************************/
      /***                                                                ***/
      /***                       Systems Routes                           ***/
      /***                                                                ***/
      /**********************************************************************/
      /**********************************************************************/

      .state('systems-manage', {
        url: '/systems',
        templateUrl: 'views/systems/manager.html',
        data: {pageTitle: 'Systems Manager'},
        controller: 'SystemDirectoryController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              serie: true,
              name: 'AgaveToGo',
              insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
              files: [
                // '../assets/global/scripts/datatable.js',
                '../bower_components/holderjs/holder.js',
                'js/services/ActionsService.js',
                'js/services/MessageService.js',
                'js/services/RolesService.js',
                'js/controllers/QueryBuilderController.js',
                'js/controllers/systems/SystemDirectoryController.js'
              ]
            });
          }]
        }
      })

      .state('systems-new', {
        url: '/systems/new',
        templateUrl: 'views/systems/wizard.html',
        data: {pageTitle: 'System Builder Wizard'},
        controller: 'SystemBuilderWizardController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
                  serie: true,
                  name: 'AgaveToGo',
                  insertBefore: '#ng_load_plugins_before',
                  files: [
                    'js/services/MessageService.js',
                    'js/controllers/systems/SystemBuilderWizardController.js',
                    'js/controllers/data/FileExplorerController.js',
                    '../bower_components/codemirror/lib/codemirror.css',
                    '../bower_components/codemirror/theme/neo.css',
                    '../bower_components/codemirror/theme/solarized.css',
                    '../bower_components/codemirror/mode/javascript/javascript.js',
                    '../bower_components/codemirror/mode/markdown/markdown.js',
                    '../bower_components/codemirror/mode/clike/clike.js',
                    '../bower_components/codemirror/mode/shell/shell.js',
                    '../bower_components/codemirror/mode/python/python.js',
                    '../bower_components/codemirror/lib/codemirror.js',
                    '../bower_components/angular-ui-codemirror/ui-codemirror.min.js',
                  ]
                },
                // 'FileManagerApp',
                'ui.codemirror'
            );
          }]
        }
      })

      .state('systems-edit', {
        url: '/systems/edit/:systemId',
        templateUrl: 'views/systems/edit-wizard.html',
        data: {pageTitle: 'System Editor Wizard'},
        controller: 'SystemEditorWizardController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
                  serie: true,
                  name: 'AgaveToGo',
                  insertBefore: '#ng_load_plugins_before',
                  files: [
                    'js/services/MessageService.js',
                    'js/controllers/systems/SystemEditorWizardController.js',
                    '../bower_components/codemirror/lib/codemirror.css',
                    '../bower_components/codemirror/theme/neo.css',
                    '../bower_components/codemirror/theme/solarized.css',
                    '../bower_components/codemirror/mode/javascript/javascript.js',
                    '../bower_components/codemirror/mode/markdown/markdown.js',
                    '../bower_components/codemirror/mode/clike/clike.js',
                    '../bower_components/codemirror/mode/shell/shell.js',
                    '../bower_components/codemirror/mode/python/python.js',
                    '../bower_components/codemirror/lib/codemirror.js',
                    '../bower_components/angular-ui-codemirror/ui-codemirror.min.js',
                  ]
                },
                // 'FileManagerApp',
                'ui.codemirror'
            );
          }]
        }
      })

      .state('systems', {
        abtract: true,
        url: '/systems/:systemId',
        templateUrl: 'views/systems/resource/resource.html',
        controller: 'SystemsResourceController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                name: 'AgaveToGo',
                files: [
                  'js/controllers/systems/resource/SystemsResourceController.js'
                ]
              }
            ]);
          }]
        }
      })

      .state('systems.details', {
        url: '',
        templateUrl: 'views/systems/resource/details.html',
        controller: 'SystemsResourceDetailsController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                serie: true,
                name: 'AgaveToGo',
                files: [
                  'js/services/ActionsService.js',
                  'js/services/MessageService.js',
                  'js/services/RolesService.js',
                  'js/controllers/systems/resource/SystemsResourceDetailsController.js'
                ]
              }
            ]);
          }]
        }
      })

      .state('systems.queues', {
        url: '/queues',
        controller: 'SystemsResourceQueuesController',
        templateUrl: 'views/systems/resource/queues.html',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                name: 'AgaveToGo',
                files: [
                  'js/services/MessageService.js',
                  'js/controllers/systems/resource/SystemsResourceQueuesController.js'
                ]
              }
            ]);
          }]
        }
      })

      .state('systems.apps', {
        url: '/apps',
        templateUrl: 'views/systems/resource/apps.html',
        controller: 'SystemsResourceAppsController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                name: 'AgaveToGo',
                files: [
                  'js/services/MessageService.js',
                  'js/controllers/systems/resource/SystemsResourceAppsController.js'
                ]
              }
            ]);
          }]
        }
      })

      .state('systems.history', {
          url: '/history',
          controller: 'SystemsResourceHistoryController',
          templateUrl: 'views/systems/resource/history.html',
          resolve: {
              deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                  return $ocLazyLoad.load([
                      {
                          name: 'AgaveToGo',
                          files: [
                              'js/services/ActionsService.js',
                              'js/services/MessageService.js',
                              'js/services/PermissionsService.js',
                              'js/controllers/systems/resource/SystemsResourceHistoryController.js'
                          ]
                      }
                  ]);
              }]
          }
      })

      .state('systems.stats', {
        url: '/stats',
        controller: 'SystemsResourceStatsController',
        templateUrl: 'views/systems/resource/stats.html',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                name: 'AgaveToGo',
                files: [
                  'js/services/MessageService.js',
                  'js/controllers/systems/resource/SystemsResourceStatsController.js'
                ]
              }
            ]);
          }]
        }
      })

      /**********************************************************************/
      /**********************************************************************/
      /***                                                                ***/
      /***                          Tags Routes                           ***/
      /***                                                                ***/
      /**********************************************************************/
      /**********************************************************************/

      .state('tags-manage', {
        url: '/tags',
        templateUrl: 'views/tags/manager.html',
        data: {pageTitle: 'Tags Manager'},
        controller: 'TagsManagerDirectoryController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              serie: true,
              name: 'AgaveToGo',
              insertBefore: '#ng_load_plugins_before',
              files: [
                '../assets/global/css/components.css',
                '../assets/global/css/components-md.css',
                '../assets/pages/css/search.css',
                'js/services/ActionsService.js',
                'js/services/MessageService.js',
                'js/services/PermissionsService.js',
                'js/services/RolesService.js',
                'js/controllers/QueryBuilderController.js',
                'js/controllers/apps/resource/AppsResourceDetailsController.js',
                'js/controllers/tags/TagsManagerDirectoryController.js'
              ]
            });
          }]
        }
      })

      .state('tags-add', {
        url: '/tags/add',
        data: {pageTitle: 'Tags Add'},
        templateUrl: 'views/tags/resource/add.html',
        controller: 'TagsResourceAddController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                serie: true,
                name: 'AgaveToGo',
                files: [
                  'js/services/ActionsService.js',
                  'js/services/MessageService.js',
                  'js/controllers/tags/resource/TagsResourceAddController.js'
                ]
              }
            ]);
          }]
        }
      })

      .state('tags-edit', {
        url: '/tags/edit/:id',
        data: {pageTitle: 'Tags Edit'},
        templateUrl: 'views/tags/resource/edit.html',
        controller: 'TagsResourceEditController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([
              {
                serie: true,
                name: 'AgaveToGo',
                files: [
                  'js/services/ActionsService.js',
                  'js/services/MessageService.js',
                  'js/controllers/tags/resource/TagsResourceEditController.js'
                ]
              }
            ]);
          }]
        }
      })

      /**********************************************************************/
      /**********************************************************************/
      /***                                                                ***/
      /***                          UUIDs Routes                          ***/
      /***                                                                ***/
      /**********************************************************************/
      /**********************************************************************/

      .state('uuids-manage', {
        url: '/uuids',
        templateUrl: 'views/uuids/manager.html',
        data: {pageTitle: 'UUIDs Manager'},
        controller: 'UUIDsManagerDirectoryController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              serie: true,
              name: 'AgaveToGo',
              insertBefore: '#ng_load_plugins_before',
              files: [
                '../assets/global/plugins/font-awesome/css/font-awesome.min.css',
                '../assets/global/plugins/simple-line-icons/simple-line-icons.min.css',
                '../assets/global/plugins/bootstrap/css/bootstrap.min.css',
                '../assets/global/plugins/bootstrap-switch/css/bootstrap-switch.min.css',
                '../assets/global/plugins/bootstrap-datepicker/css/bootstrap-datepicker3.min.css',
                '../assets/global/plugins/fancybox/source/jquery.fancybox.css',
                '../assets/global/css/components.min.css',
                '../assets/global/css/plugins.min.css',
                '../assets/pages/css/search.min.css',
                '../assets/layouts/layout/css/layout.min.css',
                '../assets/layouts/layout/css/themes/darkblue.min.css',
                '../assets/layouts/layout/css/custom.min.css',
                'js/services/ActionsService.js',
                'js/services/MessageService.js',
                'js/services/PermissionsService.js',
                'js/services/RolesService.js',
                'js/controllers/uuids/UUIDsManagerDirectoryController.js'
              ]
            });
          }]
        }
      })

      .state('uuids-manage-id', {
        url: '/uuids/:uuid',
        templateUrl: 'views/uuids/manager.html',
        data: {pageTitle: 'UUIDs Manager'},
        controller: 'UUIDsManagerDirectoryController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              serie: true,
              name: 'AgaveToGo',
              insertBefore: '#ng_load_plugins_before',
              files: [
                '../assets/global/plugins/font-awesome/css/font-awesome.min.css',
                '../assets/global/plugins/simple-line-icons/simple-line-icons.min.css',
                '../assets/global/plugins/bootstrap/css/bootstrap.min.css',
                '../assets/global/plugins/bootstrap-switch/css/bootstrap-switch.min.css',
                '../assets/global/plugins/bootstrap-datepicker/css/bootstrap-datepicker3.min.css',
                '../assets/global/plugins/fancybox/source/jquery.fancybox.css',
                '../assets/global/css/components.min.css',
                '../assets/global/css/plugins.min.css',
                '../assets/pages/css/search.min.css',
                '../assets/layouts/layout/css/layout.min.css',
                '../assets/layouts/layout/css/themes/darkblue.min.css',
                '../assets/layouts/layout/css/custom.min.css',
                'js/services/ActionsService.js',
                'js/services/MessageService.js',
                'js/services/PermissionsService.js',
                'js/services/RolesService.js',
                'js/controllers/uuids/UUIDsManagerDirectoryController.js'
              ]
            });
          }]
        }
      })


      /**********************************************************************/
      /**********************************************************************/
      /***                                                                ***/
      /***                       Plugin Routes                            ***/
      /***                                                                ***/
      /**********************************************************************/
      /**********************************************************************/

      // UI Select
      .state('uiselect', {
        url: '/ui_select.html',
        templateUrl: 'views/ui_select.html',
        data: {pageTitle: 'AngularJS Ui Select'},
        controller: 'UISelectController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([{
              name: 'ui.select',
              insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
              files: [
                '../assets/global/plugins/angularjs/plugins/ui-select/select.min.css',
                '../assets/global/plugins/angularjs/plugins/ui-select/select.min.js'
              ]
            }, {
              name: 'AgaveToGo',
              files: [
                'js/controllers/UISelectController.js'
              ]
            }]);
          }]
        }
      })

      // UI Bootstrap
      .state('uibootstrap', {
        url: '/ui_bootstrap.html',
        templateUrl: 'views/ui_bootstrap.html',
        data: {pageTitle: 'AngularJS UI Bootstrap'},
        controller: 'GeneralPageController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([{
              name: 'AgaveToGo',
              files: [
                'js/controllers/GeneralPageController.js'
              ]
            }]);
          }]
        }
      })

      // Tree View
      .state('tree', {
        url: '/tree',
        templateUrl: 'views/tree.html',
        data: {pageTitle: 'jQuery Tree View'},
        controller: 'GeneralPageController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([{
              name: 'AgaveToGo',
              insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
              files: [
                '../assets/global/plugins/jstree/dist/themes/default/style.min.css',
                '../assets/global/plugins/jstree/dist/jstree.min.js',
                '../assets/pages/scripts/ui-tree.min.js',
                'js/controllers/GeneralPageController.js'
              ]
            }]);
          }]
        }
      })

      // Form Tools
      .state('formtools', {
        url: '/form-tools',
        templateUrl: 'views/form_tools.html',
        data: {pageTitle: 'Form Tools'},
        controller: 'GeneralPageController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([{
              name: 'AgaveToGo',
              insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
              files: [
                '../assets/global/plugins/bootstrap-fileinput/bootstrap-fileinput.css',
                '../assets/global/plugins/bootstrap-switch/css/bootstrap-switch.min.css',
                '../assets/global/plugins/bootstrap-markdown/css/bootstrap-markdown.min.css',
                '../assets/global/plugins/typeahead/typeahead.css',
                '../assets/global/plugins/fuelux/js/spinner.min.js',
                '../assets/global/plugins/bootstrap-fileinput/bootstrap-fileinput.js',
                '../assets/global/plugins/jquery-inputmask/jquery.inputmask.bundle.min.js',
                '../assets/global/plugins/jquery.input-ip-address-control-1.0.min.js',
                '../assets/global/plugins/bootstrap-pwstrength/pwstrength-bootstrap.min.js',
                '../assets/global/plugins/bootstrap-switch/js/bootstrap-switch.min.js',
                '../assets/global/plugins/bootstrap-maxlength/bootstrap-maxlength.min.js',
                '../assets/global/plugins/bootstrap-touchspin/bootstrap.touchspin.js',
                '../assets/global/plugins/typeahead/handlebars.min.js',
                '../assets/global/plugins/typeahead/typeahead.bundle.min.js',
                '../assets/pages/scripts/components-form-tools-2.min.js',

                'js/controllers/GeneralPageController.js'
              ]
            }]);
          }]
        }
      })

      // Date & Time Pickers
      .state('pickers', {
        url: '/pickers',
        templateUrl: 'views/pickers.html',
        data: {pageTitle: 'Date & Time Pickers'},
        controller: 'GeneralPageController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([{
              name: 'AgaveToGo',
              insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
              files: [
                '../assets/global/plugins/clockface/css/clockface.css',
                '../assets/global/plugins/bootstrap-datepicker/css/bootstrap-datepicker3.min.css',
                '../assets/global/plugins/bootstrap-timepicker/css/bootstrap-timepicker.min.css',
                '../assets/global/plugins/bootstrap-colorpicker/css/colorpicker.css',
                '../assets/global/plugins/bootstrap-daterangepicker/daterangepicker-bs3.css',
                '../assets/global/plugins/bootstrap-datetimepicker/css/bootstrap-datetimepicker.min.css',

                '../assets/global/plugins/bootstrap-datepicker/js/bootstrap-datepicker.min.js',
                '../assets/global/plugins/bootstrap-timepicker/js/bootstrap-timepicker.min.js',
                '../assets/global/plugins/clockface/js/clockface.js',
                '../assets/global/plugins/moment.min.js',
                '../assets/global/plugins/bootstrap-daterangepicker/daterangepicker.js',
                '../assets/global/plugins/bootstrap-colorpicker/js/bootstrap-colorpicker.js',
                '../assets/global/plugins/bootstrap-datetimepicker/js/bootstrap-datetimepicker.min.js',

                '../assets/pages/scripts/components-date-time-pickers.min.js',

                'js/controllers/GeneralPageController.js'
              ]
            }]);
          }]
        }
      })

      // Custom Dropdowns
      .state('dropdowns', {
        url: '/dropdowns',
        templateUrl: 'views/dropdowns.html',
        data: {pageTitle: 'Custom Dropdowns'},
        controller: 'GeneralPageController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load([{
              name: 'AgaveToGo',
              insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
              files: [
                '../assets/global/plugins/bootstrap-select/css/bootstrap-select.min.css',
                '../assets/global/plugins/select2/css/select2.min.css',
                '../assets/global/plugins/select2/css/select2-bootstrap.min.css',

                '../assets/global/plugins/bootstrap-select/js/bootstrap-select.min.js',
                '../assets/global/plugins/select2/js/select2.full.min.js',

                '../assets/pages/scripts/components-bootstrap-select.min.js',
                '../assets/pages/scripts/components-select2.min.js',

                'js/controllers/GeneralPageController.js'
              ]
            }]);
          }]
        }
      })

      /**********************************************************************/
      /**********************************************************************/
      /***                                                                ***/
      /***                       Project Routes                           ***/
      /***                                                                ***/
      /**********************************************************************/
      /**********************************************************************/

      // Projects
      .state('projects', {
        url: '/projects',
        templateUrl: 'views/projects/dashboard.html',
        data: {pageTitle: 'Projects'},
        controller: 'ProjectDashboardController',
        resolve: {
          deps: ['$ocLazyLoad', function ($ocLazyLoad) {
            return $ocLazyLoad.load({
              name: 'AgaveToGo',
              insertBefore: '#ng_load_plugins_before', // load the above css files before '#ng_load_plugins_before'
              files: [
                '../assets/apps/css/todo.css',
                'js/services/Projects.js',
                'js/services/Tasks.js',
                'js/services/Comments.js',
                'js/controllers/projects/ProjectDashboardController.js'
              ]
            });
          }]
        }
      })

      .state('project.new', {
        url: '/projects/new',
        templateUrl: 'views/projects/editor.html',
        data: {pageTitle: 'New Project'}
      })

      .state('project.edit', {
        url: '/projects/edit',
        templateUrl: 'views/projects/editor.html',
        data: {pageTitle: 'New Project'}
      })

}]);

/* Init global settings and run the app */
AgaveToGo.run(['$rootScope', 'settings', '$state', '$http', '$templateCache', '$localStorage', '$window', 'CacheFactory',  'userProperties', 'ProfilesController',
  function ($rootScope, settings, $state, $http, $templateCache, $localStorage, $window, CacheFactory,  userProperties, ProfilesController) {
    $rootScope.$state = $state; // state to be accessed from view
    $rootScope.$settings = settings; // state to be accessed from view


    /**
     * Uncomment to enable debug logging of ui-router state changes
     */
    $rootScope.$on('$stateChangeStart',function(event, toState, toParams, fromState, fromParams){
      console.log('$stateChangeStart to '+toState.to+'- fired when the transition begins. toState,toParams : \n',toState, toParams);
    });

    $rootScope.$on('$stateChangeError',function(event, toState, toParams, fromState, fromParams){
      console.log('$stateChangeError - fired when an error occurs during transition.');
      console.log(arguments);
    });

    $rootScope.$on('$stateChangeSuccess',function(event, toState, toParams, fromState, fromParams){
      console.log('$stateChangeSuccess to '+toState.name+'- fired once the state transition is complete.');
      if (toState.templateUrl) {
        $templateCache.remove(toState.templateUrl);
      }
    });

    $rootScope.$on('$viewContentLoaded',function(event){
      console.log('$viewContentLoaded - fired after dom rendered',event);
    });

    $rootScope.$on('$stateNotFound',function(event, unfoundState, fromState, fromParams){
      console.log('$stateNotFound '+unfoundState.to+'  - fired when a state cannot be found by its name.');
      console.log(unfoundState, fromState, fromParams);
    });


    // clear out any previous redirect url prior to the auth redirect as they would
    // be provided by the auth app rather than here.
    delete $localStorage.redirectUrl;

    // translate refresh is necessary to load translate table
    $rootScope.$on('$translatePartialLoaderStructureChanged', function () {
      $translate.refresh();
    });

    if (angular.isUndefined($localStorage.activeProfile)) {
      ProfilesController.getProfile('me').then(
          function (data) {
            $localStorage.activeProfile = data;
          },
          function (response) {
            console.log("Failed to fetch authenticated user profile. Some personalization features may not be available while the user identity is unknown.");
          });
    }

    // $http.defaults.cache = CacheFactory('agave-sdk', {
    //     maxAge: 60 * 60 * 1000, // Items added to this cache expire after 1 hour
    //     cacheFlushInterval: 24 * 60 * 60 * 1000, // This cache will clear itself every day
    //     deleteOnExpire: 'aggressive', // Items will be deleted from this cache when they expire
    //     storageMode: 'localStorage',
    //     storagePrefix: 'agavetogo.'
    // });

    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
      // Temp fix until I find better solution
      // This is to avoid changing url location on filemanager promise returns
      $rootScope.locationChange = !((fromState.name === 'data-explorer-noslash' || fromState.name === 'data-explorer') && (toState.name !== 'data-explorer-noslash' || toState.name !== 'data-explorer'));

      if (angular.isUndefined($localStorage.tenant) || angular.isUndefined($localStorage.token)) {
        console.log("No tenant and auth config found in local storage. Redirecting to login page...");
        console.log("Saved previous location for redirect after login " + $window.location.href);
        if (!userProperties.offline) {
          $localStorage.redirectUrl = $window.location.href;
          $window.location.href = '../auth';
        }
      }
      else {
        var currentDate = new Date();
        var expirationDate = Date.parse($localStorage.token.expires_at);

        var diff = (expirationDate - currentDate) / 60000;
        if (diff < 0) {
          console.log("Token expired " + (expirationDate - currentDate) + " seconds ago.");

          // in the event they walked something other than an implicit flow to
          // get a token and a reresh token is present, attempt to refresh the
          // existing token before forcing them to auth again.
          if ($localStorage.token.refresh_token && $localStorage.client &&
              ($localStorage.client.client_key || $localStorage.client.apikey) &&
              ($localStorage.client.client_secret || $localStorage.client.apisecret)) {

            console.log("Token expired " + (expirationDate - currentDate) + " seconds ago.");

            var consumerKey = $localStorage.client.apikey || $localStorage.client.client_key;
            var consumerSecret = $localStorage.client.apisecret || $localStorage.client.client_secret;

            var client = {
              consumerKey: consumerKey,
              consumerSecret: consumerSecret
            };

            TokensController.refreshToken(client, $localStorage.token.refresh_token).then(
                function (refreshTokenResponse) {
                  $localStorage.token.access_token = refreshTokenResponse.access_token;
                  $localStorage.token.expires = refreshTokenResponse.expires_in;
                  $localStorage.token.expires_at = moment(refreshTokenResponse.expires_in).toDate();

                  App.alert(
                      {
                        type: 'info',
                        message: "Token successfully refreshed."
                      }
                  );
                },
                function (response) {
                  console.log("Failed to refresh token. Redirecting to login page...");
                  console.log("Saved previous location for redirect after login " + $window.location.href);
                  if (!userProperties.offline) {
                    $localStorage.redirectUrl = $window.location.href;
                    $window.location.href = '../auth';
                  }
                });
          }
          else {
            console.log("No refresh credentials found in local storage. Redirecting to login page...");
            console.log("Saved previous location for redirect after login " + $window.location.href);
            if (!userProperties.offline) {
              $localStorage.redirectUrl = $window.location.href;
              $window.location.href = '../auth';
            }
          }
        }
      }
    });
  }]);
