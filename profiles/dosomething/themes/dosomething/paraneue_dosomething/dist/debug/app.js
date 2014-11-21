define("text", {
    load: function(id) {
        throw new Error("Dynamic load not allowed: " + id);
    }
}), define("text!finder/templates/campaign.tpl.html", [], function() {
    return '<li>\n<article class="tile tile--campaign campaign-result<% if(featured) { %> big<% } %>">\n  <a class="wrapper" href="<%= url %>">\n    <% if(staffPick) {  %><div class="__flag -staff-pick"><%= Drupal.t("Staff Pick") %></div><% } %>\n    <div class="tile--meta">\n      <h1 class="__title"><%= title %></h1>\n      <p class="__tagline"><%= description %></p>\n    </div>\n    <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=" data-src="<%= image %>">\n  </a>\n</article>\n</li>\n';
}), define("finder/Campaign", [ "require", "jquery", "lodash", "text!finder/templates/campaign.tpl.html" ], function(require) {
    var $ = require("jquery"), _ = require("lodash"), campaignTplSrc = require("text!finder/templates/campaign.tpl.html"), Campaign = function(data) {
        // Default values for a newly created campaign
        var defaults = {
            title: Drupal.t("New Campaign"),
            description: Drupal.t("Take your dad to get his blood pressure checked"),
            url: "#",
            staffPick: !1,
            featured: !1
        };
        // Merge the campaign object from data with the defaults into
        // this campaign object
        $.extend(this, defaults, this.convert(data));
    };
    /**
   * Convert fields from the Solr results to relevant local, friendlier
   * field names.
   *
   * @param  {Object} data The raw campaign object
   *
   * @return {Object} The new data translated and ignoring
   */
    /**
   * Render a campaign
   * @return {jQuery} The jQuery object that is the rendered representation of this Campaign
   */
    return Campaign.prototype.convert = function(data) {
        var newData = {}, map = {
            label: "title",
            sm_field_call_to_action: "description",
            url: "url",
            bs_field_staff_pick: "staffPick",
            bs_sticky: "featured",
            ss_field_search_image_400x400: "image"
        };
        // Only populate fields that we care about from the map.
        for (var i in data) void 0 !== map[i] && (newData[map[i]] = data[i]);
        return newData;
    }, Campaign.prototype.render = function() {
        var $wrapper = _.template(campaignTplSrc, {
            image: this.image,
            staffPick: this.staffPick,
            featured: this.featured,
            title: this.title,
            description: this.description,
            url: this.url
        });
        return $wrapper;
    }, Campaign;
}), define("text!finder/templates/no-results.tpl.html", [], function() {
    return '<div class="no-result">\n  <div class="wrapper">\n    <p class="message"><%= Drupal.t("Oh snap! We\'ll work on that.") %></p>\n    <p>\n      <a id="reset-filters" href="/">\n        <%= Drupal.t("Want to try another combo?") %>\n      </a>\n    </p>\n  </div>\n</div>\n';
}), define("finder/ResultsView", [ "require", "jquery", "lodash", "finder/Campaign", "text!finder/templates/no-results.tpl.html" ], function(require) {
    var $ = require("jquery"), _ = require("lodash"), Campaign = require("finder/Campaign"), noResultsTplSrc = require("text!finder/templates/no-results.tpl.html"), ResultsView = {
        // The container element where the results go
        $container: null,
        // The gallery located in the container
        $gallery: $("<ul class='gallery -mosaic'></ul>"),
        // The div that is shown if no filters are selected
        $blankSlateDiv: null,
        // How many slots are currently used. Full-height = 2, half-height = 1
        slots: 0,
        // How many slots are we allowing
        maxSlots: 8,
        // For tracking what page we're on
        start: 0,
        /**
     * Construct the cloneables and set the parent div where the results go
     * @param  {jQuery} $container        The container element where the results will live
     * @param  {jQuery} $blankSlateDiv    The div containing initial pre-filtered state
     * @param  {function} paginateAction  Function to query next page of results.
     */
        init: function($container, $blankSlateDiv, paginateAction, clearFormAction) {
            ResultsView.$container = $container, ResultsView.$container.hide(), ResultsView.$paginationLink = $("<div class='pagination-link'><a href='#' class='secondary js-finder-show-more'>" + Drupal.t("Show More") + "</a></div>"), 
            $("body").on("click", ".js-finder-show-more", function(event) {
                event.preventDefault(), paginateAction(ResultsView.start);
            }), ResultsView.$blankSlateDiv = $blankSlateDiv, ResultsView.$container.on("click", "#reset-filters", function(event) {
                event.preventDefault(), ResultsView.showBlankSlate(), // TODO: Maybe allow for FormView.clear() to be called from ResultsView so
                // it doesn't have to be passed in as an argument to the init().
                clearFormAction();
            });
        },
        /**
     * Shows the blank slate div (initial state).
     */
        showBlankSlate: function() {
            ResultsView.$container.hide(), ResultsView.$blankSlateDiv.show();
        },
        /**
     * Shows the empty slate div (no results state).
     */
        showEmptyState: function() {
            var message = _.template(noResultsTplSrc);
            ResultsView.$container.append(message);
        },
        /**
     * Replace current results with new data
     * @param  {Object} data The raw data from the query
     */
        parseResults: function(data) {
            if (// Remove the old results
            ResultsView.clear(), data.retrieved > 0) {
                // Results view cleared, and since we have results add the gallery into the container.
                ResultsView.$container.append(ResultsView.$gallery);
                // Loopy loop! (Like me after drinking coffeeeee)
                for (var i in data.result.response.docs) ResultsView.add(new Campaign(data.result.response.docs[i]));
                // There are more results than we've shown so far, add "Show More" button
                ResultsView.showPaginationLink(data.result.response.numFound > ResultsView.start);
            } else ResultsView.showEmptyState();
            // Hey! We're done loading! I guess we can let the users know we're done.
            ResultsView.loading(!1);
        },
        /**
     * Show or hide pagination link.
     * @param {boolean} showLink    Should link be shown?
     */
        showPaginationLink: function(showLink) {
            ResultsView.$paginationLink.remove(), showLink && (ResultsView.$container.append(ResultsView.$paginationLink), 
            ResultsView.$paginationLink.show());
        },
        /**
     * Append to current results with new data.
     * @param  {Object} data The raw data from the query
     */
        appendResults: function(data) {
            // Add those results to the page!
            for (var i in data.result.response.docs) ResultsView.add(new Campaign(data.result.response.docs[i]));
            // There are more results than we've shown so far, add "Show More" button
            ResultsView.showPaginationLink(data.result.response.numFound > ResultsView.start), 
            // Hey! We're done loading! I guess we can let the users know we're done.
            ResultsView.loading(!1);
        },
        /**
     * Toggle the loading indicator for the results div
     * @param  {boolean} setTo Should I stay or should I go? If I go there will be trouble...or clicking.
     */
        loading: function(setTo) {
            // Allow the function to be called without a parameter, since X.loading() would seem
            // to be a logical call.
            void 0 === setTo && (setTo = !0), // If we're loading, add a class to the results div. Otherwise, remove it.
            ResultsView.$container.append("<div class='spinner'></div>"), ResultsView.$container.toggleClass("loading", setTo);
        },
        /**
     * Have we run the init method?
     */
        checkInit: function() {
            if (null === ResultsView.$container) // Nope. I'm gonna vomit...
            throw Drupal.t("Error: ResultsView is not initialized.");
        },
        /**
     * Remove the current results and reboot this object.
     */
        clear: function() {
            ResultsView.checkInit(), ResultsView.$container.empty(), ResultsView.$gallery.empty(), 
            ResultsView.$container.show(), ResultsView.$blankSlateDiv.hide(), ResultsView.slots = 0, 
            ResultsView.start = 0;
        },
        /**
     * Add a campaign to the results
     * @param {Campaign} campaign The campaign to add
     */
        add: function(campaign) {
            // Make sure we've initialized ourself
            ResultsView.checkInit(), // If we're full, screw it.
            // if (ResultsView.slots === ResultsView.maxSlots) {
            //   return;
            // }
            // Render campaign object and append to the gallery
            ResultsView.$gallery.append(campaign.render()), ResultsView.slots++, // Track where we are for paging
            ResultsView.start++, // Lazy-load in images
            ResultsView.$container.find("img").unveil(200, function() {
                $(this).load(function() {
                    this.style.opacity = 1;
                });
            });
        }
    };
    return ResultsView;
}), define("finder/SolrAdapter", [ "require", "jquery", "lodash" ], function(require) {
    var $ = require("jquery"), _ = require("lodash");
    // Create a callback function for caching the jsonp response.
    /* jshint ignore:start */
    window.solrResponse = function() {};
    /* jshint ignore:end */
    /**
   * SolrAdapter acts as a mediator between Solr and the Campaign Finder.
   *
   * @type {Object}
   */
    var SolrAdapter = {
        /*
     * Sets how long after a user interaction we run the Solr query. As the
     * name implies, this is a throttling mechanism that prevents the browser
     * from pinging Solr every...single...time...a checkbox is changed.
     **/
        throttleTimeout: 400,
        /*
     * Configure this too. What's the base URL of the Solr server that you want
     * the browser pinging? And what collection?
     **/
        baseURL: Drupal.settings.dosomethingSearch.solrURL,
        collection: Drupal.settings.dosomethingSearch.collection,
        // The current throttle timeout identifier
        throttle: null,
        // This would be awesome with an object key:value, but Solr allows multiple of the same key
        defaultQuery: [ "fq=-sm_field_campaign_status:(closed) bundle:[campaign TO campaign_group]", //"fq=ss_field_search_image:[* TO *]",
        "wt=json", "indent=false", "facet=true", "facet.field=fs_field_active_hours", "facet.field=im_field_cause", "facet.field=im_field_action_type", // TODO: un-hard-code the rows
        "rows=8", "fl=label,tid,im_vid_1,sm_vid_Action_Type,tm_vid_1_names,im_field_cause,im_vid_2,sm_vid_Cause,tm_vid_2_names,im_field_tags,im_vid_5,sm_vid_Tags,tm_vid_5_names,fs_field_active_hours,sm_field_call_to_action,bs_field_staff_pick,ss_field_search_image_400x400,ss_field_search_image_720x720,url" ],
        // Map the input field names to the Solr query fields
        fieldMap: {
            cause: "im_field_cause",
            time: "fs_field_active_hours",
            "action-type": "im_field_action_type"
        },
        // Inverse mapping of fieldMap (duhhh)
        fieldMapInverse: {},
        // Container for Ajax response data
        responseData: null,
        /**
     * Initialize the SolrAdapter.
     */
        init: function() {
            // Create an inverse mapping so we can go from Solr field name to local field name
            SolrAdapter.fieldMapInverse = _.invert(SolrAdapter.fieldMap);
        },
        /**
     * Run the query after a specified timeout.
     *
     * @param checkedFields      Array of fields selected in the interface.
     * @param offset             Offset to start results from (used for pagination).
     * @param responseCallback   Function called when query successfully completes.
     */
        throttledQuery: function(checkedFields, offset, responseCallback) {
            // Cancel the current pending query and set a new one
            clearTimeout(SolrAdapter.throttle), // Set a timeout so we don't immediately ping the Solr server
            SolrAdapter.throttle = setTimeout(function() {
                SolrAdapter.query(checkedFields, offset, responseCallback);
            }, SolrAdapter.throttleTimeout);
        },
        /**
     * Run the query against the Solr server
     *
     * @param checkedFields      Array of fields selected in the interface.
     * @param offset             Offset to start results from (used for pagination).
     * @param responseCallback   Function called when query successfully completes.
     */
        query: function(checkedFields, offset, responseCallback) {
            /**
       * A clone of the default query so we don't modify it directly
       * @type {Array}
       */
            var query = _.clone(SolrAdapter.defaultQuery);
            query.push("start=" + offset);
            /**
       * The "q" parameter passed to Solr
       * @type {Array}
       */
            var q = [];
            _.forOwn(checkedFields, function(fields, fieldGroup) {
                // Don't build parameter if we're not sorting by anything in this field group.
                if (!_.isEmpty(fields)) {
                    // Build a param query
                    var param = "(" + fields.join(") OR (") + ")", powerset = SolrAdapter.generatePowerset(fields);
                    powerset.length && (param += " OR " + powerset), // Push the newly built parameter onto the q parameter
                    q.push(SolrAdapter.fieldMap[fieldGroup] + ":(" + encodeURIComponent(param) + ")");
                }
            }), // If we're already running an AJAX request, cancel it
            SolrAdapter.xhr && SolrAdapter.xhr.abort(), // Store the AJAX request locally
            SolrAdapter.xhr = $.ajax({
                dataType: "jsonp",
                cache: !0,
                jsonpCallback: "solrResponse",
                url: SolrAdapter.buildQuery(query, q),
                success: function(data) {
                    responseCallback({
                        result: data,
                        retrieved: data.response.docs.length
                    });
                },
                error: function(data, errorType) {
                    responseCallback({
                        result: !1,
                        error: errorType
                    });
                },
                // We use jsonp for X-domain compatibility
                jsonp: "json.wrf"
            });
        },
        /**
     * Build a Solr query based on a base query string (what comes after the ?)
     * and a "q" which goes into the "q=" part of said query string.
     *
     * @param  {String} query The query string
     * @param  {String} q     The string for concatting into the q= parameter
     *
     * @return {String} The entire URL to query against
     */
        buildQuery: function(query, q) {
            // Add "q=" to the query array, and keep track of its position because we"re going
            // to need to modify it (less memory!)
            var pos = query.push("q=") - 1, bubble = '_query_:"{!func}scale(is_bubble_factor,0,100)" AND ';
            // If there is a query, join that sucker together
            // Join the query array together as a URL query string
            return query[pos] = q.length > 0 ? 1 === q.length ? "q=" + bubble + q[0] : "q=" + bubble + "(" + q.join(") AND (") + ")" : bubble, 
            query = query.join("&"), SolrAdapter.baseURL + SolrAdapter.collection + "/select?" + query;
        },
        /**
     * This one's fun! We want to generate power sets so we can weight results in a search.
     *
     * Instead of reading the code, here's an example!
     *
     * [a, b, c]"s powerset+weight is:
     * - []             IGNORED (i=0)
     * - [a]            IGNORED (length=1)
     * - [b]            IGNORED (length=1)
     * - [c]            IGNORED (length=1)
     * - (a AND b)      ^200
     * - (b AND c)      ^200
     * - (a AND b AND c)^300
     *
     *
     * @param  {Array} params Parameters to powerset-ize
     *
     * @return {String} A powerset-ized query string joined by OR
     */
        generatePowerset: function(params) {
            // Create a powerset
            // See: http://rosettacode.org/wiki/Power_set#JavaScript
            function powerset(ary) {
                for (var ps = [ [] ], i = 0; i < ary.length; i++) for (var j = 0, len = ps.length; len > j; j++) ps.push(ps[j].concat(ary[i]));
                return ps;
            }
            // Loop through and build the string query
            for (var variations = powerset(params), q = [], i = 1; i < variations.length; i++) variations[i].length > 1 && // Generate a string of format: ((a) AND (b) AND (c OR d))^X
            // We need the second set of parenthesis beacuse some parameters are in the format
            // "c OR d" or "[* TO 2]"
            q.push("((" + variations[i].join(") AND (") + "))^" + 100 * variations[i].length);
            return q.join(" OR ");
        }
    };
    return SolrAdapter;
}), define("text!finder/templates/error.tpl.html", [], function() {
    return '<div class="messages error">\n  <%= Drupal.t("Ooof! We\'re not sure what\'s up? Maybe it\'s us, or it could be your internet connection. Want to try again in a few minutes?") %>\n</div>\n';
}), define("finder/FormView", [ "require", "jquery", "lodash", "finder/ResultsView", "finder/SolrAdapter", "text!finder/templates/error.tpl.html" ], function(require) {
    var $ = require("jquery"), _ = require("lodash"), ResultsView = require("finder/ResultsView"), SolrAdapter = require("finder/SolrAdapter"), errorTplSrc = require("text!finder/templates/error.tpl.html"), FormView = {
        // The div where the form goes
        $div: null,
        // <button> that mobile users click to initiate the search
        $searchButton: null,
        // The field groups that contain the checkmarks
        $fields: {},
        // The last field group that was changed (by name)
        lastChanged: null,
        // TODO: Can we get this from CSS somewhere instead so it's not hard-coded?
        cssBreakpoint: 768,
        /**
     * Construct the cloneables and set the parent div where the results go
     * @param  {jQuery} $div The div where the results will live
     */
        init: function($div, queryCallback) {
            FormView.$div = $div, // Prepare toggles
            $div.find("[data-toggle]").click(function() {
                var $this = $(this), toggleClass = $this.data("toggle"), $parent = $this.parent("." + toggleClass), $siblings = $parent.siblings();
                $parent.toggleClass("open"), // Need to treat siblings slightly differently to safeguard when going from mobile to desktop.
                $(window).outerWidth() >= FormView.cssBreakpoint && ($parent.hasClass("open") ? $siblings.addClass("open") : $siblings.removeClass("open"));
            }), // Store the inputs so we can access them later
            FormView.$fields.cause = $div.find("input[name='cause']"), FormView.$fields.time = $div.find("input[name='time']"), 
            FormView.$fields["action-type"] = $div.find("input[name='action-type']"), // Hook up to the DOM
            FormView.$searchButton = $div.find(".campaign-search"), // Loop through each field selector
            // @TODO This is tightly coupled.
            _.each(FormView.$fields, function(fieldGroup) {
                // For each field selector, we need to add a Facet query so we can get counts to
                // disable the checkbox.
                fieldGroup.each(function(idx, element) {
                    /**
           * The Solr field name that we're going to query against
           * @type {String}
           */
                    var field = SolrAdapter.fieldMap[$(element).prop("name")], val = $(element).val();
                    // Add the facet query
                    SolrAdapter.defaultQuery.push("facet.query=" + field + ":" + val);
                });
            }), // Now attach events:
            _.each(FormView.$fields, function(fieldGroup) {
                // Attach ourselves to the "change" event on the input fields
                fieldGroup.change(function() {
                    // check this guy
                    $(this).parents("li").toggleClass("checked", $(this).is(":checked")), // Save the last checkbox that we checked so we don"t disable any of
                    // those fields if we"re trying to select multiple
                    FormView.lastChanged = $(this).attr("name"), // If we're not on mobile...
                    queryCallback();
                });
            }), // Search button appears on mobile in lieu of live filtering
            FormView.$searchButton.click(function() {
                queryCallback(), $("html,body").animate({
                    scrollTop: ResultsView.$div.offset().scrollTop
                }, 1e3);
            });
        },
        /**
     * Have we run the init method?
     */
        checkInit: function() {
            if (null === FormView.$div) // Nope. I'm gonna vomit...
            throw Drupal.t("Error: FormView is not initialized.");
        },
        /**
     * Shows an error message for network issues
     **/
        showErrorMessage: function() {
            var message = _.template(errorTplSrc);
            $(".error").length < 1 && FormView.$div.parents(".finder--form").after(message);
        },
        /**
     * Returns Boolean if any fields are checked
     **/
        hasCheckedFields: function() {
            var hasChecked = !1;
            // Loop through each of the field groups
            return _.each(FormView.$fields, function(fieldGroup) {
                fieldGroup.filter(":checked").length > 0 && (hasChecked = !0);
            }), hasChecked;
        },
        /**
     * Returns an object with arrays of checked fields grouped by fieldGroup.
     **/
        getCheckedFields: function() {
            var checkedFields = [];
            // Loop through each of the field groups
            return _.each(FormView.$fields, function(fieldGroup, groupName) {
                var checked = fieldGroup.filter(":checked");
                checkedFields[groupName] = [], // Only add this to the query if there are fields checked in this field group
                checked.length > 0 && // For each checked box, add it to the search query
                checked.each(function(index, e) {
                    checkedFields[groupName].push($(e).val());
                });
            }), checkedFields;
        },
        /**
     * Disable fields that have no results available for the given selection
     *
     * @param  {Object} results The Solr facet_queries result
     */
        disableFields: function(results) {
            // Make sure we've initialized ourself
            FormView.checkInit(), // @TODO: This is super inefficient. We should be storing state in memory
            // rather than in the DOM, and then rendering the form based on that state.
            // for each of the facet queries
            _.each(results, function(query, key) {
                // Solr returns results in the format field_label:count instead of a nice
                // associative array. :( Let"s parse that out.
                var keyArr = key.split(":"), field = keyArr[0], value = keyArr[1], $checkboxes = $("input[name='" + SolrAdapter.fieldMapInverse[field] + "']");
                if (_.isEmpty($checkboxes.filter(":checked"))) {
                    // Should we disable this field? Whelp, if there are no results, the answer is yes!
                    var disabled = 0 === results[key], $checkbox = $checkboxes.filter("[value='" + value + "']");
                    // Set the disabled attribute if we need to (note: disabled is a variable!)
                    $checkbox.prop("disabled", disabled), disabled ? (// Let"s uncheck it if we can't select it. It would be confusing otherwise.
                    $checkbox.prop("checked", !disabled), // And add a class so we can make it look purdy.
                    $checkbox.parents("li").addClass("disabled")) : // Oh, hey! It's re-enabled! Let"s make it look purdier than it was.
                    $checkbox.parents("li").removeClass("disabled");
                } else $checkboxes.filter(":not(:checked)").prop("disabled", !0), $checkboxes.filter(":not(:checked)").parents("li").addClass("disabled");
            });
        },
        /**
     * Remove the current results and reboot this object.
     */
        clear: function() {
            //FormView.checkInit();
            _.each(FormView.$fields, function(fieldGroup) {
                var disabled = fieldGroup.filter(":disabled");
                disabled && fieldGroup.prop("disabled", !1).parents("li").removeClass("disabled");
            });
        }
    };
    return FormView;
}), define("finder/Finder", [ "require", "finder/FormView", "finder/ResultsView", "finder/SolrAdapter" ], function(require) {
    var FormView = require("finder/FormView"), ResultsView = require("finder/ResultsView"), SolrAdapter = require("finder/SolrAdapter"), Finder = {
        /**
     * Initialize the Campaign Finder and, by extension, the Campaign Results handler
     *
     * @param  {JQuery} $formContainer       The div that the filters will be shown in
     * @param  {JQuery} $resultsContainer    The container element that the results will be injected into
     * @param  {JQuery} $blankSlate          The div that will be shown when no filter is selected
     */
        init: function($formContainer, $resultsContainer, $blankSlate) {
            // Initialize the ResultsView
            FormView.init($formContainer, Finder.query), ResultsView.init($resultsContainer, $blankSlate, Finder.query, FormView.clear), 
            // Prepare the Solr adapter
            SolrAdapter.init();
        },
        /**
     * Run the query against the Solr server
     * @param  {int} offset   Offset to start results at (used for pagination).
     */
        query: function(offset) {
            var queryOffset = offset || 0, checkedFields = FormView.getCheckedFields();
            // Run the Solr query
            queryOffset ? // Otherwise, append to existing result set
            SolrAdapter.throttledQuery(checkedFields, queryOffset, ResultsView.appendResults) : // If no offset, we display a new set of results
            SolrAdapter.throttledQuery(checkedFields, queryOffset, Finder.displayResults), // Mark the results pane as loading
            ResultsView.loading();
        },
        /**
     * Displays results after querying Solr.
     * @param data  Results from SolrAdapter
     **/
        displayResults: function(data) {
            data.result ? FormView.hasCheckedFields() ? (ResultsView.parseResults(data), /* jshint ignore:start */
            // Using that underscore variable notation for Solr.
            FormView.disableFields(data.result.facet_counts.facet_queries)) : (ResultsView.showBlankSlate(), 
            FormView.clear()) : FormView.showErrorMessage();
        }
    };
    return Finder;
}), define("StripeForm", [ "require", "jquery" ], function(require) {
    var $ = require("jquery"), Stripe = window.Stripe || {}, StripeForm = function($form, publishKey) {
        if (void 0 !== $form && $($form.length) && void 0 !== publishKey) {
            if (!this instanceof StripeForm) return new StripeForm($form, publishKey);
            this.$form = $($form), this.$parent = this.$form.parent(), this.publishKey = publishKey, 
            this.init();
        }
    };
    return StripeForm.prototype = {
        /**
      * Sets the publishable key to Stripe and adds event listeners to the form
    */
        init: function() {
            var _this = this;
            Stripe.setPublishableKey(this.publishKey), this.$form.on("submit", function(ev) {
                ev.preventDefault();
            }), // attach event listener to submit button to avoid double binding
            this.$form.find(".form-submit").on("click", function() {
                // Timeout needed so errors (if any) can render first
                setTimeout(function() {
                    var isValid = _this.isValid();
                    isValid && Stripe.card.createToken(_this.$form, function(status, response) {
                        _this.onFormSubmit(status, response);
                    });
                }, 100);
            });
        },
        /**
      * Callback method when form is submitted
      * @param {String} Response status code
      * @param {object} JSON response from submitted token
    */
        onFormSubmit: function(status, response) {
            var $form = this.$form;
            if (response.error) // Show the errors on the form
            $form.find(".payment-errors").text(response.error.message); else {
                // response contains id and card, which contains additional card details
                var token = response.id;
                $form.find("input[name='token']").val(token), $form.get(0).submit();
            }
        },
        /**
      * Checks for invalid form fields
      * @returns {boolean} Whether form contains zero errors or not
    */
        isValid: function() {
            return 0 === this.$form.find(".error").length;
        }
    }, StripeForm;
}), define("donate/Donate", [ "require", "jquery", "StripeForm" ], function(require) {
    var $ = require("jquery"), StripeForm = require("StripeForm"), $donateForm = $("#dosomething-payment-form"), Donate = {
        init: function() {
            try {
                var stripeAPIPublishKey = Drupal.settings.dosomethingPayment.stripeAPIPublish;
                new StripeForm($donateForm, stripeAPIPublishKey);
            } catch (e) {
                $donateForm.html("<div class='messages'>Whoops! Something's not right. Please email us!</div>");
            }
        }
    };
    return Donate;
}), define("revealer/Revealer", [ "require", "jquery" ], function(require) {
    var $ = require("jquery"), Revealer = function($container, $content, category) {
        this.$container = $container, this.$content = $content, this.$button = $('<button class="btn tertiary">' + Drupal.t("Show More") + "</button>"), 
        this.category = category, this.init();
    };
    return Revealer.prototype.init = function() {
        this.detachContent(), this.enableButton();
    }, Revealer.prototype.detachContent = function() {
        "gallery" === this.category && (this.$content = this.$content.slice(5)), this.$content.detach();
    }, Revealer.prototype.reattachContent = function() {
        this.$container.append(this.$content);
    }, Revealer.prototype.enableButton = function() {
        this.$button.insertAfter(this.$container);
        var _this = this;
        this.$button.on("click", function() {
            _this.reattachContent(), _this.$button.remove();
        });
    }, Revealer;
}), /**
 * # Image Carousel
 *
 * Adds simple "previous/next" functionality to slide deck-style image
 * galleries with the following markup:
 *
 * @example
 * //  <div class="js-carousel gallery">
 * //    <div id="prev" class="prev-wrapper">
 * //      <div class="prev-button"><span class="arrow">&#xe605;</span></div>
 * //    </div>
 * //
 * //    <div class="carousel-wrapper">
 * //      <figure id="slide0" class="slide"><img src="./img/example_img0.jpg" /></figure>
 * //      <figure id="slide1" class="slide"><img src="./img/example_img1.jpg" /></figure>
 * //      <figure id="slide2" class="slide"><img src="./img/example_img2.jpg" /></figure>
 * //      <figure id="slide3" class="slide"><img src="./img/example_img3.jpg" /></figure>
 * //    </div>
 * //
 * //    <div id="next" class="next-wrapper">
 * //      <div class="next-button"><span class="arrow">&#xe60a;</span></div>
 * //    </div>
 * //  </div>
 *
 */
