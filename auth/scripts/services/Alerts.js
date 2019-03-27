angular.module('AlertService', []).service('Alerts', ['$rootScope', function ($rootScope) {

    this.success = function(options) {
        options.type = 'success';
        return this.alert(options);
    };

    this.danger = function(options) {
        options.type = 'danger';
        return this.alert(options);
    };

    this.warning = function(options) {
        options.type = 'warning';
        return this.alert(options);
    };

    this.info = function(options) {
        options.type = 'info';
        return this.alert(options);
    };

    var getUniqueID = function(prefix) {
        return 'prefix_' + Math.floor(Math.random() * (new Date()).getTime());
    }

    this.alert = function (options) {

        options = $.extend(true, {
            container: "", // alerts parent container(by default placed after the page breadcrumbs)
            place: "append", // "append" or "prepend" in container
            type: 'success', // alert's type
            message: "", // alert's message
            close: true, // make alert closable
            reset: false, // close all previouse alerts first
            focus: true, // auto scroll to the alert after shown
            closeInSeconds: 0, // auto close after defined seconds
            icon: "" // put icon before the message
        }, options);

        var id = getUniqueID("App_alert");

        var html = '<div id="' + id + '" class="custom-alerts alert alert-' + options.type + ' fade in">' + (options.close ? '<button type="button" class="close" data-dismiss="alert" aria-hidden="true"></button>' : '') + (options.icon !== "" ? '<i class="fa-lg fa fa-' + options.icon + '"></i>  ' : '') + options.message + '</div>';

        if (options.reset) {
            $('.custom-alerts').remove();
        }

        if (!options.container) {
            if ($('body').hasClass("page-container-bg-solid") || $('body').hasClass("page-content-white")) {
                $('.page-title').after(html);
            } else {
                if ($('.page-bar').size() > 0) {
                    $('.page-bar').after(html);
                } else {
                    $('.page-breadcrumb').after(html);
                }
            }
        } else {
            if (options.place == "append") {
                $(options.container).append(html);
            } else {
                $(options.container).prepend(html);
            }
        }

        if (options.closeInSeconds > 0) {
            setTimeout(function () {
                $('#' + id).remove();
            }, options.closeInSeconds * 1000);
        }

        return id;
    };
}]);