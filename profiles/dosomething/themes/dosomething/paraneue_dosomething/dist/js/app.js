define("text",{load:function(e){throw new Error("Dynamic load not allowed: "+e)}}),define("text!finder/templates/campaign.tpl.html",[],function(){return'<li>\n<article class="tile tile--campaign campaign-result<% if(featured) { %> big<% } %>">\n  <a class="wrapper" href="<%= url %>">\n    <% if(staffPick) {  %><div class="__flag -staff-pick"><%= Drupal.t("Staff Pick") %></div><% } %>\n    <div class="tile--meta">\n      <h1 class="__title"><%= title %></h1>\n      <p class="__tagline"><%= description %></p>\n    </div>\n    <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=" data-src="<%= image %>">\n  </a>\n</article>\n</li>\n'}),define("finder/Campaign",["require","jquery","lodash","text!finder/templates/campaign.tpl.html"],function(e){var t=e("jquery"),n=e("lodash"),i=e("text!finder/templates/campaign.tpl.html"),a=function(e){var n={title:Drupal.t("New Campaign"),description:Drupal.t("Take your dad to get his blood pressure checked"),url:"#",staffPick:!1,featured:!1};t.extend(this,n,this.convert(e))};return a.prototype.convert=function(e){var t={},n={label:"title",sm_field_call_to_action:"description",url:"url",bs_field_staff_pick:"staffPick",bs_sticky:"featured",ss_field_search_image_400x400:"image"};for(var i in e)void 0!==n[i]&&(t[n[i]]=e[i]);return t},a.prototype.render=function(){var e=n.template(i,{image:this.image,staffPick:this.staffPick,featured:this.featured,title:this.title,description:this.description,url:this.url});return e},a}),define("text!finder/templates/no-results.tpl.html",[],function(){return'<div class="no-result">\n  <div class="wrapper">\n    <p class="message"><%= Drupal.t("Oh snap! We\'ll work on that.") %></p>\n    <p>\n      <a id="reset-filters" href="/">\n        <%= Drupal.t("Want to try another combo?") %>\n      </a>\n    </p>\n  </div>\n</div>\n'}),define("finder/ResultsView",["require","jquery","lodash","finder/Campaign","text!finder/templates/no-results.tpl.html"],function(e){var t=e("jquery"),n=e("lodash"),i=e("finder/Campaign"),a=e("text!finder/templates/no-results.tpl.html"),s={$container:null,$gallery:t("<ul class='gallery -mosaic'></ul>"),$blankSlateDiv:null,slots:0,maxSlots:8,start:0,init:function(e,n,i,a){s.$container=e,s.$container.hide(),s.$paginationLink=t("<div class='pagination-link'><a href='#' class='secondary js-finder-show-more'>"+Drupal.t("Show More")+"</a></div>"),t("body").on("click",".js-finder-show-more",function(e){e.preventDefault(),i(s.start)}),s.$blankSlateDiv=n,s.$container.on("click","#reset-filters",function(e){e.preventDefault(),s.showBlankSlate(),a()})},showBlankSlate:function(){s.$container.hide(),s.$blankSlateDiv.show()},showEmptyState:function(){var e=n.template(a);s.$container.append(e)},parseResults:function(e){if(s.clear(),e.retrieved>0){s.$container.append(s.$gallery);for(var t in e.result.response.docs)s.add(new i(e.result.response.docs[t]));s.showPaginationLink(e.result.response.numFound>s.start)}else s.showEmptyState();s.loading(!1)},showPaginationLink:function(e){s.$paginationLink.remove(),e&&(s.$container.append(s.$paginationLink),s.$paginationLink.show())},appendResults:function(e){for(var t in e.result.response.docs)s.add(new i(e.result.response.docs[t]));s.showPaginationLink(e.result.response.numFound>s.start),s.loading(!1)},loading:function(e){void 0===e&&(e=!0),s.$container.append("<div class='spinner'></div>"),s.$container.toggleClass("loading",e)},checkInit:function(){if(null===s.$container)throw Drupal.t("Error: ResultsView is not initialized.")},clear:function(){s.checkInit(),s.$container.empty(),s.$gallery.empty(),s.$container.show(),s.$blankSlateDiv.hide(),s.slots=0,s.start=0},add:function(e){s.checkInit(),s.$gallery.append(e.render()),s.slots++,s.start++,s.$container.find("img").unveil(200,function(){t(this).load(function(){this.style.opacity=1})})}};return s}),define("finder/SolrAdapter",["require","jquery","lodash"],function(e){var t=e("jquery"),n=e("lodash");window.solrResponse=function(){};var i={throttleTimeout:400,baseURL:Drupal.settings.dosomethingSearch.solrURL,collection:Drupal.settings.dosomethingSearch.collection,throttle:null,defaultQuery:["fq=-sm_field_campaign_status:(closed) bundle:[campaign TO campaign_group]","wt=json","indent=false","facet=true","facet.field=fs_field_active_hours","facet.field=im_field_cause","facet.field=im_field_action_type","rows=8","fl=label,tid,im_vid_1,sm_vid_Action_Type,tm_vid_1_names,im_field_cause,im_vid_2,sm_vid_Cause,tm_vid_2_names,im_field_tags,im_vid_5,sm_vid_Tags,tm_vid_5_names,fs_field_active_hours,sm_field_call_to_action,bs_field_staff_pick,ss_field_search_image_400x400,ss_field_search_image_720x720,url"],fieldMap:{cause:"im_field_cause",time:"fs_field_active_hours","action-type":"im_field_action_type"},fieldMapInverse:{},responseData:null,init:function(){i.fieldMapInverse=n.invert(i.fieldMap)},throttledQuery:function(e,t,n){clearTimeout(i.throttle),i.throttle=setTimeout(function(){i.query(e,t,n)},i.throttleTimeout)},query:function(e,a,s){var r=n.clone(i.defaultQuery);r.push("start="+a);var o=[];n.forOwn(e,function(e,t){if(!n.isEmpty(e)){var a="("+e.join(") OR (")+")",s=i.generatePowerset(e);s.length&&(a+=" OR "+s),o.push(i.fieldMap[t]+":("+encodeURIComponent(a)+")")}}),i.xhr&&i.xhr.abort(),i.xhr=t.ajax({dataType:"jsonp",cache:!0,jsonpCallback:"solrResponse",url:i.buildQuery(r,o),success:function(e){s({result:e,retrieved:e.response.docs.length})},error:function(e,t){s({result:!1,error:t})},jsonp:"json.wrf"})},buildQuery:function(e,t){var n=e.push("q=")-1,a='_query_:"{!func}scale(is_bubble_factor,0,100)" AND ';return e[n]=t.length>0?1===t.length?"q="+a+t[0]:"q="+a+"("+t.join(") AND (")+")":a,e=e.join("&"),i.baseURL+i.collection+"/select?"+e},generatePowerset:function(e){function t(e){for(var t=[[]],n=0;n<e.length;n++)for(var i=0,a=t.length;a>i;i++)t.push(t[i].concat(e[n]));return t}for(var n=t(e),i=[],a=1;a<n.length;a++)n[a].length>1&&i.push("(("+n[a].join(") AND (")+"))^"+100*n[a].length);return i.join(" OR ")}};return i}),define("text!finder/templates/error.tpl.html",[],function(){return'<div class="messages error">\n  <%= Drupal.t("Ooof! We\'re not sure what\'s up? Maybe it\'s us, or it could be your internet connection. Want to try again in a few minutes?") %>\n</div>\n'}),define("finder/FormView",["require","jquery","lodash","finder/ResultsView","finder/SolrAdapter","text!finder/templates/error.tpl.html"],function(e){var t=e("jquery"),n=e("lodash"),i=e("finder/ResultsView"),a=e("finder/SolrAdapter"),s=e("text!finder/templates/error.tpl.html"),r={$div:null,$searchButton:null,$fields:{},lastChanged:null,cssBreakpoint:768,init:function(e,s){r.$div=e,e.find("[data-toggle]").click(function(){var e=t(this),n=e.data("toggle"),i=e.parent("."+n),a=i.siblings();i.toggleClass("open"),t(window).outerWidth()>=r.cssBreakpoint&&(i.hasClass("open")?a.addClass("open"):a.removeClass("open"))}),r.$fields.cause=e.find("input[name='cause']"),r.$fields.time=e.find("input[name='time']"),r.$fields["action-type"]=e.find("input[name='action-type']"),r.$searchButton=e.find(".campaign-search"),n.each(r.$fields,function(e){e.each(function(e,n){var i=a.fieldMap[t(n).prop("name")],s=t(n).val();a.defaultQuery.push("facet.query="+i+":"+s)})}),n.each(r.$fields,function(e){e.change(function(){t(this).parents("li").toggleClass("checked",t(this).is(":checked")),r.lastChanged=t(this).attr("name"),s()})}),r.$searchButton.click(function(){s(),t("html,body").animate({scrollTop:i.$div.offset().scrollTop},1e3)})},checkInit:function(){if(null===r.$div)throw Drupal.t("Error: FormView is not initialized.")},showErrorMessage:function(){var e=n.template(s);t(".error").length<1&&r.$div.parents(".finder--form").after(e)},hasCheckedFields:function(){var e=!1;return n.each(r.$fields,function(t){t.filter(":checked").length>0&&(e=!0)}),e},getCheckedFields:function(){var e=[];return n.each(r.$fields,function(n,i){var a=n.filter(":checked");e[i]=[],a.length>0&&a.each(function(n,a){e[i].push(t(a).val())})}),e},disableFields:function(e){r.checkInit(),n.each(e,function(i,s){var r=s.split(":"),o=r[0],l=r[1],c=t("input[name='"+a.fieldMapInverse[o]+"']");if(n.isEmpty(c.filter(":checked"))){var u=0===e[s],d=c.filter("[value='"+l+"']");d.prop("disabled",u),u?(d.prop("checked",!u),d.parents("li").addClass("disabled")):d.parents("li").removeClass("disabled")}else c.filter(":not(:checked)").prop("disabled",!0),c.filter(":not(:checked)").parents("li").addClass("disabled")})},clear:function(){n.each(r.$fields,function(e){var t=e.filter(":disabled");t&&e.prop("disabled",!1).parents("li").removeClass("disabled")})}};return r}),define("finder/Finder",["require","finder/FormView","finder/ResultsView","finder/SolrAdapter"],function(e){var t=e("finder/FormView"),n=e("finder/ResultsView"),i=e("finder/SolrAdapter"),a={init:function(e,s,r){t.init(e,a.query),n.init(s,r,a.query,t.clear),i.init()},query:function(e){var s=e||0,r=t.getCheckedFields();s?i.throttledQuery(r,s,n.appendResults):i.throttledQuery(r,s,a.displayResults),n.loading()},displayResults:function(e){e.result?t.hasCheckedFields()?(n.parseResults(e),t.disableFields(e.result.facet_counts.facet_queries)):(n.showBlankSlate(),t.clear()):t.showErrorMessage()}};return a}),define("StripeForm",["require","jquery"],function(e){var t=e("jquery"),n=window.Stripe||{},i=function(e,n){if(void 0!==e&&t(e.length)&&void 0!==n){if(!this instanceof i)return new i(e,n);this.$form=t(e),this.$parent=this.$form.parent(),this.publishKey=n,this.init()}};return i.prototype={init:function(){var e=this;n.setPublishableKey(this.publishKey),this.$form.on("submit",function(e){e.preventDefault()}),this.$form.find(".form-submit").on("click",function(){setTimeout(function(){var t=e.isValid();t&&n.card.createToken(e.$form,function(t,n){e.onFormSubmit(t,n)})},100)})},onFormSubmit:function(e,t){var n=this.$form;if(t.error)n.find(".payment-errors").text(t.error.message);else{var i=t.id;n.find("input[name='token']").val(i),n.get(0).submit()}},isValid:function(){return 0===this.$form.find(".error").length}},i}),define("donate/Donate",["require","jquery","StripeForm"],function(e){var t=e("jquery"),n=e("StripeForm"),i=t("#dosomething-payment-form"),a={init:function(){try{var e=Drupal.settings.dosomethingPayment.stripeAPIPublish;new n(i,e)}catch(t){i.html("<div class='messages'>Whoops! Something's not right. Please email us!</div>")}}};return a}),define("revealer/Revealer",["require","jquery"],function(e){var t=e("jquery"),n=function(e,n,i){this.$container=e,this.$content=n,this.$button=t('<button class="btn tertiary">'+Drupal.t("Show More")+"</button>"),this.category=i,this.steps={items:[],count:0},this.init()};return n.prototype.init=function(){"gallery"===this.category?this.prepGalleryItems():this.steps.items.push(this.$content),this.steps.count=this.steps.items.length,this.detachContent(),this.enableButton()},n.prototype.detachContent=function(){this.$content.detach()},n.prototype.reattachContent=function(e){this.$container.append(e)},n.prototype.enableButton=function(){this.$button.insertAfter(this.$container);var e=this;this.$button.on("click",function(){e.steps.count>0&&(e.reattachContent(e.steps.items.shift()),e.steps.count--),0===e.steps.count&&e.$button.remove()})},n.prototype.prepGalleryItems=function(){this.$content=this.$content.slice(5);var e=t.makeArray(this.$content);if(this.$content.length>8)for(;e.length>0;)this.steps.items.push(e.splice(0,8));else this.steps.items.push(e);e=null},n}),define("neue/carousel",[],function(){var e=window.jQuery;e(function(){function t(){0===a?a=s:a--}function n(){a===s?a=0:a++}function i(i){e("#slide"+a).removeClass("visible"),"prev"===i?t():n(),e("#slide"+a).addClass("visible")}e("#slide0").addClass("visible");var a=0,s=e(".slide").length-1,r=e("#prev, #next");r.click(function(){i(e(this).attr("id"))})})}),define("neue/events",[],function(){var e={},t=-1,n=function(t,n){return e[t]?(setTimeout(function(){for(var i=e[t],a=i?i.length:0;a--;)i[a].func(t,n)},0),!0):!1},i=function(n,i){e[n]||(e[n]=[]);var a=(++t).toString();return e[n].push({token:a,func:i}),a},a=function(t){for(var n in e)if(e[n])for(var i=0,a=e[n].length;a>i;i++)if(e[n][i].token===t)return e[n].splice(i,1),t;return!1};return{publish:n,subscribe:i,unsubscribe:a}}),define("neue/jump-scroll",[],function(){var e=window.jQuery;e(function(){e(".js-jump-scroll").on("click",function(t){t.preventDefault();var n=e(this).attr("href");e("html,body").animate({scrollTop:e(t.target.hash).offset().top},"slow",function(){window.location.hash=n})})})}),define("neue/media-selector",[],function(){var e=window.jQuery,t=function(n,i){if(void 0!==n&&e(n.length)){if(!this instanceof t)return new t(n,i);var a=this;i=i||{},a.cfg=i={fieldClassName:"string"==typeof i.fieldClassName?i.fieldClassName:"media-options",fieldSelector:"string"==typeof i.fieldSelector?i.fieldSelector:".form-type-radio",optionSelector:"string"==typeof i.optionSelector?i.optionSelector:"label"},a.$fieldGroup=e(n).addClass(a.cfg.fieldClassName),a.$checked=[],a.init()}};t.prototype={init:function(){var t=this,n=t.cfg;t.$fieldGroup.find(n.fieldSelector).each(function(i){var a=e(this),s=(i+1)%2===0?"-second":"-first";a.addClass(s),a.find("input[type='radio']:checked").length>0&&t.check(a),a.find(n.optionSelector).on("click",function(){t.$checked.length>0&&t.uncheck(t.$checked),t.check(a)})})},check:function(e){e.addClass("selected").find("input[type='radio']").attr("checked",!0),this.$checked=e},uncheck:function(e){e.removeClass("selected").find("input[type='radio']").attr("checked",!1)}},e(function(){e(".js-media-options").each(function(){new t(e(this))})})}),define("neue/menu",[],function(){var e=window.jQuery;e(function(){e(".js-toggle-mobile-menu").on("click",function(){e(".chrome--nav").toggleClass("is-visible")}),e(".js-footer-col").addClass("is-collapsed"),e(".js-footer-col h4").on("click",function(){window.matchMedia("screen and (max-width: 768px)").matches&&e(this).closest(".js-footer-col").toggleClass("is-collapsed")})})}),define("neue/messages",[],function(){var e=window.jQuery,t='<a href="#" class="js-close-message message-close-button white">×</a>',n=function(n,i){n.append(t),n.on("click",".js-close-message",function(t){t.preventDefault(),e(this).parent(".messages").slideUp(),i&&"function"==typeof i&&i()})};return e(function(){n(e(".messages"))}),{attachCloseButton:n}}),define("neue/modal",["require","./events"],function(e){var t=window.jQuery,n=window.Modernizr,i=e("./events"),a=!1,s=null,r=t(document),o=t(".chrome"),l=null,c=t("<a href='#' class='js-close-modal js-modal-generated modal-close-button -alt'>skip</a>"),u=t("<a href='#' class='js-close-modal js-modal-generated modal-close-button'>&#215;</a>"),d=null,f=!1,p=function(){return null!==d},h=function(e,n,i){switch(n){case"skip":e.prepend(c),c.on("click",function(e){e.preventDefault(),t(i).submit()}),f=!1;break;case"false":case"0":f=!1;break;default:e.prepend(u),f=!0}},m=function(e,t){if(t=t||{},t.animated="boolean"==typeof t.animated?t.animated:!0,t.closeButton="undefined"!=typeof t.closeButton?t.closeButton:e.attr("data-modal-close"),t.skipForm="undefined"!=typeof t.skipForm?t.skipForm:e.attr("data-modal-skip-form"),0===e.length)return!1;if(!a)return s={$el:e,options:t},!1;var c="-"+r.scrollTop()+"px";h(e,t.closeButton,t.skipForm),p()?(d.hide(),e.show()):(o.css("top",c),o.addClass("modal-open"),l.css("display","block"),t.animated&&n.cssanimations&&l.addClass("animated-open"),e.css("display","block")),setTimeout(function(){r.scrollTop(0)},50),i.publish("Modal:Open",e),d=e},g=function(e){l.css("display","none"),l.removeClass("animated-close"),d.css("display","none"),d.find(".js-modal-generated").remove(),o.removeClass("modal-open"),o.css("top",""),r.scrollTop(e),d=null},v=function(e){e=e||{},e.animated="undefined"!=typeof e.animated?e.animated:!0;var t=-1*parseInt(o.css("top"));e.animated&&n.cssanimations?(l.addClass("animated-close"),l.one("webkitAnimationEnd oanimationend msAnimationEnd animationend",function(){g(t)})):g(t),window.location.hash==="#"+d.attr("id")&&(window.location.hash="/"),i.publish("Modal:Close",d)},y=function(e){e.preventDefault();var n=t(this).data("modal-href");m(t(n))},b=function(e){e.target===this&&(t(this).hasClass("js-close-modal")||f)&&(e.preventDefault(),v())};return r.ready(function(){var e=t("body");l=t("<div class='modal-container'></div>"),e.append(l),t("[data-modal]").each(function(){t(this).appendTo(l),t(this).attr("hidden",!0)});var n=window.location.hash;n&&"#/"!==n&&t(n)&&"undefined"!=typeof t(n).data("modal")&&m(t(n)),a=!0,null!==s&&m(s.$el,s.options),e.on("click","[data-modal-href]",y),e.on("click",".modal-container",b),e.on("click",".js-close-modal",b)}),{isOpen:p,open:m,close:v}}),define("neue/scroll-indicator",[],function(){function e(e,t,n){for(var i=0,a=e?e.length:i;a>i;){var s=i+a>>>1;e[s][n]<t?i=s+1:a=s}return i?i-1:i}function t(t,n){var i=e(t,n,"offset");return t[i]}function n(e){var t=r(e.attr("href"));t.length&&o.push({offset:t.offset().top,link:e})}function i(){o=[],r(".js-scroll-indicator").find("a").each(function(e,t){n(r(t))})}function a(){var e=t(o,r(window).scrollTop()+40);if(e&&e.link){var n=e.link.parentsUntil(".js-scroll-indicator"),i=r();s&&s!==e&&(s.link.removeClass("is-active"),i=s.link.parentsUntil(".js-scroll-indicator")),e.link.addClass("is-active"),n.addClass("is-active"),i.not(n).removeClass("is-active"),s=e}}var s,r=window.jQuery,o=[],l=function(e,t,n){var i,a,s,r=null,o=0;n||(n={});var l=function(){o=new Date,r=null,s=e.apply(i,a)};return function(){var c=new Date;o||n.leading!==!1||(o=c);var u=t-(c-o);return i=this,a=arguments,0>=u?(clearTimeout(r),r=null,o=c,s=e.apply(i,a)):r||n.trailing===!1||(r=setTimeout(l,u)),s}};r(function(){i();var e=l(a,60);r(window).on("scroll",e),r(window).on("resize",i)})}),define("neue/sticky",[],function(){function e(){a=[],i(".js-sticky").each(function(e,n){t(n)})}function t(e){var t=i(e).offset().top,s={$el:i(e),offset:t};a.push(s),n()}function n(){i.each(a,function(e,t){i(window).scrollTop()>t.offset?t.$el.addClass("is-stuck"):t.$el.removeClass("is-stuck")})}var i=window.jQuery,a=[];i(function(){e(),i(window).on("scroll",n),i(window).on("resize",e)})}),define("neue/validation",["require","./events"],function(e){var t=window.jQuery,n=e("./events"),i=[],a=function(e){e.each(function(){var e=t(this);s(t("label[for='"+e.attr("id")+"']")),e.on("blur",function(t){t.preventDefault(),r(e)})})},s=function(e){if(0===e.find(".inner-label").length){var n=t("<div class='inner-label'></div>");n.append("<div class='label'>"+e.html()+"</div>"),n.append("<div class='message'></div>"),e.html(n)}},r=function(e,n,a){n="undefined"!=typeof n?n:!1,a="undefined"!=typeof a?a:function(e,t){c(e,t)};var s=e.data("validate"),o=e.data("validate-trigger");if(o&&r(t(o)),i[s])if(f(e)){var l=e.val();if(n||""!==l)if("match"===s){var u=t(e.data("validate-match")).val();i[s].fn(l,u,function(t){a(e,t)})}else i[s].fn(l,function(t){a(e,t)})}else if("match"===s){var d=t(e.data("validate-match"));i[s].fn(e,d,function(t){a(e,t)})}else i[s].fn(e,function(t){a(e,t)})},o=function(e,t){if(i[e])throw"A validation function with that name has already been registered";i[e]=t},l=function(e,t){var n={fn:t};o(e,n)},c=function(e,i){var a,s=t("label[for='"+e.attr("id")+"']"),r=s.find(".message"),o=s.height();return e.removeClass("success error warning shake"),r.removeClass("success error warning"),i.success===!0?(e.addClass("success"),r.addClass("success")):(e.addClass("error"),r.addClass("error"),f(e)&&e.addClass("shake"),n.publish("Validation:InlineError",s.attr("for"))),i.message&&r.text(i.message),i.suggestion&&(r.html("Did you mean "+i.suggestion.full+"? <a href='#' data-suggestion='"+i.suggestion.full+"'class='js-mailcheck-fix'>Fix it!</a>"),n.publish("Validation:Suggestion",i.suggestion.domain)),a=r.height(),a>o?s.css("height",a+"px"):s.css("height",""),s.addClass("show-message"),t(".js-mailcheck-fix").on("click",function(e){e.preventDefault();var i=t("#"+t(this).closest("label").attr("for"));i.val(t(this).data("suggestion")),i.trigger("blur"),n.publish("Validation:SuggestionUsed",t(this).text())}),e.on("focus",function(){e.removeClass("warning error success shake"),s.removeClass("show-message"),s.css("height","")}),i.success},u=function(e){var t=e.find(":submit");t.attr("disabled",!0),t.addClass("loading"),"BUTTON"===t.prop("tagName")&&t.addClass("loading")},d=function(e){var t=e.find(":submit");t.attr("disabled",!1),t.removeClass("loading disabled")},f=function(e){var t=e.prop("tagName");return"INPUT"===t||"SELECT"===t||"TEXTAREA"===t};return t("body").on("submit","form",function(e,i){var a=t(this),s=a.find("[data-validate]");if(u(a),s=s.map(function(){var e=t(this);return"undefined"!=typeof e.attr("data-validate-required")||""!==e.val()?e:void 0}),0===s.length)return!0;if(i===!0)return!0;e.preventDefault();var o=0,l=0,f=!1;return s.each(function(){r(t(this),!0,function(e,i){o++,c(e,i),i.success&&l++,f||i.success!==!1||(f=!0,t("html,body").animate({scrollTop:e.offset().top-32},200)),o===s.length&&(l===s.length?(n.publish("Validation:Submitted",t(this).attr("id")),a.trigger("submit",!0)):(n.publish("Validation:SubmitError",t(this).attr("id")),d(a)))})}),!1}),l("match",function(e,t,n){return n(e===t&&""!==e?{success:!0,message:"Looks good!"}:{success:!1,message:"That doesn't match."})}),t(function(){a(t("body").find("[data-validate]"))}),{prepareFields:a,registerValidation:o,registerValidationFunction:l,validateField:r,showValidationMessage:c,Validations:i}}),define("neue/main",["require","./carousel","./events","./jump-scroll","./media-selector","./menu","./messages","./modal","./scroll-indicator","./sticky","./validation"],function(e){return window.NEUE={Carousel:e("./carousel"),Events:e("./events"),JumpScroll:e("./jump-scroll"),MediaSelector:e("./media-selector"),Menu:e("./menu"),Messages:e("./messages"),Modal:e("./modal"),ScrollIndicator:e("./scroll-indicator"),Sticky:e("./sticky"),Validation:e("./validation")},window.NEUE}),define("campaign/SchoolFinder",["require","jquery","lodash","neue/validation"],function(e){var t=e("jquery"),n=e("lodash"),i=e("neue/validation"),a=!0,s=n.template("<li><a class='js-schoolfinder-result' data-gsid='<%- gsid %>' href='#'><span><%- name %></span> <em><%- city %>, <%- state %></em></a></li>"),r=function(e,i,a,s){var r;if(n.isEmpty(i)||n.isEmpty(e))return s([]);try{r=Drupal.settings.dosomethingUser.schoolFinderAPIEndpoint}catch(o){r="http://lofischools.herokuapp.com/search"}t.ajax({dataType:"json",url:r+"?state="+e+"&query="+i+"&limit="+a}).done(function(e){s(e.results,e.meta.more_results)}).fail(function(){s(!1)})},o=function(e,t,i){return e.empty(),t?(n.each(t,function(t){e.append(s(t))}),0===t.length&&e.append("<div class='messages error'>Hmm, we couldn't find your school based on how the name was entered. But it may still be there! Click on the link below for tips on finding your school.</div>"),i&&e.append("<p class='schoolfinder-showmore'><a href='#' class='secondary js-schoolfinder-showmore'>Show More Results</a></p>"),void e.show()):(e.append("<div class='messages error'>We couldn't load schools. Check your internet connection, or try refreshing the page.</div>"),void e.show())},l=function(e){var i=t("#edit-school-administrative-area"),s=e.find("[name='school_id']"),l=e.find(".js-schoolfinder-search"),c=e.find(".js-schoolfinder-results"),u=t("#edit-school-not-affiliated"),d=e.find(".js-school-not-affiliated-confirmation"),f="",p=n.throttle(r,1e3);l.hide(),c.hide(),i.on("change",function(){var n=""!==t(this).val();e.find(".messages").hide(),l.val(""),l.trigger("keyup"),l.toggle(n),n&&l.focus()}),l.on("keyup",function(){e.find(".messages").hide();var n=t(this).val();""!==n?(l.addClass("loading"),p(i.val(),n,10,function(e,t){o(c,e,t),l.removeClass("loading")})):(c.hide(),s.val(""))}),c.on("click",".js-schoolfinder-result",function(e){e.preventDefault();var n=t(this);s.val(n.data("gsid")),l.val(n.find("span").text()),n.addClass("is-selected"),n.parent("li").siblings().hide()}),e.on("click",".js-schoolfinder-showmore",function(e){e.preventDefault(),t(this).remove(),l.addClass("loading"),p(i.val(),l.val(),50,function(e){o(c,e,!1),l.removeClass("loading")})}),u.on("change",function(){a=!this.checked,d.toggle(this.checked),this.checked?(f=i.val(),i.val(""),l.val(""),l.trigger("keyup")):(i.val(f),d.hide()),i.trigger("focus").trigger("change").trigger("blur"),e.find("input[type='submit']").trigger("focus")}),e.find(".js-schoolfinder-help").on("click",function(){t(".js-schoolfinder-help-content").toggle()})};t(document).ready(function(){var e=t("#dosomething-signup-user-signup-data-form");e&&l(e)}),i.registerValidationFunction("school_finder",function(e,t){var n=e.find("[name='school_id']");return a&&""===n.val()?(e.addClass("shake"),e.find(".messages.error").remove(),e.append("<div class='messages error'>You haven't entered your school. Find your school by entering your state and then selecting a school from the search results.</div>"),t({success:!1})):t({success:!0})})}),define("campaign/sources",["require","jquery","neue/events"],function(e){var t=e("jquery"),n=e("neue/events"),i=function(e){var n=e.find("ul, div:first");n.hide(),t(".js-toggle-sources").on("click",function(){n.slideToggle()})},a=t(".sources")||null;n.subscribe("Modal:opened",function(){var e=t(".modal .sources")||null;i(e)}),a&&i(a)}),define("campaign/tips",["require","jquery"],function(e){var t=e("jquery");t(".js-show-tip").on("click",function(e){e.preventDefault();var n=t(this),i=n.closest(".tips--wrapper");i.find(".tip-header").removeClass("active"),n.addClass("active");var a=n.attr("href").slice(1);i.find(".tip-body").hide(),i.find("."+a).show()})}),define("campaign/tabs",["require","jquery"],function(e){var t=e("jquery"),n=t(".js-tabs"),i=n.find(".tabs__menu a");n.each(function(){t(this).find(".tab").first().addClass("is-active")}),i.on("click",function(e){e.preventDefault();var n=t(this),i=n.parent().siblings(),a=n.data("tab")-1,s=n.closest(".js-tabs").find(".tab"),r=s.get(a);i.removeClass("is-active"),n.parent().addClass("is-active"),s.removeClass("is-active"),t(r).addClass("is-active")})}),define("campaign/ImageUploader",["require","jquery"],function(e){var t=e("jquery"),n=function(e){var n=e.find(".js-image-upload"),i=e.find(".form-item-caption"),a=0===e.find(".submitted-image").length?!1:!0;a||i.hide(),n.each(function(e,n){t(n).wrap(t("<div class='image-upload-container'></div>"));var s=t(n).parent(".image-upload-container");s.wrap("<div style='clear: both'></div>");var r=t("<a href='#' class='btn secondary small'>"+Drupal.t("Upload A Pic")+"</a>");r.insertAfter(t(n));var o=t("<img class='preview' src=''>");o.insertBefore(s),o.hide();var l=t("<p class='filename'></p>");l.insertAfter(r),t(n).on("change",function(e){e.preventDefault(),a=!0,i.show(),r.text(Drupal.t("Change Pic"));var s=this.files?this.files:[];if(s[0]&&s[0].name)l.text(s[0].name);else{var c=t(n).val().replace("C:\\fakepath\\","");l.text(c)}if(s.length&&window.FileReader&&/^image/.test(s[0].type)){var u=new FileReader;u.readAsDataURL(s[0]),u.onloadend=function(){o.show(),o.attr("src",this.result)}}})})};t(function(){n(t("body"))})}),define("validation/auth",["require","neue/validation","mailcheck"],function(e){function t(e){var t=e.toUpperCase();if(t.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]+$/)){for(var n="",i=0,a=t.length;a>i;i++){if("."===n&&"."===t[i])return!1;n=t[i]}return!0}return!1}function n(e,t,n,i){return t(""!==e?{success:!0,message:n}:{success:!1,message:i})}var i=e("neue/validation"),a=e("mailcheck");i.registerValidationFunction("name",function(e,t){n(e,t,Drupal.t("Hey, @name!",{"@name":e}),Drupal.t("We need your first name."))}),i.registerValidationFunction("last_name",function(e,t){n(e,t,Drupal.t("Got it, @name!",{"@name":e}),Drupal.t("We need your last name."))}),i.registerValidationFunction("birthday",function(e,t){var n,i,a,s,r;try{r=Drupal.settings.dsValidation.dateFormat}catch(o){r="MM/DD/YYYY"}if("MM/DD/YYYY"===r&&/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(e))n=e.split("/"),i=parseInt(n[0]),a=parseInt(n[1]),s=parseInt(n[2]);else{if("DD/MM/YYYY"!==r||!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(e))return t({success:!1,message:Drupal.t("Enter your birthday "+r+"!")});n=e.split("/"),a=parseInt(n[0]),i=parseInt(n[1]),s=parseInt(n[2])}if(i>12||0===i)return t({success:!1,message:Drupal.t("That doesn't seem right.")});var l=[0,31,28,31,30,31,30,31,31,30,31,30,31];if((s%4===0&&s%100!==0||s%400===0)&&(l[2]=29),a>l[i])return t({success:!1,message:Drupal.t("That doesn't seem right.")});var c=new Date(s,i-1,a),u=new Date,d=u.getFullYear()-c.getFullYear(),f=u.getMonth()-c.getMonth();return(0>f||0===f&&u.getDate()<c.getDate())&&d--,t(0>d?{success:!1,message:Drupal.t("Are you a time traveller?")}:d>0&&25>=d?c.getMonth()===u.getMonth()&&u.getDate()===c.getDate()?{success:!0,message:Drupal.t("Wow, happy birthday!")}:10>d?{success:!0,message:Drupal.t("Wow, you're @age!",{"@age":d})}:{success:!0,message:Drupal.t("Cool, @age!",{"@age":d})}:d>25&&130>d?{success:!0,message:Drupal.t("Got it!")}:""===e?{success:!1,message:Drupal.t("We need your birthday.")}:{success:!1,message:Drupal.t("That doesn't seem right.")})}),i.registerValidationFunction("email",function(e,n){return t(e)?void a.run({email:e,domains:["yahoo.com","google.com","hotmail.com","gmail.com","me.com","aol.com","mac.com","live.com","comcast.net","googlemail.com","msn.com","hotmail.co.uk","yahoo.co.uk","facebook.com","verizon.net","sbcglobal.net","att.net","gmx.com","mail.com","outlook.com","aim.com","ymail.com","rocketmail.com","bellsouth.net","cox.net","charter.net","me.com","earthlink.net","optonline.net","dosomething.org"],suggested:function(e){return n({success:!0,suggestion:e})},empty:function(){return n({success:!0,message:Drupal.t("Great, thanks!")})}}):n({success:!1,message:Drupal.t("We need a valid email.")})}),i.registerValidationFunction("password",function(e,t){return t(e.length>=6?{success:!0,message:Drupal.t("Keep it secret, keep it safe!")}:{success:!1,message:Drupal.t("Must be 6+ characters.")})}),i.registerValidationFunction("phone",function(e,t){var n=e.replace(/[\-\s\.]/g,""),i=/^(?:\+?([0-9]{1,3})([\-\s\.]{1})?)?\(?([0-9]{3})\)?(?:[\-\s\.]{1})?([0-9]{3})(?:[\-\s\.]{1})?([0-9]{4})/.test(n),a=e.replace(/[^0-9]/g,""),s=/([0-9]{1})\1{9,}/.test(a);return t(i&&!s?{success:!0,message:Drupal.t("Thanks!")}:{success:!1,message:Drupal.t("Enter a valid telephone number.")})})}),define("validation/reportback",["require","neue/validation"],function(e){var t=e("neue/validation");t.registerValidationFunction("positiveInteger",function(e,t){var n=e.replace(" ","");return t(""!==n&&/^[1-9]\d*$/.test(n)?{success:!0,message:Drupal.t("That's great!")}:{success:!1,message:Drupal.t("Enter a valid number!")})}),t.registerValidationFunction("reportbackReason",function(e,t){return t(""!==e?{success:!0,message:Drupal.t("Thanks for caring!")}:{success:!1,message:Drupal.t("Tell us why you cared!")})})}),define("validation/address",["require","jquery","neue/validation"],function(e){var t=e("jquery"),n=e("neue/validation"),i=function(e,t,n){return t(""!==e?{success:!0,message:n.success}:{success:!1,message:n.failure})};n.registerValidationFunction("fname",function(e,t){return i(e,t,{success:Drupal.t("Oh hey, @fname!",{"@fname":e}),failure:Drupal.t("We need your name. We’re on a first-name basis, right?")})}),n.registerValidationFunction("lname",function(e,t){return i(e,t,{success:Drupal.t("The @lname-inator! People call you that, right?",{"@lname":e}),failure:Drupal.t("We need your last name.")})}),n.registerValidationFunction("address1",function(e,t){return i(e,t,{success:Drupal.t("Got it!"),failure:Drupal.t("We need your street name and number.")})}),n.registerValidationFunction("address2",function(e,t){return i(e,t,{success:Drupal.t("Got that too!"),failure:""})}),n.registerValidationFunction("city",function(e,t){return i(e,t,{success:Drupal.t("Sweet, thanks!"),failure:Drupal.t("We need your city.")})}),n.registerValidationFunction("state",function(e,t){return i(e,t,{success:Drupal.t("I ❤ @state",{"@state":e}),failure:Drupal.t("We need your state.")})
}),n.registerValidationFunction("zipcode",function(e,t){return t(e.match(/^\d{5}(?:[-\s]\d{4})?$/)?{success:!0,message:Drupal.t("Almost done!")}:{success:!1,message:Drupal.t("We need your zip code.")})}),n.registerValidationFunction("why_signedup",function(e,t){return i(e,t,{success:Drupal.t("Thanks for caring!"),failure:Drupal.t("Oops! Can't leave this one blank.")})}),n.registerValidationFunction("ups_address",function(e,i){var a=t("<div class='messages error'><strong>"+Drupal.t("We couldn't find that address.")+"</strong>"+Drupal.t("Double check for typos and try submitting again.")+"</div>"),s=t("<div class='messages error'>"+Drupal.t("We're having trouble submitting the form, are you sure your internet connection is working? Email us if you continue having problems.")+"</div>"),r=e.find("select, input").serializeArray();e.find(".messages").slideUp(function(){t(this).remove()}),t.ajax({type:"POST",url:"/user/validate/address",dataType:"json",data:r,success:function(t){if(t.sorry)return e.append(a).hide().slideDown(),i({success:!1});var s=!1;for(var r in t)if(t.hasOwnProperty(r)&&"ambiguous"!==r){var o=t[r],l=e.find("[name='user_address["+r+"]']");"postal_code"===r&&l.val().slice(0,4)===o.slice(0,4)||o===l.val().toUpperCase()?l.val(o):(s=!0,n.showValidationMessage(l,{success:!1,suggestion:{full:o,domain:"zip"}}))}i(s?{success:!1}:{success:!0})},error:function(){e.append(s).hide().slideDown(),i({success:!1})}})}),n.registerValidationFunction("shirt_size",function(e,t){return i(e,t,{success:Drupal.t("It'll fit great!"),failure:Drupal.t("We need a shirt size!")})}),n.registerValidationFunction("shirt_style",function(e,n){var i=e.find("input[type='radio']:checked"),a=t("<div class='message error'>"+Drupal.t("We need a shirt style!")+"</div>");e.find(".message").remove(),1===i.length?n({success:!0}):(e.find("label:first").append(a),n({success:!1}))})}),define("validation/donate",["require","neue/validation"],function(e){function t(e){return/^\d+$/.test(e)}function n(e){return/^\d{3}$/.test(e)}function i(e){return/^(0?[1-9]|1[0-2])$/.test(e)}function a(e){return/^[1-9]\d{3,}$/.test(e)}function s(e,t,n,i){return t(""!==e?{success:!0,message:n}:{success:!1,message:i})}function r(e,n,i,a){return n(t(e)?{success:!0,message:i}:{success:!1,message:a})}function o(e,t,n,i){var a=null;for(var s in f){var r=f[s];r.numberPattern.test(e)&&(a=r)}return t(a?{success:!0,message:a.name+" "+n}:{success:!1,message:i})}function l(e,t,i,a){return t(n(e)?{success:!0,message:i}:{success:!1,message:a})}function c(e,t,n,a){return t(i(e)?{success:!0,message:n}:{success:!1,message:a})}function u(e,t,n,i){return t(a(e)?{success:!0,message:n}:{success:!1,message:i})}var d=e("neue/validation"),f={Visa:{name:"Visa",numberPattern:/^4[0-9]{12}(?:[0-9]{3})?$/},Mastercard:{name:"MasterCard",numberPattern:/^5[1-5][0-9]{14}$/},AmericanExpress:{name:"American Express",numberPattern:/^3[47][0-9]{13}$/},DinersClub:{name:"Diners Club",numberPattern:/^3(?:0[0-5]|[68][0-9])[0-9]{11}$/},Discover:{name:"Discover",numberPattern:/^6(?:011|5[0-9]{2})[0-9]{12}$/},JCB:{name:"JCB",numberPattern:/^(?:2131|1800|35\d{3})\d{11}$/}};d.registerValidationFunction("full_name",function(e,t){s(e,t,Drupal.t("Hey, @name!",{"@name":e}),Drupal.t("We need your full name."))}),d.registerValidationFunction("cc_num",function(e,t){o(e,t,Drupal.t("number looks good!"),Drupal.t("Invalid credit card number."))}),d.registerValidationFunction("cvv",function(e,t){l(e,t,Drupal.t("CVV looks good!"),Drupal.t("Invalid CVV."))}),d.registerValidationFunction("exp_month",function(e,t){c(e,t,Drupal.t("Good Month!"),Drupal.t("Invalid Month."))}),d.registerValidationFunction("exp_year",function(e,t){u(e,t,Drupal.t("Good Year!"),Drupal.t("Invalid Year."))}),d.registerValidationFunction("amount",function(e,t){r(e,t,Drupal.t("So Generous!"),Drupal.t("Invalid Amount."))})}),define("Analytics",["neue/events"],function(e){"undefined"!=typeof _gaq&&null!==_gaq&&(e.subscribe("Validation:InlineError",function(e,t){_gaq.push(["_trackEvent","Form","Inline Validation Error",t,null,!0])}),e.subscribe("Validation:Suggestion",function(e,t){_gaq.push(["_trackEvent","Form","Suggestion",t,null,!0])}),e.subscribe("Validation:SuggestionUsed",function(e,t){_gaq.push(["_trackEvent","Form","Suggestion Used",t,null,!0])}),e.subscribe("Validation:Submitted",function(e,t){_gaq.push(["_trackEvent","Form","Submitted",t,null,!1])}),e.subscribe("Validation:SubmitError",function(e,t){_gaq.push(["_trackEvent","Form","Validation Error on submit",t,null,!0])}),e.subscribe("Modal:Open",function(e,t){_gaq.push(["_trackEvent","Modal","Open","#"+t.attr("id"),null,!0])}),e.subscribe("Modal:Close",function(e,t){_gaq.push(["_trackEvent","Modal","Close","#"+t.attr("id"),null,!0])}))}),define("tiles",["require","jquery"],function(e){var t=e("jquery");t(".tile").find("img").unveil(200,function(){t(this).load(function(){this.style.opacity=1})})}),define("app",["require","jquery","finder/Finder","donate/Donate","revealer/Revealer","neue/main","campaign/SchoolFinder","campaign/sources","campaign/tips","campaign/tabs","campaign/ImageUploader","validation/auth","validation/reportback","validation/address","validation/donate","Analytics","tiles"],function(e){var t=e("jquery"),n=e("finder/Finder"),i=e("donate/Donate"),a=e("revealer/Revealer");e("neue/main"),e("campaign/SchoolFinder"),e("campaign/sources"),e("campaign/tips"),e("campaign/tabs"),e("campaign/ImageUploader"),e("validation/auth"),e("validation/reportback"),e("validation/address"),e("validation/donate"),e("Analytics"),e("tiles"),t(document).ready(function(){var e=t("body"),s=t(".js-finder-form");if(s.length){var r=t(".js-campaign-results"),o=t(".js-campaign-blankslate");n.init(s,r,o)}var l=t("#modal--donate-form");l.length&&i.init();var c=e.find(".gallery.-mosaic");if(e.hasClass("page-taxonomy")&&c.length>0){var u=[];c.each(function(e,n){var i=t(n),s=i.find("li");s.length>5&&(u[e]=new a(i,s,"gallery"))})}t("html").addClass("js-ready")})}),require(["app"]);
//# sourceMappingURL=app.js.map