define("neue/carousel", [], function() {
    var $ = window.jQuery;
    $(function() {
        // Decrement counter
        function decrementCounter() {
            // If first slide is shown, restart loop
            // Else, show previous slide
            0 === counter ? counter = totalCount : counter--;
        }
        // Increment counter
        function incrementCounter() {
            // If last slide is shown, restart loop
            // Else, show next slide
            counter === totalCount ? counter = 0 : counter++;
        }
        // Toggle slide visibility
        function showCurrentSlide(direction) {
            // Remove "visibile" class from the current slide
            $("#slide" + counter).removeClass("visible"), // Increment or decrement slide position based on user"s request
            "prev" === direction ? decrementCounter() : incrementCounter(), // Assign "visible" class to the requested slide
            $("#slide" + counter).addClass("visible");
        }
        // Show first image
        $("#slide0").addClass("visible");
        // Make carousel stateful
        var counter = 0, totalCount = $(".slide").length - 1, $buttons = $("#prev, #next");
        // Bind click event to carousel buttons
        $buttons.click(function() {
            showCurrentSlide($(this).attr("id"));
        });
    });
}), /**
 * @module neue/events
 * Pub/Sub events: Allows modules to communicate via publishing
 * and subscribing to events.
 *
 * Based on Addy Osmani's Pubsubz, licensed under the GPL.
 * https://github.com/addyosmani/pubsubz
 * http://jsfiddle.net/LxPrq/
 */
