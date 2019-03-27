/*!
 * Angular FileManager v1.4.0 (https://github.com/joni2back/angular-filemanager)
 * Jonas Sciangula Street <joni2back@gmail.com>
 * Licensed under MIT (https://github.com/joni2back/angular-filemanager/blob/master/LICENSE)
 */

(function(window, angular, $) {
    "use strict";
    var app = angular.module('FileManagerApp', [
      'pascalprecht.translate',
      'ngCookies',
      'ngFileUpload',
      'checklist-model',
      'oc.lazyLoad',
      'ui.bootstrap',
      // 'schemaForm',
      'angularMoment',
      'ui.router',
      'ngSanitize',
      'ngStorage',
      'AgavePlatformScienceAPILib',
      'ngclipboard',
    ]);

    /**
     * jQuery inits
     */
    $(window.document).on('shown.bs.modal', '.modal', function() {
        setTimeout(function() {
            $('[autofocus]', this).focus();
        }.bind(this), 100);
    });

    $(window.document).on('click', function() {
        $("#context-menu").hide();
    });

    $(window.document).on('contextmenu', '.main-navigation .table-files tr, .iconset a.thumbnail', function(e) {
        var posX = $(this).position().left,
            posY = $(this).position().top;
        $("#context-menu").hide().css({
            left: posX + 100, //.pageX,
            top: posY - 200 //.pageY
        }).show();
        e.preventDefault();
    });

})(window, angular, jQuery);
