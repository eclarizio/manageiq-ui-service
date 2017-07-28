describe('Directive: confirmation', function() {
  beforeEach(module('app.shared'));
  describe('template', function() {
    let parentScope, $compile;

    beforeEach(inject(function(_$compile_, _$rootScope_) {
      $compile = _$compile_;
      parentScope = _$rootScope_.$new();
    }));

    const compileHtml = function(markup, scope) {
      let element = angular.element(markup);
      $compile(element)(scope);
      scope.$digest();
      return element;
    };

    it('should compile confirmation when invoked', () => {
      const element = compileHtml(angular.element(`<confirmation on-ok="console.log()" />`), parentScope);

      expect(element[0]).to.be.defined;
    });
  });
});