define("neue/events", [], function() {
    var topics = {}, subUid = -1, publish = function(topic, args) {
        return topics[topic] ? (setTimeout(function() {
            for (var subscribers = topics[topic], len = subscribers ? subscribers.length : 0; len--; ) subscribers[len].func(topic, args);
        }, 0), !0) : !1;
    }, subscribe = function(topic, func) {
        topics[topic] || (topics[topic] = []);
        var token = (++subUid).toString();
        return topics[topic].push({
            token: token,
            func: func
        }), token;
    }, unsubscribe = function(token) {
        for (var m in topics) if (topics[m]) for (var i = 0, j = topics[m].length; j > i; i++) if (topics[m][i].token === token) return topics[m].splice(i, 1), 
        token;
        return !1;
    };
    // Export public API
    return {
        publish: publish,
        subscribe: subscribe,
        unsubscribe: unsubscribe
    };
}), /**
 * Applies a smooth-scroll animation on links with the `.js-jump-scroll` class.
 */
define("neue/jump-scroll", [], function() {
    var $ = window.jQuery;
    $(function() {
        $(".js-jump-scroll").on("click", function(event) {
            event.preventDefault();
            var href = $(this).attr("href");
            // Animate scroll position to the target of the link:
            $("html,body").animate({
                scrollTop: $(event.target.hash).offset().top
            }, "slow", function() {
                // Finally, set the correct hash in the address bar.
                window.location.hash = href;
            });
        });
    });
}), define("neue/media-selector", [], function() {
    var $ = window.jQuery, MediaRadioSelector = function($fieldGroup, opts) {
        if (void 0 !== $fieldGroup && $($fieldGroup.length)) {
            if (!this instanceof MediaRadioSelector) return new MediaRadioSelector($fieldGroup, opts);
            var _this = this;
            opts = opts || {}, _this.cfg = opts = {
                fieldClassName: "string" == typeof opts.fieldClassName ? opts.fieldClassName : "media-options",
                fieldSelector: "string" == typeof opts.fieldSelector ? opts.fieldSelector : ".form-type-radio",
                optionSelector: "string" == typeof opts.optionSelector ? opts.optionSelector : "label"
            }, _this.$fieldGroup = $($fieldGroup).addClass(_this.cfg.fieldClassName), _this.$checked = [], 
            _this.init();
        }
    };
    MediaRadioSelector.prototype = {
        /**
      * Adds event listeners to each field
    */
        init: function() {
            var _this = this, cfg = _this.cfg;
            _this.$fieldGroup.find(cfg.fieldSelector).each(function(idx) {
                var $field = $(this), className = (idx + 1) % 2 === 0 ? "-second" : "-first";
                // add 'index' class name for legacy IE
                $field.addClass(className), // if default selected field exists, set to 'selected' state
                $field.find("input[type='radio']:checked").length > 0 && _this.check($field), // add click event to toggle 'selected' class and check/uncheck radios
                $field.find(cfg.optionSelector).on("click", function() {
                    _this.$checked.length > 0 && _this.uncheck(_this.$checked), _this.check($field);
                });
            });
        },
        /**
      * Adds checked state to field
      * @param {jQuery} $field The field.
    */
        check: function($field) {
            $field.addClass("selected").find("input[type='radio']").attr("checked", !0), this.$checked = $field;
        },
        /**
      * Removes checked state to field
      * @param {jQuery} $field The field.
    */
        uncheck: function($field) {
            $field.removeClass("selected").find("input[type='radio']").attr("checked", !1);
        }
    }, $(function() {
        // Instantiate the media radio selectors
        $(".js-media-options").each(function() {
            new MediaRadioSelector($(this));
        });
    });
}), /**
 * Initializes site-wide menu chrome functionality.
 */
