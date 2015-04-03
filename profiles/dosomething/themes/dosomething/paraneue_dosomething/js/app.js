/**
 * This is where we load and initialize components of our app.
 */
define("app", function (require) {
  "use strict";

  var $ = require("jquery");
  var debounce = require("lodash/function/debounce");

  // let's get going
  var Finder   = require("finder/Finder");
  var Donate   = require("donate/Donate");
  var Revealer = require("revealer/Revealer");
  var Swapper  = require("swapper/Swapper");
  var Reportback = require("reportback/Reportback");
  var Share    = require("utils/Share");

  // Initialize modules on load
  require("dosomething-neue");
  require("dosomething-modal");
  require("dosomething-validation");

  require("campaign/SchoolFinder");
  require("validators/auth");
  require("validators/reportback");
  require("validators/address");
  require("validators/donate");
  require("Analytics");
  require("tiles");

  $(document).ready(function() {
    // If a fixed-sticky element is on the page, hook it up.
    $(".js-fixedsticky").fixedsticky();

    var $body = $("body");

    var $campaignFinderForm = $(".js-finder-form");
    if( $campaignFinderForm.length ) {
      var $results = $(".js-campaign-results");
      var $blankSlate = $(".js-campaign-blankslate");
      Finder.init($campaignFinderForm, $results, $blankSlate);
    }


    var $donateForm = $("#modal--donate-form");
    if( $donateForm.length ) {
      Donate.init();
    }

    var $revealGalleries = $body.find('[data-show-more="true"]');
    /**
     * Show hide large galleries.
     */
    if ($revealGalleries.length > 0) {
      var galleryList = [];

      $revealGalleries.each(function (index, gallery) {
        var $gallery = $(gallery);
        var $tiles = $gallery.find("li");
        var isMosaicGallery = $gallery.hasClass('-mosaic');
        var initialItems = isMosaicGallery ? 5 : 6;
        var stepItems = isMosaicGallery ? 8 : 6;

        if ($tiles.length > initialItems) {
          galleryList[index] = new Revealer($gallery, $tiles, "gallery", initialItems, stepItems);
        }
      });
    }

    var $mosaicGalleries = $body.find(".gallery.-mosaic");

    /**
     * Swap low resolution images for feature tiles in mosaic gallery
     * with higher resolution version from tablet size up.
     */
    if ($mosaicGalleries.length && $mosaicGalleries.hasClass("-featured")) {
      var swappedImagesList = [];

      $(window).on("resize", debounce(function () {

        if (window.matchMedia("(min-width: 768px)").matches && !swappedImagesList.length) {
          $mosaicGalleries.each(function (index) {
            var $featureTile = $(this).find("li").first();
            swappedImagesList[index] = new Swapper($featureTile);
          });
        }
      }, 500));

    }

    /**
     * Initialize Reportback js.
     */
    var $reportback = $body.find("#reportback");

    if ($reportback.length) {
      Reportback.init($reportback);
    }


    /*
     * Show share links in a popup
     */
    if ($body.find("a.js-share-link").length) {
      Share.popup();
    }

    /*
     * Toggle truncated text and long text on permalink pages.
     */
    var $showMoreText = $body.find(".js-permalink-show-more");

    if ($showMoreText.length) {
      $showMoreText.click(function(event) {
        event.preventDefault();
        $(".participate").toggleClass("is-shown");
        ($showMoreText.html() === "Show More") ? $showMoreText.html("Show Less") : $showMoreText.html("Show More");
      });
    }


    $("html").addClass("js-ready");

  });

});
