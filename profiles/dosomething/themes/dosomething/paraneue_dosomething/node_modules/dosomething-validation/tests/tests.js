/* jshint ignore:start */

module("Validation");

test("Match", function() {
  DSValidation.Validations.match.fn("dog", "cat", function(result) {
    ok(result.success == false, "should reject if different strings");
  });

  DSValidation.Validations.match.fn("dog", "Dog", function(result) {
    ok(result.success == false, "should reject if different capitalization");
  });

  DSValidation.Validations.match.fn("dog", "dog ", function(result) {
    ok(result.success == false, "should reject if different spacing");
  });

  DSValidation.Validations.match.fn("super$ecure19", "super$ecure19", function(result) {
    ok(result.success == true, "should accept if the same");
  });
});