define("neue/menu", [], function() {
    var $ = window.jQuery;
    $(function() {
        // Toggle dropdown menu navigation on mobile:
        $(".js-toggle-mobile-menu").on("click", function() {
            $(".chrome--nav").toggleClass("is-visible");
        }), // Hide footer on mobile until clicked
        $(".js-footer-col").addClass("is-collapsed"), $(".js-footer-col h4").on("click", function() {
            window.matchMedia("screen and (max-width: 768px)").matches && $(this).closest(".js-footer-col").toggleClass("is-collapsed");
        });
    });
}), /**
 * @module neue/messages
 * System Messages. Will create a close ("X") button
 * for users with JavaScript enabled that uses the following
 * syntax to hook into this function:
 *
 * @example
 * //  <div class="js-message">Alert! You win.</div>
 *
 * @returns
 * // <div class="js-message">Alert! You win.
 * //   <a href="#" class="js-close-message">x</a>
 * // </div>
 */
define("neue/messages", [], function() {
    var $ = window.jQuery, messageClose = '<a href="#" class="js-close-message message-close-button white">×</a>', attachCloseButton = function($messages, callback) {
        // Create message close button
        $messages.append(messageClose), // Close message when "x" is clicked:
        $messages.on("click", ".js-close-message", function(event) {
            event.preventDefault(), $(this).parent(".messages").slideUp(), callback && "function" == typeof callback && callback();
        });
    };
    // Prepare any messages in the DOM on load
    return $(function() {
        attachCloseButton($(".messages"));
    }), {
        attachCloseButton: attachCloseButton
    };
}), /**
 * @module neue/modal
 * Show/hide modals. To link to a modal, add a `data-modal-href` attribute
 * pointing to the selector for the modal you want to show.
 *
 * @example
 * // <a href="http://www.example.com" data-modal-href="#modal--example">Click!</a>
 * // <div data-modal id="modal--example" role="dialog">
 * //   <!-- content -->
 * // </div>
 *
 */
define("neue/modal", [ "require", "./events" ], function(require) {
    var $ = window.jQuery, Modernizr = window.Modernizr, Events = require("./events"), modalReady = !1, queuedModal = null, $document = $(document), $chrome = $(".chrome"), $modalContainer = null, $skipLink = $("<a href='#' class='js-close-modal js-modal-generated modal-close-button -alt'>skip</a>"), $closeLink = $("<a href='#' class='js-close-modal js-modal-generated modal-close-button'>&#215;</a>"), $modal = null, closeable = !1, isOpen = function() {
        return null !== $modal;
    }, _addCloseButton = function($el, type, skipForm) {
        switch (type) {
          case "skip":
            // Add a skip button, which delegates to the submitting the form with the given ID
            $el.prepend($skipLink), $skipLink.on("click", function(event) {
                event.preventDefault(), $(skipForm).submit();
            }), closeable = !1;
            break;

          case "false":
          case "0":
            closeable = !1;
            break;

          default:
            $el.prepend($closeLink), closeable = !0;
        }
    }, open = function($el, options) {
        if (options = options || {}, options.animated = "boolean" == typeof options.animated ? options.animated : !0, 
        options.closeButton = "undefined" != typeof options.closeButton ? options.closeButton : $el.attr("data-modal-close"), 
        options.skipForm = "undefined" != typeof options.skipForm ? options.skipForm : $el.attr("data-modal-skip-form"), 
        0 === $el.length) // If modal does not exist, don't try to open it.
        return !1;
        // If modal markup isn't initialized, save and display once it is.
        if (!modalReady) return queuedModal = {
            $el: $el,
            options: options
        }, !1;
        // Read from DOM
        var offsetTop = "-" + $document.scrollTop() + "px";
        // Add generated content
        _addCloseButton($el, options.closeButton, options.skipForm), isOpen() ? (// Modal is already open, so just replace current content
        $modal.hide(), $el.show()) : (// Set up overlay and show modal
        $chrome.css("top", offsetTop), $chrome.addClass("modal-open"), $modalContainer.css("display", "block"), 
        options.animated && Modernizr.cssanimations && $modalContainer.addClass("animated-open"), 
        $el.css("display", "block")), // Make sure we're scrolled to the top of the modal.
        setTimeout(function() {
            $document.scrollTop(0);
        }, 50), // We provide an event that other modules can hook into to perform custom functionality when
        // a modal opens (such as preparing things that are added to the DOM, etc.)
        Events.publish("Modal:Open", $el), // Keep track of whether modal is open or not
        $modal = $el;
    }, _cleanup = function(scrollOffset) {
        $modalContainer.css("display", "none"), $modalContainer.removeClass("animated-close"), 
        $modal.css("display", "none"), // Remove any generated content
        $modal.find(".js-modal-generated").remove(), // Remove overlay and reset scroll position
        $chrome.removeClass("modal-open"), $chrome.css("top", ""), $document.scrollTop(scrollOffset), 
        // Get rid of reference to closed modal
        $modal = null;
    }, close = function(options) {
        options = options || {}, options.animated = "undefined" != typeof options.animated ? options.animated : !0;
        var scrollOffset = -1 * parseInt($chrome.css("top"));
        options.animated && Modernizr.cssanimations ? ($modalContainer.addClass("animated-close"), 
        $modalContainer.one("webkitAnimationEnd oanimationend msAnimationEnd animationend", function() {
            _cleanup(scrollOffset);
        })) : _cleanup(scrollOffset), // Remove URL hash for modal from browser
        window.location.hash === "#" + $modal.attr("id") && (window.location.hash = "/"), 
        // We provide an event that other modules can hook into to perform custom functionality when
        // a modal opens (such as preparing things that are added to the DOM, etc.)
        Events.publish("Modal:Close", $modal);
    }, _openHandler = function(event) {
        event.preventDefault();
        var href = $(this).data("modal-href");
        open($(href));
    }, _closeHandler = function(event) {
        // Don't let the event bubble.
        event.target === this && ($(this).hasClass("js-close-modal") || closeable) && (// Override default link behavior.
        event.preventDefault(), close());
    };
    // Return public API for controlling modals
    return $document.ready(function() {
        var $body = $("body");
        // Create container for modals
        $modalContainer = $("<div class='modal-container'></div>"), $body.append($modalContainer), 
        // Prepare the DOM!
        $("[data-modal]").each(function() {
            $(this).appendTo($modalContainer), $(this).attr("hidden", !0);
        });
        //If there's a hash in the URL, check if it's a modal and load it
        var hash = window.location.hash;
        hash && "#/" !== hash && $(hash) && "undefined" != typeof $(hash).data("modal") && open($(hash)), 
        modalReady = !0, null !== queuedModal && open(queuedModal.$el, queuedModal.options), 
        // Bind events to open & close modal
        $body.on("click", "[data-modal-href]", _openHandler), $body.on("click", ".modal-container", _closeHandler), 
        $body.on("click", ".js-close-modal", _closeHandler);
    }), {
        isOpen: isOpen,
        open: open,
        close: close
    };
}), /**
 * Indicates current section in nav on scroll. Applies an `.is-active`
 * class when the specified `href` reaches the top of the viewport.
 *
 * Triggered by a `.js-scroll-indicator` on a link.
 */
define("neue/scroll-indicator", [], function() {
    /**
   * @see _.sortedIndex
   */
    function sortedIndex(array, value, key) {
        for (var low = 0, high = array ? array.length : low; high > low; ) {
            var mid = low + high >>> 1;
            // jshint ignore:line
            array[mid][key] < value ? low = mid + 1 : high = mid;
        }
        return low ? low - 1 : low;
    }
    /**
   * Modified binary search. Finds target key, or next lowest if
   * it doesn't exist.
   * @see _.binarySearch
   */
    function binarySearch(array, value) {
        var index = sortedIndex(array, value, "offset");
        return array[index];
    }
    // Registers links and their targets with scroll handler
    function prepareIndicator($link) {
        // Calculate the element's offset from the top of the page while anchored
        var $linkTarget = $($link.attr("href"));
        $linkTarget.length && // Add jQuery object and offset value to link map
        links.push({
            offset: $linkTarget.offset().top,
            link: $link
        });
    }
    // Prepare all `.js-scroll-indicator` links on the page.
    function preparePage() {
        links = [], $(".js-scroll-indicator").find("a").each(function(index, link) {
            prepareIndicator($(link));
        });
    }
    // Scroll handler: highlights the furthest link the user has passed
    function updateScrollIndicators() {
        var newIndicator = binarySearch(links, $(window).scrollTop() + 40);
        // @NOTE: We use a 40px offset to trigger indicator slightly after scroll position
        // (so that nav switches closer to where a user will likely be reading the text)
        if (newIndicator && newIndicator.link) {
            var newIndicatorParents = newIndicator.link.parentsUntil(".js-scroll-indicator"), oldIndicatorParents = $();
            oldIndicator && oldIndicator !== newIndicator && (oldIndicator.link.removeClass("is-active"), 
            oldIndicatorParents = oldIndicator.link.parentsUntil(".js-scroll-indicator")), newIndicator.link.addClass("is-active"), 
            newIndicatorParents.addClass("is-active"), oldIndicatorParents.not(newIndicatorParents).removeClass("is-active"), 
            oldIndicator = newIndicator;
        }
    }
    var oldIndicator, $ = window.jQuery, links = [], throttle = function(func, wait, options) {
        var context, args, result, timeout = null, previous = 0;
        options || (options = {});
        var later = function() {
            previous = new Date(), timeout = null, result = func.apply(context, args);
        };
        return function() {
            var now = new Date();
            previous || options.leading !== !1 || (previous = now);
            var remaining = wait - (now - previous);
            return context = this, args = arguments, 0 >= remaining ? (clearTimeout(timeout), 
            timeout = null, previous = now, result = func.apply(context, args)) : timeout || options.trailing === !1 || (timeout = setTimeout(later, remaining)), 
            result;
        };
    };
    // Attach our functions to their respective events.
    $(function() {
        preparePage();
        var throttledScroll = throttle(updateScrollIndicators, 60);
        $(window).on("scroll", throttledScroll), $(window).on("resize", preparePage);
    });
}), /**
 * Pins an element to the top of the screen on scroll.
 *
 * Requires pinned element to have `.js-sticky` class, and have
 * a `.is-stuck` modifier class in its CSS (which allows
 * customized sticky behavior based on media queries).
 *
 * @example
 * // .sidebar {
 * //   &.is-stuck {
 * //     position: fixed;
 * //     top: 0;
 * //   }
 * // }
 *
 */
