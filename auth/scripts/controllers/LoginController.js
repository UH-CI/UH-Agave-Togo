angular.module('AgaveAuth').controller('LoginController', function ($injector, $timeout, $http, $location, $rootScope, $scope, $state, $stateParams, settings, $localStorage, AccessToken, TenantsController, Commons, Alerts) {

    settings.layout.tenantPage = true;
    settings.layout.loginPage = false;
    $scope.useImplicit = true;
    $scope.randomState = function() {
        return (Math.ceil(Math.random() * 9));
    }
    $scope.alerts=[]
    $scope.user = ($localStorage.client && angular.copy($localStorage.client)) || {
            username: '',
            password: '',
            client_key: '',
            client_secret: '',
            remember: 0
    };
    $scope.tenantId = 'hawaii'
    /*if ($stateParams.tenantId) {
        $scope.tenantId = $stateParams.tenantId;
    } else {
        $state.go('tenants');
    }*/

    $scope.getTenantByCode = function (tenantId) {
        var namedTenant = false;
        angular.forEach(settings.tenants, function (tenant, key) {
            if (tenant.code === tenantId) {
                namedTenant = tenant;
                return false;
            }
        });

        if (namedTenant) {
            return namedTenant;
        } else {
            Alerts.danger({message: 'No tenant found matching ' + tenantId});
        }
    };
    $scope.requesting =false;
    $scope.getAuthToken = function(){
        $scope.requesting = true;
        var post_data = {};
        var url = 'https://ikewai-dev.its.hawaii.edu:8000/login';
        var options = {
            withCredentials: true, 
            headers:{ 'Authorization':  'Basic ' + btoa($scope.username + ":" + $scope.password)}
          }
        $http.post(url,post_data, options)
            .success(function (data, status, headers, config) {
                $scope.requesting=false;
                if (data.access_token){
                    $localStorage.token = data;
                    d = new Date();
                    $localStorage.token.expires_at = moment(d).add($localStorage.token.expires_in, 's').toDate();
                    $localStorage.tenant = {"id":"0001411570998814-b0b0b0bb0b-0001-016","name":"Hawaii Tenant","baseUrl":"https://agaveauth.its.hawaii.edu/","code":"hawaii","contact":[{"name":"Sean Cleveland","email":"seanbc@uhawaii.edu","url":"","type":"admin","primary":true}],"_links":{"self":{"href":"https://docker.example.com/tenants/v2/hawaii"},"publickey":{"href":"https://agaveauth.its.hawaii.edu/apim/v2/publickey"}}};
                    $location.path("/success");
                }
                else{
                    $scope.login_error=true;
                }
            })
            .error(function (data, status, header, config) {
                $scope.requesting=false;
                Alerts.danger({message:angular.toJson(data)});
            });
            
    }



    var updateCurrentTenant = function () {
        $timeout(function () {

            $scope.tenant = $scope.getTenantByCode($scope.tenantId);

            $rootScope.$broadcast('oauth:template:update', '/auth/views/templates/oauth-ng-button.html');

        }, 500);
    };

    $scope.$watch('settings.tenants', function(value){
        updateCurrentTenant();
    }, true);


    updateCurrentTenant();


    var getAccessToken = function(user, options) {
        // Check if `user` has required properties.
        if (!user || !user.username || !user.password) {
            Alerts.danger({message: 'Please supply a valid username and password'});
        }

        var data = {
            grant_type: 'password',
            username: $scope.user.username,
            password: $scope.user.password
        };

        data = queryString.stringify(data);

        options = angular.extend({
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': btoa($scope.user.client_key + ':' + $scope.user.client_secret)
            }
        },  options);

        return $http.post($scope.tenant.baseUrl + '/token', data, options).then(
            function(response) {
                $localStorage.token = response;
                $localStorage.client = $scope.user;
                $localStorage.tenant = $scope.tenant;
                $rootScope.broadcast('oauth:login', token);
                return response;
            },
            function(response) {
                $rootScope.broadcast('oauth:denied');
            });
    }

    /**
     * Retrieves the `refresh_token` and stores the `response.data` on cookies
     * using the `OAuthToken`.
     *
     * @return {promise} A response promise.
     */
    var getRefreshToken = function() {
        var data = {
            grant_type: 'refresh_token',
            refresh_token: $localStorage.token.refresh_token,
            scope: 'PRODUCTION'
        };

        if (null !== config.clientSecret) {
            data.client_secret = config.clientSecret;
        }

        data = queryString.stringify(data);

        var options = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': btoa($scope.user.client_key + ':' + $scope.user.client_secret)
            }
        };

        return $http.post($scope.tenant.baseUrl + '/token', data, options).then(
            function (response) {
                $localStorage.token = response;
                $rootScope.broadcast('oauth:refresh', token);
                $localStorage.tenant = $scope.tenant;
                return response;
            },
            function(response) {
                $rootScope.broadcast('oauth:denied');
            });
    };
//forward user onto the oauth login page
/*$scope.$on('oauth:loggedOut', function(event) {
  //console.log('The user is not signed in');
  $timeout(function() {
    angular.element('a.btn.default.logged-out.ng-scope').trigger('click');
  });
});
*/
});
