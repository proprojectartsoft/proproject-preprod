angular.module($APP.name).directive('field', [
    '$rootScope',
    'FieldUpdateService',
    '$ionicModal',
    function ($rootScope, FieldUpdateService, $ionicModal) {

        return {
            templateUrl: 'view/form/_all.html',
            restrict: 'EA',
            scope: {
                data: '='
            },
            link: function ($scope, $elem, $attrs) {
                $scope.value = $scope.data.value;
                $scope.dirty = false;
                $scope.submit = false;
                $scope.hash = "H" + $scope.$id;
                $ionicModal.fromTemplateUrl('view/form/_modal.html', {
                    scope: $scope,
                    animation: 'slide-in-up',
                    backdropClickToClose: false,
                    hardwareBackButtonClose: false,
                    focusFirstInput: true
                }).then(function (modal) {
                    $scope.modal = modal;
                });
                $scope.$on('submit', function () {
                    if ($scope.data.type === "checkbox") {
                        $scope.data.value = $scope.data.value ? true : false;
                    }
                    $scope.submit = true;
                });
                $scope.directiveClick = function (hash) {
                    $scope.modalHelper = [];
                    $scope.modalHelper.groupId = $scope.data.field_group_design_id;
                    $scope.modalHelper.fieldId = $scope.data.id;
                    $ionicModal.fromTemplateUrl('view/form/_modal.html', {
                        scope: $scope,
                        animation: 'slide-in-up',
                        backdropClickToClose: false,
                        hardwareBackButtonClose: false,
                        focusFirstInput: true
                    }).then(function (modal) {
                        $scope.modal = modal;
                        $scope.modal.hash = $scope.hash;
                        FieldUpdateService.addProduct($scope.modalHelper);
                        $rootScope.$broadcast('updateScopeFromDirective');
                        $scope.modal.show();
                    });
                };

                $scope.$watch('data.errors', function (data) {
                    if (data && data.length) {
                        angular.element($elem[0].firstChild).addClass('has-error');
                        $rootScope.$emit('invalidField', $scope.data);
                    }
                    else {
                        angular.element($elem[0].firstChild).removeClass('has-error');
                        $rootScope.$emit('validField', $scope.data);
                    }
                });

                $scope.$watch('data.value', function (data) {
                    if ($scope.value !== $scope.data.value) {
                        $scope.dirty = true;
                    }
                    if ((!$scope.data.value && $scope.dirty) || $scope.submit || ($scope.data.value && $scope.data.errors && $scope.data.errors.length)) {
                        $scope.$emit('validateField', $scope.data);
                    }
                });
                $scope.$on('focus', function () {
                    $elem.addClass('focus');
                });

                $scope.$on('blur', function () {
                    $elem.removeClass('focus');
                });

            }
        };
    }
]);