define("neue/sticky", [], function() {
    // Prepare all `.js-sticky` divs on the page.
    function preparePage() {
        divs = [], $(".js-sticky").each(function(index, div) {
            prepareSticky(div);
        });
    }
    // Prepare markup and register divs with scroll handler
    function prepareSticky(div) {
        // Calculate the element's offset from the top of the page while anchored
        var divOffset = $(div).offset().top, divObj = {
            $el: $(div),
            offset: divOffset
        };
        // Add jQuery object and offset value to divs array
        divs.push(divObj), // Now that we're ready, let's calculate how stickies should be displayed
        scrollSticky();
    }
    // Scroll handler: pins/unpins divs on scroll event
    function scrollSticky() {
        $.each(divs, function(index, div) {
            // Compare the distance to the top of the page with the distance scrolled.
            // For each div: if we've scrolled past it's offset, pin it to top.
            $(window).scrollTop() > div.offset ? div.$el.addClass("is-stuck") : div.$el.removeClass("is-stuck");
        });
    }
    var $ = window.jQuery, divs = [];
    // Attach our functions to their respective events.
    $(function() {
        preparePage(), $(window).on("scroll", scrollSticky), $(window).on("resize", preparePage);
    });
}), /**
 * Client-side form validation logic. Form element is validated based
 * on `data-validate` attribute, and validation output is placed in
 * corresponding `<label>`.
 *
 * Validations can be added later by extending `NEUE.Validation.Validations`.
 * Validators can be added later by extending `NEUE.Validation.Validators`.
 *
 * finished validating with a boolean `success` and a plain-text `message`
 * value. (Alternatively, a `suggestion` value can be passed which will
 * prompt the user "Did you mean {suggestion}?".
 *
 * ## Usage Notes:
 * - Input field must have `data-validate` attribute.
 * - If adding input fields to the DOM after load, run `prepareFields`
 */
define("neue/validation", [ "require", "./events" ], function(require) {
    var $ = window.jQuery, Events = require("./events"), validations = [], prepareFields = function($fields) {
        $fields.each(function() {
            var $field = $(this);
            prepareLabel($("label[for='" + $field.attr("id") + "']")), $field.on("blur", function(event) {
                event.preventDefault(), validateField($field);
            });
        });
    }, prepareLabel = function($label) {
        // Check to make sure we haven't already prepared this before
        if (0 === $label.find(".inner-label").length) {
            var $innerLabel = $("<div class='inner-label'></div>");
            $innerLabel.append("<div class='label'>" + $label.html() + "</div>"), $innerLabel.append("<div class='message'></div>"), 
            $label.html($innerLabel);
        }
    }, validateField = function($field, force, callback) {
        // Default arguments
        force = "undefined" != typeof force ? force : !1, callback = "undefined" != typeof callback ? callback : function($field, result) {
            showValidationMessage($field, result);
        };
        var validation = $field.data("validate"), validationTrigger = $field.data("validate-trigger");
        // Don't validate if validation doesn't exist
        if (validationTrigger && validateField($(validationTrigger)), !validations[validation]) return void console.error("A validation with the name " + validation + " has not been registered.");
        // For <input>, <select>, and <textarea> tags we provide
        // the field's value as a string
        if (isFormField($field)) {
            // Get field info
            var fieldValue = $field.val();
            // Finally, let's not validate blank fields unless forced to
            if (force || "" !== fieldValue) if ("match" === validation) {
                var matchFieldValue = $($field.data("validate-match")).val();
                validations[validation].fn(fieldValue, matchFieldValue, function(result) {
                    callback($field, result);
                });
            } else validations[validation].fn(fieldValue, function(result) {
                callback($field, result);
            });
        } else // For all other tags, we pass the element directly
        if ("match" === validation) {
            var $matchField = $($field.data("validate-match"));
            validations[validation].fn($field, $matchField, function(result) {
                callback($field, result);
            });
        } else validations[validation].fn($field, function(result) {
            callback($field, result);
        });
    }, registerValidation = function(name, validation) {
        if (validations[name]) throw "A validation function with that name has already been registered";
        validations[name] = validation;
    }, registerValidationFunction = function(name, func) {
        var v = {
            fn: func
        };
        registerValidation(name, v);
    }, showValidationMessage = function($field, result) {
        var fieldMessageHeight, $fieldLabel = $("label[for='" + $field.attr("id") + "']"), $fieldMessage = $fieldLabel.find(".message"), fieldLabelHeight = $fieldLabel.height();
        // Highlight/animate field
        // Show validation message
        // Set label height if it needs to be multiline.
        // Clear previous multiline height if no longer needed.
        // Animate in the validation message
        return $field.removeClass("success error warning shake"), $fieldMessage.removeClass("success error warning"), 
        result.success === !0 ? ($field.addClass("success"), $fieldMessage.addClass("success")) : ($field.addClass("error"), 
        $fieldMessage.addClass("error"), isFormField($field) && $field.addClass("shake"), 
        Events.publish("Validation:InlineError", $fieldLabel.attr("for"))), result.message && $fieldMessage.text(result.message), 
        result.suggestion && ($fieldMessage.html("Did you mean " + result.suggestion.full + "? <a href='#' data-suggestion='" + result.suggestion.full + "'class='js-mailcheck-fix'>Fix it!</a>"), 
        Events.publish("Validation:Suggestion", result.suggestion.domain)), fieldMessageHeight = $fieldMessage.height(), 
        fieldMessageHeight > fieldLabelHeight ? $fieldLabel.css("height", fieldMessageHeight + "px") : $fieldLabel.css("height", ""), 
        $fieldLabel.addClass("show-message"), $(".js-mailcheck-fix").on("click", function(e) {
            e.preventDefault();
            var $field = $("#" + $(this).closest("label").attr("for"));
            $field.val($(this).data("suggestion")), $field.trigger("blur"), // If Google Analytics is set up, we fire an event to
            // mark that a suggestion has been made
            Events.publish("Validation:SuggestionUsed", $(this).text());
        }), $field.on("focus", function() {
            $field.removeClass("warning error success shake"), $fieldLabel.removeClass("show-message"), 
            $fieldLabel.css("height", "");
        }), result.success;
    }, disableFormSubmit = function($form) {
        // Prevent double-submissions
        var $submitButton = $form.find(":submit");
        // Disable that guy
        $submitButton.attr("disabled", !0), $submitButton.addClass("loading"), // If <button>, add a loading style
        "BUTTON" === $submitButton.prop("tagName") && // Neue's `.loading` class only works on <a> or <button> :(
        $submitButton.addClass("loading");
    }, enableFormSubmit = function($form) {
        var $submitButton = $form.find(":submit");
        $submitButton.attr("disabled", !1), $submitButton.removeClass("loading disabled");
    }, isFormField = function($el) {
        var tag = $el.prop("tagName");
        return "INPUT" === tag || "SELECT" === tag || "TEXTAREA" === tag;
    };
    /**
   * Validate form on submit.
   */
    // Register the "match" validation.
    return $("body").on("submit", "form", function(event, isValidated) {
        var $form = $(this), $validationFields = $form.find("[data-validate]");
        // If no fields should be validated, submit!
        if (// Disable form submission to prevent double-clicks.
        disableFormSubmit($form), // We want to validate all [data-validate] field that are either required, or have user input.
        $validationFields = $validationFields.map(function() {
            var $this = $(this);
            return "undefined" != typeof $this.attr("data-validate-required") || "" !== $this.val() ? $this : void 0;
        }), 0 === $validationFields.length) return !0;
        if (isValidated === !0) // completed a previous runthrough & validated;
        // we're ready to submit the form
        return !0;
        event.preventDefault();
        var validatedFields = 0, validatedResults = 0, scrolledToError = !1;
        return $validationFields.each(function() {
            validateField($(this), !0, function($field, result) {
                validatedFields++, showValidationMessage($field, result), result.success && validatedResults++, 
                // If this is the first error in the form, scroll to it.
                scrolledToError || result.success !== !1 || (scrolledToError = !0, $("html,body").animate({
                    scrollTop: $field.offset().top - 32
                }, 200)), // Once we're done validating all fields, check status of form
                validatedFields === $validationFields.length && (validatedResults === $validationFields.length ? (// we've validated all that can be validated
                Events.publish("Validation:Submitted", $(this).attr("id")), $form.trigger("submit", !0)) : (Events.publish("Validation:SubmitError", $(this).attr("id")), 
                enableFormSubmit($form)));
            });
        }), !1;
    }), registerValidationFunction("match", function(string, secondString, done) {
        return done(string === secondString && "" !== string ? {
            success: !0,
            message: "Looks good!"
        } : {
            success: !1,
            message: "That doesn't match."
        });
    }), $(function() {
        // Prepare the labels on any `[data-validate]` fields in the DOM at load
        prepareFields($("body").find("[data-validate]"));
    }), {
        prepareFields: prepareFields,
        registerValidation: registerValidation,
        registerValidationFunction: registerValidationFunction,
        validateField: validateField,
        showValidationMessage: showValidationMessage,
        Validations: validations
    };
}), /**
 * Main build script. This will compile modules into `neue.js`
 * and `neue.min.js` in dist package, and attach each module to
 * a NEUE global variable attached to the window.
 */
