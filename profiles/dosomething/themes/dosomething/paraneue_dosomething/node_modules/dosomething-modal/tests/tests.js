/* jshint ignore:start */

module("Modal");

test("Basic Usage", function(assert) {
  var $modal = $("#test-modal");

  // Modal should not be visible on page load.
  assert.equal($modal.is(":visible"), false, "Modal is not visible on page load.");

  // Click the modal link
  $("a[data-modal-href='#test-modal']").trigger('click');

  // Modal should be visible after corresponding link is clicked.
  assert.equal($modal.is(":visible"), true, "Modal is not visible on page load.");
  assert.equal($("#test-modal-unused").is(":visible"), false, "Only the referenced modal is shown.");

  assert.equal($modal.find(".js-close-modal").length, 1, "Close button is added to modal when clicking open.");
});

test("Modal API", function(assert) {
  var $modal = $("#test-modal");

  DSModal.open($modal, { animated: false });

  assert.equal($modal.is(":visible"), true, "Modal can be opened by API.");

  assert.equal(DSModal.isOpen(), true, "Modal isOpen() returns true when open.");

  DSModal.close({ animated: false });

  assert.equal($modal.is(":visible"), false, "Modal can be closed by API.");

  assert.equal(DSModal.isOpen(), false, "Modal isOpen() returns false when open.");
});

