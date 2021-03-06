(function() {
  'use strict';

  angular.module('app.states')
    .run(appRun);

  /** @ngInject */
  function appRun(routerHelper) {
    routerHelper.configureStates(getStates());
  }

  function getStates() {
    return {
      'services.reconfigure': {
        url: '/:serviceId',
        templateUrl: 'app/states/services/reconfigure/reconfigure.html',
        controller: StateController,
        controllerAs: 'vm',
        title: N_('Service Details'),
        resolve: {
          service: resolveService
        }
      }
    };
  }

  /** @ngInject */
  function resolveService($stateParams, CollectionsApi) {
    var requestAttributes = [
      'provision_dialog'
    ];
    var options = {attributes: requestAttributes};

    return CollectionsApi.get('services', $stateParams.serviceId, options);
  }

  /** @ngInject */
  function StateController($state, $stateParams, CollectionsApi, service, Notifications, DialogFieldRefresh) {
    var vm = this;

    vm.title = __('Service Details');
    vm.service = service;
    vm.dialogs = [service.provision_dialog];
    vm.submitDialog = submitDialog;
    vm.cancelDialog = cancelDialog;

    var autoRefreshableDialogFields = [];
    var allDialogFields = [];

    angular.forEach(vm.dialogs, function(dialog) {
      angular.forEach(dialog.dialog_tabs, function(dialogTab) {
        angular.forEach(dialogTab.dialog_groups, function(dialogGroup) {
          angular.forEach(dialogGroup.dialog_fields, function(dialogField) {
            allDialogFields.push(dialogField);
            if (dialogField.default_value === '' && dialogField.values !== '') {
              dialogField.default_value = dialogField.values;
            }

            if (typeof (dialogField.values) === 'object' && dialogField.default_value === undefined) {
              dialogField.default_value = String(dialogField.values[0][0]);
            }

            dialogField.triggerAutoRefresh = function() {
              DialogFieldRefresh.triggerAutoRefresh(dialogField);
            };

            if (dialogField.auto_refresh === true) {
              autoRefreshableDialogFields.push(dialogField.name);
            }
          });
        });
      });
    });

    var dialogUrl = 'services/' + vm.service.service_template_catalog_id + '/service_templates';

    angular.forEach(allDialogFields, function(dialogField) {
      dialogField.refreshSingleDialogField = function() {
        DialogFieldRefresh.refreshSingleDialogField(allDialogFields, dialogField, dialogUrl, vm.service.id);
      };
    });

    DialogFieldRefresh.listenForAutoRefreshMessages(
      allDialogFields,
      autoRefreshableDialogFields,
      dialogUrl,
      vm.service.id
    );

    function submitDialog() {
      var dialogFieldData = {
        href: '/api/services/' + service.id
      };

      angular.forEach(allDialogFields, function(dialogField) {
        dialogFieldData[dialogField.name] = dialogField.default_value;
      });

      CollectionsApi.post(
        'services',
        $stateParams.serviceId,
        {},
        JSON.stringify({action: 'reconfigure', resource: dialogFieldData})
      ).then(submitSuccess, submitFailure);

      function submitSuccess(result) {
        Notifications.success(result.message);
        $state.go('services.details', {serviceId: $stateParams.serviceId});
      }

      function submitFailure(result) {
        Notifications.error(__('There was an error submitting this request: ') + result);
      }
    }

    function cancelDialog() {
      Notifications.success(__('Reconfigure this service has been cancelled'));
      $state.go('services.details', {serviceId: $stateParams.serviceId});
    }
  }
})();