define("neue/main", [ "require", "./carousel", "./events", "./jump-scroll", "./media-selector", "./menu", "./messages", "./modal", "./scroll-indicator", "./sticky", "./validation" ], function(require) {
    // Attach modules to window
    return window.NEUE = {
        Carousel: require("./carousel"),
        Events: require("./events"),
        JumpScroll: require("./jump-scroll"),
        MediaSelector: require("./media-selector"),
        Menu: require("./menu"),
        Messages: require("./messages"),
        Modal: require("./modal"),
        ScrollIndicator: require("./scroll-indicator"),
        Sticky: require("./sticky"),
        Validation: require("./validation")
    }, window.NEUE;
}), define("campaign/SchoolFinder", [ "require", "jquery", "lodash", "neue/validation" ], function(require) {
    var $ = require("jquery"), _ = require("lodash"), Validation = require("neue/validation"), shouldValidateForm = !0, resultTpl = _.template("<li><a class='js-schoolfinder-result' data-gsid='<%- gsid %>' href='#'><span><%- name %></span> <em><%- city %>, <%- state %></em></a></li>"), getResults = function(state, query, limit, callback) {
        var endpoint;
        if (_.isEmpty(query) || _.isEmpty(state)) return callback([]);
        try {
            // Use Drupal dateFormat validation format if available
            endpoint = Drupal.settings.dosomethingUser.schoolFinderAPIEndpoint;
        } catch (e) {
            endpoint = "http://lofischools.herokuapp.com/search";
        }
        $.ajax({
            dataType: "json",
            url: endpoint + "?state=" + state + "&query=" + query + "&limit=" + limit
        }).done(function(data) {
            callback(data.results, data.meta.more_results);
        }).fail(function() {
            callback(!1);
        });
    }, displayResults = function($el, results, canShowMore) {
        return $el.empty(), results ? (_.each(results, function(result) {
            $el.append(resultTpl(result));
        }), 0 === results.length && $el.append("<div class='messages error'>Hmm, we couldn't find your school based on how the name was entered. But it may still be there! Click on the link below for tips on finding your school.</div>"), 
        canShowMore && $el.append("<p class='schoolfinder-showmore'><a href='#' class='secondary js-schoolfinder-showmore'>Show More Results</a></p>"), 
        void $el.show()) : ($el.append("<div class='messages error'>We couldn't load schools. Check your internet connection, or try refreshing the page.</div>"), 
        void $el.show());
    }, initializeSchoolFinder = function($schoolSignupForm) {
        var $stateField = $("#edit-school-administrative-area"), $schoolIDField = $schoolSignupForm.find("[name='school_id']"), $schoolSearchField = $schoolSignupForm.find(".js-schoolfinder-search"), $schoolSearchResults = $schoolSignupForm.find(".js-schoolfinder-results"), $notAffiliatedField = $("#edit-school-not-affiliated"), $notAffiliatedConfirmationMessage = $schoolSignupForm.find(".js-school-not-affiliated-confirmation"), savedStateFieldState = "", getResultsThrottled = _.throttle(getResults, 1e3);
        // Set the form to default state.
        $schoolSearchField.hide(), $schoolSearchResults.hide(), /**
     * Event handler for the state select field.
     */
        $stateField.on("change", function() {
            // Show the school name field once user has chosen a state.
            var stateSelected = "" !== $(this).val();
            $schoolSignupForm.find(".messages").hide(), $schoolSearchField.val(""), $schoolSearchField.trigger("keyup"), 
            $schoolSearchField.toggle(stateSelected), stateSelected && $schoolSearchField.focus();
        }), /**
     * Event handler for school search field text input.
     */
        $schoolSearchField.on("keyup", function() {
            $schoolSignupForm.find(".messages").hide();
            var val = $(this).val();
            "" !== val ? ($schoolSearchField.addClass("loading"), getResultsThrottled($stateField.val(), val, 10, function(res, moreAvailable) {
                displayResults($schoolSearchResults, res, moreAvailable), $schoolSearchField.removeClass("loading");
            })) : ($schoolSearchResults.hide(), $schoolIDField.val(""));
        }), /**
     * Event handler for clicking a result.
     */
        $schoolSearchResults.on("click", ".js-schoolfinder-result", function(e) {
            e.preventDefault();
            var $this = $(this);
            $schoolIDField.val($this.data("gsid")), $schoolSearchField.val($this.find("span").text()), 
            $this.addClass("is-selected"), $this.parent("li").siblings().hide();
        }), /**
     * Event handler for "Show More" link.
     */
        $schoolSignupForm.on("click", ".js-schoolfinder-showmore", function(e) {
            e.preventDefault(), $(this).remove(), $schoolSearchField.addClass("loading"), getResultsThrottled($stateField.val(), $schoolSearchField.val(), 50, function(res) {
                displayResults($schoolSearchResults, res, !1), $schoolSearchField.removeClass("loading");
            });
        }), /**
     * Event handler for the "I'm not affiliated with a school" checkbox.
     */
        $notAffiliatedField.on("change", function() {
            // If user is not entering a school, don't validate form.
            shouldValidateForm = !this.checked, $notAffiliatedConfirmationMessage.toggle(this.checked), 
            this.checked ? (savedStateFieldState = $stateField.val(), $stateField.val(""), $schoolSearchField.val(""), 
            $schoolSearchField.trigger("keyup")) : ($stateField.val(savedStateFieldState), $notAffiliatedConfirmationMessage.hide()), 
            $stateField.trigger("focus").trigger("change").trigger("blur"), $schoolSignupForm.find("input[type='submit']").trigger("focus");
        }), $schoolSignupForm.find(".js-schoolfinder-help").on("click", function() {
            $(".js-schoolfinder-help-content").toggle();
        });
    };
    $(document).ready(function() {
        var $schoolSignupForm = $("#dosomething-signup-user-signup-data-form");
        $schoolSignupForm && initializeSchoolFinder($schoolSignupForm);
    }), /**
   * Custom validation for the School Finder.
   */
    Validation.registerValidationFunction("school_finder", function($el, done) {
        var $schoolID = $el.find("[name='school_id']");
        // User has not selected a school.
        // Remove any existing error messages.
        return shouldValidateForm && "" === $schoolID.val() ? ($el.addClass("shake"), $el.find(".messages.error").remove(), 
        $el.append("<div class='messages error'>You haven't entered your school. Find your school by entering your state and then selecting a school from the search results.</div>"), 
        done({
            success: !1
        })) : done({
            success: !0
        });
    });
}), define("campaign/sources", [ "require", "jquery", "neue/events" ], function(require) {
    var $ = require("jquery"), Events = require("neue/events"), toggleSources = function(container) {
        var $list = container.find("ul, div:first");
        // Hide the fact sources list if present.
        $list.hide(), // Toggle visibility of fact sources.
        $(".js-toggle-sources").on("click", function() {
            // Toggle visibility of fact sources list.
            $list.slideToggle();
        });
    }, $sources = $(".sources") || null;
    // If there's a list of sources output in a modal, activate the toggle.
    Events.subscribe("Modal:opened", function() {
        var $sources = $(".modal .sources") || null;
        toggleSources($sources);
    }), // If there's a list of sources output on the page, activate the toggle.
    $sources && toggleSources($sources);
}), define("campaign/tips", [ "require", "jquery" ], function(require) {
    var $ = require("jquery");
    // View other tips on click
    $(".js-show-tip").on("click", function(event) {
        event.preventDefault();
        // Cache $(this) and reference to parent wrapper
        var $this = $(this), $thisParent = $this.closest(".tips--wrapper");
        // Pass "active" class to move tip indicator
        $thisParent.find(".tip-header").removeClass("active"), $this.addClass("active");
        // Get current tip number
        var tipNumber = $this.attr("href").slice(1);
        // Show current tip
        $thisParent.find(".tip-body").hide(), $thisParent.find("." + tipNumber).show();
    });
}), define("campaign/tabs", [ "require", "jquery" ], function(require) {
    var $ = require("jquery"), $tabs = $(".js-tabs"), $tabMenuLinks = $tabs.find(".tabs__menu a");
    // Show the first tab in any "js-tabs" collection.
    $tabs.each(function() {
        $(this).find(".tab").first().addClass("is-active");
    }), // View other tabs on click.
    $tabMenuLinks.on("click", function(event) {
        event.preventDefault();
        var $this = $(this), $siblings = $this.parent().siblings(), selection = $this.data("tab") - 1, $tabs = $this.closest(".js-tabs").find(".tab"), tab = $tabs.get(selection);
        $siblings.removeClass("is-active"), $this.parent().addClass("is-active"), // Show selected tab.
        $tabs.removeClass("is-active"), $(tab).addClass("is-active");
    });
}), define("campaign/ImageUploader", [ "require", "jquery" ], function(require) {
    var $ = require("jquery"), prepareImageUploadUI = function($context) {
        // Toggle visibility of upload button and hide that guy
        var $imageUploads = $context.find(".js-image-upload"), $caption = $context.find(".form-item-caption"), submittedImage = 0 === $context.find(".submitted-image").length ? !1 : !0;
        // If no prior submitted image is present, caption should be hidden.
        submittedImage || $caption.hide(), $imageUploads.each(function(i, el) {
            $(el).wrap($("<div class='image-upload-container'></div>"));
            var $container = $(el).parent(".image-upload-container");
            $container.wrap("<div style='clear: both'></div>");
            var $uploadBtn = $("<a href='#' class='btn secondary small'>" + Drupal.t("Upload A Pic") + "</a>");
            $uploadBtn.insertAfter($(el));
            var $imgPreview = $("<img class='preview' src=''>");
            $imgPreview.insertBefore($container), $imgPreview.hide();
            var $fileName = $("<p class='filename'></p>");
            $fileName.insertAfter($uploadBtn), // Show image preview on upload
            $(el).on("change", function(event) {
                event.preventDefault(), // New image added, show the caption.
                submittedImage = !0, $caption.show(), // Change button state
                $uploadBtn.text(Drupal.t("Change Pic"));
                var files = this.files ? this.files : [];
                // Show file name below field
                if (files[0] && files[0].name) $fileName.text(files[0].name); else {
                    var file = $(el).val().replace("C:\\fakepath\\", "");
                    $fileName.text(file);
                }
                // If no file selected/no FileReader support, we're all done
                if (files.length && window.FileReader && /^image/.test(files[0].type)) {
                    var reader = new FileReader();
                    reader.readAsDataURL(files[0]), reader.onloadend = function() {
                        $imgPreview.show(), $imgPreview.attr("src", this.result);
                    };
                }
            });
        });
    };
    // On DOM ready, we prepare any `.js-image-upload`s that we find on the page
    $(function() {
        prepareImageUploadUI($("body"));
    });
}), define("validation/auth", [ "require", "neue/validation", "mailcheck" ], function(require) {
    // # Helpers
    // Basic sanity check used by email validation.
    // This won't catch everything, but should prevent validating some simple mistakes
    function isValidEmailSyntax(string) {
        var email = string.toUpperCase();
        if (email.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]+$/)) {
            for (var lastChar = "", i = 0, len = email.length; len > i; i++) {
                // fail if we see two dots in a row
                if ("." === lastChar && "." === email[i]) return !1;
                lastChar = email[i];
            }
            return !0;
        }
        return !1;
    }
    // @TODO: This will be removed when Neue's validation gets refactored.
    function validateNotBlank(string, done, success, failure) {
        return done("" !== string ? {
            success: !0,
            message: success
        } : {
            success: !1,
            message: failure
        });
    }
    var Validation = require("neue/validation"), mailcheck = require("mailcheck");
    // # Add validation functions...
    // ## Name
    // Greets the user when they enter their name.
    Validation.registerValidationFunction("name", function(string, done) {
        validateNotBlank(string, done, Drupal.t("Hey, @name!", {
            "@name": string
        }), Drupal.t("We need your first name."));
    }), Validation.registerValidationFunction("last_name", function(string, done) {
        validateNotBlank(string, done, Drupal.t("Got it, @name!", {
            "@name": string
        }), Drupal.t("We need your last name."));
    }), // ## Birthday
    // Validates correct date input, reasonable birthdate, and says a nice message.
    Validation.registerValidationFunction("birthday", function(string, done) {
        var birthday, birthMonth, birthDay, birthYear, format;
        try {
            // Use Drupal dateFormat validation format if available
            format = Drupal.settings.dsValidation.dateFormat;
        } catch (e) {
            format = "MM/DD/YYYY";
        }
        // parse date from string
        if ("MM/DD/YYYY" === format && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(string)) // US formatting
        birthday = string.split("/"), birthMonth = parseInt(birthday[0]), birthDay = parseInt(birthday[1]), 
        birthYear = parseInt(birthday[2]); else {
            if ("DD/MM/YYYY" !== format || !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(string)) return done({
                success: !1,
                message: Drupal.t("Enter your birthday " + format + "!")
            });
            // UK formatting
            birthday = string.split("/"), birthDay = parseInt(birthday[0]), birthMonth = parseInt(birthday[1]), 
            birthYear = parseInt(birthday[2]);
        }
        // fail if incorrect month
        if (birthMonth > 12 || 0 === birthMonth) return done({
            success: !1,
            message: Drupal.t("That doesn't seem right.")
        });
        //list of last days in months and check for leap year
        var endDates = [ 0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];
        // fail if incorrect day
        if ((birthYear % 4 === 0 && birthYear % 100 !== 0 || birthYear % 400 === 0) && (endDates[2] = 29), 
        birthDay > endDates[birthMonth]) return done({
            success: !1,
            message: Drupal.t("That doesn't seem right.")
        });
        // calculate age
        // Source: http://stackoverflow.com/questions/4060004/calculate-age-in-javascript#answer-7091965
        var birthDate = new Date(birthYear, birthMonth - 1, birthDay), now = new Date(), age = now.getFullYear() - birthDate.getFullYear(), m = now.getMonth() - birthDate.getMonth();
        return (0 > m || 0 === m && now.getDate() < birthDate.getDate()) && age--, done(0 > age ? {
            success: !1,
            message: Drupal.t("Are you a time traveller?")
        } : age > 0 && 25 >= age ? birthDate.getMonth() === now.getMonth() && now.getDate() === birthDate.getDate() ? {
            success: !0,
            message: Drupal.t("Wow, happy birthday!")
        } : 10 > age ? {
            success: !0,
            message: Drupal.t("Wow, you're @age!", {
                "@age": age
            })
        } : {
            success: !0,
            message: Drupal.t("Cool, @age!", {
                "@age": age
            })
        } : age > 25 && 130 > age ? {
            success: !0,
            message: Drupal.t("Got it!")
        } : "" === string ? {
            success: !1,
            message: Drupal.t("We need your birthday.")
        } : {
            success: !1,
            message: Drupal.t("That doesn't seem right.")
        });
    }), // ## Email
    // Performs some basic sanity checks on email format (see helper method), and
    // uses Kicksend's mailcheck library to offer suggestions for misspellings.
    Validation.registerValidationFunction("email", function(string, done) {
        // we use mailcheck.js to find some common email mispellings
        return isValidEmailSyntax(string) ? void mailcheck.run({
            email: string,
            domains: [ "yahoo.com", "google.com", "hotmail.com", "gmail.com", "me.com", "aol.com", "mac.com", "live.com", "comcast.net", "googlemail.com", "msn.com", "hotmail.co.uk", "yahoo.co.uk", "facebook.com", "verizon.net", "sbcglobal.net", "att.net", "gmx.com", "mail.com", "outlook.com", "aim.com", "ymail.com", "rocketmail.com", "bellsouth.net", "cox.net", "charter.net", "me.com", "earthlink.net", "optonline.net", "dosomething.org" ],
            suggested: function(s) {
                return done({
                    success: !0,
                    suggestion: s
                });
            },
            empty: function() {
                return done({
                    success: !0,
                    message: Drupal.t("Great, thanks!")
                });
            }
        }) : done({
            success: !1,
            message: Drupal.t("We need a valid email.")
        });
    }), // ## Password
    // Checks that password is 6 or more characters long.
    // Matches validation performed in dosomething_user.module.
    Validation.registerValidationFunction("password", function(string, done) {
        return done(string.length >= 6 ? {
            success: !0,
            message: Drupal.t("Keep it secret, keep it safe!")
        } : {
            success: !1,
            message: Drupal.t("Must be 6+ characters.")
        });
    }), // ## Phone
    // Matches validation performed in dosomething_user.module.
    Validation.registerValidationFunction("phone", function(string, done) {
        // Matches server-side validation from `dosomething_user_valid_cell()` in `dosomething_user.module`.
        var numberWithoutFormatting = string.replace(/[\-\s\.]/g, ""), isValidFormat = /^(?:\+?([0-9]{1,3})([\-\s\.]{1})?)?\(?([0-9]{3})\)?(?:[\-\s\.]{1})?([0-9]{3})(?:[\-\s\.]{1})?([0-9]{4})/.test(numberWithoutFormatting), sanitizedNumber = string.replace(/[^0-9]/g, ""), allRepeatingDigits = /([0-9]{1})\1{9,}/.test(sanitizedNumber);
        return done(isValidFormat && !allRepeatingDigits ? {
            success: !0,
            message: Drupal.t("Thanks!")
        } : {
            success: !1,
            message: Drupal.t("Enter a valid telephone number.")
        });
    });
}), define("validation/reportback", [ "require", "neue/validation" ], function(require) {
    var Validation = require("neue/validation");
    // validate number of items
    Validation.registerValidationFunction("positiveInteger", function(string, done) {
        var trimmedString = string.replace(" ", "");
        return done("" !== trimmedString && /^[1-9]\d*$/.test(trimmedString) ? {
            success: !0,
            message: Drupal.t("That's great!")
        } : {
            success: !1,
            message: Drupal.t("Enter a valid number!")
        });
    }), // validate that string isn't blank
    Validation.registerValidationFunction("reportbackReason", function(string, done) {
        return done("" !== string ? {
            success: !0,
            message: Drupal.t("Thanks for caring!")
        } : {
            success: !1,
            message: Drupal.t("Tell us why you cared!")
        });
    });
}), define("validation/address", [ "require", "jquery", "neue/validation" ], function(require) {
    var $ = require("jquery"), Validation = require("neue/validation"), requiredValidator = function(string, done, args) {
        return done("" !== string ? {
            success: !0,
            message: args.success
        } : {
            success: !1,
            message: args.failure
        });
    };
    /**
   * Validators for individual address form fields:
   */
    Validation.registerValidationFunction("fname", function(string, done) {
        return requiredValidator(string, done, {
            success: Drupal.t("Oh hey, @fname!", {
                "@fname": string
            }),
            failure: Drupal.t("We need your name. We’re on a first-name basis, right?")
        });
    }), Validation.registerValidationFunction("lname", function(string, done) {
        return requiredValidator(string, done, {
            success: Drupal.t("The @lname-inator! People call you that, right?", {
                "@lname": string
            }),
            failure: Drupal.t("We need your last name.")
        });
    }), Validation.registerValidationFunction("address1", function(string, done) {
        return requiredValidator(string, done, {
            success: Drupal.t("Got it!"),
            failure: Drupal.t("We need your street name and number.")
        });
    }), Validation.registerValidationFunction("address2", function(string, done) {
        return requiredValidator(string, done, {
            success: Drupal.t("Got that too!"),
            failure: ""
        });
    }), Validation.registerValidationFunction("city", function(string, done) {
        return requiredValidator(string, done, {
            success: Drupal.t("Sweet, thanks!"),
            failure: Drupal.t("We need your city.")
        });
    }), Validation.registerValidationFunction("state", function(string, done) {
        return requiredValidator(string, done, {
            success: Drupal.t("I ❤ @state", {
                "@state": string
            }),
            failure: Drupal.t("We need your state.")
        });
    }), Validation.registerValidationFunction("zipcode", function(string, done) {
        return done(string.match(/^\d{5}(?:[-\s]\d{4})?$/) ? {
            success: !0,
            message: Drupal.t("Almost done!")
        } : {
            success: !1,
            message: Drupal.t("We need your zip code.")
        });
    }), Validation.registerValidationFunction("why_signedup", function(string, done) {
        return requiredValidator(string, done, {
            success: Drupal.t("Thanks for caring!"),
            failure: Drupal.t("Oops! Can't leave this one blank.")
        });
    }), /**
   * Custom validation for UPS address fieldset.
   */
    Validation.registerValidationFunction("ups_address", function($el, done) {
        var $sorryError = $("<div class='messages error'><strong>" + Drupal.t("We couldn't find that address.") + "</strong>" + Drupal.t("Double check for typos and try submitting again.") + "</div>"), $networkError = $("<div class='messages error'>" + Drupal.t("We're having trouble submitting the form, are you sure your internet connection is working? Email us if you continue having problems.") + "</div>"), addressFieldData = $el.find("select, input").serializeArray();
        // Remove previous messages.
        $el.find(".messages").slideUp(function() {
            $(this).remove();
        }), // Once we know we have, submit them to the AJAX endpoint
        $.ajax({
            type: "POST",
            url: "/user/validate/address",
            dataType: "json",
            data: addressFieldData,
            success: function(data) {
                if (data.sorry) // Address is invalid and we don't have any suggestions
                return $el.append($sorryError).hide().slideDown(), done({
                    success: !1
                });
                var hasFieldErrors = !1;
                for (var field in data) if (data.hasOwnProperty(field) && "ambiguous" !== field) {
                    var suggestion = data[field], $fieldEl = $el.find("[name='user_address[" + field + "]']");
                    // If just capitalizing or adding extra 4-digit to zip, don't show an error
                    "postal_code" === field && $fieldEl.val().slice(0, 4) === suggestion.slice(0, 4) || suggestion === $fieldEl.val().toUpperCase() ? $fieldEl.val(suggestion) : (// Otherwise, mark errors and ask user to correct them
                    hasFieldErrors = !0, Validation.showValidationMessage($fieldEl, {
                        success: !1,
                        suggestion: {
                            full: suggestion,
                            domain: "zip"
                        }
                    }));
                }
                done(hasFieldErrors ? {
                    success: !1
                } : {
                    success: !0
                });
            },
            error: function() {
                // We're having trouble getting the validation over AJAX, let's mark as
                // validated and leave it up to the server just to be safe.
                $el.append($networkError).hide().slideDown(), done({
                    success: !1
                });
            }
        });
    }), /**
   * Validators for shirt reward fields:
   */
    Validation.registerValidationFunction("shirt_size", function(string, done) {
        return requiredValidator(string, done, {
            success: Drupal.t("It'll fit great!"),
            failure: Drupal.t("We need a shirt size!")
        });
    }), // Shirt style validor
    // @TODO: add support to radio button validation in Neue
    Validation.registerValidationFunction("shirt_style", function($el, done) {
        // collected checked radio's
        var $checked = $el.find("input[type='radio']:checked"), $errorMsg = $("<div class='message error'>" + Drupal.t("We need a shirt style!") + "</div>");
        // remove the error message before validation
        $el.find(".message").remove(), 1 === $checked.length ? done({
            success: !0
        }) : ($el.find("label:first").append($errorMsg), done({
            success: !1
        }));
    });
}), define("validation/donate", [ "require", "neue/validation" ], function(require) {
    /**
  * Validates string for a number
  *
  * @param {String}   string  String to be test against regex
  * @return {boolean}
  */
    function isDigit(string) {
        return /^\d+$/.test(string);
    }
    /**
  * Validates string for at least three digits
  *
  * @param {String}   string  String to be test against regex
  * @return {boolean}
  */
    function isMinThreeDigits(string) {
        return /^\d{3}$/.test(string);
    }
    /**
  * Validates string for a valid month [MM]
  *
  * @param {String}   string  String to be test against regex
  * @return {boolean}
  */
    function isValidMonth(string) {
        return /^(0?[1-9]|1[0-2])$/.test(string);
    }
    /**
  * Validates string for a valid year [YYYY]
  *
  * @param {String}   string  String to be test against regex
  * @return {boolean}
  */
    function isValidYear(string) {
        return /^[1-9]\d{3,}$/.test(string);
    }
    // @TODO: This will be removed when Neue's validation gets refactored.
    function validateNotBlank(string, done, success, failure) {
        return done("" !== string ? {
            success: !0,
            message: success
        } : {
            success: !1,
            message: failure
        });
    }
    // @TODO: This will be removed when Neue's validation gets refactored.
    function validateDigit(string, done, success, failure) {
        return done(isDigit(string) ? {
            success: !0,
            message: success
        } : {
            success: !1,
            message: failure
        });
    }
    /**
  * Validates string for a valid credit card number
  *
  * @param {String}   string  String to be test against regex
  * @return {boolean}
  */
    function validateCreditCardNumber(string, done, success, failure) {
        var found = null;
        for (var key in cardTypes) {
            var card = cardTypes[key];
            card.numberPattern.test(string) && (found = card);
        }
        return done(found ? {
            success: !0,
            message: found.name + " " + success
        } : {
            success: !1,
            message: failure
        });
    }
    /**
  * Validates string for a valid cvv
  *
  * @param {String}   string  String to be test against regex
  * @return {boolean}
  */
    function validateCvv(string, done, success, failure) {
        return done(isMinThreeDigits(string) ? {
            success: !0,
            message: success
        } : {
            success: !1,
            message: failure
        });
    }
    /**
  * Validates string for a valid expiration month
  *
  * @param {String}   string  String to be test against regex
  * @return {boolean}
  */
    function validateExpMonth(string, done, success, failure) {
        return done(isValidMonth(string) ? {
            success: !0,
            message: success
        } : {
            success: !1,
            message: failure
        });
    }
    /**
  * Validates string for a valid expiration year
  *
  * @param {String}   string  String to be test against regex
  * @return {boolean}
  */
    function validateExpYear(string, done, success, failure) {
        return done(isValidYear(string) ? {
            success: !0,
            message: success
        } : {
            success: !1,
            message: failure
        });
    }
    var Validation = require("neue/validation"), cardTypes = {
        Visa: {
            name: "Visa",
            numberPattern: /^4[0-9]{12}(?:[0-9]{3})?$/
        },
        Mastercard: {
            name: "MasterCard",
            numberPattern: /^5[1-5][0-9]{14}$/
        },
        AmericanExpress: {
            name: "American Express",
            numberPattern: /^3[47][0-9]{13}$/
        },
        DinersClub: {
            name: "Diners Club",
            numberPattern: /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/
        },
        Discover: {
            name: "Discover",
            numberPattern: /^6(?:011|5[0-9]{2})[0-9]{12}$/
        },
        JCB: {
            name: "JCB",
            numberPattern: /^(?:2131|1800|35\d{3})\d{11}$/
        }
    };
    // # Add validation functions...
    Validation.registerValidationFunction("full_name", function(string, done) {
        validateNotBlank(string, done, Drupal.t("Hey, @name!", {
            "@name": string
        }), Drupal.t("We need your full name."));
    }), Validation.registerValidationFunction("cc_num", function(string, done) {
        validateCreditCardNumber(string, done, Drupal.t("number looks good!"), Drupal.t("Invalid credit card number."));
    }), Validation.registerValidationFunction("cvv", function(string, done) {
        validateCvv(string, done, Drupal.t("CVV looks good!"), Drupal.t("Invalid CVV."));
    }), Validation.registerValidationFunction("exp_month", function(string, done) {
        validateExpMonth(string, done, Drupal.t("Good Month!"), Drupal.t("Invalid Month."));
    }), Validation.registerValidationFunction("exp_year", function(string, done) {
        validateExpYear(string, done, Drupal.t("Good Year!"), Drupal.t("Invalid Year."));
    }), Validation.registerValidationFunction("amount", function(string, done) {
        validateDigit(string, done, Drupal.t("So Generous!"), Drupal.t("Invalid Amount."));
    });
}), /**
 * @module Analytics
 * Uses Google Analytics custom events API to fire events for client-side
 * Modal and Form Validation flows.
 */
