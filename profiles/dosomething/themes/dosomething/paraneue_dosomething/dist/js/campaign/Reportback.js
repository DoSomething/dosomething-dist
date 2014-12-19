define(function(require) {
  "use strict";

  var $               = require("jquery");
  var Events          = require("neue/events");
  var ImageUploadBeta = require("campaign/ImageUploadBeta");
  var Revealer        = require("revealer/Revealer");


  var Reportback = {

    $viewMoreButton: $("<button id=\"\" >View more</button>"),
    $uploadButton  : $(".js-image-upload-beta"),
    $reportbackForm: $("#dosomething-reportback-form"),

    /**
     * Initialize the Reportback interface.
     *
     * @param  {jQuery} $container  Reportback container object.
     */
    init: function ($container) {
      var $initialGallery = $container.find(".gallery--reportback");
      this.$viewMoreButton.insertAfter($initialGallery);

      this.$viewMoreButton.on("click", this.request);

      // Initializes image upload modal.
      var imageUpload = new ImageUploadBeta(this.$uploadButton);

      var _this = this;

      // Grab the image caption and crop information from the modal only when the user is done with it.
      Events.subscribe("Modal:Close", function() {
        _this.setImageOptions(imageUpload.getImageValues());
      });
    },


    /**
     * [request description]
     * @return {[type]} [description]
     */
    request: function () {
      // Add AJAX call here.
      // $.ajax({
      //   url: '',
      //   dataType: 'json'
      // }).done(function () {

      // }).fail(function () {

      // }).always(function () {

      // });
    },

    /**
    * Populates the main reportback form with values from the image upload modal.
    *
    * @param  {jQuery} imageOptions  An object containing vaules from the modal.
    */
    setImageOptions: function(imageOptions) {
      var $captionField = this.$reportbackForm.find("input[name='caption']");
      $captionField.val(imageOptions.caption);
    },

  };


  return Reportback;
});
