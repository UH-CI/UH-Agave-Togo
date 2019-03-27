'use strict';
angular.module('AgavePlatformScienceAPILib').factory('TagsController', ['$q', 'Configuration', 'HttpClient', 'APIHelper', function ($q, Configuration, HttpClient, APIHelper) {
  return {
      /**
       * List tags
       * @param {string} q    Required parameter: The query to perform. Traditional MongoDB queries are supported
       * @param {int|null} limit    Optional parameter: The maximum number of results returned from this query
       * @param {int|null} offset    Optional parameter: The number of results skipped in the result set returned from this query
       *
       * @return {promise<array>}
       */
      listTags: function (q, limit, offset) {
          //Assign default values
          limit = limit || 100;
          offset = offset || 0;

          //prepare query string for API call
          var baseUri = Configuration.BASEURI;
          var queryBuilder = baseUri + '/tags/v2/';

          //Process query parameters
          queryBuilder = APIHelper.appendUrlWithQueryParameters(queryBuilder, {
              'q': q,
              'limit': (null !== limit) ? limit : 100,
              'offset': (null !== offset) ? offset : 0
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
      },

      /**
       * Update or Add new Tag.
       * @param {Tag} body    Required parameter: The tag to add.
       *
       * @return {promise<Tag>}
       */
      addTag: function (body) {

          //prepare query string for API call
          var baseUri = Configuration.BASEURI;
          var queryBuilder = baseUri + '/tags/v2/';

          //validate and preprocess url
          var queryUrl = APIHelper.cleanUrl(queryBuilder);

          //prepare headers
          var headers = {
              'accept': 'application/json',
              'content-type': 'application/json; charset=utf-8',
              'Authorization': 'Bearer ' + Configuration.oAuthAccessToken
          };

          //Remove null values
          APIHelper.cleanObject(body);

          //prepare and invoke the API call request to fetch the response
          var config = {
              method: 'POST',
              queryUrl: queryUrl,
              headers: headers,
              body: body
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
      },

      /**
       * Update or Add new Tag.
       * @param {Tag} body    Required parameter: The tag to add.
       *
       * @return {promise<Tag>}
       */
      updateTag: function (tagId, body) {

          //prepare query string for API call
          var baseUri = Configuration.BASEURI;
          var queryBuilder = baseUri + '/tags/v2/' + tagId;

          //validate and preprocess url
          var queryUrl = APIHelper.cleanUrl(queryBuilder);

          //prepare headers
          var headers = {
              'accept': 'application/json',
              'content-type': 'application/json; charset=utf-8',
              'Authorization': 'Bearer ' + Configuration.oAuthAccessToken
          };

          //Remove null values
          APIHelper.cleanObject(body);

          //prepare and invoke the API call request to fetch the response
          var config = {
              method: 'POST',
              queryUrl: queryUrl,
              headers: headers,
              body: body
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
      },

      /**
       * Retrieve Metadata.
       * @param {string} id    Required parameter: The uuid of the tag item
       *
       * @return {promise<Tag>}
       */
      getTag: function (id) {

          //prepare query string for API call
          var baseUri = Configuration.BASEURI;
          var queryBuilder = baseUri + '/tags/v2/{id}';

          //Process template parameters
          queryBuilder = APIHelper.appendUrlWithTemplateParameters(queryBuilder, {
              'id': id
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
      },

      /**
       * Remove Metadata from the system.
       * @param {string} id    Required parameter: The id of the tag item
       *
       * @return {promise<void>}
       */
      deleteTag: function (id) {

          //prepare query string for API call
          var baseUri = Configuration.BASEURI;
          var queryBuilder = baseUri + '/tags/v2/{id}';

          //Process template parameters
          queryBuilder = APIHelper.appendUrlWithTemplateParameters(queryBuilder, {
              'id': id
          });

          //validate and preprocess url
          var queryUrl = APIHelper.cleanUrl(queryBuilder);

          //prepare headers
          var headers = {
              'Authorization': 'Bearer ' + Configuration.oAuthAccessToken
          };

          //prepare and invoke the API call request to fetch the response
          var config = {
              method: 'DELETE',
              queryUrl: queryUrl,
              headers: headers,
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