define("Analytics", [ "neue/events" ], function(Events) {
    // We'll only fire GA Custom Events if the GA object exists
    "undefined" != typeof _gaq && null !== _gaq && (// Validation
    Events.subscribe("Validation:InlineError", function(topic, args) {
        _gaq.push([ "_trackEvent", "Form", "Inline Validation Error", args, null, !0 ]);
    }), Events.subscribe("Validation:Suggestion", function(topic, args) {
        _gaq.push([ "_trackEvent", "Form", "Suggestion", args, null, !0 ]);
    }), Events.subscribe("Validation:SuggestionUsed", function(topic, args) {
        _gaq.push([ "_trackEvent", "Form", "Suggestion Used", args, null, !0 ]);
    }), Events.subscribe("Validation:Submitted", function(topic, args) {
        _gaq.push([ "_trackEvent", "Form", "Submitted", args, null, !1 ]);
    }), Events.subscribe("Validation:SubmitError", function(topic, args) {
        _gaq.push([ "_trackEvent", "Form", "Validation Error on submit", args, null, !0 ]);
    }), // Modals
    Events.subscribe("Modal:Open", function(topic, args) {
        _gaq.push([ "_trackEvent", "Modal", "Open", "#" + args.attr("id"), null, !0 ]);
    }), Events.subscribe("Modal:Close", function(topic, args) {
        _gaq.push([ "_trackEvent", "Modal", "Close", "#" + args.attr("id"), null, !0 ]);
    }));
}), define("tiles", [ "require", "jquery" ], function(require) {
    var $ = require("jquery");
    // Lazy-load in tile images
    $(".tile").find("img").unveil(200, function() {
        $(this).load(function() {
            this.style.opacity = 1;
        });
    });
}), /**
 * This is where we load and initialize components of our app.
 */
