'use strict';
angular.module('AgavePlatformScienceAPILib').factory('UUIDsController', ['$q', 'Configuration', 'HttpClient', 'APIHelper', function ($q, Configuration, HttpClient, APIHelper) {
  return {
      /**
       * get UUID
       * @param {string} uuid    Required parameter: The uuid
       *
       * @return {promise<UUID>}
       */
      getUUID: function (uuid, expand) {
        //Assign default values
        expand = expand || false;

        //prepare query string for API call
        var baseUri = Configuration.BASEURI;
        var queryBuilder = baseUri + '/uuids/v2/{uuid}';

        //Process template parameters
        queryBuilder = APIHelper.appendUrlWithTemplateParameters(queryBuilder, {
            'uuid': uuid || null,
        });

        queryBuilder = APIHelper.appendUrlWithQueryParameters(queryBuilder, {
            'expand': expand || false
        });

        //validate and preprocess url
        var queryUrl = APIHelper.cleanUrl(queryBuilder);

        //prepare headers
        var headers = {
            'accept': 'application/json',
            'Authorization': 'Bearer ' + Configuration.oAuthAccessToken
        };

        //prepare and invoke the API call request to fetch the response
        var config = {
            method: 'GET',
            queryUrl: queryUrl,
            headers: headers,
            cache: false
        };

        var response = new HttpClient(config);

        //Create promise to return
        var deferred = $q.defer();

        //process response
        response.then(function (result) {
            deferred.resolve(result.body);
        }, function (result) {
            deferred.reject(APIHelper.appendContext({
                errorMessage: 'HTTP Response Not OK',
                errorCode: result.code,
                errorResponse: result.message
            }, result.getContext()));
        });

        return deferred.promise;
      }
  };
}]);