define("app", [ "require", "jquery", "finder/Finder", "donate/Donate", "revealer/Revealer", "neue/main", "campaign/SchoolFinder", "campaign/sources", "campaign/tips", "campaign/tabs", "campaign/ImageUploader", "validation/auth", "validation/reportback", "validation/address", "validation/donate", "Analytics", "tiles" ], function(require) {
    var $ = require("jquery"), Finder = require("finder/Finder"), Donate = require("donate/Donate"), Revealer = require("revealer/Revealer");
    // Initialize modules on load
    require("neue/main"), require("campaign/SchoolFinder"), require("campaign/sources"), 
    require("campaign/tips"), require("campaign/tabs"), require("campaign/ImageUploader"), 
    require("validation/auth"), require("validation/reportback"), require("validation/address"), 
    require("validation/donate"), require("Analytics"), require("tiles"), $(document).ready(function() {
        var $body = $("body"), $campaignFinderForm = $(".js-finder-form");
        if ($campaignFinderForm.length) {
            var $results = $(".js-campaign-results"), $blankSlate = $(".js-campaign-blankslate");
            Finder.init($campaignFinderForm, $results, $blankSlate);
        }
        var $donateForm = $("#modal--donate-form");
        $donateForm.length && Donate.init();
        /**
     * Show hide large galleries.
     * Only applies to taxonomy pages for the time being.
     */
        var $galleries = $body.find(".gallery.-mosaic");
        if ($body.hasClass("page-taxonomy") && $galleries.length > 0) {
            var galleryList = [];
            $galleries.each(function(index, gallery) {
                var $gallery = $(gallery), $tiles = $gallery.find("li");
                $tiles.length > 5 && (galleryList[index] = new Revealer($gallery, $tiles, "gallery"));
            });
        }
        $("html").addClass("js-ready");
    });
}), require([ "app" ]);