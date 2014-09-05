/**
 * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */
var requirejs, require, define;

!function(undef) {
    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }
    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex, foundI, foundStarMap, starI, i, j, part, baseParts = baseName && baseName.split("/"), map = config.map, starMap = map && map["*"] || {};
        //Adjust any relative paths.
        if (name && "." === name.charAt(0)) //If have a base name, try to normalize against it,
        //otherwise, assume it is a top-level require that will
        //be relative to baseUrl in the end.
        if (baseName) {
            //start trimDots
            for (//Convert baseName to array, and lop off the last part,
            //so that . matches that "directory" and not name of the baseName's
            //module. For instance, baseName of "one/two/three", maps to
            //"one/two/three.js", but we want the directory, "one/two" for
            //this normalization.
            baseParts = baseParts.slice(0, baseParts.length - 1), name = name.split("/"), lastIndex = name.length - 1, 
            // Node .js allowance:
            config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex]) && (name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, "")), 
            name = baseParts.concat(name), i = 0; i < name.length; i += 1) if (part = name[i], 
            "." === part) name.splice(i, 1), i -= 1; else if (".." === part) {
                if (1 === i && (".." === name[2] || ".." === name[0])) //End of the line. Keep at least one non-dot
                //path segment at the front so it can be mapped
                //correctly to disk. Otherwise, there is likely
                //no path mapping for a path starting with '..'.
                //This can still fail, but catches the most reasonable
                //uses of ..
                break;
                i > 0 && (name.splice(i - 1, 2), i -= 2);
            }
            //end trimDots
            name = name.join("/");
        } else 0 === name.indexOf("./") && (// No baseName, so this is ID is resolved relative
        // to baseUrl, pull off the leading dot.
        name = name.substring(2));
        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            for (nameParts = name.split("/"), i = nameParts.length; i > 0; i -= 1) {
                if (nameSegment = nameParts.slice(0, i).join("/"), baseParts) //Find the longest baseName segment match in the config.
                //So, do joins on the biggest to smallest lengths of baseParts.
                for (j = baseParts.length; j > 0; j -= 1) //baseName segment has  config, find if it has one for
                //this name.
                if (mapValue = map[baseParts.slice(0, j).join("/")], mapValue && (mapValue = mapValue[nameSegment])) {
                    //Match, update name to the new value.
                    foundMap = mapValue, foundI = i;
                    break;
                }
                if (foundMap) break;
                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                !foundStarMap && starMap && starMap[nameSegment] && (foundStarMap = starMap[nameSegment], 
                starI = i);
            }
            !foundMap && foundStarMap && (foundMap = foundStarMap, foundI = starI), foundMap && (nameParts.splice(0, foundI, foundMap), 
            name = nameParts.join("/"));
        }
        return name;
    }
    function makeRequire(relName, forceSync) {
        return function() {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([ relName, forceSync ]));
        };
    }
    function makeNormalize(relName) {
        return function(name) {
            return normalize(name, relName);
        };
    }
    function makeLoad(depName) {
        return function(value) {
            defined[depName] = value;
        };
    }
    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name], defining[name] = !0, main.apply(undef, args);
        }
        if (!hasProp(defined, name) && !hasProp(defining, name)) throw new Error("No " + name);
        return defined[name];
    }
    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix, index = name ? name.indexOf("!") : -1;
        return index > -1 && (prefix = name.substring(0, index), name = name.substring(index + 1, name.length)), 
        [ prefix, name ];
    }
    function makeConfig(name) {
        return function() {
            return config && config.config && config.config[name] || {};
        };
    }
    var main, req, makeMap, handlers, defined = {}, waiting = {}, config = {}, defining = {}, hasOwn = Object.prototype.hasOwnProperty, aps = [].slice, jsSuffixRegExp = /\.js$/;
    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function(name, relName) {
        var plugin, parts = splitPrefix(name), prefix = parts[0];
        //Using ridiculous property names for space reasons
        //Normalize according
        return name = parts[1], prefix && (prefix = normalize(prefix, relName), plugin = callDep(prefix)), 
        prefix ? name = plugin && plugin.normalize ? plugin.normalize(name, makeNormalize(relName)) : normalize(name, relName) : (name = normalize(name, relName), 
        parts = splitPrefix(name), prefix = parts[0], name = parts[1], prefix && (plugin = callDep(prefix))), 
        {
            f: prefix ? prefix + "!" + name : name,
            //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    }, handlers = {
        require: function(name) {
            return makeRequire(name);
        },
        exports: function(name) {
            var e = defined[name];
            return "undefined" != typeof e ? e : defined[name] = {};
        },
        module: function(name) {
            return {
                id: name,
                uri: "",
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    }, main = function(name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i, usingExports, args = [], callbackType = typeof callback;
        //Call the callback to define the module, if necessary.
        if (//Use name if no relName
        relName = relName || name, "undefined" === callbackType || "function" === callbackType) {
            for (//Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? [ "require", "exports", "module" ] : deps, 
            i = 0; i < deps.length; i += 1) //Fast path CommonJS standard dependencies.
            if (map = makeMap(deps[i], relName), depName = map.f, "require" === depName) args[i] = handlers.require(name); else if ("exports" === depName) //CommonJS module spec 1.1
            args[i] = handlers.exports(name), usingExports = !0; else if ("module" === depName) //CommonJS module spec 1.1
            cjsModule = args[i] = handlers.module(name); else if (hasProp(defined, depName) || hasProp(waiting, depName) || hasProp(defining, depName)) args[i] = callDep(depName); else {
                if (!map.p) throw new Error(name + " missing " + depName);
                map.p.load(map.n, makeRequire(relName, !0), makeLoad(depName), {}), args[i] = defined[depName];
            }
            ret = callback ? callback.apply(defined[name], args) : void 0, name && (//If setting exports via "module" is in play,
            //favor that over return value and exports. After that,
            //favor a non-undefined return value over exports use.
            cjsModule && cjsModule.exports !== undef && cjsModule.exports !== defined[name] ? defined[name] = cjsModule.exports : ret === undef && usingExports || (//Use the return value from the function.
            defined[name] = ret));
        } else name && (//May just be an object definition for the module. Only
        //worry about defining if have a module name.
        defined[name] = callback);
    }, requirejs = require = req = function(deps, callback, relName, forceSync, alt) {
        if ("string" == typeof deps) return handlers[deps] ? handlers[deps](callback) : callDep(makeMap(deps, callback).f);
        if (!deps.splice) {
            if (//deps is a config object, not an array.
            config = deps, config.deps && req(config.deps, config.callback), !callback) return;
            callback.splice ? (//callback is an array, which means it is a dependency list.
            //Adjust args if there are dependencies
            deps = callback, callback = relName, relName = null) : deps = undef;
        }
        //Support require(['a'])
        //If relName is a function, it is an errback handler,
        //so remove it.
        //Simulate async callback;
        //Using a non-zero value because of concern for what old browsers
        //do, and latest browsers "upgrade" to 4 if lower value is used:
        //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
        //If want a value immediately, use require('id') instead -- something
        //that works in almond on the global level, but not guaranteed and
        //unlikely to work in other AMD implementations.
        return callback = callback || function() {}, "function" == typeof relName && (relName = forceSync, 
        forceSync = alt), forceSync ? main(undef, deps, callback, relName) : setTimeout(function() {
            main(undef, deps, callback, relName);
        }, 4), req;
    }, /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function(cfg) {
        return req(cfg);
    }, /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined, define = function(name, deps, callback) {
        //This module may not have dependencies
        deps.splice || (//deps is not an array, so probably means
        //an object literal or factory function for
        //the value. Adjust args.
        callback = deps, deps = []), hasProp(defined, name) || hasProp(waiting, name) || (waiting[name] = [ name, deps, callback ]);
    }, define.amd = {
        jQuery: !0
    };
}(), define("almond", function() {}), /*!
 * jQuery JavaScript Library v1.8.3
 * http://jquery.com/
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 *
 * Copyright 2012 jQuery Foundation and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: Tue Nov 13 2012 08:20:33 GMT-0500 (Eastern Standard Time)
 */
function(window, undefined) {
    // Convert String-formatted options into Object-formatted ones and store in cache
    function createOptions(options) {
        var object = optionsCache[options] = {};
        return jQuery.each(options.split(core_rspace), function(_, flag) {
            object[flag] = !0;
        }), object;
    }
    function dataAttr(elem, key, data) {
        // If nothing was found internally, try to fetch any
        // data from the HTML5 data-* attribute
        if (data === undefined && 1 === elem.nodeType) {
            var name = "data-" + key.replace(rmultiDash, "-$1").toLowerCase();
            if (data = elem.getAttribute(name), "string" == typeof data) {
                try {
                    data = "true" === data ? !0 : "false" === data ? !1 : "null" === data ? null : // Only convert to a number if it doesn't change the string
                    +data + "" === data ? +data : rbrace.test(data) ? jQuery.parseJSON(data) : data;
                } catch (e) {}
                // Make sure we set the data so it isn't changed later
                jQuery.data(elem, key, data);
            } else data = undefined;
        }
        return data;
    }
    // checks a cache object for emptiness
    function isEmptyDataObject(obj) {
        var name;
        for (name in obj) // if the public data object is empty, the private is still empty
        if (("data" !== name || !jQuery.isEmptyObject(obj[name])) && "toJSON" !== name) return !1;
        return !0;
    }
    function returnFalse() {
        return !1;
    }
    function returnTrue() {
        return !0;
    }
    // A painfully simple check to see if an element is disconnected
    // from a document (should be improved, where feasible).
    function isDisconnected(node) {
        return !node || !node.parentNode || 11 === node.parentNode.nodeType;
    }
    function sibling(cur, dir) {
        do cur = cur[dir]; while (cur && 1 !== cur.nodeType);
        return cur;
    }
    // Implement the identical functionality for filter and not
    function winnow(elements, qualifier, keep) {
        if (// Can't pass null or undefined to indexOf in Firefox 4
        // Set to 0 to skip string check
        qualifier = qualifier || 0, jQuery.isFunction(qualifier)) return jQuery.grep(elements, function(elem, i) {
            var retVal = !!qualifier.call(elem, i, elem);
            return retVal === keep;
        });
        if (qualifier.nodeType) return jQuery.grep(elements, function(elem) {
            return elem === qualifier === keep;
        });
        if ("string" == typeof qualifier) {
            var filtered = jQuery.grep(elements, function(elem) {
                return 1 === elem.nodeType;
            });
            if (isSimple.test(qualifier)) return jQuery.filter(qualifier, filtered, !keep);
            qualifier = jQuery.filter(qualifier, filtered);
        }
        return jQuery.grep(elements, function(elem) {
            return jQuery.inArray(elem, qualifier) >= 0 === keep;
        });
    }
    function createSafeFragment(document) {
        var list = nodeNames.split("|"), safeFrag = document.createDocumentFragment();
        if (safeFrag.createElement) for (;list.length; ) safeFrag.createElement(list.pop());
        return safeFrag;
    }
    function findOrAppend(elem, tag) {
        return elem.getElementsByTagName(tag)[0] || elem.appendChild(elem.ownerDocument.createElement(tag));
    }
    function cloneCopyEvent(src, dest) {
        if (1 === dest.nodeType && jQuery.hasData(src)) {
            var type, i, l, oldData = jQuery._data(src), curData = jQuery._data(dest, oldData), events = oldData.events;
            if (events) {
                delete curData.handle, curData.events = {};
                for (type in events) for (i = 0, l = events[type].length; l > i; i++) jQuery.event.add(dest, type, events[type][i]);
            }
            // make the cloned public data object a copy from the original
            curData.data && (curData.data = jQuery.extend({}, curData.data));
        }
    }
    function cloneFixAttributes(src, dest) {
        var nodeName;
        // We do not need to do anything for non-Elements
        1 === dest.nodeType && (// clearAttributes removes the attributes, which we don't want,
        // but also removes the attachEvent events, which we *do* want
        dest.clearAttributes && dest.clearAttributes(), // mergeAttributes, in contrast, only merges back on the
        // original attributes, not the events
        dest.mergeAttributes && dest.mergeAttributes(src), nodeName = dest.nodeName.toLowerCase(), 
        "object" === nodeName ? (// IE6-10 improperly clones children of object elements using classid.
        // IE10 throws NoModificationAllowedError if parent is null, #12132.
        dest.parentNode && (dest.outerHTML = src.outerHTML), // This path appears unavoidable for IE9. When cloning an object
        // element in IE9, the outerHTML strategy above is not sufficient.
        // If the src has innerHTML and the destination does not,
        // copy the src.innerHTML into the dest.innerHTML. #10324
        jQuery.support.html5Clone && src.innerHTML && !jQuery.trim(dest.innerHTML) && (dest.innerHTML = src.innerHTML)) : "input" === nodeName && rcheckableType.test(src.type) ? (// IE6-8 fails to persist the checked state of a cloned checkbox
        // or radio button. Worse, IE6-7 fail to give the cloned element
        // a checked appearance if the defaultChecked value isn't also set
        dest.defaultChecked = dest.checked = src.checked, // IE6-7 get confused and end up setting the value of a cloned
        // checkbox/radio button to an empty string instead of "on"
        dest.value !== src.value && (dest.value = src.value)) : "option" === nodeName ? dest.selected = src.defaultSelected : "input" === nodeName || "textarea" === nodeName ? dest.defaultValue = src.defaultValue : "script" === nodeName && dest.text !== src.text && (dest.text = src.text), 
        // Event data gets referenced instead of copied if the expando
        // gets copied too
        dest.removeAttribute(jQuery.expando));
    }
    function getAll(elem) {
        return "undefined" != typeof elem.getElementsByTagName ? elem.getElementsByTagName("*") : "undefined" != typeof elem.querySelectorAll ? elem.querySelectorAll("*") : [];
    }
    // Used in clean, fixes the defaultChecked property
    function fixDefaultChecked(elem) {
        rcheckableType.test(elem.type) && (elem.defaultChecked = elem.checked);
    }
    // return a css property mapped to a potentially vendor prefixed property
    function vendorPropName(style, name) {
        // shortcut for names that are not vendor prefixed
        if (name in style) return name;
        for (// check for vendor prefixed names
        var capName = name.charAt(0).toUpperCase() + name.slice(1), origName = name, i = cssPrefixes.length; i--; ) if (name = cssPrefixes[i] + capName, 
        name in style) return name;
        return origName;
    }
    function isHidden(elem, el) {
        return elem = el || elem, "none" === jQuery.css(elem, "display") || !jQuery.contains(elem.ownerDocument, elem);
    }
    function showHide(elements, show) {
        for (var elem, display, values = [], index = 0, length = elements.length; length > index; index++) elem = elements[index], 
        elem.style && (values[index] = jQuery._data(elem, "olddisplay"), show ? (// Reset the inline display of this element to learn if it is
        // being hidden by cascaded rules or not
        values[index] || "none" !== elem.style.display || (elem.style.display = ""), // Set elements which have been overridden with display: none
        // in a stylesheet to whatever the default browser style is
        // for such an element
        "" === elem.style.display && isHidden(elem) && (values[index] = jQuery._data(elem, "olddisplay", css_defaultDisplay(elem.nodeName)))) : (display = curCSS(elem, "display"), 
        values[index] || "none" === display || jQuery._data(elem, "olddisplay", display)));
        // Set the display of most of the elements in a second loop
        // to avoid the constant reflow
        for (index = 0; length > index; index++) elem = elements[index], elem.style && (show && "none" !== elem.style.display && "" !== elem.style.display || (elem.style.display = show ? values[index] || "" : "none"));
        return elements;
    }
    function setPositiveNumber(elem, value, subtract) {
        var matches = rnumsplit.exec(value);
        return matches ? Math.max(0, matches[1] - (subtract || 0)) + (matches[2] || "px") : value;
    }
    function augmentWidthOrHeight(elem, name, extra, isBorderBox) {
        for (var i = extra === (isBorderBox ? "border" : "content") ? // If we already have the right measurement, avoid augmentation
        4 : // Otherwise initialize for horizontal or vertical properties
        "width" === name ? 1 : 0, val = 0; 4 > i; i += 2) // both box models exclude margin, so add it if we want it
        "margin" === extra && (// we use jQuery.css instead of curCSS here
        // because of the reliableMarginRight CSS hook!
        val += jQuery.css(elem, extra + cssExpand[i], !0)), // From this point on we use curCSS for maximum performance (relevant in animations)
        isBorderBox ? (// border-box includes padding, so remove it if we want content
        "content" === extra && (val -= parseFloat(curCSS(elem, "padding" + cssExpand[i])) || 0), 
        // at this point, extra isn't border nor margin, so remove border
        "margin" !== extra && (val -= parseFloat(curCSS(elem, "border" + cssExpand[i] + "Width")) || 0)) : (// at this point, extra isn't content, so add padding
        val += parseFloat(curCSS(elem, "padding" + cssExpand[i])) || 0, // at this point, extra isn't content nor padding, so add border
        "padding" !== extra && (val += parseFloat(curCSS(elem, "border" + cssExpand[i] + "Width")) || 0));
        return val;
    }
    function getWidthOrHeight(elem, name, extra) {
        // Start with offset property, which is equivalent to the border-box value
        var val = "width" === name ? elem.offsetWidth : elem.offsetHeight, valueIsBorderBox = !0, isBorderBox = jQuery.support.boxSizing && "border-box" === jQuery.css(elem, "boxSizing");
        // some non-html elements return undefined for offsetWidth, so check for null/undefined
        // svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
        // MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
        if (0 >= val || null == val) {
            // Computed unit is not pixels. Stop here and return.
            if (// Fall back to computed then uncomputed css if necessary
            val = curCSS(elem, name), (0 > val || null == val) && (val = elem.style[name]), 
            rnumnonpx.test(val)) return val;
            // we need the check for style in case a browser which returns unreliable values
            // for getComputedStyle silently falls back to the reliable elem.style
            valueIsBorderBox = isBorderBox && (jQuery.support.boxSizingReliable || val === elem.style[name]), 
            // Normalize "", auto, and prepare for extra
            val = parseFloat(val) || 0;
        }
        // use the active box-sizing model to add/subtract irrelevant styles
        return val + augmentWidthOrHeight(elem, name, extra || (isBorderBox ? "border" : "content"), valueIsBorderBox) + "px";
    }
    // Try to determine the default display value of an element
    function css_defaultDisplay(nodeName) {
        if (elemdisplay[nodeName]) return elemdisplay[nodeName];
        var elem = jQuery("<" + nodeName + ">").appendTo(document.body), display = elem.css("display");
        // If the simple way fails,
        // get element's real default display by attaching it to a temp iframe
        // Use the already-created iframe if possible
        // Create a cacheable copy of the iframe document on first call.
        // IE and Opera will allow us to reuse the iframeDoc without re-writing the fake HTML
        // document to it; WebKit & Firefox won't allow reusing the iframe document.
        // Store the correct default display
        return elem.remove(), ("none" === display || "" === display) && (iframe = document.body.appendChild(iframe || jQuery.extend(document.createElement("iframe"), {
            frameBorder: 0,
            width: 0,
            height: 0
        })), iframeDoc && iframe.createElement || (iframeDoc = (iframe.contentWindow || iframe.contentDocument).document, 
        iframeDoc.write("<!doctype html><html><body>"), iframeDoc.close()), elem = iframeDoc.body.appendChild(iframeDoc.createElement(nodeName)), 
        display = curCSS(elem, "display"), document.body.removeChild(iframe)), elemdisplay[nodeName] = display, 
        display;
    }
    function buildParams(prefix, obj, traditional, add) {
        var name;
        if (jQuery.isArray(obj)) // Serialize array item.
        jQuery.each(obj, function(i, v) {
            traditional || rbracket.test(prefix) ? // Treat each array item as a scalar.
            add(prefix, v) : // If array item is non-scalar (array or object), encode its
            // numeric index to resolve deserialization ambiguity issues.
            // Note that rack (as of 1.0.0) can't currently deserialize
            // nested arrays properly, and attempting to do so may cause
            // a server error. Possible fixes are to modify rack's
            // deserialization algorithm or to provide an option or flag
            // to force array serialization to be shallow.
            buildParams(prefix + "[" + ("object" == typeof v ? i : "") + "]", v, traditional, add);
        }); else if (traditional || "object" !== jQuery.type(obj)) // Serialize scalar item.
        add(prefix, obj); else // Serialize object item.
        for (name in obj) buildParams(prefix + "[" + name + "]", obj[name], traditional, add);
    }
    // Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
    function addToPrefiltersOrTransports(structure) {
        // dataTypeExpression is optional and defaults to "*"
        return function(dataTypeExpression, func) {
            "string" != typeof dataTypeExpression && (func = dataTypeExpression, dataTypeExpression = "*");
            var dataType, list, placeBefore, dataTypes = dataTypeExpression.toLowerCase().split(core_rspace), i = 0, length = dataTypes.length;
            if (jQuery.isFunction(func)) // For each dataType in the dataTypeExpression
            for (;length > i; i++) dataType = dataTypes[i], // We control if we're asked to add before
            // any existing element
            placeBefore = /^\+/.test(dataType), placeBefore && (dataType = dataType.substr(1) || "*"), 
            list = structure[dataType] = structure[dataType] || [], // then we add to the structure accordingly
            list[placeBefore ? "unshift" : "push"](func);
        };
    }
    // Base inspection function for prefilters and transports
    function inspectPrefiltersOrTransports(structure, options, originalOptions, jqXHR, dataType, inspected) {
        dataType = dataType || options.dataTypes[0], inspected = inspected || {}, inspected[dataType] = !0;
        for (var selection, list = structure[dataType], i = 0, length = list ? list.length : 0, executeOnly = structure === prefilters; length > i && (executeOnly || !selection); i++) selection = list[i](options, originalOptions, jqXHR), 
        // If we got redirected to another dataType
        // we try there if executing only and not done already
        "string" == typeof selection && (!executeOnly || inspected[selection] ? selection = undefined : (options.dataTypes.unshift(selection), 
        selection = inspectPrefiltersOrTransports(structure, options, originalOptions, jqXHR, selection, inspected)));
        // unnecessary when only executing (prefilters)
        // but it'll be ignored by the caller in that case
        // If we're only executing or nothing was selected
        // we try the catchall dataType if not done already
        return !executeOnly && selection || inspected["*"] || (selection = inspectPrefiltersOrTransports(structure, options, originalOptions, jqXHR, "*", inspected)), 
        selection;
    }
    // A special extend for ajax options
    // that takes "flat" options (not to be deep extended)
    // Fixes #9887
    function ajaxExtend(target, src) {
        var key, deep, flatOptions = jQuery.ajaxSettings.flatOptions || {};
        for (key in src) src[key] !== undefined && ((flatOptions[key] ? target : deep || (deep = {}))[key] = src[key]);
        deep && jQuery.extend(!0, target, deep);
    }
    /* Handles responses to an ajax request:
 * - sets all responseXXX fields accordingly
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
    function ajaxHandleResponses(s, jqXHR, responses) {
        var ct, type, finalDataType, firstDataType, contents = s.contents, dataTypes = s.dataTypes, responseFields = s.responseFields;
        // Fill responseXXX fields
        for (type in responseFields) type in responses && (jqXHR[responseFields[type]] = responses[type]);
        // Remove auto dataType and get content-type in the process
        for (;"*" === dataTypes[0]; ) dataTypes.shift(), ct === undefined && (ct = s.mimeType || jqXHR.getResponseHeader("content-type"));
        // Check if we're dealing with a known content-type
        if (ct) for (type in contents) if (contents[type] && contents[type].test(ct)) {
            dataTypes.unshift(type);
            break;
        }
        // Check to see if we have a response for the expected dataType
        if (dataTypes[0] in responses) finalDataType = dataTypes[0]; else {
            // Try convertible dataTypes
            for (type in responses) {
                if (!dataTypes[0] || s.converters[type + " " + dataTypes[0]]) {
                    finalDataType = type;
                    break;
                }
                firstDataType || (firstDataType = type);
            }
            // Or just use first one
            finalDataType = finalDataType || firstDataType;
        }
        // If we found a dataType
        // We add the dataType to the list if needed
        // and return the corresponding response
        // If we found a dataType
        // We add the dataType to the list if needed
        // and return the corresponding response
        return finalDataType ? (finalDataType !== dataTypes[0] && dataTypes.unshift(finalDataType), 
        responses[finalDataType]) : void 0;
    }
    // Chain conversions given the request and the original response
    function ajaxConvert(s, response) {
        var conv, conv2, current, tmp, // Work with a copy of dataTypes in case we need to modify it for conversion
        dataTypes = s.dataTypes.slice(), prev = dataTypes[0], converters = {}, i = 0;
        // Create converters map with lowercased keys
        if (// Apply the dataFilter if provided
        s.dataFilter && (response = s.dataFilter(response, s.dataType)), dataTypes[1]) for (conv in s.converters) converters[conv.toLowerCase()] = s.converters[conv];
        // Convert to each sequential dataType, tolerating list modification
        for (;current = dataTypes[++i]; ) // There's only work to do if current dataType is non-auto
        if ("*" !== current) {
            // Convert response if prev dataType is non-auto and differs from current
            if ("*" !== prev && prev !== current) {
                // If none found, seek a pair
                if (// Seek a direct converter
                conv = converters[prev + " " + current] || converters["* " + current], !conv) for (conv2 in converters) if (// If conv2 outputs current
                tmp = conv2.split(" "), tmp[1] === current && (// If prev can be converted to accepted input
                conv = converters[prev + " " + tmp[0]] || converters["* " + tmp[0]])) {
                    // Condense equivalence converters
                    conv === !0 ? conv = converters[conv2] : converters[conv2] !== !0 && (current = tmp[0], 
                    dataTypes.splice(i--, 0, current));
                    break;
                }
                // Apply converter (if not an equivalence)
                if (conv !== !0) // Unless errors are allowed to bubble, catch and return them
                if (conv && s["throws"]) response = conv(response); else try {
                    response = conv(response);
                } catch (e) {
                    return {
                        state: "parsererror",
                        error: conv ? e : "No conversion from " + prev + " to " + current
                    };
                }
            }
            // Update prev for next iteration
            prev = current;
        }
        return {
            state: "success",
            data: response
        };
    }
    // Functions to create xhrs
    function createStandardXHR() {
        try {
            return new window.XMLHttpRequest();
        } catch (e) {}
    }
    function createActiveXHR() {
        try {
            return new window.ActiveXObject("Microsoft.XMLHTTP");
        } catch (e) {}
    }
    // Animations created synchronously will run synchronously
    function createFxNow() {
        return setTimeout(function() {
            fxNow = undefined;
        }, 0), fxNow = jQuery.now();
    }
    function createTweens(animation, props) {
        jQuery.each(props, function(prop, value) {
            for (var collection = (tweeners[prop] || []).concat(tweeners["*"]), index = 0, length = collection.length; length > index; index++) if (collection[index].call(animation, prop, value)) // we're done with this property
            return;
        });
    }
    function Animation(elem, properties, options) {
        var result, index = 0, length = animationPrefilters.length, deferred = jQuery.Deferred().always(function() {
            // don't match elem in the :animated selector
            delete tick.elem;
        }), tick = function() {
            for (var currentTime = fxNow || createFxNow(), remaining = Math.max(0, animation.startTime + animation.duration - currentTime), // archaic crash bug won't allow us to use 1 - ( 0.5 || 0 ) (#12497)
            temp = remaining / animation.duration || 0, percent = 1 - temp, index = 0, length = animation.tweens.length; length > index; index++) animation.tweens[index].run(percent);
            return deferred.notifyWith(elem, [ animation, percent, remaining ]), 1 > percent && length ? remaining : (deferred.resolveWith(elem, [ animation ]), 
            !1);
        }, animation = deferred.promise({
            elem: elem,
            props: jQuery.extend({}, properties),
            opts: jQuery.extend(!0, {
                specialEasing: {}
            }, options),
            originalProperties: properties,
            originalOptions: options,
            startTime: fxNow || createFxNow(),
            duration: options.duration,
            tweens: [],
            createTween: function(prop, end) {
                var tween = jQuery.Tween(elem, animation.opts, prop, end, animation.opts.specialEasing[prop] || animation.opts.easing);
                return animation.tweens.push(tween), tween;
            },
            stop: function(gotoEnd) {
                for (var index = 0, // if we are going to the end, we want to run all the tweens
                // otherwise we skip this part
                length = gotoEnd ? animation.tweens.length : 0; length > index; index++) animation.tweens[index].run(1);
                // resolve when we played the last frame
                // otherwise, reject
                return gotoEnd ? deferred.resolveWith(elem, [ animation, gotoEnd ]) : deferred.rejectWith(elem, [ animation, gotoEnd ]), 
                this;
            }
        }), props = animation.props;
        for (propFilter(props, animation.opts.specialEasing); length > index; index++) if (result = animationPrefilters[index].call(animation, elem, props, animation.opts)) return result;
        // attach callbacks from options
        return createTweens(animation, props), jQuery.isFunction(animation.opts.start) && animation.opts.start.call(elem, animation), 
        jQuery.fx.timer(jQuery.extend(tick, {
            anim: animation,
            queue: animation.opts.queue,
            elem: elem
        })), animation.progress(animation.opts.progress).done(animation.opts.done, animation.opts.complete).fail(animation.opts.fail).always(animation.opts.always);
    }
    function propFilter(props, specialEasing) {
        var index, name, easing, value, hooks;
        // camelCase, specialEasing and expand cssHook pass
        for (index in props) if (name = jQuery.camelCase(index), easing = specialEasing[name], 
        value = props[index], jQuery.isArray(value) && (easing = value[1], value = props[index] = value[0]), 
        index !== name && (props[name] = value, delete props[index]), hooks = jQuery.cssHooks[name], 
        hooks && "expand" in hooks) {
            value = hooks.expand(value), delete props[name];
            // not quite $.extend, this wont overwrite keys already present.
            // also - reusing 'index' from above because we have the correct "name"
            for (index in value) index in props || (props[index] = value[index], specialEasing[index] = easing);
        } else specialEasing[name] = easing;
    }
    function defaultPrefilter(elem, props, opts) {
        var index, prop, value, length, dataShow, toggle, tween, hooks, oldfire, anim = this, style = elem.style, orig = {}, handled = [], hidden = elem.nodeType && isHidden(elem);
        // handle queue: false promises
        opts.queue || (hooks = jQuery._queueHooks(elem, "fx"), null == hooks.unqueued && (hooks.unqueued = 0, 
        oldfire = hooks.empty.fire, hooks.empty.fire = function() {
            hooks.unqueued || oldfire();
        }), hooks.unqueued++, anim.always(function() {
            // doing this makes sure that the complete handler will be called
            // before this completes
            anim.always(function() {
                hooks.unqueued--, jQuery.queue(elem, "fx").length || hooks.empty.fire();
            });
        })), // height/width overflow pass
        1 === elem.nodeType && ("height" in props || "width" in props) && (// Make sure that nothing sneaks out
        // Record all 3 overflow attributes because IE does not
        // change the overflow attribute when overflowX and
        // overflowY are set to the same value
        opts.overflow = [ style.overflow, style.overflowX, style.overflowY ], // Set display property to inline-block for height/width
        // animations on inline elements that are having width/height animated
        "inline" === jQuery.css(elem, "display") && "none" === jQuery.css(elem, "float") && (// inline-level elements accept inline-block;
        // block-level elements need to be inline with layout
        jQuery.support.inlineBlockNeedsLayout && "inline" !== css_defaultDisplay(elem.nodeName) ? style.zoom = 1 : style.display = "inline-block")), 
        opts.overflow && (style.overflow = "hidden", jQuery.support.shrinkWrapBlocks || anim.done(function() {
            style.overflow = opts.overflow[0], style.overflowX = opts.overflow[1], style.overflowY = opts.overflow[2];
        }));
        // show/hide pass
        for (index in props) if (value = props[index], rfxtypes.exec(value)) {
            if (delete props[index], toggle = toggle || "toggle" === value, value === (hidden ? "hide" : "show")) continue;
            handled.push(index);
        }
        if (length = handled.length) {
            dataShow = jQuery._data(elem, "fxshow") || jQuery._data(elem, "fxshow", {}), "hidden" in dataShow && (hidden = dataShow.hidden), 
            // store state if its toggle - enables .stop().toggle() to "reverse"
            toggle && (dataShow.hidden = !hidden), hidden ? jQuery(elem).show() : anim.done(function() {
                jQuery(elem).hide();
            }), anim.done(function() {
                var prop;
                jQuery.removeData(elem, "fxshow", !0);
                for (prop in orig) jQuery.style(elem, prop, orig[prop]);
            });
            for (index = 0; length > index; index++) prop = handled[index], tween = anim.createTween(prop, hidden ? dataShow[prop] : 0), 
            orig[prop] = dataShow[prop] || jQuery.style(elem, prop), prop in dataShow || (dataShow[prop] = tween.start, 
            hidden && (tween.end = tween.start, tween.start = "width" === prop || "height" === prop ? 1 : 0));
        }
    }
    function Tween(elem, options, prop, end, easing) {
        return new Tween.prototype.init(elem, options, prop, end, easing);
    }
    // Generate parameters to create a standard animation
    function genFx(type, includeWidth) {
        var which, attrs = {
            height: type
        }, i = 0;
        for (// if we include width, step value is 1 to do all cssExpand values,
        // if we don't include width, step value is 2 to skip over Left and Right
        includeWidth = includeWidth ? 1 : 0; 4 > i; i += 2 - includeWidth) which = cssExpand[i], 
        attrs["margin" + which] = attrs["padding" + which] = type;
        return includeWidth && (attrs.opacity = attrs.width = type), attrs;
    }
    function getWindow(elem) {
        return jQuery.isWindow(elem) ? elem : 9 === elem.nodeType ? elem.defaultView || elem.parentWindow : !1;
    }
    var // A central reference to the root jQuery(document)
    rootjQuery, // The deferred used on DOM ready
    readyList, // Use the correct document accordingly with window argument (sandbox)
    document = window.document, location = window.location, navigator = window.navigator, // Map over jQuery in case of overwrite
    _jQuery = window.jQuery, // Map over the $ in case of overwrite
    _$ = window.$, // Save a reference to some core methods
    core_push = Array.prototype.push, core_slice = Array.prototype.slice, core_indexOf = Array.prototype.indexOf, core_toString = Object.prototype.toString, core_hasOwn = Object.prototype.hasOwnProperty, core_trim = String.prototype.trim, // Define a local copy of jQuery
    jQuery = function(selector, context) {
        // The jQuery object is actually just the init constructor 'enhanced'
        return new jQuery.fn.init(selector, context, rootjQuery);
    }, // Used for matching numbers
    core_pnum = /[\-+]?(?:\d*\.|)\d+(?:[eE][\-+]?\d+|)/.source, // Used for detecting and trimming whitespace
    core_rnotwhite = /\S/, core_rspace = /\s+/, // Make sure we trim BOM and NBSP (here's looking at you, Safari 5.0 and IE)
    rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, // A simple way to check for HTML strings
    // Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
    rquickExpr = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/, // Match a standalone tag
    rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/, // JSON RegExp
    rvalidchars = /^[\],:{}\s]*$/, rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g, rvalidescape = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g, rvalidtokens = /"[^"\\\r\n]*"|true|false|null|-?(?:\d\d*\.|)\d+(?:[eE][\-+]?\d+|)/g, // Matches dashed string for camelizing
    rmsPrefix = /^-ms-/, rdashAlpha = /-([\da-z])/gi, // Used by jQuery.camelCase as callback to replace()
    fcamelCase = function(all, letter) {
        return (letter + "").toUpperCase();
    }, // The ready event handler and self cleanup method
    DOMContentLoaded = function() {
        document.addEventListener ? (document.removeEventListener("DOMContentLoaded", DOMContentLoaded, !1), 
        jQuery.ready()) : "complete" === document.readyState && (// we're here because readyState === "complete" in oldIE
        // which is good enough for us to call the dom ready!
        document.detachEvent("onreadystatechange", DOMContentLoaded), jQuery.ready());
    }, // [[Class]] -> type pairs
    class2type = {};
    jQuery.fn = jQuery.prototype = {
        constructor: jQuery,
        init: function(selector, context, rootjQuery) {
            var match, elem, doc;
            // Handle $(""), $(null), $(undefined), $(false)
            if (!selector) return this;
            // Handle $(DOMElement)
            if (selector.nodeType) return this.context = this[0] = selector, this.length = 1, 
            this;
            // Handle HTML strings
            if ("string" == typeof selector) {
                // Match html or make sure no context is specified for #id
                if (// Assume that strings that start and end with <> are HTML and skip the regex check
                match = "<" === selector.charAt(0) && ">" === selector.charAt(selector.length - 1) && selector.length >= 3 ? [ null, selector, null ] : rquickExpr.exec(selector), 
                !match || !match[1] && context) return !context || context.jquery ? (context || rootjQuery).find(selector) : this.constructor(context).find(selector);
                // HANDLE: $(html) -> $(array)
                if (match[1]) // scripts is true for back-compat
                return context = context instanceof jQuery ? context[0] : context, doc = context && context.nodeType ? context.ownerDocument || context : document, 
                selector = jQuery.parseHTML(match[1], doc, !0), rsingleTag.test(match[1]) && jQuery.isPlainObject(context) && this.attr.call(selector, context, !0), 
                jQuery.merge(this, selector);
                // Check parentNode to catch when Blackberry 4.6 returns
                // nodes that are no longer in the document #6963
                if (elem = document.getElementById(match[2]), elem && elem.parentNode) {
                    // Handle the case where IE and Opera return items
                    // by name instead of ID
                    if (elem.id !== match[2]) return rootjQuery.find(selector);
                    // Otherwise, we inject the element directly into the jQuery object
                    this.length = 1, this[0] = elem;
                }
                return this.context = document, this.selector = selector, this;
            }
            return jQuery.isFunction(selector) ? rootjQuery.ready(selector) : (selector.selector !== undefined && (this.selector = selector.selector, 
            this.context = selector.context), jQuery.makeArray(selector, this));
        },
        // Start with an empty selector
        selector: "",
        // The current version of jQuery being used
        jquery: "1.8.3",
        // The default length of a jQuery object is 0
        length: 0,
        // The number of elements contained in the matched element set
        size: function() {
            return this.length;
        },
        toArray: function() {
            return core_slice.call(this);
        },
        // Get the Nth element in the matched element set OR
        // Get the whole matched element set as a clean array
        get: function(num) {
            // Return a 'clean' array
            // Return just the object
            return null == num ? this.toArray() : 0 > num ? this[this.length + num] : this[num];
        },
        // Take an array of elements and push it onto the stack
        // (returning the new matched element set)
        pushStack: function(elems, name, selector) {
            // Build a new jQuery matched element set
            var ret = jQuery.merge(this.constructor(), elems);
            // Return the newly-formed element set
            // Add the old object onto the stack (as a reference)
            return ret.prevObject = this, ret.context = this.context, "find" === name ? ret.selector = this.selector + (this.selector ? " " : "") + selector : name && (ret.selector = this.selector + "." + name + "(" + selector + ")"), 
            ret;
        },
        // Execute a callback for every element in the matched set.
        // (You can seed the arguments with an array of args, but this is
        // only used internally.)
        each: function(callback, args) {
            return jQuery.each(this, callback, args);
        },
        ready: function(fn) {
            // Add the callback
            return jQuery.ready.promise().done(fn), this;
        },
        eq: function(i) {
            return i = +i, -1 === i ? this.slice(i) : this.slice(i, i + 1);
        },
        first: function() {
            return this.eq(0);
        },
        last: function() {
            return this.eq(-1);
        },
        slice: function() {
            return this.pushStack(core_slice.apply(this, arguments), "slice", core_slice.call(arguments).join(","));
        },
        map: function(callback) {
            return this.pushStack(jQuery.map(this, function(elem, i) {
                return callback.call(elem, i, elem);
            }));
        },
        end: function() {
            return this.prevObject || this.constructor(null);
        },
        // For internal use only.
        // Behaves like an Array's method, not like a jQuery method.
        push: core_push,
        sort: [].sort,
        splice: [].splice
    }, // Give the init function the jQuery prototype for later instantiation
    jQuery.fn.init.prototype = jQuery.fn, jQuery.extend = jQuery.fn.extend = function() {
        var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {}, i = 1, length = arguments.length, deep = !1;
        for (// Handle a deep copy situation
        "boolean" == typeof target && (deep = target, target = arguments[1] || {}, // skip the boolean and the target
        i = 2), // Handle case when target is a string or something (possible in deep copy)
        "object" == typeof target || jQuery.isFunction(target) || (target = {}), // extend jQuery itself if only one argument is passed
        length === i && (target = this, --i); length > i; i++) // Only deal with non-null/undefined values
        if (null != (options = arguments[i])) // Extend the base object
        for (name in options) src = target[name], copy = options[name], // Prevent never-ending loop
        target !== copy && (// Recurse if we're merging plain objects or arrays
        deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy))) ? (copyIsArray ? (copyIsArray = !1, 
        clone = src && jQuery.isArray(src) ? src : []) : clone = src && jQuery.isPlainObject(src) ? src : {}, 
        // Never move original objects, clone them
        target[name] = jQuery.extend(deep, clone, copy)) : copy !== undefined && (target[name] = copy));
        // Return the modified object
        return target;
    }, jQuery.extend({
        noConflict: function(deep) {
            return window.$ === jQuery && (window.$ = _$), deep && window.jQuery === jQuery && (window.jQuery = _jQuery), 
            jQuery;
        },
        // Is the DOM ready to be used? Set to true once it occurs.
        isReady: !1,
        // A counter to track how many items to wait for before
        // the ready event fires. See #6781
        readyWait: 1,
        // Hold (or release) the ready event
        holdReady: function(hold) {
            hold ? jQuery.readyWait++ : jQuery.ready(!0);
        },
        // Handle when the DOM is ready
        ready: function(wait) {
            // Abort if there are pending holds or we're already ready
            if (wait === !0 ? !--jQuery.readyWait : !jQuery.isReady) {
                // Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
                if (!document.body) return setTimeout(jQuery.ready, 1);
                // Remember that the DOM is ready
                jQuery.isReady = !0, // If a normal DOM Ready event fired, decrement, and wait if need be
                wait !== !0 && --jQuery.readyWait > 0 || (// If there are functions bound, to execute
                readyList.resolveWith(document, [ jQuery ]), // Trigger any bound ready events
                jQuery.fn.trigger && jQuery(document).trigger("ready").off("ready"));
            }
        },
        // See test/unit/core.js for details concerning isFunction.
        // Since version 1.3, DOM methods and functions like alert
        // aren't supported. They return false on IE (#2968).
        isFunction: function(obj) {
            return "function" === jQuery.type(obj);
        },
        isArray: Array.isArray || function(obj) {
            return "array" === jQuery.type(obj);
        },
        isWindow: function(obj) {
            return null != obj && obj == obj.window;
        },
        isNumeric: function(obj) {
            return !isNaN(parseFloat(obj)) && isFinite(obj);
        },
        type: function(obj) {
            return null == obj ? String(obj) : class2type[core_toString.call(obj)] || "object";
        },
        isPlainObject: function(obj) {
            // Must be an Object.
            // Because of IE, we also have to check the presence of the constructor property.
            // Make sure that DOM nodes and window objects don't pass through, as well
            if (!obj || "object" !== jQuery.type(obj) || obj.nodeType || jQuery.isWindow(obj)) return !1;
            try {
                // Not own constructor property must be Object
                if (obj.constructor && !core_hasOwn.call(obj, "constructor") && !core_hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) return !1;
            } catch (e) {
                // IE8,9 Will throw exceptions on certain host objects #9897
                return !1;
            }
            // Own properties are enumerated firstly, so to speed up,
            // if last one is own, then all properties are own.
            var key;
            for (key in obj) ;
            return key === undefined || core_hasOwn.call(obj, key);
        },
        isEmptyObject: function(obj) {
            var name;
            for (name in obj) return !1;
            return !0;
        },
        error: function(msg) {
            throw new Error(msg);
        },
        // data: string of html
        // context (optional): If specified, the fragment will be created in this context, defaults to document
        // scripts (optional): If true, will include scripts passed in the html string
        parseHTML: function(data, context, scripts) {
            var parsed;
            // Single tag
            return data && "string" == typeof data ? ("boolean" == typeof context && (scripts = context, 
            context = 0), context = context || document, (parsed = rsingleTag.exec(data)) ? [ context.createElement(parsed[1]) ] : (parsed = jQuery.buildFragment([ data ], context, scripts ? null : []), 
            jQuery.merge([], (parsed.cacheable ? jQuery.clone(parsed.fragment) : parsed.fragment).childNodes))) : null;
        },
        parseJSON: function(data) {
            // Make sure leading/trailing whitespace is removed (IE can't handle it)
            // Attempt to parse using the native JSON parser first
            // Make sure the incoming data is actual JSON
            // Logic borrowed from http://json.org/json2.js
            return data && "string" == typeof data ? (data = jQuery.trim(data), window.JSON && window.JSON.parse ? window.JSON.parse(data) : rvalidchars.test(data.replace(rvalidescape, "@").replace(rvalidtokens, "]").replace(rvalidbraces, "")) ? new Function("return " + data)() : void jQuery.error("Invalid JSON: " + data)) : null;
        },
        // Cross-browser xml parsing
        parseXML: function(data) {
            var xml, tmp;
            if (!data || "string" != typeof data) return null;
            try {
                window.DOMParser ? (// Standard
                tmp = new DOMParser(), xml = tmp.parseFromString(data, "text/xml")) : (// IE
                xml = new ActiveXObject("Microsoft.XMLDOM"), xml.async = "false", xml.loadXML(data));
            } catch (e) {
                xml = undefined;
            }
            return xml && xml.documentElement && !xml.getElementsByTagName("parsererror").length || jQuery.error("Invalid XML: " + data), 
            xml;
        },
        noop: function() {},
        // Evaluates a script in a global context
        // Workarounds based on findings by Jim Driscoll
        // http://weblogs.java.net/blog/driscoll/archive/2009/09/08/eval-javascript-global-context
        globalEval: function(data) {
            data && core_rnotwhite.test(data) && // We use execScript on Internet Explorer
            // We use an anonymous function so that context is window
            // rather than jQuery in Firefox
            (window.execScript || function(data) {
                window.eval.call(window, data);
            })(data);
        },
        // Convert dashed to camelCase; used by the css and data modules
        // Microsoft forgot to hump their vendor prefix (#9572)
        camelCase: function(string) {
            return string.replace(rmsPrefix, "ms-").replace(rdashAlpha, fcamelCase);
        },
        nodeName: function(elem, name) {
            return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
        },
        // args is for internal usage only
        each: function(obj, callback, args) {
            var name, i = 0, length = obj.length, isObj = length === undefined || jQuery.isFunction(obj);
            if (args) if (isObj) {
                for (name in obj) if (callback.apply(obj[name], args) === !1) break;
            } else for (;length > i && callback.apply(obj[i++], args) !== !1; ) ; else if (isObj) {
                for (name in obj) if (callback.call(obj[name], name, obj[name]) === !1) break;
            } else for (;length > i && callback.call(obj[i], i, obj[i++]) !== !1; ) ;
            return obj;
        },
        // Use native String.trim function wherever possible
        trim: core_trim && !core_trim.call("﻿ ") ? function(text) {
            return null == text ? "" : core_trim.call(text);
        } : // Otherwise use our own trimming functionality
        function(text) {
            return null == text ? "" : (text + "").replace(rtrim, "");
        },
        // results is for internal usage only
        makeArray: function(arr, results) {
            var type, ret = results || [];
            // The window, strings (and functions) also have 'length'
            // Tweaked logic slightly to handle Blackberry 4.7 RegExp issues #6930
            return null != arr && (type = jQuery.type(arr), null == arr.length || "string" === type || "function" === type || "regexp" === type || jQuery.isWindow(arr) ? core_push.call(ret, arr) : jQuery.merge(ret, arr)), 
            ret;
        },
        inArray: function(elem, arr, i) {
            var len;
            if (arr) {
                if (core_indexOf) return core_indexOf.call(arr, elem, i);
                for (len = arr.length, i = i ? 0 > i ? Math.max(0, len + i) : i : 0; len > i; i++) // Skip accessing in sparse arrays
                if (i in arr && arr[i] === elem) return i;
            }
            return -1;
        },
        merge: function(first, second) {
            var l = second.length, i = first.length, j = 0;
            if ("number" == typeof l) for (;l > j; j++) first[i++] = second[j]; else for (;second[j] !== undefined; ) first[i++] = second[j++];
            return first.length = i, first;
        },
        grep: function(elems, callback, inv) {
            var retVal, ret = [], i = 0, length = elems.length;
            // Go through the array, only saving the items
            // that pass the validator function
            for (inv = !!inv; length > i; i++) retVal = !!callback(elems[i], i), inv !== retVal && ret.push(elems[i]);
            return ret;
        },
        // arg is for internal usage only
        map: function(elems, callback, arg) {
            var value, key, ret = [], i = 0, length = elems.length, // jquery objects are treated as arrays
            isArray = elems instanceof jQuery || length !== undefined && "number" == typeof length && (length > 0 && elems[0] && elems[length - 1] || 0 === length || jQuery.isArray(elems));
            // Go through the array, translating each of the items to their
            if (isArray) for (;length > i; i++) value = callback(elems[i], i, arg), null != value && (ret[ret.length] = value); else for (key in elems) value = callback(elems[key], key, arg), 
            null != value && (ret[ret.length] = value);
            // Flatten any nested arrays
            return ret.concat.apply([], ret);
        },
        // A global GUID counter for objects
        guid: 1,
        // Bind a function to a context, optionally partially applying any
        // arguments.
        proxy: function(fn, context) {
            var tmp, args, proxy;
            // Quick check to determine if target is callable, in the spec
            // this throws a TypeError, but we will just return undefined.
            // Quick check to determine if target is callable, in the spec
            // this throws a TypeError, but we will just return undefined.
            // Simulated bind
            // Set the guid of unique handler to the same of original handler, so it can be removed
            return "string" == typeof context && (tmp = fn[context], context = fn, fn = tmp), 
            jQuery.isFunction(fn) ? (args = core_slice.call(arguments, 2), proxy = function() {
                return fn.apply(context, args.concat(core_slice.call(arguments)));
            }, proxy.guid = fn.guid = fn.guid || jQuery.guid++, proxy) : undefined;
        },
        // Multifunctional method to get and set values of a collection
        // The value/s can optionally be executed if it's a function
        access: function(elems, fn, key, value, chainable, emptyGet, pass) {
            var exec, bulk = null == key, i = 0, length = elems.length;
            // Sets many values
            if (key && "object" == typeof key) {
                for (i in key) jQuery.access(elems, fn, i, key[i], 1, emptyGet, value);
                chainable = 1;
            } else if (value !== undefined) {
                if (// Optionally, function values get executed if exec is true
                exec = pass === undefined && jQuery.isFunction(value), bulk && (// Bulk operations only iterate when executing function values
                exec ? (exec = fn, fn = function(elem, key, value) {
                    return exec.call(jQuery(elem), value);
                }) : (fn.call(elems, value), fn = null)), fn) for (;length > i; i++) fn(elems[i], key, exec ? value.call(elems[i], i, fn(elems[i], key)) : value, pass);
                chainable = 1;
            }
            // Gets
            return chainable ? elems : bulk ? fn.call(elems) : length ? fn(elems[0], key) : emptyGet;
        },
        now: function() {
            return new Date().getTime();
        }
    }), jQuery.ready.promise = function(obj) {
        if (!readyList) // Catch cases where $(document).ready() is called after the browser event has already occurred.
        // we once tried to use readyState "interactive" here, but it caused issues like the one
        // discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15
        if (readyList = jQuery.Deferred(), "complete" === document.readyState) // Handle it asynchronously to allow scripts the opportunity to delay ready
        setTimeout(jQuery.ready, 1); else if (document.addEventListener) // Use the handy event callback
        document.addEventListener("DOMContentLoaded", DOMContentLoaded, !1), // A fallback to window.onload, that will always work
        window.addEventListener("load", jQuery.ready, !1); else {
            // Ensure firing before onload, maybe late but safe also for iframes
            document.attachEvent("onreadystatechange", DOMContentLoaded), // A fallback to window.onload, that will always work
            window.attachEvent("onload", jQuery.ready);
            // If IE and not a frame
            // continually check to see if the document is ready
            var top = !1;
            try {
                top = null == window.frameElement && document.documentElement;
            } catch (e) {}
            top && top.doScroll && !function doScrollCheck() {
                if (!jQuery.isReady) {
                    try {
                        // Use the trick by Diego Perini
                        // http://javascript.nwbox.com/IEContentLoaded/
                        top.doScroll("left");
                    } catch (e) {
                        return setTimeout(doScrollCheck, 50);
                    }
                    // and execute any waiting functions
                    jQuery.ready();
                }
            }();
        }
        return readyList.promise(obj);
    }, // Populate the class2type map
    jQuery.each("Boolean Number String Function Array Date RegExp Object".split(" "), function(i, name) {
        class2type["[object " + name + "]"] = name.toLowerCase();
    }), // All jQuery objects should point back to these
    rootjQuery = jQuery(document);
    // String to Object options format cache
    var optionsCache = {};
    /*
 * Create a callback list using the following parameters:
 *
 *      options: an optional list of space-separated options that will change how
 *                      the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *      once:                   will ensure the callback list can only be fired once (like a Deferred)
 *
 *      memory:                 will keep track of previous values and will call any callback added
 *                                      after the list has been fired right away with the latest "memorized"
 *                                      values (like a Deferred)
 *
 *      unique:                 will ensure a callback can only be added once (no duplicate in the list)
 *
 *      stopOnFalse:    interrupt callings when a callback returns false
 *
 */
    jQuery.Callbacks = function(options) {
        // Convert options from String-formatted to Object-formatted if needed
        // (we check in cache first)
        options = "string" == typeof options ? optionsCache[options] || createOptions(options) : jQuery.extend({}, options);
        var // Last fire value (for non-forgettable lists)
        memory, // Flag to know if list was already fired
        fired, // Flag to know if list is currently firing
        firing, // First callback to fire (used internally by add and fireWith)
        firingStart, // End of the loop when firing
        firingLength, // Index of currently firing callback (modified by remove if needed)
        firingIndex, // Actual callback list
        list = [], // Stack of fire calls for repeatable lists
        stack = !options.once && [], // Fire callbacks
        fire = function(data) {
            for (memory = options.memory && data, fired = !0, firingIndex = firingStart || 0, 
            firingStart = 0, firingLength = list.length, firing = !0; list && firingLength > firingIndex; firingIndex++) if (list[firingIndex].apply(data[0], data[1]) === !1 && options.stopOnFalse) {
                memory = !1;
                // To prevent further calls using add
                break;
            }
            firing = !1, list && (stack ? stack.length && fire(stack.shift()) : memory ? list = [] : self.disable());
        }, // Actual Callbacks object
        self = {
            // Add a callback or a collection of callbacks to the list
            add: function() {
                if (list) {
                    // First, we save the current length
                    var start = list.length;
                    !function add(args) {
                        jQuery.each(args, function(_, arg) {
                            var type = jQuery.type(arg);
                            "function" === type ? options.unique && self.has(arg) || list.push(arg) : arg && arg.length && "string" !== type && // Inspect recursively
                            add(arg);
                        });
                    }(arguments), // Do we need to add the callbacks to the
                    // current firing batch?
                    firing ? firingLength = list.length : memory && (firingStart = start, fire(memory));
                }
                return this;
            },
            // Remove a callback from the list
            remove: function() {
                return list && jQuery.each(arguments, function(_, arg) {
                    for (var index; (index = jQuery.inArray(arg, list, index)) > -1; ) list.splice(index, 1), 
                    // Handle firing indexes
                    firing && (firingLength >= index && firingLength--, firingIndex >= index && firingIndex--);
                }), this;
            },
            // Control if a given callback is in the list
            has: function(fn) {
                return jQuery.inArray(fn, list) > -1;
            },
            // Remove all callbacks from the list
            empty: function() {
                return list = [], this;
            },
            // Have the list do nothing anymore
            disable: function() {
                return list = stack = memory = undefined, this;
            },
            // Is it disabled?
            disabled: function() {
                return !list;
            },
            // Lock the list in its current state
            lock: function() {
                return stack = undefined, memory || self.disable(), this;
            },
            // Is it locked?
            locked: function() {
                return !stack;
            },
            // Call all callbacks with the given context and arguments
            fireWith: function(context, args) {
                return args = args || [], args = [ context, args.slice ? args.slice() : args ], 
                !list || fired && !stack || (firing ? stack.push(args) : fire(args)), this;
            },
            // Call all the callbacks with the given arguments
            fire: function() {
                return self.fireWith(this, arguments), this;
            },
            // To know if the callbacks have already been called at least once
            fired: function() {
                return !!fired;
            }
        };
        return self;
    }, jQuery.extend({
        Deferred: function(func) {
            var tuples = [ // action, add listener, listener list, final state
            [ "resolve", "done", jQuery.Callbacks("once memory"), "resolved" ], [ "reject", "fail", jQuery.Callbacks("once memory"), "rejected" ], [ "notify", "progress", jQuery.Callbacks("memory") ] ], state = "pending", promise = {
                state: function() {
                    return state;
                },
                always: function() {
                    return deferred.done(arguments).fail(arguments), this;
                },
                then: function() {
                    var fns = arguments;
                    return jQuery.Deferred(function(newDefer) {
                        jQuery.each(tuples, function(i, tuple) {
                            var action = tuple[0], fn = fns[i];
                            // deferred[ done | fail | progress ] for forwarding actions to newDefer
                            deferred[tuple[1]](jQuery.isFunction(fn) ? function() {
                                var returned = fn.apply(this, arguments);
                                returned && jQuery.isFunction(returned.promise) ? returned.promise().done(newDefer.resolve).fail(newDefer.reject).progress(newDefer.notify) : newDefer[action + "With"](this === deferred ? newDefer : this, [ returned ]);
                            } : newDefer[action]);
                        }), fns = null;
                    }).promise();
                },
                // Get a promise for this deferred
                // If obj is provided, the promise aspect is added to the object
                promise: function(obj) {
                    return null != obj ? jQuery.extend(obj, promise) : promise;
                }
            }, deferred = {};
            // All done!
            // Keep pipe for back-compat
            // Add list-specific methods
            // Make the deferred a promise
            // Call given func if any
            return promise.pipe = promise.then, jQuery.each(tuples, function(i, tuple) {
                var list = tuple[2], stateString = tuple[3];
                // promise[ done | fail | progress ] = list.add
                promise[tuple[1]] = list.add, // Handle state
                stateString && list.add(function() {
                    // state = [ resolved | rejected ]
                    state = stateString;
                }, tuples[1 ^ i][2].disable, tuples[2][2].lock), // deferred[ resolve | reject | notify ] = list.fire
                deferred[tuple[0]] = list.fire, deferred[tuple[0] + "With"] = list.fireWith;
            }), promise.promise(deferred), func && func.call(deferred, deferred), deferred;
        },
        // Deferred helper
        when: function(subordinate) {
            var progressValues, progressContexts, resolveContexts, i = 0, resolveValues = core_slice.call(arguments), length = resolveValues.length, // the count of uncompleted subordinates
            remaining = 1 !== length || subordinate && jQuery.isFunction(subordinate.promise) ? length : 0, // the master Deferred. If resolveValues consist of only a single Deferred, just use that.
            deferred = 1 === remaining ? subordinate : jQuery.Deferred(), // Update function for both resolve and progress values
            updateFunc = function(i, contexts, values) {
                return function(value) {
                    contexts[i] = this, values[i] = arguments.length > 1 ? core_slice.call(arguments) : value, 
                    values === progressValues ? deferred.notifyWith(contexts, values) : --remaining || deferred.resolveWith(contexts, values);
                };
            };
            // add listeners to Deferred subordinates; treat others as resolved
            if (length > 1) for (progressValues = new Array(length), progressContexts = new Array(length), 
            resolveContexts = new Array(length); length > i; i++) resolveValues[i] && jQuery.isFunction(resolveValues[i].promise) ? resolveValues[i].promise().done(updateFunc(i, resolveContexts, resolveValues)).fail(deferred.reject).progress(updateFunc(i, progressContexts, progressValues)) : --remaining;
            // if we're not waiting on anything, resolve the master
            return remaining || deferred.resolveWith(resolveContexts, resolveValues), deferred.promise();
        }
    }), jQuery.support = function() {
        var support, all, a, select, opt, input, fragment, eventName, i, isSupported, clickFn, div = document.createElement("div");
        if (// Setup
        div.setAttribute("className", "t"), div.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>", 
        // Support tests won't run in some limited or non-browser environments
        all = div.getElementsByTagName("*"), a = div.getElementsByTagName("a")[0], !all || !a || !all.length) return {};
        // First batch of tests
        select = document.createElement("select"), opt = select.appendChild(document.createElement("option")), 
        input = div.getElementsByTagName("input")[0], a.style.cssText = "top:1px;float:left;opacity:.5", 
        support = {
            // IE strips leading whitespace when .innerHTML is used
            leadingWhitespace: 3 === div.firstChild.nodeType,
            // Make sure that tbody elements aren't automatically inserted
            // IE will insert them into empty tables
            tbody: !div.getElementsByTagName("tbody").length,
            // Make sure that link elements get serialized correctly by innerHTML
            // This requires a wrapper element in IE
            htmlSerialize: !!div.getElementsByTagName("link").length,
            // Get the style information from getAttribute
            // (IE uses .cssText instead)
            style: /top/.test(a.getAttribute("style")),
            // Make sure that URLs aren't manipulated
            // (IE normalizes it by default)
            hrefNormalized: "/a" === a.getAttribute("href"),
            // Make sure that element opacity exists
            // (IE uses filter instead)
            // Use a regex to work around a WebKit issue. See #5145
            opacity: /^0.5/.test(a.style.opacity),
            // Verify style float existence
            // (IE uses styleFloat instead of cssFloat)
            cssFloat: !!a.style.cssFloat,
            // Make sure that if no value is specified for a checkbox
            // that it defaults to "on".
            // (WebKit defaults to "" instead)
            checkOn: "on" === input.value,
            // Make sure that a selected-by-default option has a working selected property.
            // (WebKit defaults to false instead of true, IE too, if it's in an optgroup)
            optSelected: opt.selected,
            // Test setAttribute on camelCase class. If it works, we need attrFixes when doing get/setAttribute (ie6/7)
            getSetAttribute: "t" !== div.className,
            // Tests for enctype support on a form (#6743)
            enctype: !!document.createElement("form").enctype,
            // Makes sure cloning an html5 element does not cause problems
            // Where outerHTML is undefined, this still works
            html5Clone: "<:nav></:nav>" !== document.createElement("nav").cloneNode(!0).outerHTML,
            // jQuery.support.boxModel DEPRECATED in 1.8 since we don't support Quirks Mode
            boxModel: "CSS1Compat" === document.compatMode,
            // Will be defined later
            submitBubbles: !0,
            changeBubbles: !0,
            focusinBubbles: !1,
            deleteExpando: !0,
            noCloneEvent: !0,
            inlineBlockNeedsLayout: !1,
            shrinkWrapBlocks: !1,
            reliableMarginRight: !0,
            boxSizingReliable: !0,
            pixelPosition: !1
        }, // Make sure checked status is properly cloned
        input.checked = !0, support.noCloneChecked = input.cloneNode(!0).checked, // Make sure that the options inside disabled selects aren't marked as disabled
        // (WebKit marks them as disabled)
        select.disabled = !0, support.optDisabled = !opt.disabled;
        // Test to see if it's possible to delete an expando from an element
        // Fails in Internet Explorer
        try {
            delete div.test;
        } catch (e) {
            support.deleteExpando = !1;
        }
        // Technique from Juriy Zaytsev
        // http://perfectionkills.com/detecting-event-support-without-browser-sniffing/
        // We only care about the case where non-standard event systems
        // are used, namely in IE. Short-circuiting here helps us to
        // avoid an eval call (in setAttribute) which can cause CSP
        // to go haywire. See: https://developer.mozilla.org/en/Security/CSP
        if (!div.addEventListener && div.attachEvent && div.fireEvent && (div.attachEvent("onclick", clickFn = function() {
            // Cloning a node shouldn't copy over any
            // bound event handlers (IE does this)
            support.noCloneEvent = !1;
        }), div.cloneNode(!0).fireEvent("onclick"), div.detachEvent("onclick", clickFn)), 
        // Check if a radio maintains its value
        // after being appended to the DOM
        input = document.createElement("input"), input.value = "t", input.setAttribute("type", "radio"), 
        support.radioValue = "t" === input.value, input.setAttribute("checked", "checked"), 
        // #11217 - WebKit loses check when the name is after the checked attribute
        input.setAttribute("name", "t"), div.appendChild(input), fragment = document.createDocumentFragment(), 
        fragment.appendChild(div.lastChild), // WebKit doesn't clone checked state correctly in fragments
        support.checkClone = fragment.cloneNode(!0).cloneNode(!0).lastChild.checked, // Check if a disconnected checkbox will retain its checked
        // value of true after appended to the DOM (IE6/7)
        support.appendChecked = input.checked, fragment.removeChild(input), fragment.appendChild(div), 
        div.attachEvent) for (i in {
            submit: !0,
            change: !0,
            focusin: !0
        }) eventName = "on" + i, isSupported = eventName in div, isSupported || (div.setAttribute(eventName, "return;"), 
        isSupported = "function" == typeof div[eventName]), support[i + "Bubbles"] = isSupported;
        // Run tests that need a body at doc ready
        // Null elements to avoid leaks in IE
        return jQuery(function() {
            var container, div, tds, marginDiv, divReset = "padding:0;margin:0;border:0;display:block;overflow:hidden;", body = document.getElementsByTagName("body")[0];
            body && (container = document.createElement("div"), container.style.cssText = "visibility:hidden;border:0;width:0;height:0;position:static;top:0;margin-top:1px", 
            body.insertBefore(container, body.firstChild), // Construct the test element
            div = document.createElement("div"), container.appendChild(div), // Check if table cells still have offsetWidth/Height when they are set
            // to display:none and there are still other visible table cells in a
            // table row; if so, offsetWidth/Height are not reliable for use when
            // determining if an element has been hidden directly using
            // display:none (it is still safe to use offsets if a parent element is
            // hidden; don safety goggles and see bug #4512 for more information).
            // (only IE 8 fails this test)
            div.innerHTML = "<table><tr><td></td><td>t</td></tr></table>", tds = div.getElementsByTagName("td"), 
            tds[0].style.cssText = "padding:0;margin:0;border:0;display:none", isSupported = 0 === tds[0].offsetHeight, 
            tds[0].style.display = "", tds[1].style.display = "none", // Check if empty table cells still have offsetWidth/Height
            // (IE <= 8 fail this test)
            support.reliableHiddenOffsets = isSupported && 0 === tds[0].offsetHeight, // Check box-sizing and margin behavior
            div.innerHTML = "", div.style.cssText = "box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;", 
            support.boxSizing = 4 === div.offsetWidth, support.doesNotIncludeMarginInBodyOffset = 1 !== body.offsetTop, 
            // NOTE: To any future maintainer, we've window.getComputedStyle
            // because jsdom on node.js will break without it.
            window.getComputedStyle && (support.pixelPosition = "1%" !== (window.getComputedStyle(div, null) || {}).top, 
            support.boxSizingReliable = "4px" === (window.getComputedStyle(div, null) || {
                width: "4px"
            }).width, // Check if div with explicit width and no margin-right incorrectly
            // gets computed margin-right based on width of container. For more
            // info see bug #3333
            // Fails in WebKit before Feb 2011 nightlies
            // WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
            marginDiv = document.createElement("div"), marginDiv.style.cssText = div.style.cssText = divReset, 
            marginDiv.style.marginRight = marginDiv.style.width = "0", div.style.width = "1px", 
            div.appendChild(marginDiv), support.reliableMarginRight = !parseFloat((window.getComputedStyle(marginDiv, null) || {}).marginRight)), 
            "undefined" != typeof div.style.zoom && (// Check if natively block-level elements act like inline-block
            // elements when setting their display to 'inline' and giving
            // them layout
            // (IE < 8 does this)
            div.innerHTML = "", div.style.cssText = divReset + "width:1px;padding:1px;display:inline;zoom:1", 
            support.inlineBlockNeedsLayout = 3 === div.offsetWidth, // Check if elements with layout shrink-wrap their children
            // (IE 6 does this)
            div.style.display = "block", div.style.overflow = "visible", div.innerHTML = "<div></div>", 
            div.firstChild.style.width = "5px", support.shrinkWrapBlocks = 3 !== div.offsetWidth, 
            container.style.zoom = 1), // Null elements to avoid leaks in IE
            body.removeChild(container), container = div = tds = marginDiv = null);
        }), fragment.removeChild(div), all = a = select = opt = input = fragment = div = null, 
        support;
    }();
    var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/, rmultiDash = /([A-Z])/g;
    jQuery.extend({
        cache: {},
        deletedIds: [],
        // Remove at next major release (1.9/2.0)
        uuid: 0,
        // Unique for each copy of jQuery on the page
        // Non-digits removed to match rinlinejQuery
        expando: "jQuery" + (jQuery.fn.jquery + Math.random()).replace(/\D/g, ""),
        // The following elements throw uncatchable exceptions if you
        // attempt to add expando properties to them.
        noData: {
            embed: !0,
            // Ban all objects except for Flash (which handle expandos)
            object: "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",
            applet: !0
        },
        hasData: function(elem) {
            return elem = elem.nodeType ? jQuery.cache[elem[jQuery.expando]] : elem[jQuery.expando], 
            !!elem && !isEmptyDataObject(elem);
        },
        data: function(elem, name, data, pvt) {
            if (jQuery.acceptData(elem)) {
                var thisCache, ret, internalKey = jQuery.expando, getByName = "string" == typeof name, // We have to handle DOM nodes and JS objects differently because IE6-7
                // can't GC object references properly across the DOM-JS boundary
                isNode = elem.nodeType, // Only DOM nodes need the global jQuery cache; JS object data is
                // attached directly to the object so GC can occur automatically
                cache = isNode ? jQuery.cache : elem, // Only defining an ID for JS objects if its cache already exists allows
                // the code to shortcut on the same path as a DOM node with no cache
                id = isNode ? elem[internalKey] : elem[internalKey] && internalKey;
                // Avoid doing any more work than we need to when trying to get data on an
                // object that has no data at all
                if (id && cache[id] && (pvt || cache[id].data) || !getByName || data !== undefined) // Only DOM nodes need a new unique ID for each element since their data
                // ends up in the global cache
                // Avoids exposing jQuery metadata on plain JS objects when the object
                // is serialized using JSON.stringify
                // An object can be passed to jQuery.data instead of a key/value pair; this gets
                // shallow copied over onto the existing cache
                // jQuery data() is stored in a separate object inside the object's internal data
                // cache in order to avoid key collisions between internal data and user-defined
                // data.
                // Check for both converted-to-camel and non-converted data property names
                // If a data property was specified
                // First Try to find as-is property data
                // Test for null|undefined property data
                // Try to find the camelCased property
                return id || (isNode ? elem[internalKey] = id = jQuery.deletedIds.pop() || jQuery.guid++ : id = internalKey), 
                cache[id] || (cache[id] = {}, isNode || (cache[id].toJSON = jQuery.noop)), ("object" == typeof name || "function" == typeof name) && (pvt ? cache[id] = jQuery.extend(cache[id], name) : cache[id].data = jQuery.extend(cache[id].data, name)), 
                thisCache = cache[id], pvt || (thisCache.data || (thisCache.data = {}), thisCache = thisCache.data), 
                data !== undefined && (thisCache[jQuery.camelCase(name)] = data), getByName ? (ret = thisCache[name], 
                null == ret && (ret = thisCache[jQuery.camelCase(name)])) : ret = thisCache, ret;
            }
        },
        removeData: function(elem, name, pvt) {
            if (jQuery.acceptData(elem)) {
                var thisCache, i, l, isNode = elem.nodeType, // See jQuery.data for more information
                cache = isNode ? jQuery.cache : elem, id = isNode ? elem[jQuery.expando] : jQuery.expando;
                // If there is already no cache entry for this object, there is no
                // purpose in continuing
                if (cache[id]) {
                    if (name && (thisCache = pvt ? cache[id] : cache[id].data)) {
                        // Support array or space separated string names for data keys
                        jQuery.isArray(name) || (// try the string as a key before any manipulation
                        name in thisCache ? name = [ name ] : (// split the camel cased version by spaces unless a key with the spaces exists
                        name = jQuery.camelCase(name), name = name in thisCache ? [ name ] : name.split(" ")));
                        for (i = 0, l = name.length; l > i; i++) delete thisCache[name[i]];
                        // If there is no data left in the cache, we want to continue
                        // and let the cache object itself get destroyed
                        if (!(pvt ? isEmptyDataObject : jQuery.isEmptyObject)(thisCache)) return;
                    }
                    // See jQuery.data for more information
                    (pvt || (delete cache[id].data, isEmptyDataObject(cache[id]))) && (// Destroy the cache
                    isNode ? jQuery.cleanData([ elem ], !0) : jQuery.support.deleteExpando || cache != cache.window ? delete cache[id] : cache[id] = null);
                }
            }
        },
        // For internal use only.
        _data: function(elem, name, data) {
            return jQuery.data(elem, name, data, !0);
        },
        // A method for determining if a DOM node can handle the data expando
        acceptData: function(elem) {
            var noData = elem.nodeName && jQuery.noData[elem.nodeName.toLowerCase()];
            // nodes accept data unless otherwise specified; rejection can be conditional
            return !noData || noData !== !0 && elem.getAttribute("classid") === noData;
        }
    }), jQuery.fn.extend({
        data: function(key, value) {
            var parts, part, attr, name, l, elem = this[0], i = 0, data = null;
            // Gets all values
            if (key === undefined) {
                if (this.length && (data = jQuery.data(elem), 1 === elem.nodeType && !jQuery._data(elem, "parsedAttrs"))) {
                    for (attr = elem.attributes, l = attr.length; l > i; i++) name = attr[i].name, name.indexOf("data-") || (name = jQuery.camelCase(name.substring(5)), 
                    dataAttr(elem, name, data[name]));
                    jQuery._data(elem, "parsedAttrs", !0);
                }
                return data;
            }
            // Sets multiple values
            // Sets multiple values
            return "object" == typeof key ? this.each(function() {
                jQuery.data(this, key);
            }) : (parts = key.split(".", 2), parts[1] = parts[1] ? "." + parts[1] : "", part = parts[1] + "!", 
            jQuery.access(this, function(value) {
                // Try to fetch any internally stored data first
                return value === undefined ? (data = this.triggerHandler("getData" + part, [ parts[0] ]), 
                data === undefined && elem && (data = jQuery.data(elem, key), data = dataAttr(elem, key, data)), 
                data === undefined && parts[1] ? this.data(parts[0]) : data) : (parts[1] = value, 
                void this.each(function() {
                    var self = jQuery(this);
                    self.triggerHandler("setData" + part, parts), jQuery.data(this, key, value), self.triggerHandler("changeData" + part, parts);
                }));
            }, null, value, arguments.length > 1, null, !1));
        },
        removeData: function(key) {
            return this.each(function() {
                jQuery.removeData(this, key);
            });
        }
    }), jQuery.extend({
        queue: function(elem, type, data) {
            var queue;
            // Speed up dequeue by getting out quickly if this is just a lookup
            return elem ? (type = (type || "fx") + "queue", queue = jQuery._data(elem, type), 
            data && (!queue || jQuery.isArray(data) ? queue = jQuery._data(elem, type, jQuery.makeArray(data)) : queue.push(data)), 
            queue || []) : void 0;
        },
        dequeue: function(elem, type) {
            type = type || "fx";
            var queue = jQuery.queue(elem, type), startLength = queue.length, fn = queue.shift(), hooks = jQuery._queueHooks(elem, type), next = function() {
                jQuery.dequeue(elem, type);
            };
            // If the fx queue is dequeued, always remove the progress sentinel
            "inprogress" === fn && (fn = queue.shift(), startLength--), fn && (// Add a progress sentinel to prevent the fx queue from being
            // automatically dequeued
            "fx" === type && queue.unshift("inprogress"), // clear up the last queue stop function
            delete hooks.stop, fn.call(elem, next, hooks)), !startLength && hooks && hooks.empty.fire();
        },
        // not intended for public consumption - generates a queueHooks object, or returns the current one
        _queueHooks: function(elem, type) {
            var key = type + "queueHooks";
            return jQuery._data(elem, key) || jQuery._data(elem, key, {
                empty: jQuery.Callbacks("once memory").add(function() {
                    jQuery.removeData(elem, type + "queue", !0), jQuery.removeData(elem, key, !0);
                })
            });
        }
    }), jQuery.fn.extend({
        queue: function(type, data) {
            var setter = 2;
            return "string" != typeof type && (data = type, type = "fx", setter--), arguments.length < setter ? jQuery.queue(this[0], type) : data === undefined ? this : this.each(function() {
                var queue = jQuery.queue(this, type, data);
                // ensure a hooks for this queue
                jQuery._queueHooks(this, type), "fx" === type && "inprogress" !== queue[0] && jQuery.dequeue(this, type);
            });
        },
        dequeue: function(type) {
            return this.each(function() {
                jQuery.dequeue(this, type);
            });
        },
        // Based off of the plugin by Clint Helfers, with permission.
        // http://blindsignals.com/index.php/2009/07/jquery-delay/
        delay: function(time, type) {
            return time = jQuery.fx ? jQuery.fx.speeds[time] || time : time, type = type || "fx", 
            this.queue(type, function(next, hooks) {
                var timeout = setTimeout(next, time);
                hooks.stop = function() {
                    clearTimeout(timeout);
                };
            });
        },
        clearQueue: function(type) {
            return this.queue(type || "fx", []);
        },
        // Get a promise resolved when queues of a certain type
        // are emptied (fx is the type by default)
        promise: function(type, obj) {
            var tmp, count = 1, defer = jQuery.Deferred(), elements = this, i = this.length, resolve = function() {
                --count || defer.resolveWith(elements, [ elements ]);
            };
            for ("string" != typeof type && (obj = type, type = undefined), type = type || "fx"; i--; ) tmp = jQuery._data(elements[i], type + "queueHooks"), 
            tmp && tmp.empty && (count++, tmp.empty.add(resolve));
            return resolve(), defer.promise(obj);
        }
    });
    var nodeHook, boolHook, fixSpecified, rclass = /[\t\r\n]/g, rreturn = /\r/g, rtype = /^(?:button|input)$/i, rfocusable = /^(?:button|input|object|select|textarea)$/i, rclickable = /^a(?:rea|)$/i, rboolean = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i, getSetAttribute = jQuery.support.getSetAttribute;
    jQuery.fn.extend({
        attr: function(name, value) {
            return jQuery.access(this, jQuery.attr, name, value, arguments.length > 1);
        },
        removeAttr: function(name) {
            return this.each(function() {
                jQuery.removeAttr(this, name);
            });
        },
        prop: function(name, value) {
            return jQuery.access(this, jQuery.prop, name, value, arguments.length > 1);
        },
        removeProp: function(name) {
            return name = jQuery.propFix[name] || name, this.each(function() {
                // try/catch handles cases where IE balks (such as removing a property on window)
                try {
                    this[name] = undefined, delete this[name];
                } catch (e) {}
            });
        },
        addClass: function(value) {
            var classNames, i, l, elem, setClass, c, cl;
            if (jQuery.isFunction(value)) return this.each(function(j) {
                jQuery(this).addClass(value.call(this, j, this.className));
            });
            if (value && "string" == typeof value) for (classNames = value.split(core_rspace), 
            i = 0, l = this.length; l > i; i++) if (elem = this[i], 1 === elem.nodeType) if (elem.className || 1 !== classNames.length) {
                for (setClass = " " + elem.className + " ", c = 0, cl = classNames.length; cl > c; c++) setClass.indexOf(" " + classNames[c] + " ") < 0 && (setClass += classNames[c] + " ");
                elem.className = jQuery.trim(setClass);
            } else elem.className = value;
            return this;
        },
        removeClass: function(value) {
            var removes, className, elem, c, cl, i, l;
            if (jQuery.isFunction(value)) return this.each(function(j) {
                jQuery(this).removeClass(value.call(this, j, this.className));
            });
            if (value && "string" == typeof value || value === undefined) for (removes = (value || "").split(core_rspace), 
            i = 0, l = this.length; l > i; i++) if (elem = this[i], 1 === elem.nodeType && elem.className) {
                // loop over each item in the removal list
                for (className = (" " + elem.className + " ").replace(rclass, " "), c = 0, cl = removes.length; cl > c; c++) // Remove until there is nothing to remove,
                for (;className.indexOf(" " + removes[c] + " ") >= 0; ) className = className.replace(" " + removes[c] + " ", " ");
                elem.className = value ? jQuery.trim(className) : "";
            }
            return this;
        },
        toggleClass: function(value, stateVal) {
            var type = typeof value, isBool = "boolean" == typeof stateVal;
            return this.each(jQuery.isFunction(value) ? function(i) {
                jQuery(this).toggleClass(value.call(this, i, this.className, stateVal), stateVal);
            } : function() {
                if ("string" === type) for (// toggle individual class names
                var className, i = 0, self = jQuery(this), state = stateVal, classNames = value.split(core_rspace); className = classNames[i++]; ) // check each className given, space separated list
                state = isBool ? state : !self.hasClass(className), self[state ? "addClass" : "removeClass"](className); else ("undefined" === type || "boolean" === type) && (this.className && // store className if set
                jQuery._data(this, "__className__", this.className), // toggle whole className
                this.className = this.className || value === !1 ? "" : jQuery._data(this, "__className__") || "");
            });
        },
        hasClass: function(selector) {
            for (var className = " " + selector + " ", i = 0, l = this.length; l > i; i++) if (1 === this[i].nodeType && (" " + this[i].className + " ").replace(rclass, " ").indexOf(className) >= 0) return !0;
            return !1;
        },
        val: function(value) {
            var hooks, ret, isFunction, elem = this[0];
            {
                if (arguments.length) return isFunction = jQuery.isFunction(value), this.each(function(i) {
                    var val, self = jQuery(this);
                    1 === this.nodeType && (val = isFunction ? value.call(this, i, self.val()) : value, 
                    // Treat null/undefined as ""; convert numbers to string
                    null == val ? val = "" : "number" == typeof val ? val += "" : jQuery.isArray(val) && (val = jQuery.map(val, function(value) {
                        return null == value ? "" : value + "";
                    })), hooks = jQuery.valHooks[this.type] || jQuery.valHooks[this.nodeName.toLowerCase()], 
                    // If set returns undefined, fall back to normal setting
                    hooks && "set" in hooks && hooks.set(this, val, "value") !== undefined || (this.value = val));
                });
                if (elem) // handle most common string cases
                // handle cases where value is null/undef or number
                return hooks = jQuery.valHooks[elem.type] || jQuery.valHooks[elem.nodeName.toLowerCase()], 
                hooks && "get" in hooks && (ret = hooks.get(elem, "value")) !== undefined ? ret : (ret = elem.value, 
                "string" == typeof ret ? ret.replace(rreturn, "") : null == ret ? "" : ret);
            }
        }
    }), jQuery.extend({
        valHooks: {
            option: {
                get: function(elem) {
                    // attributes.value is undefined in Blackberry 4.7 but
                    // uses .value. See #6932
                    var val = elem.attributes.value;
                    return !val || val.specified ? elem.value : elem.text;
                }
            },
            select: {
                get: function(elem) {
                    // Loop through all the selected options
                    for (var value, option, options = elem.options, index = elem.selectedIndex, one = "select-one" === elem.type || 0 > index, values = one ? null : [], max = one ? index + 1 : options.length, i = 0 > index ? max : one ? index : 0; max > i; i++) // oldIE doesn't update selected after form reset (#2551)
                    if (option = options[i], !(!option.selected && i !== index || (// Don't return options that are disabled or in a disabled optgroup
                    jQuery.support.optDisabled ? option.disabled : null !== option.getAttribute("disabled")) || option.parentNode.disabled && jQuery.nodeName(option.parentNode, "optgroup"))) {
                        // We don't need an array for one selects
                        if (// Get the specific value for the option
                        value = jQuery(option).val(), one) return value;
                        // Multi-Selects return an array
                        values.push(value);
                    }
                    return values;
                },
                set: function(elem, value) {
                    var values = jQuery.makeArray(value);
                    return jQuery(elem).find("option").each(function() {
                        this.selected = jQuery.inArray(jQuery(this).val(), values) >= 0;
                    }), values.length || (elem.selectedIndex = -1), values;
                }
            }
        },
        // Unused in 1.8, left in so attrFn-stabbers won't die; remove in 1.9
        attrFn: {},
        attr: function(elem, name, value, pass) {
            var ret, hooks, notxml, nType = elem.nodeType;
            // don't get/set attributes on text, comment and attribute nodes
            if (elem && 3 !== nType && 8 !== nType && 2 !== nType) // Fallback to prop when attributes are not supported
            // All attributes are lowercase
            // Grab necessary hook if one is defined
            return pass && jQuery.isFunction(jQuery.fn[name]) ? jQuery(elem)[name](value) : "undefined" == typeof elem.getAttribute ? jQuery.prop(elem, name, value) : (notxml = 1 !== nType || !jQuery.isXMLDoc(elem), 
            notxml && (name = name.toLowerCase(), hooks = jQuery.attrHooks[name] || (rboolean.test(name) ? boolHook : nodeHook)), 
            value !== undefined ? null === value ? void jQuery.removeAttr(elem, name) : hooks && "set" in hooks && notxml && (ret = hooks.set(elem, value, name)) !== undefined ? ret : (elem.setAttribute(name, value + ""), 
            value) : hooks && "get" in hooks && notxml && null !== (ret = hooks.get(elem, name)) ? ret : (ret = elem.getAttribute(name), 
            null === ret ? undefined : ret));
        },
        removeAttr: function(elem, value) {
            var propName, attrNames, name, isBool, i = 0;
            if (value && 1 === elem.nodeType) for (attrNames = value.split(core_rspace); i < attrNames.length; i++) name = attrNames[i], 
            name && (propName = jQuery.propFix[name] || name, isBool = rboolean.test(name), 
            // See #9699 for explanation of this approach (setting first, then removal)
            // Do not do this for boolean attributes (see #10870)
            isBool || jQuery.attr(elem, name, ""), elem.removeAttribute(getSetAttribute ? name : propName), 
            // Set corresponding property to false for boolean attributes
            isBool && propName in elem && (elem[propName] = !1));
        },
        attrHooks: {
            type: {
                set: function(elem, value) {
                    // We can't allow the type property to be changed (since it causes problems in IE)
                    if (rtype.test(elem.nodeName) && elem.parentNode) jQuery.error("type property can't be changed"); else if (!jQuery.support.radioValue && "radio" === value && jQuery.nodeName(elem, "input")) {
                        // Setting the type on a radio button after the value resets the value in IE6-9
                        // Reset value to it's default in case type is set after value
                        // This is for element creation
                        var val = elem.value;
                        return elem.setAttribute("type", value), val && (elem.value = val), value;
                    }
                }
            },
            // Use the value property for back compat
            // Use the nodeHook for button elements in IE6/7 (#1954)
            value: {
                get: function(elem, name) {
                    return nodeHook && jQuery.nodeName(elem, "button") ? nodeHook.get(elem, name) : name in elem ? elem.value : null;
                },
                set: function(elem, value, name) {
                    // Does not return so that setAttribute is also used
                    return nodeHook && jQuery.nodeName(elem, "button") ? nodeHook.set(elem, value, name) : void (elem.value = value);
                }
            }
        },
        propFix: {
            tabindex: "tabIndex",
            readonly: "readOnly",
            "for": "htmlFor",
            "class": "className",
            maxlength: "maxLength",
            cellspacing: "cellSpacing",
            cellpadding: "cellPadding",
            rowspan: "rowSpan",
            colspan: "colSpan",
            usemap: "useMap",
            frameborder: "frameBorder",
            contenteditable: "contentEditable"
        },
        prop: function(elem, name, value) {
            var ret, hooks, notxml, nType = elem.nodeType;
            // don't get/set properties on text, comment and attribute nodes
            if (elem && 3 !== nType && 8 !== nType && 2 !== nType) // Fix name and attach hooks
            return notxml = 1 !== nType || !jQuery.isXMLDoc(elem), notxml && (name = jQuery.propFix[name] || name, 
            hooks = jQuery.propHooks[name]), value !== undefined ? hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== undefined ? ret : elem[name] = value : hooks && "get" in hooks && null !== (ret = hooks.get(elem, name)) ? ret : elem[name];
        },
        propHooks: {
            tabIndex: {
                get: function(elem) {
                    // elem.tabIndex doesn't always return the correct value when it hasn't been explicitly set
                    // http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
                    var attributeNode = elem.getAttributeNode("tabindex");
                    return attributeNode && attributeNode.specified ? parseInt(attributeNode.value, 10) : rfocusable.test(elem.nodeName) || rclickable.test(elem.nodeName) && elem.href ? 0 : undefined;
                }
            }
        }
    }), // Hook for boolean attributes
    boolHook = {
        get: function(elem, name) {
            // Align boolean attributes with corresponding properties
            // Fall back to attribute presence where some booleans are not supported
            var attrNode, property = jQuery.prop(elem, name);
            return property === !0 || "boolean" != typeof property && (attrNode = elem.getAttributeNode(name)) && attrNode.nodeValue !== !1 ? name.toLowerCase() : undefined;
        },
        set: function(elem, value, name) {
            var propName;
            // Remove boolean attributes when set to false
            // value is true since we know at this point it's type boolean and not false
            // Set boolean attributes to the same name and set the DOM property
            // Only set the IDL specifically if it already exists on the element
            return value === !1 ? jQuery.removeAttr(elem, name) : (propName = jQuery.propFix[name] || name, 
            propName in elem && (elem[propName] = !0), elem.setAttribute(name, name.toLowerCase())), 
            name;
        }
    }, // IE6/7 do not support getting/setting some attributes with get/setAttribute
    getSetAttribute || (fixSpecified = {
        name: !0,
        id: !0,
        coords: !0
    }, // Use this for any attribute in IE6/7
    // This fixes almost every IE6/7 issue
    nodeHook = jQuery.valHooks.button = {
        get: function(elem, name) {
            var ret;
            return ret = elem.getAttributeNode(name), ret && (fixSpecified[name] ? "" !== ret.value : ret.specified) ? ret.value : undefined;
        },
        set: function(elem, value, name) {
            // Set the existing or create a new attribute node
            var ret = elem.getAttributeNode(name);
            return ret || (ret = document.createAttribute(name), elem.setAttributeNode(ret)), 
            ret.value = value + "";
        }
    }, // Set width and height to auto instead of 0 on empty string( Bug #8150 )
    // This is for removals
    jQuery.each([ "width", "height" ], function(i, name) {
        jQuery.attrHooks[name] = jQuery.extend(jQuery.attrHooks[name], {
            set: function(elem, value) {
                return "" === value ? (elem.setAttribute(name, "auto"), value) : void 0;
            }
        });
    }), // Set contenteditable to false on removals(#10429)
    // Setting to empty string throws an error as an invalid value
    jQuery.attrHooks.contenteditable = {
        get: nodeHook.get,
        set: function(elem, value, name) {
            "" === value && (value = "false"), nodeHook.set(elem, value, name);
        }
    }), // Some attributes require a special call on IE
    jQuery.support.hrefNormalized || jQuery.each([ "href", "src", "width", "height" ], function(i, name) {
        jQuery.attrHooks[name] = jQuery.extend(jQuery.attrHooks[name], {
            get: function(elem) {
                var ret = elem.getAttribute(name, 2);
                return null === ret ? undefined : ret;
            }
        });
    }), jQuery.support.style || (jQuery.attrHooks.style = {
        get: function(elem) {
            // Return undefined in the case of empty string
            // Normalize to lowercase since IE uppercases css property names
            return elem.style.cssText.toLowerCase() || undefined;
        },
        set: function(elem, value) {
            return elem.style.cssText = value + "";
        }
    }), // Safari mis-reports the default selected property of an option
    // Accessing the parent's selectedIndex property fixes it
    jQuery.support.optSelected || (jQuery.propHooks.selected = jQuery.extend(jQuery.propHooks.selected, {
        get: function(elem) {
            var parent = elem.parentNode;
            // Make sure that it also works with optgroups, see #5701
            return parent && (parent.selectedIndex, parent.parentNode && parent.parentNode.selectedIndex), 
            null;
        }
    })), // IE6/7 call enctype encoding
    jQuery.support.enctype || (jQuery.propFix.enctype = "encoding"), // Radios and checkboxes getter/setter
    jQuery.support.checkOn || jQuery.each([ "radio", "checkbox" ], function() {
        jQuery.valHooks[this] = {
            get: function(elem) {
                // Handle the case where in Webkit "" is returned instead of "on" if a value isn't specified
                return null === elem.getAttribute("value") ? "on" : elem.value;
            }
        };
    }), jQuery.each([ "radio", "checkbox" ], function() {
        jQuery.valHooks[this] = jQuery.extend(jQuery.valHooks[this], {
            set: function(elem, value) {
                return jQuery.isArray(value) ? elem.checked = jQuery.inArray(jQuery(elem).val(), value) >= 0 : void 0;
            }
        });
    });
    var rformElems = /^(?:textarea|input|select)$/i, rtypenamespace = /^([^\.]*|)(?:\.(.+)|)$/, rhoverHack = /(?:^|\s)hover(\.\S+|)\b/, rkeyEvent = /^key/, rmouseEvent = /^(?:mouse|contextmenu)|click/, rfocusMorph = /^(?:focusinfocus|focusoutblur)$/, hoverHack = function(events) {
        return jQuery.event.special.hover ? events : events.replace(rhoverHack, "mouseenter$1 mouseleave$1");
    };
    /*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
    jQuery.event = {
        add: function(elem, types, handler, data, selector) {
            var elemData, eventHandle, events, t, tns, type, namespaces, handleObj, handleObjIn, handlers, special;
            // Don't attach events to noData or text/comment nodes (allow plain objects tho)
            if (3 !== elem.nodeType && 8 !== elem.nodeType && types && handler && (elemData = jQuery._data(elem))) {
                for (// Caller can pass in an object of custom data in lieu of the handler
                handler.handler && (handleObjIn = handler, handler = handleObjIn.handler, selector = handleObjIn.selector), 
                // Make sure that the handler has a unique ID, used to find/remove it later
                handler.guid || (handler.guid = jQuery.guid++), // Init the element's event structure and main handler, if this is the first
                events = elemData.events, events || (elemData.events = events = {}), eventHandle = elemData.handle, 
                eventHandle || (elemData.handle = eventHandle = function(e) {
                    // Discard the second event of a jQuery.event.trigger() and
                    // when an event is called after a page has unloaded
                    return "undefined" == typeof jQuery || e && jQuery.event.triggered === e.type ? undefined : jQuery.event.dispatch.apply(eventHandle.elem, arguments);
                }, // Add elem as a property of the handle fn to prevent a memory leak with IE non-native events
                eventHandle.elem = elem), // Handle multiple events separated by a space
                // jQuery(...).bind("mouseover mouseout", fn);
                types = jQuery.trim(hoverHack(types)).split(" "), t = 0; t < types.length; t++) tns = rtypenamespace.exec(types[t]) || [], 
                type = tns[1], namespaces = (tns[2] || "").split(".").sort(), // If event changes its type, use the special event handlers for the changed type
                special = jQuery.event.special[type] || {}, // If selector defined, determine special event api type, otherwise given type
                type = (selector ? special.delegateType : special.bindType) || type, // Update special based on newly reset type
                special = jQuery.event.special[type] || {}, // handleObj is passed to all event handlers
                handleObj = jQuery.extend({
                    type: type,
                    origType: tns[1],
                    data: data,
                    handler: handler,
                    guid: handler.guid,
                    selector: selector,
                    needsContext: selector && jQuery.expr.match.needsContext.test(selector),
                    namespace: namespaces.join(".")
                }, handleObjIn), // Init the event handler queue if we're the first
                handlers = events[type], handlers || (handlers = events[type] = [], handlers.delegateCount = 0, 
                // Only use addEventListener/attachEvent if the special events handler returns false
                special.setup && special.setup.call(elem, data, namespaces, eventHandle) !== !1 || (// Bind the global event handler to the element
                elem.addEventListener ? elem.addEventListener(type, eventHandle, !1) : elem.attachEvent && elem.attachEvent("on" + type, eventHandle))), 
                special.add && (special.add.call(elem, handleObj), handleObj.handler.guid || (handleObj.handler.guid = handler.guid)), 
                // Add to the element's handler list, delegates in front
                selector ? handlers.splice(handlers.delegateCount++, 0, handleObj) : handlers.push(handleObj), 
                // Keep track of which events have ever been used, for event optimization
                jQuery.event.global[type] = !0;
                // Nullify elem to prevent memory leaks in IE
                elem = null;
            }
        },
        global: {},
        // Detach an event or set of events from an element
        remove: function(elem, types, handler, selector, mappedTypes) {
            var t, tns, type, origType, namespaces, origCount, j, events, special, eventType, handleObj, elemData = jQuery.hasData(elem) && jQuery._data(elem);
            if (elemData && (events = elemData.events)) {
                for (// Once for each type.namespace in types; type may be omitted
                types = jQuery.trim(hoverHack(types || "")).split(" "), t = 0; t < types.length; t++) // Unbind all events (on this namespace, if provided) for the element
                if (tns = rtypenamespace.exec(types[t]) || [], type = origType = tns[1], namespaces = tns[2], 
                type) {
                    // Remove matching events
                    for (special = jQuery.event.special[type] || {}, type = (selector ? special.delegateType : special.bindType) || type, 
                    eventType = events[type] || [], origCount = eventType.length, namespaces = namespaces ? new RegExp("(^|\\.)" + namespaces.split(".").sort().join("\\.(?:.*\\.|)") + "(\\.|$)") : null, 
                    j = 0; j < eventType.length; j++) handleObj = eventType[j], !mappedTypes && origType !== handleObj.origType || handler && handler.guid !== handleObj.guid || namespaces && !namespaces.test(handleObj.namespace) || selector && selector !== handleObj.selector && ("**" !== selector || !handleObj.selector) || (eventType.splice(j--, 1), 
                    handleObj.selector && eventType.delegateCount--, special.remove && special.remove.call(elem, handleObj));
                    // Remove generic event handler if we removed something and no more handlers exist
                    // (avoids potential for endless recursion during removal of special event handlers)
                    0 === eventType.length && origCount !== eventType.length && (special.teardown && special.teardown.call(elem, namespaces, elemData.handle) !== !1 || jQuery.removeEvent(elem, type, elemData.handle), 
                    delete events[type]);
                } else for (type in events) jQuery.event.remove(elem, type + types[t], handler, selector, !0);
                // Remove the expando if it's no longer used
                jQuery.isEmptyObject(events) && (delete elemData.handle, // removeData also checks for emptiness and clears the expando if empty
                // so use it instead of delete
                jQuery.removeData(elem, "events", !0));
            }
        },
        // Events that are safe to short-circuit if no handlers are attached.
        // Native DOM events should not be added, they may have inline handlers.
        customEvent: {
            getData: !0,
            setData: !0,
            changeData: !0
        },
        trigger: function(event, data, elem, onlyHandlers) {
            // Don't do events on text and comment nodes
            if (!elem || 3 !== elem.nodeType && 8 !== elem.nodeType) {
                // Event object or event type
                var cache, exclusive, i, cur, old, ontype, special, handle, eventPath, bubbleType, type = event.type || event, namespaces = [];
                // focus/blur morphs to focusin/out; ensure we're not firing them right now
                if (!rfocusMorph.test(type + jQuery.event.triggered) && (type.indexOf("!") >= 0 && (// Exclusive events trigger only for the exact event (no namespaces)
                type = type.slice(0, -1), exclusive = !0), type.indexOf(".") >= 0 && (// Namespaced trigger; create a regexp to match event type in handle()
                namespaces = type.split("."), type = namespaces.shift(), namespaces.sort()), elem && !jQuery.event.customEvent[type] || jQuery.event.global[type])) // Handle a global trigger
                if (// Caller can pass in an Event, Object, or just an event type string
                event = "object" == typeof event ? // jQuery.Event object
                event[jQuery.expando] ? event : // Object literal
                new jQuery.Event(type, event) : // Just the event type (string)
                new jQuery.Event(type), event.type = type, event.isTrigger = !0, event.exclusive = exclusive, 
                event.namespace = namespaces.join("."), event.namespace_re = event.namespace ? new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)") : null, 
                ontype = type.indexOf(":") < 0 ? "on" + type : "", elem) {
                    if (// Clean up the event in case it is being reused
                    event.result = undefined, event.target || (event.target = elem), // Clone any incoming data and prepend the event, creating the handler arg list
                    data = null != data ? jQuery.makeArray(data) : [], data.unshift(event), // Allow special events to draw outside the lines
                    special = jQuery.event.special[type] || {}, !special.trigger || special.trigger.apply(elem, data) !== !1) {
                        if (// Determine event propagation path in advance, per W3C events spec (#9951)
                        // Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
                        eventPath = [ [ elem, special.bindType || type ] ], !onlyHandlers && !special.noBubble && !jQuery.isWindow(elem)) {
                            for (bubbleType = special.delegateType || type, cur = rfocusMorph.test(bubbleType + type) ? elem : elem.parentNode, 
                            old = elem; cur; cur = cur.parentNode) eventPath.push([ cur, bubbleType ]), old = cur;
                            // Only add window if we got to document (e.g., not plain obj or detached DOM)
                            old === (elem.ownerDocument || document) && eventPath.push([ old.defaultView || old.parentWindow || window, bubbleType ]);
                        }
                        // Fire handlers on the event path
                        for (i = 0; i < eventPath.length && !event.isPropagationStopped(); i++) cur = eventPath[i][0], 
                        event.type = eventPath[i][1], handle = (jQuery._data(cur, "events") || {})[event.type] && jQuery._data(cur, "handle"), 
                        handle && handle.apply(cur, data), // Note that this is a bare JS function and not a jQuery handler
                        handle = ontype && cur[ontype], handle && jQuery.acceptData(cur) && handle.apply && handle.apply(cur, data) === !1 && event.preventDefault();
                        // If nobody prevented the default action, do it now
                        // Call a native DOM method on the target with the same name name as the event.
                        // Can't use an .isFunction() check here because IE6/7 fails that test.
                        // Don't do default actions on window, that's where global variables be (#6170)
                        // IE<9 dies on focus/blur to hidden element (#1486)
                        // Don't re-trigger an onFOO event when we call its FOO() method
                        // Prevent re-triggering of the same event, since we already bubbled it above
                        return event.type = type, onlyHandlers || event.isDefaultPrevented() || special._default && special._default.apply(elem.ownerDocument, data) !== !1 || "click" === type && jQuery.nodeName(elem, "a") || !jQuery.acceptData(elem) || ontype && elem[type] && ("focus" !== type && "blur" !== type || 0 !== event.target.offsetWidth) && !jQuery.isWindow(elem) && (old = elem[ontype], 
                        old && (elem[ontype] = null), jQuery.event.triggered = type, elem[type](), jQuery.event.triggered = undefined, 
                        old && (elem[ontype] = old)), event.result;
                    }
                } else {
                    // TODO: Stop taunting the data cache; remove global events and always attach to document
                    cache = jQuery.cache;
                    for (i in cache) cache[i].events && cache[i].events[type] && jQuery.event.trigger(event, data, cache[i].handle.elem, !0);
                }
            }
        },
        dispatch: function(event) {
            // Make a writable jQuery.Event from the native event object
            event = jQuery.event.fix(event || window.event);
            var i, j, cur, ret, selMatch, matched, matches, handleObj, sel, handlers = (jQuery._data(this, "events") || {})[event.type] || [], delegateCount = handlers.delegateCount, args = core_slice.call(arguments), run_all = !event.exclusive && !event.namespace, special = jQuery.event.special[event.type] || {}, handlerQueue = [];
            // Call the preDispatch hook for the mapped type, and let it bail if desired
            if (// Use the fix-ed jQuery.Event rather than the (read-only) native event
            args[0] = event, event.delegateTarget = this, !special.preDispatch || special.preDispatch.call(this, event) !== !1) {
                // Determine handlers that should run if there are delegated events
                // Avoid non-left-click bubbling in Firefox (#3861)
                if (delegateCount && (!event.button || "click" !== event.type)) for (cur = event.target; cur != this; cur = cur.parentNode || this) // Don't process clicks (ONLY) on disabled elements (#6911, #8165, #11382, #11764)
                if (cur.disabled !== !0 || "click" !== event.type) {
                    for (selMatch = {}, matches = [], i = 0; delegateCount > i; i++) handleObj = handlers[i], 
                    sel = handleObj.selector, selMatch[sel] === undefined && (selMatch[sel] = handleObj.needsContext ? jQuery(sel, this).index(cur) >= 0 : jQuery.find(sel, this, null, [ cur ]).length), 
                    selMatch[sel] && matches.push(handleObj);
                    matches.length && handlerQueue.push({
                        elem: cur,
                        matches: matches
                    });
                }
                // Run delegates first; they may want to stop propagation beneath us
                for (// Add the remaining (directly-bound) handlers
                handlers.length > delegateCount && handlerQueue.push({
                    elem: this,
                    matches: handlers.slice(delegateCount)
                }), i = 0; i < handlerQueue.length && !event.isPropagationStopped(); i++) for (matched = handlerQueue[i], 
                event.currentTarget = matched.elem, j = 0; j < matched.matches.length && !event.isImmediatePropagationStopped(); j++) handleObj = matched.matches[j], 
                // Triggered event must either 1) be non-exclusive and have no namespace, or
                // 2) have namespace(s) a subset or equal to those in the bound event (both can have no namespace).
                (run_all || !event.namespace && !handleObj.namespace || event.namespace_re && event.namespace_re.test(handleObj.namespace)) && (event.data = handleObj.data, 
                event.handleObj = handleObj, ret = ((jQuery.event.special[handleObj.origType] || {}).handle || handleObj.handler).apply(matched.elem, args), 
                ret !== undefined && (event.result = ret, ret === !1 && (event.preventDefault(), 
                event.stopPropagation())));
                // Call the postDispatch hook for the mapped type
                return special.postDispatch && special.postDispatch.call(this, event), event.result;
            }
        },
        // Includes some event props shared by KeyEvent and MouseEvent
        // *** attrChange attrName relatedNode srcElement  are not normalized, non-W3C, deprecated, will be removed in 1.8 ***
        props: "attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),
        fixHooks: {},
        keyHooks: {
            props: "char charCode key keyCode".split(" "),
            filter: function(event, original) {
                // Add which for key events
                return null == event.which && (event.which = null != original.charCode ? original.charCode : original.keyCode), 
                event;
            }
        },
        mouseHooks: {
            props: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
            filter: function(event, original) {
                var eventDoc, doc, body, button = original.button, fromElement = original.fromElement;
                // Calculate pageX/Y if missing and clientX/Y available
                // Add relatedTarget, if necessary
                // Add which for click: 1 === left; 2 === middle; 3 === right
                // Note: button is not normalized, so don't use it
                return null == event.pageX && null != original.clientX && (eventDoc = event.target.ownerDocument || document, 
                doc = eventDoc.documentElement, body = eventDoc.body, event.pageX = original.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0), 
                event.pageY = original.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0)), 
                !event.relatedTarget && fromElement && (event.relatedTarget = fromElement === event.target ? original.toElement : fromElement), 
                event.which || button === undefined || (event.which = 1 & button ? 1 : 2 & button ? 3 : 4 & button ? 2 : 0), 
                event;
            }
        },
        fix: function(event) {
            if (event[jQuery.expando]) return event;
            // Create a writable copy of the event object and normalize some properties
            var i, prop, originalEvent = event, fixHook = jQuery.event.fixHooks[event.type] || {}, copy = fixHook.props ? this.props.concat(fixHook.props) : this.props;
            for (event = jQuery.Event(originalEvent), i = copy.length; i; ) prop = copy[--i], 
            event[prop] = originalEvent[prop];
            // Fix target property, if necessary (#1925, IE 6/7/8 & Safari2)
            // Target should not be a text node (#504, Safari)
            // For mouse/key events, metaKey==false if it's undefined (#3368, #11328; IE6/7/8)
            return event.target || (event.target = originalEvent.srcElement || document), 3 === event.target.nodeType && (event.target = event.target.parentNode), 
            event.metaKey = !!event.metaKey, fixHook.filter ? fixHook.filter(event, originalEvent) : event;
        },
        special: {
            load: {
                // Prevent triggered image.load events from bubbling to window.load
                noBubble: !0
            },
            focus: {
                delegateType: "focusin"
            },
            blur: {
                delegateType: "focusout"
            },
            beforeunload: {
                setup: function(data, namespaces, eventHandle) {
                    // We only want to do this special case on windows
                    jQuery.isWindow(this) && (this.onbeforeunload = eventHandle);
                },
                teardown: function(namespaces, eventHandle) {
                    this.onbeforeunload === eventHandle && (this.onbeforeunload = null);
                }
            }
        },
        simulate: function(type, elem, event, bubble) {
            // Piggyback on a donor event to simulate a different one.
            // Fake originalEvent to avoid donor's stopPropagation, but if the
            // simulated event prevents default then we do the same on the donor.
            var e = jQuery.extend(new jQuery.Event(), event, {
                type: type,
                isSimulated: !0,
                originalEvent: {}
            });
            bubble ? jQuery.event.trigger(e, null, elem) : jQuery.event.dispatch.call(elem, e), 
            e.isDefaultPrevented() && event.preventDefault();
        }
    }, // Some plugins are using, but it's undocumented/deprecated and will be removed.
    // The 1.7 special event interface should provide all the hooks needed now.
    jQuery.event.handle = jQuery.event.dispatch, jQuery.removeEvent = document.removeEventListener ? function(elem, type, handle) {
        elem.removeEventListener && elem.removeEventListener(type, handle, !1);
    } : function(elem, type, handle) {
        var name = "on" + type;
        elem.detachEvent && (// #8545, #7054, preventing memory leaks for custom events in IE6-8
        // detachEvent needed property on element, by name of that event, to properly expose it to GC
        "undefined" == typeof elem[name] && (elem[name] = null), elem.detachEvent(name, handle));
    }, jQuery.Event = function(src, props) {
        // Allow instantiation without the 'new' keyword
        // Allow instantiation without the 'new' keyword
        // Event object
        // Events bubbling up the document may have been marked as prevented
        // by a handler lower down the tree; reflect the correct value.
        // Put explicitly provided properties onto the event object
        // Create a timestamp if incoming event doesn't have one
        // Mark it as fixed
        return this instanceof jQuery.Event ? (src && src.type ? (this.originalEvent = src, 
        this.type = src.type, this.isDefaultPrevented = src.defaultPrevented || src.returnValue === !1 || src.getPreventDefault && src.getPreventDefault() ? returnTrue : returnFalse) : this.type = src, 
        props && jQuery.extend(this, props), this.timeStamp = src && src.timeStamp || jQuery.now(), 
        void (this[jQuery.expando] = !0)) : new jQuery.Event(src, props);
    }, // jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
    // http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
    jQuery.Event.prototype = {
        preventDefault: function() {
            this.isDefaultPrevented = returnTrue;
            var e = this.originalEvent;
            e && (// if preventDefault exists run it on the original event
            e.preventDefault ? e.preventDefault() : e.returnValue = !1);
        },
        stopPropagation: function() {
            this.isPropagationStopped = returnTrue;
            var e = this.originalEvent;
            e && (// if stopPropagation exists run it on the original event
            e.stopPropagation && e.stopPropagation(), // otherwise set the cancelBubble property of the original event to true (IE)
            e.cancelBubble = !0);
        },
        stopImmediatePropagation: function() {
            this.isImmediatePropagationStopped = returnTrue, this.stopPropagation();
        },
        isDefaultPrevented: returnFalse,
        isPropagationStopped: returnFalse,
        isImmediatePropagationStopped: returnFalse
    }, // Create mouseenter/leave events using mouseover/out and event-time checks
    jQuery.each({
        mouseenter: "mouseover",
        mouseleave: "mouseout"
    }, function(orig, fix) {
        jQuery.event.special[orig] = {
            delegateType: fix,
            bindType: fix,
            handle: function(event) {
                {
                    var ret, target = this, related = event.relatedTarget, handleObj = event.handleObj;
                    handleObj.selector;
                }
                // For mousenter/leave call the handler if related is outside the target.
                // NB: No relatedTarget if the mouse left/entered the browser window
                return (!related || related !== target && !jQuery.contains(target, related)) && (event.type = handleObj.origType, 
                ret = handleObj.handler.apply(this, arguments), event.type = fix), ret;
            }
        };
    }), // IE submit delegation
    jQuery.support.submitBubbles || (jQuery.event.special.submit = {
        setup: function() {
            // Only need this for delegated form submit events
            // Only need this for delegated form submit events
            // Lazy-add a submit handler when a descendant form may potentially be submitted
            return jQuery.nodeName(this, "form") ? !1 : void jQuery.event.add(this, "click._submit keypress._submit", function(e) {
                // Node name check avoids a VML-related crash in IE (#9807)
                var elem = e.target, form = jQuery.nodeName(elem, "input") || jQuery.nodeName(elem, "button") ? elem.form : undefined;
                form && !jQuery._data(form, "_submit_attached") && (jQuery.event.add(form, "submit._submit", function(event) {
                    event._submit_bubble = !0;
                }), jQuery._data(form, "_submit_attached", !0));
            });
        },
        postDispatch: function(event) {
            // If form was submitted by the user, bubble the event up the tree
            event._submit_bubble && (delete event._submit_bubble, this.parentNode && !event.isTrigger && jQuery.event.simulate("submit", this.parentNode, event, !0));
        },
        teardown: function() {
            // Only need this for delegated form submit events
            // Only need this for delegated form submit events
            // Remove delegated handlers; cleanData eventually reaps submit handlers attached above
            return jQuery.nodeName(this, "form") ? !1 : void jQuery.event.remove(this, "._submit");
        }
    }), // IE change delegation and checkbox/radio fix
    jQuery.support.changeBubbles || (jQuery.event.special.change = {
        setup: function() {
            // IE doesn't fire change on a check/radio until blur; trigger it on click
            // after a propertychange. Eat the blur-change in special.change.handle.
            // This still fires onchange a second time for check/radio after blur.
            // Delegated event; lazy-add a change handler on descendant inputs
            return rformElems.test(this.nodeName) ? (("checkbox" === this.type || "radio" === this.type) && (jQuery.event.add(this, "propertychange._change", function(event) {
                "checked" === event.originalEvent.propertyName && (this._just_changed = !0);
            }), jQuery.event.add(this, "click._change", function(event) {
                this._just_changed && !event.isTrigger && (this._just_changed = !1), // Allow triggered, simulated change events (#11500)
                jQuery.event.simulate("change", this, event, !0);
            })), !1) : void jQuery.event.add(this, "beforeactivate._change", function(e) {
                var elem = e.target;
                rformElems.test(elem.nodeName) && !jQuery._data(elem, "_change_attached") && (jQuery.event.add(elem, "change._change", function(event) {
                    !this.parentNode || event.isSimulated || event.isTrigger || jQuery.event.simulate("change", this.parentNode, event, !0);
                }), jQuery._data(elem, "_change_attached", !0));
            });
        },
        handle: function(event) {
            var elem = event.target;
            // Swallow native change events from checkbox/radio, we already triggered them above
            // Swallow native change events from checkbox/radio, we already triggered them above
            return this !== elem || event.isSimulated || event.isTrigger || "radio" !== elem.type && "checkbox" !== elem.type ? event.handleObj.handler.apply(this, arguments) : void 0;
        },
        teardown: function() {
            return jQuery.event.remove(this, "._change"), !rformElems.test(this.nodeName);
        }
    }), // Create "bubbling" focus and blur events
    jQuery.support.focusinBubbles || jQuery.each({
        focus: "focusin",
        blur: "focusout"
    }, function(orig, fix) {
        // Attach a single capturing handler while someone wants focusin/focusout
        var attaches = 0, handler = function(event) {
            jQuery.event.simulate(fix, event.target, jQuery.event.fix(event), !0);
        };
        jQuery.event.special[fix] = {
            setup: function() {
                0 === attaches++ && document.addEventListener(orig, handler, !0);
            },
            teardown: function() {
                0 === --attaches && document.removeEventListener(orig, handler, !0);
            }
        };
    }), jQuery.fn.extend({
        on: function(types, selector, data, fn, /*INTERNAL*/ one) {
            var origFn, type;
            // Types can be a map of types/handlers
            if ("object" == typeof types) {
                // ( types-Object, selector, data )
                "string" != typeof selector && (// && selector != null
                // ( types-Object, data )
                data = data || selector, selector = undefined);
                for (type in types) this.on(type, selector, data, types[type], one);
                return this;
            }
            if (null == data && null == fn ? (// ( types, fn )
            fn = selector, data = selector = undefined) : null == fn && ("string" == typeof selector ? (// ( types, selector, fn )
            fn = data, data = undefined) : (// ( types, data, fn )
            fn = data, data = selector, selector = undefined)), fn === !1) fn = returnFalse; else if (!fn) return this;
            // Use same guid so caller can remove using origFn
            return 1 === one && (origFn = fn, fn = function(event) {
                // Can use an empty set, since event contains the info
                return jQuery().off(event), origFn.apply(this, arguments);
            }, fn.guid = origFn.guid || (origFn.guid = jQuery.guid++)), this.each(function() {
                jQuery.event.add(this, types, fn, data, selector);
            });
        },
        one: function(types, selector, data, fn) {
            return this.on(types, selector, data, fn, 1);
        },
        off: function(types, selector, fn) {
            var handleObj, type;
            if (types && types.preventDefault && types.handleObj) // ( event )  dispatched jQuery.Event
            return handleObj = types.handleObj, jQuery(types.delegateTarget).off(handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType, handleObj.selector, handleObj.handler), 
            this;
            if ("object" == typeof types) {
                // ( types-object [, selector] )
                for (type in types) this.off(type, selector, types[type]);
                return this;
            }
            // ( types [, fn] )
            return (selector === !1 || "function" == typeof selector) && (fn = selector, selector = undefined), 
            fn === !1 && (fn = returnFalse), this.each(function() {
                jQuery.event.remove(this, types, fn, selector);
            });
        },
        bind: function(types, data, fn) {
            return this.on(types, null, data, fn);
        },
        unbind: function(types, fn) {
            return this.off(types, null, fn);
        },
        live: function(types, data, fn) {
            return jQuery(this.context).on(types, this.selector, data, fn), this;
        },
        die: function(types, fn) {
            return jQuery(this.context).off(types, this.selector || "**", fn), this;
        },
        delegate: function(selector, types, data, fn) {
            return this.on(types, selector, data, fn);
        },
        undelegate: function(selector, types, fn) {
            // ( namespace ) or ( selector, types [, fn] )
            return 1 === arguments.length ? this.off(selector, "**") : this.off(types, selector || "**", fn);
        },
        trigger: function(type, data) {
            return this.each(function() {
                jQuery.event.trigger(type, data, this);
            });
        },
        triggerHandler: function(type, data) {
            return this[0] ? jQuery.event.trigger(type, data, this[0], !0) : void 0;
        },
        toggle: function(fn) {
            // Save reference to arguments for access in closure
            var args = arguments, guid = fn.guid || jQuery.guid++, i = 0, toggler = function(event) {
                // Figure out which function to execute
                var lastToggle = (jQuery._data(this, "lastToggle" + fn.guid) || 0) % i;
                // and execute the function
                // Make sure that clicks stop
                return jQuery._data(this, "lastToggle" + fn.guid, lastToggle + 1), event.preventDefault(), 
                args[lastToggle].apply(this, arguments) || !1;
            };
            for (// link all the functions, so any of them can unbind this click handler
            toggler.guid = guid; i < args.length; ) args[i++].guid = guid;
            return this.click(toggler);
        },
        hover: function(fnOver, fnOut) {
            return this.mouseenter(fnOver).mouseleave(fnOut || fnOver);
        }
    }), jQuery.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "), function(i, name) {
        // Handle event binding
        jQuery.fn[name] = function(data, fn) {
            return null == fn && (fn = data, data = null), arguments.length > 0 ? this.on(name, null, data, fn) : this.trigger(name);
        }, rkeyEvent.test(name) && (jQuery.event.fixHooks[name] = jQuery.event.keyHooks), 
        rmouseEvent.test(name) && (jQuery.event.fixHooks[name] = jQuery.event.mouseHooks);
    }), /*!
 * Sizzle CSS Selector Engine
 * Copyright 2012 jQuery Foundation and other contributors
 * Released under the MIT license
 * http://sizzlejs.com/
 */
    function(window, undefined) {
        function Sizzle(selector, context, results, seed) {
            results = results || [], context = context || document;
            var match, elem, xml, m, nodeType = context.nodeType;
            if (!selector || "string" != typeof selector) return results;
            if (1 !== nodeType && 9 !== nodeType) return [];
            if (xml = isXML(context), !xml && !seed && (match = rquickExpr.exec(selector))) // Speed-up: Sizzle("#ID")
            if (m = match[1]) {
                if (9 === nodeType) {
                    // Check parentNode to catch when Blackberry 4.6 returns
                    // nodes that are no longer in the document #6963
                    if (elem = context.getElementById(m), !elem || !elem.parentNode) return results;
                    // Handle the case where IE, Opera, and Webkit return items
                    // by name instead of ID
                    if (elem.id === m) return results.push(elem), results;
                } else // Context is not a document
                if (context.ownerDocument && (elem = context.ownerDocument.getElementById(m)) && contains(context, elem) && elem.id === m) return results.push(elem), 
                results;
            } else {
                if (match[2]) return push.apply(results, slice.call(context.getElementsByTagName(selector), 0)), 
                results;
                if ((m = match[3]) && assertUsableClassName && context.getElementsByClassName) return push.apply(results, slice.call(context.getElementsByClassName(m), 0)), 
                results;
            }
            // All others
            return select(selector.replace(rtrim, "$1"), context, results, seed, xml);
        }
        // Returns a function to use in pseudos for input types
        function createInputPseudo(type) {
            return function(elem) {
                var name = elem.nodeName.toLowerCase();
                return "input" === name && elem.type === type;
            };
        }
        // Returns a function to use in pseudos for buttons
        function createButtonPseudo(type) {
            return function(elem) {
                var name = elem.nodeName.toLowerCase();
                return ("input" === name || "button" === name) && elem.type === type;
            };
        }
        // Returns a function to use in pseudos for positionals
        function createPositionalPseudo(fn) {
            return markFunction(function(argument) {
                return argument = +argument, markFunction(function(seed, matches) {
                    // Match elements found at the specified indexes
                    for (var j, matchIndexes = fn([], seed.length, argument), i = matchIndexes.length; i--; ) seed[j = matchIndexes[i]] && (seed[j] = !(matches[j] = seed[j]));
                });
            });
        }
        function siblingCheck(a, b, ret) {
            if (a === b) return ret;
            for (var cur = a.nextSibling; cur; ) {
                if (cur === b) return -1;
                cur = cur.nextSibling;
            }
            return 1;
        }
        function tokenize(selector, parseOnly) {
            var matched, match, tokens, type, soFar, groups, preFilters, cached = tokenCache[expando][selector + " "];
            if (cached) return parseOnly ? 0 : cached.slice(0);
            for (soFar = selector, groups = [], preFilters = Expr.preFilter; soFar; ) {
                // Comma and first run
                (!matched || (match = rcomma.exec(soFar))) && (match && (// Don't consume trailing commas as valid
                soFar = soFar.slice(match[0].length) || soFar), groups.push(tokens = [])), matched = !1, 
                // Combinators
                (match = rcombinators.exec(soFar)) && (tokens.push(matched = new Token(match.shift())), 
                soFar = soFar.slice(matched.length), // Cast descendant combinators to space
                matched.type = match[0].replace(rtrim, " "));
                // Filters
                for (type in Expr.filter) !(match = matchExpr[type].exec(soFar)) || preFilters[type] && !(match = preFilters[type](match)) || (tokens.push(matched = new Token(match.shift())), 
                soFar = soFar.slice(matched.length), matched.type = type, matched.matches = match);
                if (!matched) break;
            }
            // Return the length of the invalid excess
            // if we're just parsing
            // Otherwise, throw an error or return tokens
            // Cache the tokens
            return parseOnly ? soFar.length : soFar ? Sizzle.error(selector) : tokenCache(selector, groups).slice(0);
        }
        function addCombinator(matcher, combinator, base) {
            var dir = combinator.dir, checkNonElements = base && "parentNode" === combinator.dir, doneName = done++;
            // Check against closest ancestor/preceding element
            // Check against all ancestor/preceding elements
            return combinator.first ? function(elem, context, xml) {
                for (;elem = elem[dir]; ) if (checkNonElements || 1 === elem.nodeType) return matcher(elem, context, xml);
            } : function(elem, context, xml) {
                // We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
                if (xml) {
                    for (;elem = elem[dir]; ) if ((checkNonElements || 1 === elem.nodeType) && matcher(elem, context, xml)) return elem;
                } else for (var cache, dirkey = dirruns + " " + doneName + " ", cachedkey = dirkey + cachedruns; elem = elem[dir]; ) if (checkNonElements || 1 === elem.nodeType) {
                    if ((cache = elem[expando]) === cachedkey) return elem.sizset;
                    if ("string" == typeof cache && 0 === cache.indexOf(dirkey)) {
                        if (elem.sizset) return elem;
                    } else {
                        if (elem[expando] = cachedkey, matcher(elem, context, xml)) return elem.sizset = !0, 
                        elem;
                        elem.sizset = !1;
                    }
                }
            };
        }
        function elementMatcher(matchers) {
            return matchers.length > 1 ? function(elem, context, xml) {
                for (var i = matchers.length; i--; ) if (!matchers[i](elem, context, xml)) return !1;
                return !0;
            } : matchers[0];
        }
        function condense(unmatched, map, filter, context, xml) {
            for (var elem, newUnmatched = [], i = 0, len = unmatched.length, mapped = null != map; len > i; i++) (elem = unmatched[i]) && (!filter || filter(elem, context, xml)) && (newUnmatched.push(elem), 
            mapped && map.push(i));
            return newUnmatched;
        }
        function setMatcher(preFilter, selector, matcher, postFilter, postFinder, postSelector) {
            return postFilter && !postFilter[expando] && (postFilter = setMatcher(postFilter)), 
            postFinder && !postFinder[expando] && (postFinder = setMatcher(postFinder, postSelector)), 
            markFunction(function(seed, results, context, xml) {
                var temp, i, elem, preMap = [], postMap = [], preexisting = results.length, // Get initial elements from seed or context
                elems = seed || multipleContexts(selector || "*", context.nodeType ? [ context ] : context, []), // Prefilter to get matcher input, preserving a map for seed-results synchronization
                matcherIn = !preFilter || !seed && selector ? elems : condense(elems, preMap, preFilter, context, xml), matcherOut = matcher ? // If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
                postFinder || (seed ? preFilter : preexisting || postFilter) ? // ...intermediate processing is necessary
                [] : // ...otherwise use results directly
                results : matcherIn;
                // Apply postFilter
                if (// Find primary matches
                matcher && matcher(matcherIn, matcherOut, context, xml), postFilter) for (temp = condense(matcherOut, postMap), 
                postFilter(temp, [], context, xml), // Un-match failing elements by moving them back to matcherIn
                i = temp.length; i--; ) (elem = temp[i]) && (matcherOut[postMap[i]] = !(matcherIn[postMap[i]] = elem));
                if (seed) {
                    if (postFinder || preFilter) {
                        if (postFinder) {
                            for (// Get the final matcherOut by condensing this intermediate into postFinder contexts
                            temp = [], i = matcherOut.length; i--; ) (elem = matcherOut[i]) && // Restore matcherIn since elem is not yet a final match
                            temp.push(matcherIn[i] = elem);
                            postFinder(null, matcherOut = [], temp, xml);
                        }
                        for (// Move matched elements from seed to results to keep them synchronized
                        i = matcherOut.length; i--; ) (elem = matcherOut[i]) && (temp = postFinder ? indexOf.call(seed, elem) : preMap[i]) > -1 && (seed[temp] = !(results[temp] = elem));
                    }
                } else matcherOut = condense(matcherOut === results ? matcherOut.splice(preexisting, matcherOut.length) : matcherOut), 
                postFinder ? postFinder(null, results, matcherOut, xml) : push.apply(results, matcherOut);
            });
        }
        function matcherFromTokens(tokens) {
            for (var checkContext, matcher, j, len = tokens.length, leadingRelative = Expr.relative[tokens[0].type], implicitRelative = leadingRelative || Expr.relative[" "], i = leadingRelative ? 1 : 0, // The foundational matcher ensures that elements are reachable from top-level context(s)
            matchContext = addCombinator(function(elem) {
                return elem === checkContext;
            }, implicitRelative, !0), matchAnyContext = addCombinator(function(elem) {
                return indexOf.call(checkContext, elem) > -1;
            }, implicitRelative, !0), matchers = [ function(elem, context, xml) {
                return !leadingRelative && (xml || context !== outermostContext) || ((checkContext = context).nodeType ? matchContext(elem, context, xml) : matchAnyContext(elem, context, xml));
            } ]; len > i; i++) if (matcher = Expr.relative[tokens[i].type]) matchers = [ addCombinator(elementMatcher(matchers), matcher) ]; else {
                // Return special upon seeing a positional matcher
                if (matcher = Expr.filter[tokens[i].type].apply(null, tokens[i].matches), matcher[expando]) {
                    for (// Find the next relative operator (if any) for proper handling
                    j = ++i; len > j && !Expr.relative[tokens[j].type]; j++) ;
                    return setMatcher(i > 1 && elementMatcher(matchers), i > 1 && tokens.slice(0, i - 1).join("").replace(rtrim, "$1"), matcher, j > i && matcherFromTokens(tokens.slice(i, j)), len > j && matcherFromTokens(tokens = tokens.slice(j)), len > j && tokens.join(""));
                }
                matchers.push(matcher);
            }
            return elementMatcher(matchers);
        }
        function matcherFromGroupMatchers(elementMatchers, setMatchers) {
            var bySet = setMatchers.length > 0, byElement = elementMatchers.length > 0, superMatcher = function(seed, context, xml, results, expandContext) {
                var elem, j, matcher, setMatched = [], matchedCount = 0, i = "0", unmatched = seed && [], outermost = null != expandContext, contextBackup = outermostContext, // We must always have either seed elements or context
                elems = seed || byElement && Expr.find.TAG("*", expandContext && context.parentNode || context), // Nested matchers should use non-integer dirruns
                dirrunsUnique = dirruns += null == contextBackup ? 1 : Math.E;
                // Add elements passing elementMatchers directly to results
                for (outermost && (outermostContext = context !== document && context, cachedruns = superMatcher.el); null != (elem = elems[i]); i++) {
                    if (byElement && elem) {
                        for (j = 0; matcher = elementMatchers[j]; j++) if (matcher(elem, context, xml)) {
                            results.push(elem);
                            break;
                        }
                        outermost && (dirruns = dirrunsUnique, cachedruns = ++superMatcher.el);
                    }
                    // Track unmatched elements for set filters
                    bySet && (// They will have gone through all possible matchers
                    (elem = !matcher && elem) && matchedCount--, // Lengthen the array for every element, matched or not
                    seed && unmatched.push(elem));
                }
                if (// Apply set filters to unmatched elements
                matchedCount += i, bySet && i !== matchedCount) {
                    for (j = 0; matcher = setMatchers[j]; j++) matcher(unmatched, setMatched, context, xml);
                    if (seed) {
                        // Reintegrate element matches to eliminate the need for sorting
                        if (matchedCount > 0) for (;i--; ) unmatched[i] || setMatched[i] || (setMatched[i] = pop.call(results));
                        // Discard index placeholder values to get only actual matches
                        setMatched = condense(setMatched);
                    }
                    // Add matches to results
                    push.apply(results, setMatched), // Seedless set matches succeeding multiple successful matchers stipulate sorting
                    outermost && !seed && setMatched.length > 0 && matchedCount + setMatchers.length > 1 && Sizzle.uniqueSort(results);
                }
                // Override manipulation of globals by nested matchers
                return outermost && (dirruns = dirrunsUnique, outermostContext = contextBackup), 
                unmatched;
            };
            return superMatcher.el = 0, bySet ? markFunction(superMatcher) : superMatcher;
        }
        function multipleContexts(selector, contexts, results) {
            for (var i = 0, len = contexts.length; len > i; i++) Sizzle(selector, contexts[i], results);
            return results;
        }
        function select(selector, context, results, seed, xml) {
            {
                var i, tokens, token, type, find, match = tokenize(selector);
                match.length;
            }
            if (!seed && 1 === match.length) {
                if (// Take a shortcut and set the context if the root selector is an ID
                tokens = match[0] = match[0].slice(0), tokens.length > 2 && "ID" === (token = tokens[0]).type && 9 === context.nodeType && !xml && Expr.relative[tokens[1].type]) {
                    if (context = Expr.find.ID(token.matches[0].replace(rbackslash, ""), context, xml)[0], 
                    !context) return results;
                    selector = selector.slice(tokens.shift().length);
                }
                // Fetch a seed set for right-to-left matching
                for (i = matchExpr.POS.test(selector) ? -1 : tokens.length - 1; i >= 0 && (token = tokens[i], 
                !Expr.relative[type = token.type]); i--) if ((find = Expr.find[type]) && (seed = find(token.matches[0].replace(rbackslash, ""), rsibling.test(tokens[0].type) && context.parentNode || context, xml))) {
                    if (// If seed is empty or no tokens remain, we can return early
                    tokens.splice(i, 1), selector = seed.length && tokens.join(""), !selector) return push.apply(results, slice.call(seed, 0)), 
                    results;
                    break;
                }
            }
            // Compile and execute a filtering function
            // Provide `match` to avoid retokenization if we modified the selector above
            return compile(selector, match)(seed, context, xml, results, rsibling.test(selector)), 
            results;
        }
        // Back-compat
        function setFilters() {}
        var cachedruns, assertGetIdNotName, Expr, getText, isXML, contains, compile, sortOrder, hasDuplicate, outermostContext, baseHasDuplicate = !0, strundefined = "undefined", expando = ("sizcache" + Math.random()).replace(".", ""), Token = String, document = window.document, docElem = document.documentElement, dirruns = 0, done = 0, pop = [].pop, push = [].push, slice = [].slice, // Use a stripped-down indexOf if a native one is unavailable
        indexOf = [].indexOf || function(elem) {
            for (var i = 0, len = this.length; len > i; i++) if (this[i] === elem) return i;
            return -1;
        }, // Augment a function for special use by Sizzle
        markFunction = function(fn, value) {
            return fn[expando] = null == value || value, fn;
        }, createCache = function() {
            var cache = {}, keys = [];
            return markFunction(function(key, value) {
                // Retrieve with (key + " ") to avoid collision with native Object.prototype properties (see Issue #157)
                // Only keep the most recent entries
                return keys.push(key) > Expr.cacheLength && delete cache[keys.shift()], cache[key + " "] = value;
            }, cache);
        }, classCache = createCache(), tokenCache = createCache(), compilerCache = createCache(), // Regex
        // Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
        whitespace = "[\\x20\\t\\r\\n\\f]", // http://www.w3.org/TR/css3-syntax/#characters
        characterEncoding = "(?:\\\\.|[-\\w]|[^\\x00-\\xa0])+", // Loosely modeled on CSS identifier characters
        // An unquoted value should be a CSS identifier (http://www.w3.org/TR/css3-selectors/#attribute-selectors)
        // Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
        identifier = characterEncoding.replace("w", "w#"), // Acceptable operators http://www.w3.org/TR/selectors/#attribute-selectors
        operators = "([*^$|!~]?=)", attributes = "\\[" + whitespace + "*(" + characterEncoding + ")" + whitespace + "*(?:" + operators + whitespace + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + identifier + ")|)|)" + whitespace + "*\\]", // Prefer arguments not in parens/brackets,
        //   then attribute selectors and non-pseudos (denoted by :),
        //   then anything else
        // These preferences are here to reduce the number of selectors
        //   needing tokenize in the PSEUDO preFilter
        pseudos = ":(" + characterEncoding + ")(?:\\((?:(['\"])((?:\\\\.|[^\\\\])*?)\\2|([^()[\\]]*|(?:(?:" + attributes + ")|[^:]|\\\\.)*|.*))\\)|)", // For matchExpr.POS and matchExpr.needsContext
        pos = ":(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", // Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
        rtrim = new RegExp("^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g"), rcomma = new RegExp("^" + whitespace + "*," + whitespace + "*"), rcombinators = new RegExp("^" + whitespace + "*([\\x20\\t\\r\\n\\f>+~])" + whitespace + "*"), rpseudo = new RegExp(pseudos), // Easily-parseable/retrievable ID or TAG or CLASS selectors
        rquickExpr = /^(?:#([\w\-]+)|(\w+)|\.([\w\-]+))$/, rsibling = /[\x20\t\r\n\f]*[+~]/, rheader = /h\d/i, rinputs = /input|select|textarea|button/i, rbackslash = /\\(?!\\)/g, matchExpr = {
            ID: new RegExp("^#(" + characterEncoding + ")"),
            CLASS: new RegExp("^\\.(" + characterEncoding + ")"),
            NAME: new RegExp("^\\[name=['\"]?(" + characterEncoding + ")['\"]?\\]"),
            TAG: new RegExp("^(" + characterEncoding.replace("w", "w*") + ")"),
            ATTR: new RegExp("^" + attributes),
            PSEUDO: new RegExp("^" + pseudos),
            POS: new RegExp(pos, "i"),
            CHILD: new RegExp("^:(only|nth|first|last)-child(?:\\(" + whitespace + "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace + "*(\\d+)|))" + whitespace + "*\\)|)", "i"),
            // For use in libraries implementing .is()
            needsContext: new RegExp("^" + whitespace + "*[>+~]|" + pos, "i")
        }, // Support
        // Used for testing something on an element
        assert = function(fn) {
            var div = document.createElement("div");
            try {
                return fn(div);
            } catch (e) {
                return !1;
            } finally {
                // release memory in IE
                div = null;
            }
        }, // Check if getElementsByTagName("*") returns only elements
        assertTagNameNoComments = assert(function(div) {
            return div.appendChild(document.createComment("")), !div.getElementsByTagName("*").length;
        }), // Check if getAttribute returns normalized href attributes
        assertHrefNotNormalized = assert(function(div) {
            return div.innerHTML = "<a href='#'></a>", div.firstChild && typeof div.firstChild.getAttribute !== strundefined && "#" === div.firstChild.getAttribute("href");
        }), // Check if attributes should be retrieved by attribute nodes
        assertAttributes = assert(function(div) {
            div.innerHTML = "<select></select>";
            var type = typeof div.lastChild.getAttribute("multiple");
            // IE8 returns a string for some attributes even when not present
            return "boolean" !== type && "string" !== type;
        }), // Check if getElementsByClassName can be trusted
        assertUsableClassName = assert(function(div) {
            // Opera can't find a second classname (in 9.6)
            // Safari 3.2 caches class attributes and doesn't catch changes
            return div.innerHTML = "<div class='hidden e'></div><div class='hidden'></div>", 
            div.getElementsByClassName && div.getElementsByClassName("e").length ? (div.lastChild.className = "e", 
            2 === div.getElementsByClassName("e").length) : !1;
        }), // Check if getElementById returns elements by name
        // Check if getElementsByName privileges form controls or returns elements by ID
        assertUsableName = assert(function(div) {
            // Inject content
            div.id = expando + 0, div.innerHTML = "<a name='" + expando + "'></a><div name='" + expando + "'></div>", 
            docElem.insertBefore(div, docElem.firstChild);
            // Test
            var pass = document.getElementsByName && // buggy browsers will return fewer than the correct 2
            document.getElementsByName(expando).length === 2 + // buggy browsers will return more than the correct 0
            document.getElementsByName(expando + 0).length;
            // Cleanup
            return assertGetIdNotName = !document.getElementById(expando), docElem.removeChild(div), 
            pass;
        });
        // If slice is not available, provide a backup
        try {
            slice.call(docElem.childNodes, 0)[0].nodeType;
        } catch (e) {
            slice = function(i) {
                for (var elem, results = []; elem = this[i]; i++) results.push(elem);
                return results;
            };
        }
        Sizzle.matches = function(expr, elements) {
            return Sizzle(expr, null, null, elements);
        }, Sizzle.matchesSelector = function(elem, expr) {
            return Sizzle(expr, null, null, [ elem ]).length > 0;
        }, /**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
        getText = Sizzle.getText = function(elem) {
            var node, ret = "", i = 0, nodeType = elem.nodeType;
            if (nodeType) {
                if (1 === nodeType || 9 === nodeType || 11 === nodeType) {
                    // Use textContent for elements
                    // innerText usage removed for consistency of new lines (see #11153)
                    if ("string" == typeof elem.textContent) return elem.textContent;
                    // Traverse its children
                    for (elem = elem.firstChild; elem; elem = elem.nextSibling) ret += getText(elem);
                } else if (3 === nodeType || 4 === nodeType) return elem.nodeValue;
            } else // If no nodeType, this is expected to be an array
            for (;node = elem[i]; i++) // Do not traverse comment nodes
            ret += getText(node);
            return ret;
        }, isXML = Sizzle.isXML = function(elem) {
            // documentElement is verified for cases where it doesn't yet exist
            // (such as loading iframes in IE - #4833)
            var documentElement = elem && (elem.ownerDocument || elem).documentElement;
            return documentElement ? "HTML" !== documentElement.nodeName : !1;
        }, // Element contains another
        contains = Sizzle.contains = docElem.contains ? function(a, b) {
            var adown = 9 === a.nodeType ? a.documentElement : a, bup = b && b.parentNode;
            return a === bup || !!(bup && 1 === bup.nodeType && adown.contains && adown.contains(bup));
        } : docElem.compareDocumentPosition ? function(a, b) {
            return b && !!(16 & a.compareDocumentPosition(b));
        } : function(a, b) {
            for (;b = b.parentNode; ) if (b === a) return !0;
            return !1;
        }, Sizzle.attr = function(elem, name) {
            var val, xml = isXML(elem);
            return xml || (name = name.toLowerCase()), (val = Expr.attrHandle[name]) ? val(elem) : xml || assertAttributes ? elem.getAttribute(name) : (val = elem.getAttributeNode(name), 
            val ? "boolean" == typeof elem[name] ? elem[name] ? name : null : val.specified ? val.value : null : null);
        }, Expr = Sizzle.selectors = {
            // Can be adjusted by the user
            cacheLength: 50,
            createPseudo: markFunction,
            match: matchExpr,
            // IE6/7 return a modified href
            attrHandle: assertHrefNotNormalized ? {} : {
                href: function(elem) {
                    return elem.getAttribute("href", 2);
                },
                type: function(elem) {
                    return elem.getAttribute("type");
                }
            },
            find: {
                ID: assertGetIdNotName ? function(id, context, xml) {
                    if (typeof context.getElementById !== strundefined && !xml) {
                        var m = context.getElementById(id);
                        // Check parentNode to catch when Blackberry 4.6 returns
                        // nodes that are no longer in the document #6963
                        return m && m.parentNode ? [ m ] : [];
                    }
                } : function(id, context, xml) {
                    if (typeof context.getElementById !== strundefined && !xml) {
                        var m = context.getElementById(id);
                        return m ? m.id === id || typeof m.getAttributeNode !== strundefined && m.getAttributeNode("id").value === id ? [ m ] : undefined : [];
                    }
                },
                TAG: assertTagNameNoComments ? function(tag, context) {
                    return typeof context.getElementsByTagName !== strundefined ? context.getElementsByTagName(tag) : void 0;
                } : function(tag, context) {
                    var results = context.getElementsByTagName(tag);
                    // Filter out possible comments
                    if ("*" === tag) {
                        for (var elem, tmp = [], i = 0; elem = results[i]; i++) 1 === elem.nodeType && tmp.push(elem);
                        return tmp;
                    }
                    return results;
                },
                NAME: assertUsableName && function(tag, context) {
                    return typeof context.getElementsByName !== strundefined ? context.getElementsByName(name) : void 0;
                },
                CLASS: assertUsableClassName && function(className, context, xml) {
                    return typeof context.getElementsByClassName === strundefined || xml ? void 0 : context.getElementsByClassName(className);
                }
            },
            relative: {
                ">": {
                    dir: "parentNode",
                    first: !0
                },
                " ": {
                    dir: "parentNode"
                },
                "+": {
                    dir: "previousSibling",
                    first: !0
                },
                "~": {
                    dir: "previousSibling"
                }
            },
            preFilter: {
                ATTR: function(match) {
                    // Move the given value to match[3] whether quoted or unquoted
                    return match[1] = match[1].replace(rbackslash, ""), match[3] = (match[4] || match[5] || "").replace(rbackslash, ""), 
                    "~=" === match[2] && (match[3] = " " + match[3] + " "), match.slice(0, 4);
                },
                CHILD: function(match) {
                    /* matches from matchExpr["CHILD"]
                                1 type (only|nth|...)
                                2 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
                                3 xn-component of xn+y argument ([+-]?\d*n|)
                                4 sign of xn-component
                                5 x of xn-component
                                6 sign of y-component
                                7 y of y-component
                        */
                    // nth-child requires argument
                    // numeric x and y parameters for Expr.filter.CHILD
                    // remember that false/true cast respectively to 0/1
                    return match[1] = match[1].toLowerCase(), "nth" === match[1] ? (match[2] || Sizzle.error(match[0]), 
                    match[3] = +(match[3] ? match[4] + (match[5] || 1) : 2 * ("even" === match[2] || "odd" === match[2])), 
                    match[4] = +(match[6] + match[7] || "odd" === match[2])) : match[2] && Sizzle.error(match[0]), 
                    match;
                },
                PSEUDO: function(match) {
                    var unquoted, excess;
                    // Only check arguments that contain a pseudo
                    // Get excess from tokenize (recursively)
                    // advance to the next closing parenthesis
                    // excess is a negative index
                    return matchExpr.CHILD.test(match[0]) ? null : (match[3] ? match[2] = match[3] : (unquoted = match[4]) && (rpseudo.test(unquoted) && (excess = tokenize(unquoted, !0)) && (excess = unquoted.indexOf(")", unquoted.length - excess) - unquoted.length) && (unquoted = unquoted.slice(0, excess), 
                    match[0] = match[0].slice(0, excess)), match[2] = unquoted), match.slice(0, 3));
                }
            },
            filter: {
                ID: assertGetIdNotName ? function(id) {
                    return id = id.replace(rbackslash, ""), function(elem) {
                        return elem.getAttribute("id") === id;
                    };
                } : function(id) {
                    return id = id.replace(rbackslash, ""), function(elem) {
                        var node = typeof elem.getAttributeNode !== strundefined && elem.getAttributeNode("id");
                        return node && node.value === id;
                    };
                },
                TAG: function(nodeName) {
                    return "*" === nodeName ? function() {
                        return !0;
                    } : (nodeName = nodeName.replace(rbackslash, "").toLowerCase(), function(elem) {
                        return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
                    });
                },
                CLASS: function(className) {
                    var pattern = classCache[expando][className + " "];
                    return pattern || (pattern = new RegExp("(^|" + whitespace + ")" + className + "(" + whitespace + "|$)")) && classCache(className, function(elem) {
                        return pattern.test(elem.className || typeof elem.getAttribute !== strundefined && elem.getAttribute("class") || "");
                    });
                },
                ATTR: function(name, operator, check) {
                    return function(elem) {
                        var result = Sizzle.attr(elem, name);
                        return null == result ? "!=" === operator : operator ? (result += "", "=" === operator ? result === check : "!=" === operator ? result !== check : "^=" === operator ? check && 0 === result.indexOf(check) : "*=" === operator ? check && result.indexOf(check) > -1 : "$=" === operator ? check && result.substr(result.length - check.length) === check : "~=" === operator ? (" " + result + " ").indexOf(check) > -1 : "|=" === operator ? result === check || result.substr(0, check.length + 1) === check + "-" : !1) : !0;
                    };
                },
                CHILD: function(type, argument, first, last) {
                    return "nth" === type ? function(elem) {
                        var node, diff, parent = elem.parentNode;
                        if (1 === first && 0 === last) return !0;
                        if (parent) for (diff = 0, node = parent.firstChild; node && (1 !== node.nodeType || (diff++, 
                        elem !== node)); node = node.nextSibling) ;
                        // Incorporate the offset (or cast to NaN), then check against cycle size
                        return diff -= last, diff === first || diff % first === 0 && diff / first >= 0;
                    } : function(elem) {
                        var node = elem;
                        switch (type) {
                          case "only":
                          case "first":
                            for (;node = node.previousSibling; ) if (1 === node.nodeType) return !1;
                            if ("first" === type) return !0;
                            node = elem;

                          /* falls through */
                            case "last":
                            for (;node = node.nextSibling; ) if (1 === node.nodeType) return !1;
                            return !0;
                        }
                    };
                },
                PSEUDO: function(pseudo, argument) {
                    // pseudo-class names are case-insensitive
                    // http://www.w3.org/TR/selectors/#pseudo-classes
                    // Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
                    // Remember that setFilters inherits from pseudos
                    var args, fn = Expr.pseudos[pseudo] || Expr.setFilters[pseudo.toLowerCase()] || Sizzle.error("unsupported pseudo: " + pseudo);
                    // The user may use createPseudo to indicate that
                    // arguments are needed to create the filter function
                    // just as Sizzle does
                    // The user may use createPseudo to indicate that
                    // arguments are needed to create the filter function
                    // just as Sizzle does
                    // But maintain support for old signatures
                    return fn[expando] ? fn(argument) : fn.length > 1 ? (args = [ pseudo, pseudo, "", argument ], 
                    Expr.setFilters.hasOwnProperty(pseudo.toLowerCase()) ? markFunction(function(seed, matches) {
                        for (var idx, matched = fn(seed, argument), i = matched.length; i--; ) idx = indexOf.call(seed, matched[i]), 
                        seed[idx] = !(matches[idx] = matched[i]);
                    }) : function(elem) {
                        return fn(elem, 0, args);
                    }) : fn;
                }
            },
            pseudos: {
                not: markFunction(function(selector) {
                    // Trim the selector passed to compile
                    // to avoid treating leading and trailing
                    // spaces as combinators
                    var input = [], results = [], matcher = compile(selector.replace(rtrim, "$1"));
                    return matcher[expando] ? markFunction(function(seed, matches, context, xml) {
                        // Match elements unmatched by `matcher`
                        for (var elem, unmatched = matcher(seed, null, xml, []), i = seed.length; i--; ) (elem = unmatched[i]) && (seed[i] = !(matches[i] = elem));
                    }) : function(elem, context, xml) {
                        return input[0] = elem, matcher(input, null, xml, results), !results.pop();
                    };
                }),
                has: markFunction(function(selector) {
                    return function(elem) {
                        return Sizzle(selector, elem).length > 0;
                    };
                }),
                contains: markFunction(function(text) {
                    return function(elem) {
                        return (elem.textContent || elem.innerText || getText(elem)).indexOf(text) > -1;
                    };
                }),
                enabled: function(elem) {
                    return elem.disabled === !1;
                },
                disabled: function(elem) {
                    return elem.disabled === !0;
                },
                checked: function(elem) {
                    // In CSS3, :checked should return both checked and selected elements
                    // http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
                    var nodeName = elem.nodeName.toLowerCase();
                    return "input" === nodeName && !!elem.checked || "option" === nodeName && !!elem.selected;
                },
                selected: function(elem) {
                    // Accessing this property makes selected-by-default
                    // options in Safari work properly
                    return elem.parentNode && elem.parentNode.selectedIndex, elem.selected === !0;
                },
                parent: function(elem) {
                    return !Expr.pseudos.empty(elem);
                },
                empty: function(elem) {
                    // http://www.w3.org/TR/selectors/#empty-pseudo
                    // :empty is only affected by element nodes and content nodes(including text(3), cdata(4)),
                    //   not comment, processing instructions, or others
                    // Thanks to Diego Perini for the nodeName shortcut
                    //   Greater than "@" means alpha characters (specifically not starting with "#" or "?")
                    var nodeType;
                    for (elem = elem.firstChild; elem; ) {
                        if (elem.nodeName > "@" || 3 === (nodeType = elem.nodeType) || 4 === nodeType) return !1;
                        elem = elem.nextSibling;
                    }
                    return !0;
                },
                header: function(elem) {
                    return rheader.test(elem.nodeName);
                },
                text: function(elem) {
                    var type, attr;
                    // IE6 and 7 will map elem.type to 'text' for new HTML5 types (search, etc)
                    // use getAttribute instead to test this case
                    return "input" === elem.nodeName.toLowerCase() && "text" === (type = elem.type) && (null == (attr = elem.getAttribute("type")) || attr.toLowerCase() === type);
                },
                // Input types
                radio: createInputPseudo("radio"),
                checkbox: createInputPseudo("checkbox"),
                file: createInputPseudo("file"),
                password: createInputPseudo("password"),
                image: createInputPseudo("image"),
                submit: createButtonPseudo("submit"),
                reset: createButtonPseudo("reset"),
                button: function(elem) {
                    var name = elem.nodeName.toLowerCase();
                    return "input" === name && "button" === elem.type || "button" === name;
                },
                input: function(elem) {
                    return rinputs.test(elem.nodeName);
                },
                focus: function(elem) {
                    var doc = elem.ownerDocument;
                    return elem === doc.activeElement && (!doc.hasFocus || doc.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
                },
                active: function(elem) {
                    return elem === elem.ownerDocument.activeElement;
                },
                // Positional types
                first: createPositionalPseudo(function() {
                    return [ 0 ];
                }),
                last: createPositionalPseudo(function(matchIndexes, length) {
                    return [ length - 1 ];
                }),
                eq: createPositionalPseudo(function(matchIndexes, length, argument) {
                    return [ 0 > argument ? argument + length : argument ];
                }),
                even: createPositionalPseudo(function(matchIndexes, length) {
                    for (var i = 0; length > i; i += 2) matchIndexes.push(i);
                    return matchIndexes;
                }),
                odd: createPositionalPseudo(function(matchIndexes, length) {
                    for (var i = 1; length > i; i += 2) matchIndexes.push(i);
                    return matchIndexes;
                }),
                lt: createPositionalPseudo(function(matchIndexes, length, argument) {
                    for (var i = 0 > argument ? argument + length : argument; --i >= 0; ) matchIndexes.push(i);
                    return matchIndexes;
                }),
                gt: createPositionalPseudo(function(matchIndexes, length, argument) {
                    for (var i = 0 > argument ? argument + length : argument; ++i < length; ) matchIndexes.push(i);
                    return matchIndexes;
                })
            }
        }, sortOrder = docElem.compareDocumentPosition ? function(a, b) {
            return a === b ? (hasDuplicate = !0, 0) : (a.compareDocumentPosition && b.compareDocumentPosition ? 4 & a.compareDocumentPosition(b) : a.compareDocumentPosition) ? -1 : 1;
        } : function(a, b) {
            // The nodes are identical, we can exit early
            if (a === b) return hasDuplicate = !0, 0;
            if (a.sourceIndex && b.sourceIndex) return a.sourceIndex - b.sourceIndex;
            var al, bl, ap = [], bp = [], aup = a.parentNode, bup = b.parentNode, cur = aup;
            // If the nodes are siblings (or identical) we can do a quick check
            if (aup === bup) return siblingCheck(a, b);
            if (!aup) return -1;
            if (!bup) return 1;
            // Otherwise they're somewhere else in the tree so we need
            // to build up a full list of the parentNodes for comparison
            for (;cur; ) ap.unshift(cur), cur = cur.parentNode;
            for (cur = bup; cur; ) bp.unshift(cur), cur = cur.parentNode;
            al = ap.length, bl = bp.length;
            // Start walking down the tree looking for a discrepancy
            for (var i = 0; al > i && bl > i; i++) if (ap[i] !== bp[i]) return siblingCheck(ap[i], bp[i]);
            // We ended someplace up the tree so do a sibling check
            return i === al ? siblingCheck(a, bp[i], -1) : siblingCheck(ap[i], b, 1);
        }, // Always assume the presence of duplicates if sort doesn't
        // pass them to our comparison function (as in Google Chrome).
        [ 0, 0 ].sort(sortOrder), baseHasDuplicate = !hasDuplicate, // Document sorting and removing duplicates
        Sizzle.uniqueSort = function(results) {
            var elem, duplicates = [], i = 1, j = 0;
            if (hasDuplicate = baseHasDuplicate, results.sort(sortOrder), hasDuplicate) {
                for (;elem = results[i]; i++) elem === results[i - 1] && (j = duplicates.push(i));
                for (;j--; ) results.splice(duplicates[j], 1);
            }
            return results;
        }, Sizzle.error = function(msg) {
            throw new Error("Syntax error, unrecognized expression: " + msg);
        }, compile = Sizzle.compile = function(selector, group) {
            var i, setMatchers = [], elementMatchers = [], cached = compilerCache[expando][selector + " "];
            if (!cached) {
                for (// Generate a function of recursive functions that can be used to check each element
                group || (group = tokenize(selector)), i = group.length; i--; ) cached = matcherFromTokens(group[i]), 
                cached[expando] ? setMatchers.push(cached) : elementMatchers.push(cached);
                // Cache the compiled function
                cached = compilerCache(selector, matcherFromGroupMatchers(elementMatchers, setMatchers));
            }
            return cached;
        }, document.querySelectorAll && !function() {
            var disconnectedMatch, oldSelect = select, rescape = /'|\\/g, rattributeQuotes = /\=[\x20\t\r\n\f]*([^'"\]]*)[\x20\t\r\n\f]*\]/g, // qSa(:focus) reports false when true (Chrome 21), no need to also add to buggyMatches since matches checks buggyQSA
            // A support test would require too much code (would include document ready)
            rbuggyQSA = [ ":focus" ], // matchesSelector(:active) reports false when true (IE9/Opera 11.5)
            // A support test would require too much code (would include document ready)
            // just skip matchesSelector for :active
            rbuggyMatches = [ ":active" ], matches = docElem.matchesSelector || docElem.mozMatchesSelector || docElem.webkitMatchesSelector || docElem.oMatchesSelector || docElem.msMatchesSelector;
            // Build QSA regex
            // Regex strategy adopted from Diego Perini
            assert(function(div) {
                // Select is set to empty string on purpose
                // This is to test IE's treatment of not explictly
                // setting a boolean content attribute,
                // since its presence should be enough
                // http://bugs.jquery.com/ticket/12359
                div.innerHTML = "<select><option selected=''></option></select>", // IE8 - Some boolean attributes are not treated correctly
                div.querySelectorAll("[selected]").length || rbuggyQSA.push("\\[" + whitespace + "*(?:checked|disabled|ismap|multiple|readonly|selected|value)"), 
                // Webkit/Opera - :checked should return selected option elements
                // http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
                // IE8 throws error here (do not put tests after this one)
                div.querySelectorAll(":checked").length || rbuggyQSA.push(":checked");
            }), assert(function(div) {
                // Opera 10-12/IE9 - ^= $= *= and empty values
                // Should not select anything
                div.innerHTML = "<p test=''></p>", div.querySelectorAll("[test^='']").length && rbuggyQSA.push("[*^$]=" + whitespace + "*(?:\"\"|'')"), 
                // FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
                // IE8 throws error here (do not put tests after this one)
                div.innerHTML = "<input type='hidden'/>", div.querySelectorAll(":enabled").length || rbuggyQSA.push(":enabled", ":disabled");
            }), // rbuggyQSA always contains :focus, so no need for a length check
            rbuggyQSA = /* rbuggyQSA.length && */ new RegExp(rbuggyQSA.join("|")), select = function(selector, context, results, seed, xml) {
                // Only use querySelectorAll when not filtering,
                // when this is not xml,
                // and when no QSA bugs apply
                if (!seed && !xml && !rbuggyQSA.test(selector)) {
                    var groups, i, old = !0, nid = expando, newContext = context, newSelector = 9 === context.nodeType && selector;
                    // qSA works strangely on Element-rooted queries
                    // We can work around this by specifying an extra ID on the root
                    // and working up from there (Thanks to Andrew Dupont for the technique)
                    // IE 8 doesn't work on object elements
                    if (1 === context.nodeType && "object" !== context.nodeName.toLowerCase()) {
                        for (groups = tokenize(selector), (old = context.getAttribute("id")) ? nid = old.replace(rescape, "\\$&") : context.setAttribute("id", nid), 
                        nid = "[id='" + nid + "'] ", i = groups.length; i--; ) groups[i] = nid + groups[i].join("");
                        newContext = rsibling.test(selector) && context.parentNode || context, newSelector = groups.join(",");
                    }
                    if (newSelector) try {
                        return push.apply(results, slice.call(newContext.querySelectorAll(newSelector), 0)), 
                        results;
                    } catch (qsaError) {} finally {
                        old || context.removeAttribute("id");
                    }
                }
                return oldSelect(selector, context, results, seed, xml);
            }, matches && (assert(function(div) {
                // Check to see if it's possible to do matchesSelector
                // on a disconnected node (IE 9)
                disconnectedMatch = matches.call(div, "div");
                // This should fail with an exception
                // Gecko does not error, returns false instead
                try {
                    matches.call(div, "[test!='']:sizzle"), rbuggyMatches.push("!=", pseudos);
                } catch (e) {}
            }), // rbuggyMatches always contains :active and :focus, so no need for a length check
            rbuggyMatches = /* rbuggyMatches.length && */ new RegExp(rbuggyMatches.join("|")), 
            Sizzle.matchesSelector = function(elem, expr) {
                // rbuggyMatches always contains :active, so no need for an existence check
                if (// Make sure that attribute selectors are quoted
                expr = expr.replace(rattributeQuotes, "='$1']"), !isXML(elem) && !rbuggyMatches.test(expr) && !rbuggyQSA.test(expr)) try {
                    var ret = matches.call(elem, expr);
                    // IE 9's matchesSelector returns false on disconnected nodes
                    if (ret || disconnectedMatch || // As well, disconnected nodes are said to be in a document
                    // fragment in IE 9
                    elem.document && 11 !== elem.document.nodeType) return ret;
                } catch (e) {}
                return Sizzle(expr, null, null, [ elem ]).length > 0;
            });
        }(), // Deprecated
        Expr.pseudos.nth = Expr.pseudos.eq, Expr.filters = setFilters.prototype = Expr.pseudos, 
        Expr.setFilters = new setFilters(), // Override sizzle attribute retrieval
        Sizzle.attr = jQuery.attr, jQuery.find = Sizzle, jQuery.expr = Sizzle.selectors, 
        jQuery.expr[":"] = jQuery.expr.pseudos, jQuery.unique = Sizzle.uniqueSort, jQuery.text = Sizzle.getText, 
        jQuery.isXMLDoc = Sizzle.isXML, jQuery.contains = Sizzle.contains;
    }(window);
    var runtil = /Until$/, rparentsprev = /^(?:parents|prev(?:Until|All))/, isSimple = /^.[^:#\[\.,]*$/, rneedsContext = jQuery.expr.match.needsContext, // methods guaranteed to produce a unique set when starting from a unique set
    guaranteedUnique = {
        children: !0,
        contents: !0,
        next: !0,
        prev: !0
    };
    jQuery.fn.extend({
        find: function(selector) {
            var i, l, length, n, r, ret, self = this;
            if ("string" != typeof selector) return jQuery(selector).filter(function() {
                for (i = 0, l = self.length; l > i; i++) if (jQuery.contains(self[i], this)) return !0;
            });
            for (ret = this.pushStack("", "find", selector), i = 0, l = this.length; l > i; i++) if (length = ret.length, 
            jQuery.find(selector, this[i], ret), i > 0) // Make sure that the results are unique
            for (n = length; n < ret.length; n++) for (r = 0; length > r; r++) if (ret[r] === ret[n]) {
                ret.splice(n--, 1);
                break;
            }
            return ret;
        },
        has: function(target) {
            var i, targets = jQuery(target, this), len = targets.length;
            return this.filter(function() {
                for (i = 0; len > i; i++) if (jQuery.contains(this, targets[i])) return !0;
            });
        },
        not: function(selector) {
            return this.pushStack(winnow(this, selector, !1), "not", selector);
        },
        filter: function(selector) {
            return this.pushStack(winnow(this, selector, !0), "filter", selector);
        },
        is: function(selector) {
            // If this is a positional/relative selector, check membership in the returned set
            // so $("p:first").is("p:last") won't return true for a doc with two "p".
            return !!selector && ("string" == typeof selector ? rneedsContext.test(selector) ? jQuery(selector, this.context).index(this[0]) >= 0 : jQuery.filter(selector, this).length > 0 : this.filter(selector).length > 0);
        },
        closest: function(selectors, context) {
            for (var cur, i = 0, l = this.length, ret = [], pos = rneedsContext.test(selectors) || "string" != typeof selectors ? jQuery(selectors, context || this.context) : 0; l > i; i++) for (cur = this[i]; cur && cur.ownerDocument && cur !== context && 11 !== cur.nodeType; ) {
                if (pos ? pos.index(cur) > -1 : jQuery.find.matchesSelector(cur, selectors)) {
                    ret.push(cur);
                    break;
                }
                cur = cur.parentNode;
            }
            return ret = ret.length > 1 ? jQuery.unique(ret) : ret, this.pushStack(ret, "closest", selectors);
        },
        // Determine the position of an element within
        // the matched set of elements
        index: function(elem) {
            // No argument, return index in parent
            // No argument, return index in parent
            // index in selector
            // If it receives a jQuery object, the first element is used
            return elem ? "string" == typeof elem ? jQuery.inArray(this[0], jQuery(elem)) : jQuery.inArray(elem.jquery ? elem[0] : elem, this) : this[0] && this[0].parentNode ? this.prevAll().length : -1;
        },
        add: function(selector, context) {
            var set = "string" == typeof selector ? jQuery(selector, context) : jQuery.makeArray(selector && selector.nodeType ? [ selector ] : selector), all = jQuery.merge(this.get(), set);
            return this.pushStack(isDisconnected(set[0]) || isDisconnected(all[0]) ? all : jQuery.unique(all));
        },
        addBack: function(selector) {
            return this.add(null == selector ? this.prevObject : this.prevObject.filter(selector));
        }
    }), jQuery.fn.andSelf = jQuery.fn.addBack, jQuery.each({
        parent: function(elem) {
            var parent = elem.parentNode;
            return parent && 11 !== parent.nodeType ? parent : null;
        },
        parents: function(elem) {
            return jQuery.dir(elem, "parentNode");
        },
        parentsUntil: function(elem, i, until) {
            return jQuery.dir(elem, "parentNode", until);
        },
        next: function(elem) {
            return sibling(elem, "nextSibling");
        },
        prev: function(elem) {
            return sibling(elem, "previousSibling");
        },
        nextAll: function(elem) {
            return jQuery.dir(elem, "nextSibling");
        },
        prevAll: function(elem) {
            return jQuery.dir(elem, "previousSibling");
        },
        nextUntil: function(elem, i, until) {
            return jQuery.dir(elem, "nextSibling", until);
        },
        prevUntil: function(elem, i, until) {
            return jQuery.dir(elem, "previousSibling", until);
        },
        siblings: function(elem) {
            return jQuery.sibling((elem.parentNode || {}).firstChild, elem);
        },
        children: function(elem) {
            return jQuery.sibling(elem.firstChild);
        },
        contents: function(elem) {
            return jQuery.nodeName(elem, "iframe") ? elem.contentDocument || elem.contentWindow.document : jQuery.merge([], elem.childNodes);
        }
    }, function(name, fn) {
        jQuery.fn[name] = function(until, selector) {
            var ret = jQuery.map(this, fn, until);
            return runtil.test(name) || (selector = until), selector && "string" == typeof selector && (ret = jQuery.filter(selector, ret)), 
            ret = this.length > 1 && !guaranteedUnique[name] ? jQuery.unique(ret) : ret, this.length > 1 && rparentsprev.test(name) && (ret = ret.reverse()), 
            this.pushStack(ret, name, core_slice.call(arguments).join(","));
        };
    }), jQuery.extend({
        filter: function(expr, elems, not) {
            return not && (expr = ":not(" + expr + ")"), 1 === elems.length ? jQuery.find.matchesSelector(elems[0], expr) ? [ elems[0] ] : [] : jQuery.find.matches(expr, elems);
        },
        dir: function(elem, dir, until) {
            for (var matched = [], cur = elem[dir]; cur && 9 !== cur.nodeType && (until === undefined || 1 !== cur.nodeType || !jQuery(cur).is(until)); ) 1 === cur.nodeType && matched.push(cur), 
            cur = cur[dir];
            return matched;
        },
        sibling: function(n, elem) {
            for (var r = []; n; n = n.nextSibling) 1 === n.nodeType && n !== elem && r.push(n);
            return r;
        }
    });
    var nodeNames = "abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video", rinlinejQuery = / jQuery\d+="(?:null|\d+)"/g, rleadingWhitespace = /^\s+/, rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi, rtagName = /<([\w:]+)/, rtbody = /<tbody/i, rhtml = /<|&#?\w+;/, rnoInnerhtml = /<(?:script|style|link)/i, rnocache = /<(?:script|object|embed|option|style)/i, rnoshimcache = new RegExp("<(?:" + nodeNames + ")[\\s/>]", "i"), rcheckableType = /^(?:checkbox|radio)$/, // checked="checked" or checked
    rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i, rscriptType = /\/(java|ecma)script/i, rcleanScript = /^\s*<!(?:\[CDATA\[|\-\-)|[\]\-]{2}>\s*$/g, wrapMap = {
        option: [ 1, "<select multiple='multiple'>", "</select>" ],
        legend: [ 1, "<fieldset>", "</fieldset>" ],
        thead: [ 1, "<table>", "</table>" ],
        tr: [ 2, "<table><tbody>", "</tbody></table>" ],
        td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],
        col: [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ],
        area: [ 1, "<map>", "</map>" ],
        _default: [ 0, "", "" ]
    }, safeFragment = createSafeFragment(document), fragmentDiv = safeFragment.appendChild(document.createElement("div"));
    wrapMap.optgroup = wrapMap.option, wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead, 
    wrapMap.th = wrapMap.td, // IE6-8 can't serialize link, script, style, or any html5 (NoScope) tags,
    // unless wrapped in a div with non-breaking characters in front of it.
    jQuery.support.htmlSerialize || (wrapMap._default = [ 1, "X<div>", "</div>" ]), 
    jQuery.fn.extend({
        text: function(value) {
            return jQuery.access(this, function(value) {
                return value === undefined ? jQuery.text(this) : this.empty().append((this[0] && this[0].ownerDocument || document).createTextNode(value));
            }, null, value, arguments.length);
        },
        wrapAll: function(html) {
            if (jQuery.isFunction(html)) return this.each(function(i) {
                jQuery(this).wrapAll(html.call(this, i));
            });
            if (this[0]) {
                // The elements to wrap the target around
                var wrap = jQuery(html, this[0].ownerDocument).eq(0).clone(!0);
                this[0].parentNode && wrap.insertBefore(this[0]), wrap.map(function() {
                    for (var elem = this; elem.firstChild && 1 === elem.firstChild.nodeType; ) elem = elem.firstChild;
                    return elem;
                }).append(this);
            }
            return this;
        },
        wrapInner: function(html) {
            return this.each(jQuery.isFunction(html) ? function(i) {
                jQuery(this).wrapInner(html.call(this, i));
            } : function() {
                var self = jQuery(this), contents = self.contents();
                contents.length ? contents.wrapAll(html) : self.append(html);
            });
        },
        wrap: function(html) {
            var isFunction = jQuery.isFunction(html);
            return this.each(function(i) {
                jQuery(this).wrapAll(isFunction ? html.call(this, i) : html);
            });
        },
        unwrap: function() {
            return this.parent().each(function() {
                jQuery.nodeName(this, "body") || jQuery(this).replaceWith(this.childNodes);
            }).end();
        },
        append: function() {
            return this.domManip(arguments, !0, function(elem) {
                (1 === this.nodeType || 11 === this.nodeType) && this.appendChild(elem);
            });
        },
        prepend: function() {
            return this.domManip(arguments, !0, function(elem) {
                (1 === this.nodeType || 11 === this.nodeType) && this.insertBefore(elem, this.firstChild);
            });
        },
        before: function() {
            if (!isDisconnected(this[0])) return this.domManip(arguments, !1, function(elem) {
                this.parentNode.insertBefore(elem, this);
            });
            if (arguments.length) {
                var set = jQuery.clean(arguments);
                return this.pushStack(jQuery.merge(set, this), "before", this.selector);
            }
        },
        after: function() {
            if (!isDisconnected(this[0])) return this.domManip(arguments, !1, function(elem) {
                this.parentNode.insertBefore(elem, this.nextSibling);
            });
            if (arguments.length) {
                var set = jQuery.clean(arguments);
                return this.pushStack(jQuery.merge(this, set), "after", this.selector);
            }
        },
        // keepData is for internal use only--do not document
        remove: function(selector, keepData) {
            for (var elem, i = 0; null != (elem = this[i]); i++) (!selector || jQuery.filter(selector, [ elem ]).length) && (keepData || 1 !== elem.nodeType || (jQuery.cleanData(elem.getElementsByTagName("*")), 
            jQuery.cleanData([ elem ])), elem.parentNode && elem.parentNode.removeChild(elem));
            return this;
        },
        empty: function() {
            for (var elem, i = 0; null != (elem = this[i]); i++) // Remove any remaining nodes
            for (// Remove element nodes and prevent memory leaks
            1 === elem.nodeType && jQuery.cleanData(elem.getElementsByTagName("*")); elem.firstChild; ) elem.removeChild(elem.firstChild);
            return this;
        },
        clone: function(dataAndEvents, deepDataAndEvents) {
            return dataAndEvents = null == dataAndEvents ? !1 : dataAndEvents, deepDataAndEvents = null == deepDataAndEvents ? dataAndEvents : deepDataAndEvents, 
            this.map(function() {
                return jQuery.clone(this, dataAndEvents, deepDataAndEvents);
            });
        },
        html: function(value) {
            return jQuery.access(this, function(value) {
                var elem = this[0] || {}, i = 0, l = this.length;
                if (value === undefined) return 1 === elem.nodeType ? elem.innerHTML.replace(rinlinejQuery, "") : undefined;
                // See if we can take a shortcut and just use innerHTML
                if (!("string" != typeof value || rnoInnerhtml.test(value) || !jQuery.support.htmlSerialize && rnoshimcache.test(value) || !jQuery.support.leadingWhitespace && rleadingWhitespace.test(value) || wrapMap[(rtagName.exec(value) || [ "", "" ])[1].toLowerCase()])) {
                    value = value.replace(rxhtmlTag, "<$1></$2>");
                    try {
                        for (;l > i; i++) // Remove element nodes and prevent memory leaks
                        elem = this[i] || {}, 1 === elem.nodeType && (jQuery.cleanData(elem.getElementsByTagName("*")), 
                        elem.innerHTML = value);
                        elem = 0;
                    } catch (e) {}
                }
                elem && this.empty().append(value);
            }, null, value, arguments.length);
        },
        replaceWith: function(value) {
            // Make sure that the elements are removed from the DOM before they are inserted
            // this can help fix replacing a parent with child elements
            return isDisconnected(this[0]) ? this.length ? this.pushStack(jQuery(jQuery.isFunction(value) ? value() : value), "replaceWith", value) : this : jQuery.isFunction(value) ? this.each(function(i) {
                var self = jQuery(this), old = self.html();
                self.replaceWith(value.call(this, i, old));
            }) : ("string" != typeof value && (value = jQuery(value).detach()), this.each(function() {
                var next = this.nextSibling, parent = this.parentNode;
                jQuery(this).remove(), next ? jQuery(next).before(value) : jQuery(parent).append(value);
            }));
        },
        detach: function(selector) {
            return this.remove(selector, !0);
        },
        domManip: function(args, table, callback) {
            // Flatten any nested arrays
            args = [].concat.apply([], args);
            var results, first, fragment, iNoClone, i = 0, value = args[0], scripts = [], l = this.length;
            // We can't cloneNode fragments that contain checked, in WebKit
            if (!jQuery.support.checkClone && l > 1 && "string" == typeof value && rchecked.test(value)) return this.each(function() {
                jQuery(this).domManip(args, table, callback);
            });
            if (jQuery.isFunction(value)) return this.each(function(i) {
                var self = jQuery(this);
                args[0] = value.call(this, i, table ? self.html() : undefined), self.domManip(args, table, callback);
            });
            if (this[0]) {
                if (results = jQuery.buildFragment(args, this, scripts), fragment = results.fragment, 
                first = fragment.firstChild, 1 === fragment.childNodes.length && (fragment = first), 
                first) // Use the original fragment for the last item instead of the first because it can end up
                // being emptied incorrectly in certain situations (#8070).
                // Fragments from the fragment cache must always be cloned and never used in place.
                for (table = table && jQuery.nodeName(first, "tr"), iNoClone = results.cacheable || l - 1; l > i; i++) callback.call(table && jQuery.nodeName(this[i], "table") ? findOrAppend(this[i], "tbody") : this[i], i === iNoClone ? fragment : jQuery.clone(fragment, !0, !0));
                // Fix #11809: Avoid leaking memory
                fragment = first = null, scripts.length && jQuery.each(scripts, function(i, elem) {
                    elem.src ? jQuery.ajax ? jQuery.ajax({
                        url: elem.src,
                        type: "GET",
                        dataType: "script",
                        async: !1,
                        global: !1,
                        "throws": !0
                    }) : jQuery.error("no ajax") : jQuery.globalEval((elem.text || elem.textContent || elem.innerHTML || "").replace(rcleanScript, "")), 
                    elem.parentNode && elem.parentNode.removeChild(elem);
                });
            }
            return this;
        }
    }), jQuery.buildFragment = function(args, context, scripts) {
        var fragment, cacheable, cachehit, first = args[0];
        // Set context from what may come in as undefined or a jQuery collection or a node
        // Updated to fix #12266 where accessing context[0] could throw an exception in IE9/10 &
        // also doubles as fix for #8950 where plain objects caused createDocumentFragment exception
        // Only cache "small" (1/2 KB) HTML strings that are associated with the main document
        // Cloning options loses the selected state, so don't cache them
        // IE 6 doesn't like it when you put <object> or <embed> elements in a fragment
        // Also, WebKit does not clone 'checked' attributes on cloneNode, so don't cache
        // Lastly, IE6,7,8 will not correctly reuse cached fragments that were created from unknown elems #10501
        // Mark cacheable and look for a hit
        // Update the cache, but only store false
        // unless this is a second parsing of the same content
        return context = context || document, context = !context.nodeType && context[0] || context, 
        context = context.ownerDocument || context, !(1 === args.length && "string" == typeof first && first.length < 512 && context === document && "<" === first.charAt(0)) || rnocache.test(first) || !jQuery.support.checkClone && rchecked.test(first) || !jQuery.support.html5Clone && rnoshimcache.test(first) || (cacheable = !0, 
        fragment = jQuery.fragments[first], cachehit = fragment !== undefined), fragment || (fragment = context.createDocumentFragment(), 
        jQuery.clean(args, context, fragment, scripts), cacheable && (jQuery.fragments[first] = cachehit && fragment)), 
        {
            fragment: fragment,
            cacheable: cacheable
        };
    }, jQuery.fragments = {}, jQuery.each({
        appendTo: "append",
        prependTo: "prepend",
        insertBefore: "before",
        insertAfter: "after",
        replaceAll: "replaceWith"
    }, function(name, original) {
        jQuery.fn[name] = function(selector) {
            var elems, i = 0, ret = [], insert = jQuery(selector), l = insert.length, parent = 1 === this.length && this[0].parentNode;
            if ((null == parent || parent && 11 === parent.nodeType && 1 === parent.childNodes.length) && 1 === l) return insert[original](this[0]), 
            this;
            for (;l > i; i++) elems = (i > 0 ? this.clone(!0) : this).get(), jQuery(insert[i])[original](elems), 
            ret = ret.concat(elems);
            return this.pushStack(ret, name, insert.selector);
        };
    }), jQuery.extend({
        clone: function(elem, dataAndEvents, deepDataAndEvents) {
            var srcElements, destElements, i, clone;
            if (jQuery.support.html5Clone || jQuery.isXMLDoc(elem) || !rnoshimcache.test("<" + elem.nodeName + ">") ? clone = elem.cloneNode(!0) : (fragmentDiv.innerHTML = elem.outerHTML, 
            fragmentDiv.removeChild(clone = fragmentDiv.firstChild)), !(jQuery.support.noCloneEvent && jQuery.support.noCloneChecked || 1 !== elem.nodeType && 11 !== elem.nodeType || jQuery.isXMLDoc(elem))) // Weird iteration because IE will replace the length property
            // with an element if you are cloning the body and one of the
            // elements on the page has a name or id of "length"
            for (// IE copies events bound via attachEvent when using cloneNode.
            // Calling detachEvent on the clone will also remove the events
            // from the original. In order to get around this, we use some
            // proprietary methods to clear the events. Thanks to MooTools
            // guys for this hotness.
            cloneFixAttributes(elem, clone), // Using Sizzle here is crazy slow, so we use getElementsByTagName instead
            srcElements = getAll(elem), destElements = getAll(clone), i = 0; srcElements[i]; ++i) // Ensure that the destination node is not null; Fixes #9587
            destElements[i] && cloneFixAttributes(srcElements[i], destElements[i]);
            // Copy the events from the original to the clone
            if (dataAndEvents && (cloneCopyEvent(elem, clone), deepDataAndEvents)) for (srcElements = getAll(elem), 
            destElements = getAll(clone), i = 0; srcElements[i]; ++i) cloneCopyEvent(srcElements[i], destElements[i]);
            // Return the cloned set
            return srcElements = destElements = null, clone;
        },
        clean: function(elems, context, fragment, scripts) {
            var i, j, elem, tag, wrap, depth, div, hasBody, tbody, handleScript, jsTags, safe = context === document && safeFragment, ret = [];
            // Use the already-created safe fragment if context permits
            for (// Ensure that context is a document
            context && "undefined" != typeof context.createDocumentFragment || (context = document), 
            i = 0; null != (elem = elems[i]); i++) if ("number" == typeof elem && (elem += ""), 
            elem) {
                // Convert html string into DOM nodes
                if ("string" == typeof elem) if (rhtml.test(elem)) {
                    // Move to the right depth
                    for (// Ensure a safe container in which to render the html
                    safe = safe || createSafeFragment(context), div = context.createElement("div"), 
                    safe.appendChild(div), // Fix "XHTML"-style tags in all browsers
                    elem = elem.replace(rxhtmlTag, "<$1></$2>"), // Go to html and back, then peel off extra wrappers
                    tag = (rtagName.exec(elem) || [ "", "" ])[1].toLowerCase(), wrap = wrapMap[tag] || wrapMap._default, 
                    depth = wrap[0], div.innerHTML = wrap[1] + elem + wrap[2]; depth--; ) div = div.lastChild;
                    // Remove IE's autoinserted <tbody> from table fragments
                    if (!jQuery.support.tbody) for (// String was a <table>, *may* have spurious <tbody>
                    hasBody = rtbody.test(elem), tbody = "table" !== tag || hasBody ? // String was a bare <thead> or <tfoot>
                    "<table>" !== wrap[1] || hasBody ? [] : div.childNodes : div.firstChild && div.firstChild.childNodes, 
                    j = tbody.length - 1; j >= 0; --j) jQuery.nodeName(tbody[j], "tbody") && !tbody[j].childNodes.length && tbody[j].parentNode.removeChild(tbody[j]);
                    // IE completely kills leading whitespace when innerHTML is used
                    !jQuery.support.leadingWhitespace && rleadingWhitespace.test(elem) && div.insertBefore(context.createTextNode(rleadingWhitespace.exec(elem)[0]), div.firstChild), 
                    elem = div.childNodes, // Take out of fragment container (we need a fresh div each time)
                    div.parentNode.removeChild(div);
                } else elem = context.createTextNode(elem);
                elem.nodeType ? ret.push(elem) : jQuery.merge(ret, elem);
            }
            // Reset defaultChecked for any radios and checkboxes
            // about to be appended to the DOM in IE 6/7 (#8060)
            if (// Fix #11356: Clear elements from safeFragment
            div && (elem = div = safe = null), !jQuery.support.appendChecked) for (i = 0; null != (elem = ret[i]); i++) jQuery.nodeName(elem, "input") ? fixDefaultChecked(elem) : "undefined" != typeof elem.getElementsByTagName && jQuery.grep(elem.getElementsByTagName("input"), fixDefaultChecked);
            // Append elements to a provided document fragment
            if (fragment) for (// Special handling of each script element
            handleScript = function(elem) {
                // Check if we consider it executable
                // Check if we consider it executable
                return !elem.type || rscriptType.test(elem.type) ? scripts ? scripts.push(elem.parentNode ? elem.parentNode.removeChild(elem) : elem) : fragment.appendChild(elem) : void 0;
            }, i = 0; null != (elem = ret[i]); i++) // Check if we're done after handling an executable script
            jQuery.nodeName(elem, "script") && handleScript(elem) || (// Append to fragment and handle embedded scripts
            fragment.appendChild(elem), "undefined" != typeof elem.getElementsByTagName && (// handleScript alters the DOM, so use jQuery.merge to ensure snapshot iteration
            jsTags = jQuery.grep(jQuery.merge([], elem.getElementsByTagName("script")), handleScript), 
            // Splice the scripts into ret after their former ancestor and advance our index beyond them
            ret.splice.apply(ret, [ i + 1, 0 ].concat(jsTags)), i += jsTags.length));
            return ret;
        },
        cleanData: function(elems, /* internal */ acceptData) {
            for (var data, id, elem, type, i = 0, internalKey = jQuery.expando, cache = jQuery.cache, deleteExpando = jQuery.support.deleteExpando, special = jQuery.event.special; null != (elem = elems[i]); i++) if ((acceptData || jQuery.acceptData(elem)) && (id = elem[internalKey], 
            data = id && cache[id])) {
                if (data.events) for (type in data.events) special[type] ? jQuery.event.remove(elem, type) : jQuery.removeEvent(elem, type, data.handle);
                // Remove cache only if it was not already removed by jQuery.event.remove
                cache[id] && (delete cache[id], // IE does not allow us to delete expando properties from nodes,
                // nor does it have a removeAttribute function on Document nodes;
                // we must handle all of these cases
                deleteExpando ? delete elem[internalKey] : elem.removeAttribute ? elem.removeAttribute(internalKey) : elem[internalKey] = null, 
                jQuery.deletedIds.push(id));
            }
        }
    }), // Limit scope pollution from any deprecated API
    function() {
        var matched, browser;
        // Use of jQuery.browser is frowned upon.
        // More details: http://api.jquery.com/jQuery.browser
        // jQuery.uaMatch maintained for back-compat
        jQuery.uaMatch = function(ua) {
            ua = ua.toLowerCase();
            var match = /(chrome)[ \/]([\w.]+)/.exec(ua) || /(webkit)[ \/]([\w.]+)/.exec(ua) || /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) || /(msie) ([\w.]+)/.exec(ua) || ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) || [];
            return {
                browser: match[1] || "",
                version: match[2] || "0"
            };
        }, matched = jQuery.uaMatch(navigator.userAgent), browser = {}, matched.browser && (browser[matched.browser] = !0, 
        browser.version = matched.version), // Chrome is Webkit, but Webkit is also Safari.
        browser.chrome ? browser.webkit = !0 : browser.webkit && (browser.safari = !0), 
        jQuery.browser = browser, jQuery.sub = function() {
            function jQuerySub(selector, context) {
                return new jQuerySub.fn.init(selector, context);
            }
            jQuery.extend(!0, jQuerySub, this), jQuerySub.superclass = this, jQuerySub.fn = jQuerySub.prototype = this(), 
            jQuerySub.fn.constructor = jQuerySub, jQuerySub.sub = this.sub, jQuerySub.fn.init = function(selector, context) {
                return context && context instanceof jQuery && !(context instanceof jQuerySub) && (context = jQuerySub(context)), 
                jQuery.fn.init.call(this, selector, context, rootjQuerySub);
            }, jQuerySub.fn.init.prototype = jQuerySub.fn;
            var rootjQuerySub = jQuerySub(document);
            return jQuerySub;
        };
    }();
    var curCSS, iframe, iframeDoc, ralpha = /alpha\([^)]*\)/i, ropacity = /opacity=([^)]*)/, rposition = /^(top|right|bottom|left)$/, // swappable if display is none or starts with table except "table", "table-cell", or "table-caption"
    // see here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
    rdisplayswap = /^(none|table(?!-c[ea]).+)/, rmargin = /^margin/, rnumsplit = new RegExp("^(" + core_pnum + ")(.*)$", "i"), rnumnonpx = new RegExp("^(" + core_pnum + ")(?!px)[a-z%]+$", "i"), rrelNum = new RegExp("^([-+])=(" + core_pnum + ")", "i"), elemdisplay = {
        BODY: "block"
    }, cssShow = {
        position: "absolute",
        visibility: "hidden",
        display: "block"
    }, cssNormalTransform = {
        letterSpacing: 0,
        fontWeight: 400
    }, cssExpand = [ "Top", "Right", "Bottom", "Left" ], cssPrefixes = [ "Webkit", "O", "Moz", "ms" ], eventsToggle = jQuery.fn.toggle;
    jQuery.fn.extend({
        css: function(name, value) {
            return jQuery.access(this, function(elem, name, value) {
                return value !== undefined ? jQuery.style(elem, name, value) : jQuery.css(elem, name);
            }, name, value, arguments.length > 1);
        },
        show: function() {
            return showHide(this, !0);
        },
        hide: function() {
            return showHide(this);
        },
        toggle: function(state, fn2) {
            var bool = "boolean" == typeof state;
            return jQuery.isFunction(state) && jQuery.isFunction(fn2) ? eventsToggle.apply(this, arguments) : this.each(function() {
                (bool ? state : isHidden(this)) ? jQuery(this).show() : jQuery(this).hide();
            });
        }
    }), jQuery.extend({
        // Add in style property hooks for overriding the default
        // behavior of getting and setting a style property
        cssHooks: {
            opacity: {
                get: function(elem, computed) {
                    if (computed) {
                        // We should always get a number back from opacity
                        var ret = curCSS(elem, "opacity");
                        return "" === ret ? "1" : ret;
                    }
                }
            }
        },
        // Exclude the following css properties to add px
        cssNumber: {
            fillOpacity: !0,
            fontWeight: !0,
            lineHeight: !0,
            opacity: !0,
            orphans: !0,
            widows: !0,
            zIndex: !0,
            zoom: !0
        },
        // Add in properties whose names you wish to fix before
        // setting or getting the value
        cssProps: {
            // normalize float css property
            "float": jQuery.support.cssFloat ? "cssFloat" : "styleFloat"
        },
        // Get and set the style property on a DOM Node
        style: function(elem, name, value, extra) {
            // Don't set styles on text and comment nodes
            if (elem && 3 !== elem.nodeType && 8 !== elem.nodeType && elem.style) {
                // Make sure that we're working with the right name
                var ret, type, hooks, origName = jQuery.camelCase(name), style = elem.style;
                // Check if we're setting a value
                if (name = jQuery.cssProps[origName] || (jQuery.cssProps[origName] = vendorPropName(style, origName)), 
                // gets hook for the prefixed version
                // followed by the unprefixed version
                hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName], value === undefined) // If a hook was provided get the non-computed value from there
                // If a hook was provided get the non-computed value from there
                return hooks && "get" in hooks && (ret = hooks.get(elem, !1, extra)) !== undefined ? ret : style[name];
                // Make sure that NaN and null values aren't set. See: #7116
                if (type = typeof value, // convert relative number strings (+= or -=) to relative numbers. #7345
                "string" === type && (ret = rrelNum.exec(value)) && (value = (ret[1] + 1) * ret[2] + parseFloat(jQuery.css(elem, name)), 
                // Fixes bug #9237
                type = "number"), !(null == value || "number" === type && isNaN(value) || (// If a number was passed in, add 'px' to the (except for certain CSS properties)
                "number" !== type || jQuery.cssNumber[origName] || (value += "px"), hooks && "set" in hooks && (value = hooks.set(elem, value, extra)) === undefined))) // Wrapped to prevent IE from throwing errors when 'invalid' values are provided
                // Fixes bug #5509
                try {
                    style[name] = value;
                } catch (e) {}
            }
        },
        css: function(elem, name, numeric, extra) {
            var val, num, hooks, origName = jQuery.camelCase(name);
            // Return, converting to number if forced or a qualifier was provided and val looks numeric
            // Make sure that we're working with the right name
            // gets hook for the prefixed version
            // followed by the unprefixed version
            // If a hook was provided get the computed value from there
            // Otherwise, if a way to get the computed value exists, use that
            //convert "normal" to computed value
            // Return, converting to number if forced or a qualifier was provided and val looks numeric
            return name = jQuery.cssProps[origName] || (jQuery.cssProps[origName] = vendorPropName(elem.style, origName)), 
            hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName], hooks && "get" in hooks && (val = hooks.get(elem, !0, extra)), 
            val === undefined && (val = curCSS(elem, name)), "normal" === val && name in cssNormalTransform && (val = cssNormalTransform[name]), 
            numeric || extra !== undefined ? (num = parseFloat(val), numeric || jQuery.isNumeric(num) ? num || 0 : val) : val;
        },
        // A method for quickly swapping in/out CSS properties to get correct calculations
        swap: function(elem, options, callback) {
            var ret, name, old = {};
            // Remember the old values, and insert the new ones
            for (name in options) old[name] = elem.style[name], elem.style[name] = options[name];
            ret = callback.call(elem);
            // Revert the old values
            for (name in options) elem.style[name] = old[name];
            return ret;
        }
    }), // NOTE: To any future maintainer, we've window.getComputedStyle
    // because jsdom on node.js will break without it.
    window.getComputedStyle ? curCSS = function(elem, name) {
        var ret, width, minWidth, maxWidth, computed = window.getComputedStyle(elem, null), style = elem.style;
        // getPropertyValue is only needed for .css('filter') in IE9, see #12537
        // A tribute to the "awesome hack by Dean Edwards"
        // Chrome < 17 and Safari 5.0 uses "computed value" instead of "used value" for margin-right
        // Safari 5.1.7 (at least) returns percentage for a larger set of values, but width seems to be reliably pixels
        // this is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
        return computed && (ret = computed.getPropertyValue(name) || computed[name], "" !== ret || jQuery.contains(elem.ownerDocument, elem) || (ret = jQuery.style(elem, name)), 
        rnumnonpx.test(ret) && rmargin.test(name) && (width = style.width, minWidth = style.minWidth, 
        maxWidth = style.maxWidth, style.minWidth = style.maxWidth = style.width = ret, 
        ret = computed.width, style.width = width, style.minWidth = minWidth, style.maxWidth = maxWidth)), 
        ret;
    } : document.documentElement.currentStyle && (curCSS = function(elem, name) {
        var left, rsLeft, ret = elem.currentStyle && elem.currentStyle[name], style = elem.style;
        // Avoid setting ret to empty string here
        // so we don't default to auto
        // From the awesome hack by Dean Edwards
        // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291
        // If we're not dealing with a regular pixel number
        // but a number that has a weird ending, we need to convert it to pixels
        // but not position css attributes, as those are proportional to the parent element instead
        // and we can't measure the parent instead because it might trigger a "stacking dolls" problem
        // Remember the original values
        // Put in the new values to get a computed value out
        // Revert the changed values
        return null == ret && style && style[name] && (ret = style[name]), rnumnonpx.test(ret) && !rposition.test(name) && (left = style.left, 
        rsLeft = elem.runtimeStyle && elem.runtimeStyle.left, rsLeft && (elem.runtimeStyle.left = elem.currentStyle.left), 
        style.left = "fontSize" === name ? "1em" : ret, ret = style.pixelLeft + "px", style.left = left, 
        rsLeft && (elem.runtimeStyle.left = rsLeft)), "" === ret ? "auto" : ret;
    }), jQuery.each([ "height", "width" ], function(i, name) {
        jQuery.cssHooks[name] = {
            get: function(elem, computed, extra) {
                // certain elements can have dimension info if we invisibly show them
                // however, it must have a current display style that would benefit from this
                return computed ? 0 === elem.offsetWidth && rdisplayswap.test(curCSS(elem, "display")) ? jQuery.swap(elem, cssShow, function() {
                    return getWidthOrHeight(elem, name, extra);
                }) : getWidthOrHeight(elem, name, extra) : void 0;
            },
            set: function(elem, value, extra) {
                return setPositiveNumber(elem, value, extra ? augmentWidthOrHeight(elem, name, extra, jQuery.support.boxSizing && "border-box" === jQuery.css(elem, "boxSizing")) : 0);
            }
        };
    }), jQuery.support.opacity || (jQuery.cssHooks.opacity = {
        get: function(elem, computed) {
            // IE uses filters for opacity
            return ropacity.test((computed && elem.currentStyle ? elem.currentStyle.filter : elem.style.filter) || "") ? .01 * parseFloat(RegExp.$1) + "" : computed ? "1" : "";
        },
        set: function(elem, value) {
            var style = elem.style, currentStyle = elem.currentStyle, opacity = jQuery.isNumeric(value) ? "alpha(opacity=" + 100 * value + ")" : "", filter = currentStyle && currentStyle.filter || style.filter || "";
            // IE has trouble with opacity if it does not have layout
            // Force it by setting the zoom level
            style.zoom = 1, // if setting opacity to 1, and no other filters exist - attempt to remove filter attribute #6652
            value >= 1 && "" === jQuery.trim(filter.replace(ralpha, "")) && style.removeAttribute && (// Setting style.filter to null, "" & " " still leave "filter:" in the cssText
            // if "filter:" is present at all, clearType is disabled, we want to avoid this
            // style.removeAttribute is IE Only, but so apparently is this code path...
            style.removeAttribute("filter"), currentStyle && !currentStyle.filter) || (// otherwise, set new filter values
            style.filter = ralpha.test(filter) ? filter.replace(ralpha, opacity) : filter + " " + opacity);
        }
    }), // These hooks cannot be added until DOM ready because the support test
    // for it is not run until after DOM ready
    jQuery(function() {
        jQuery.support.reliableMarginRight || (jQuery.cssHooks.marginRight = {
            get: function(elem, computed) {
                // WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
                // Work around by temporarily setting element display to inline-block
                return jQuery.swap(elem, {
                    display: "inline-block"
                }, function() {
                    return computed ? curCSS(elem, "marginRight") : void 0;
                });
            }
        }), // Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
        // getComputedStyle returns percent when specified for top/left/bottom/right
        // rather than make the css module depend on the offset module, we just check for it here
        !jQuery.support.pixelPosition && jQuery.fn.position && jQuery.each([ "top", "left" ], function(i, prop) {
            jQuery.cssHooks[prop] = {
                get: function(elem, computed) {
                    if (computed) {
                        var ret = curCSS(elem, prop);
                        // if curCSS returns percentage, fallback to offset
                        return rnumnonpx.test(ret) ? jQuery(elem).position()[prop] + "px" : ret;
                    }
                }
            };
        });
    }), jQuery.expr && jQuery.expr.filters && (jQuery.expr.filters.hidden = function(elem) {
        return 0 === elem.offsetWidth && 0 === elem.offsetHeight || !jQuery.support.reliableHiddenOffsets && "none" === (elem.style && elem.style.display || curCSS(elem, "display"));
    }, jQuery.expr.filters.visible = function(elem) {
        return !jQuery.expr.filters.hidden(elem);
    }), // These hooks are used by animate to expand properties
    jQuery.each({
        margin: "",
        padding: "",
        border: "Width"
    }, function(prefix, suffix) {
        jQuery.cssHooks[prefix + suffix] = {
            expand: function(value) {
                var i, // assumes a single number if not a string
                parts = "string" == typeof value ? value.split(" ") : [ value ], expanded = {};
                for (i = 0; 4 > i; i++) expanded[prefix + cssExpand[i] + suffix] = parts[i] || parts[i - 2] || parts[0];
                return expanded;
            }
        }, rmargin.test(prefix) || (jQuery.cssHooks[prefix + suffix].set = setPositiveNumber);
    });
    var r20 = /%20/g, rbracket = /\[\]$/, rCRLF = /\r?\n/g, rinput = /^(?:color|date|datetime|datetime-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i, rselectTextarea = /^(?:select|textarea)/i;
    jQuery.fn.extend({
        serialize: function() {
            return jQuery.param(this.serializeArray());
        },
        serializeArray: function() {
            return this.map(function() {
                return this.elements ? jQuery.makeArray(this.elements) : this;
            }).filter(function() {
                return this.name && !this.disabled && (this.checked || rselectTextarea.test(this.nodeName) || rinput.test(this.type));
            }).map(function(i, elem) {
                var val = jQuery(this).val();
                return null == val ? null : jQuery.isArray(val) ? jQuery.map(val, function(val) {
                    return {
                        name: elem.name,
                        value: val.replace(rCRLF, "\r\n")
                    };
                }) : {
                    name: elem.name,
                    value: val.replace(rCRLF, "\r\n")
                };
            }).get();
        }
    }), //Serialize an array of form elements or a set of
    //key/values into a query string
    jQuery.param = function(a, traditional) {
        var prefix, s = [], add = function(key, value) {
            // If value is a function, invoke it and return its value
            value = jQuery.isFunction(value) ? value() : null == value ? "" : value, s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
        };
        // If an array was passed in, assume that it is an array of form elements.
        if (// Set traditional to true for jQuery <= 1.3.2 behavior.
        traditional === undefined && (traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional), 
        jQuery.isArray(a) || a.jquery && !jQuery.isPlainObject(a)) // Serialize the form elements
        jQuery.each(a, function() {
            add(this.name, this.value);
        }); else // If traditional, encode the "old" way (the way 1.3.2 or older
        // did it), otherwise encode params recursively.
        for (prefix in a) buildParams(prefix, a[prefix], traditional, add);
        // Return the resulting serialization
        return s.join("&").replace(r20, "+");
    };
    var // Document location
    ajaxLocParts, ajaxLocation, rhash = /#.*$/, rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/gm, // IE leaves an \r character at EOL
    // #7653, #8125, #8152: local protocol detection
    rlocalProtocol = /^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/, rnoContent = /^(?:GET|HEAD)$/, rprotocol = /^\/\//, rquery = /\?/, rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, rts = /([?&])_=[^&]*/, rurl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/, // Keep a copy of the old load method
    _load = jQuery.fn.load, /* Prefilters
         * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
         * 2) These are called:
         *    - BEFORE asking for a transport
         *    - AFTER param serialization (s.data is a string if s.processData is true)
         * 3) key is the dataType
         * 4) the catchall symbol "*" can be used
         * 5) execution will start with transport dataType and THEN continue down to "*" if needed
         */
    prefilters = {}, /* Transports bindings
         * 1) key is the dataType
         * 2) the catchall symbol "*" can be used
         * 3) selection will start with transport dataType and THEN go to "*" if needed
         */
    transports = {}, // Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
    allTypes = [ "*/" ] + [ "*" ];
    // #8138, IE may throw an exception when accessing
    // a field from window.location if document.domain has been set
    try {
        ajaxLocation = location.href;
    } catch (e) {
        // Use the href attribute of an A element
        // since IE will modify it given document.location
        ajaxLocation = document.createElement("a"), ajaxLocation.href = "", ajaxLocation = ajaxLocation.href;
    }
    // Segment location into parts
    ajaxLocParts = rurl.exec(ajaxLocation.toLowerCase()) || [], jQuery.fn.load = function(url, params, callback) {
        if ("string" != typeof url && _load) return _load.apply(this, arguments);
        // Don't do a request if no elements are being requested
        if (!this.length) return this;
        var selector, type, response, self = this, off = url.indexOf(" ");
        // If it's a function
        // We assume that it's the callback
        // Request the remote document
        return off >= 0 && (selector = url.slice(off, url.length), url = url.slice(0, off)), 
        jQuery.isFunction(params) ? (callback = params, params = undefined) : params && "object" == typeof params && (type = "POST"), 
        jQuery.ajax({
            url: url,
            // if "type" variable is undefined, then "GET" method will be used
            type: type,
            dataType: "html",
            data: params,
            complete: function(jqXHR, status) {
                callback && self.each(callback, response || [ jqXHR.responseText, status, jqXHR ]);
            }
        }).done(function(responseText) {
            // Save response for use in complete callback
            response = arguments, // See if a selector was specified
            self.html(selector ? // Create a dummy div to hold the results
            jQuery("<div>").append(responseText.replace(rscript, "")).find(selector) : // If not, just inject the full result
            responseText);
        }), this;
    }, // Attach a bunch of functions for handling common AJAX events
    jQuery.each("ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "), function(i, o) {
        jQuery.fn[o] = function(f) {
            return this.on(o, f);
        };
    }), jQuery.each([ "get", "post" ], function(i, method) {
        jQuery[method] = function(url, data, callback, type) {
            // shift arguments if data argument was omitted
            return jQuery.isFunction(data) && (type = type || callback, callback = data, data = undefined), 
            jQuery.ajax({
                type: method,
                url: url,
                data: data,
                success: callback,
                dataType: type
            });
        };
    }), jQuery.extend({
        getScript: function(url, callback) {
            return jQuery.get(url, undefined, callback, "script");
        },
        getJSON: function(url, data, callback) {
            return jQuery.get(url, data, callback, "json");
        },
        // Creates a full fledged settings object into target
        // with both ajaxSettings and settings fields.
        // If target is omitted, writes into ajaxSettings.
        ajaxSetup: function(target, settings) {
            // Building a settings object
            // Extending ajaxSettings
            return settings ? ajaxExtend(target, jQuery.ajaxSettings) : (settings = target, 
            target = jQuery.ajaxSettings), ajaxExtend(target, settings), target;
        },
        ajaxSettings: {
            url: ajaxLocation,
            isLocal: rlocalProtocol.test(ajaxLocParts[1]),
            global: !0,
            type: "GET",
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            processData: !0,
            async: !0,
            /*
                timeout: 0,
                data: null,
                dataType: null,
                username: null,
                password: null,
                cache: null,
                throws: false,
                traditional: false,
                headers: {},
                */
            accepts: {
                xml: "application/xml, text/xml",
                html: "text/html",
                text: "text/plain",
                json: "application/json, text/javascript",
                "*": allTypes
            },
            contents: {
                xml: /xml/,
                html: /html/,
                json: /json/
            },
            responseFields: {
                xml: "responseXML",
                text: "responseText"
            },
            // List of data converters
            // 1) key format is "source_type destination_type" (a single space in-between)
            // 2) the catchall symbol "*" can be used for source_type
            converters: {
                // Convert anything to text
                "* text": window.String,
                // Text to html (true = no transformation)
                "text html": !0,
                // Evaluate text as a json expression
                "text json": jQuery.parseJSON,
                // Parse text as xml
                "text xml": jQuery.parseXML
            },
            // For options that shouldn't be deep extended:
            // you can add your own custom options here if
            // and when you create one that shouldn't be
            // deep extended (see ajaxExtend)
            flatOptions: {
                context: !0,
                url: !0
            }
        },
        ajaxPrefilter: addToPrefiltersOrTransports(prefilters),
        ajaxTransport: addToPrefiltersOrTransports(transports),
        // Main method
        ajax: function(url, options) {
            // Callback for when everything is done
            // It is defined here because jslint complains if it is declared
            // at the end of the function (which would be more logical and readable)
            function done(status, nativeStatusText, responses, headers) {
                var isSuccess, success, error, response, modified, statusText = nativeStatusText;
                // Called once
                2 !== state && (// State is "done" now
                state = 2, // Clear timeout if it exists
                timeoutTimer && clearTimeout(timeoutTimer), // Dereference transport for early garbage collection
                // (no matter how long the jqXHR object will be used)
                transport = undefined, // Cache response headers
                responseHeadersString = headers || "", // Set readyState
                jqXHR.readyState = status > 0 ? 4 : 0, // Get response data
                responses && (response = ajaxHandleResponses(s, jqXHR, responses)), // If successful, handle type chaining
                status >= 200 && 300 > status || 304 === status ? (// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
                s.ifModified && (modified = jqXHR.getResponseHeader("Last-Modified"), modified && (jQuery.lastModified[ifModifiedKey] = modified), 
                modified = jqXHR.getResponseHeader("Etag"), modified && (jQuery.etag[ifModifiedKey] = modified)), 
                // If not modified
                304 === status ? (statusText = "notmodified", isSuccess = !0) : (isSuccess = ajaxConvert(s, response), 
                statusText = isSuccess.state, success = isSuccess.data, error = isSuccess.error, 
                isSuccess = !error)) : (// We extract error from statusText
                // then normalize statusText and status for non-aborts
                error = statusText, (!statusText || status) && (statusText = "error", 0 > status && (status = 0))), 
                // Set data for the fake xhr object
                jqXHR.status = status, jqXHR.statusText = (nativeStatusText || statusText) + "", 
                // Success/Error
                isSuccess ? deferred.resolveWith(callbackContext, [ success, statusText, jqXHR ]) : deferred.rejectWith(callbackContext, [ jqXHR, statusText, error ]), 
                // Status-dependent callbacks
                jqXHR.statusCode(statusCode), statusCode = undefined, fireGlobals && globalEventContext.trigger("ajax" + (isSuccess ? "Success" : "Error"), [ jqXHR, s, isSuccess ? success : error ]), 
                // Complete
                completeDeferred.fireWith(callbackContext, [ jqXHR, statusText ]), fireGlobals && (globalEventContext.trigger("ajaxComplete", [ jqXHR, s ]), 
                // Handle the global AJAX counter
                --jQuery.active || jQuery.event.trigger("ajaxStop")));
            }
            // If url is an object, simulate pre-1.5 signature
            "object" == typeof url && (options = url, url = undefined), // Force options to be an object
            options = options || {};
            var // ifModified key
            ifModifiedKey, // Response headers
            responseHeadersString, responseHeaders, // transport
            transport, // timeout handle
            timeoutTimer, // Cross-domain detection vars
            parts, // To know if global events are to be dispatched
            fireGlobals, // Loop variable
            i, // Create the final options object
            s = jQuery.ajaxSetup({}, options), // Callbacks context
            callbackContext = s.context || s, // Context for global events
            // It's the callbackContext if one was provided in the options
            // and if it's a DOM node or a jQuery collection
            globalEventContext = callbackContext !== s && (callbackContext.nodeType || callbackContext instanceof jQuery) ? jQuery(callbackContext) : jQuery.event, // Deferreds
            deferred = jQuery.Deferred(), completeDeferred = jQuery.Callbacks("once memory"), // Status-dependent callbacks
            statusCode = s.statusCode || {}, // Headers (they are sent all at once)
            requestHeaders = {}, requestHeadersNames = {}, // The jqXHR state
            state = 0, // Default abort message
            strAbort = "canceled", // Fake xhr
            jqXHR = {
                readyState: 0,
                // Caches the header
                setRequestHeader: function(name, value) {
                    if (!state) {
                        var lname = name.toLowerCase();
                        name = requestHeadersNames[lname] = requestHeadersNames[lname] || name, requestHeaders[name] = value;
                    }
                    return this;
                },
                // Raw string
                getAllResponseHeaders: function() {
                    return 2 === state ? responseHeadersString : null;
                },
                // Builds headers hashtable if needed
                getResponseHeader: function(key) {
                    var match;
                    if (2 === state) {
                        if (!responseHeaders) for (responseHeaders = {}; match = rheaders.exec(responseHeadersString); ) responseHeaders[match[1].toLowerCase()] = match[2];
                        match = responseHeaders[key.toLowerCase()];
                    }
                    return match === undefined ? null : match;
                },
                // Overrides response content-type header
                overrideMimeType: function(type) {
                    return state || (s.mimeType = type), this;
                },
                // Cancel the request
                abort: function(statusText) {
                    return statusText = statusText || strAbort, transport && transport.abort(statusText), 
                    done(0, statusText), this;
                }
            };
            // If request was aborted inside a prefilter, stop there
            if (// Attach deferreds
            deferred.promise(jqXHR), jqXHR.success = jqXHR.done, jqXHR.error = jqXHR.fail, jqXHR.complete = completeDeferred.add, 
            // Status-dependent callbacks
            jqXHR.statusCode = function(map) {
                if (map) {
                    var tmp;
                    if (2 > state) for (tmp in map) statusCode[tmp] = [ statusCode[tmp], map[tmp] ]; else tmp = map[jqXHR.status], 
                    jqXHR.always(tmp);
                }
                return this;
            }, // Remove hash character (#7531: and string promotion)
            // Add protocol if not provided (#5866: IE7 issue with protocol-less urls)
            // We also use the url parameter if available
            s.url = ((url || s.url) + "").replace(rhash, "").replace(rprotocol, ajaxLocParts[1] + "//"), 
            // Extract dataTypes list
            s.dataTypes = jQuery.trim(s.dataType || "*").toLowerCase().split(core_rspace), // A cross-domain request is in order when we have a protocol:host:port mismatch
            null == s.crossDomain && (parts = rurl.exec(s.url.toLowerCase()), s.crossDomain = !(!parts || parts[1] === ajaxLocParts[1] && parts[2] === ajaxLocParts[2] && (parts[3] || ("http:" === parts[1] ? 80 : 443)) == (ajaxLocParts[3] || ("http:" === ajaxLocParts[1] ? 80 : 443)))), 
            // Convert data if not already a string
            s.data && s.processData && "string" != typeof s.data && (s.data = jQuery.param(s.data, s.traditional)), 
            // Apply prefilters
            inspectPrefiltersOrTransports(prefilters, s, options, jqXHR), 2 === state) return jqXHR;
            // More options handling for requests with no content
            if (// We can fire global events as of now if asked to
            fireGlobals = s.global, // Uppercase the type
            s.type = s.type.toUpperCase(), // Determine if request has content
            s.hasContent = !rnoContent.test(s.type), // Watch for a new set of requests
            fireGlobals && 0 === jQuery.active++ && jQuery.event.trigger("ajaxStart"), !s.hasContent && (// If data is available, append data to url
            s.data && (s.url += (rquery.test(s.url) ? "&" : "?") + s.data, // #9682: remove data so that it's not used in an eventual retry
            delete s.data), // Get ifModifiedKey before adding the anti-cache parameter
            ifModifiedKey = s.url, s.cache === !1)) {
                var ts = jQuery.now(), // try replacing _= if it is there
                ret = s.url.replace(rts, "$1_=" + ts);
                // if nothing was replaced, add timestamp to the end
                s.url = ret + (ret === s.url ? (rquery.test(s.url) ? "&" : "?") + "_=" + ts : "");
            }
            // Set the correct header, if data is being sent
            (s.data && s.hasContent && s.contentType !== !1 || options.contentType) && jqXHR.setRequestHeader("Content-Type", s.contentType), 
            // Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
            s.ifModified && (ifModifiedKey = ifModifiedKey || s.url, jQuery.lastModified[ifModifiedKey] && jqXHR.setRequestHeader("If-Modified-Since", jQuery.lastModified[ifModifiedKey]), 
            jQuery.etag[ifModifiedKey] && jqXHR.setRequestHeader("If-None-Match", jQuery.etag[ifModifiedKey])), 
            // Set the Accepts header for the server, depending on the dataType
            jqXHR.setRequestHeader("Accept", s.dataTypes[0] && s.accepts[s.dataTypes[0]] ? s.accepts[s.dataTypes[0]] + ("*" !== s.dataTypes[0] ? ", " + allTypes + "; q=0.01" : "") : s.accepts["*"]);
            // Check for headers option
            for (i in s.headers) jqXHR.setRequestHeader(i, s.headers[i]);
            // Allow custom headers/mimetypes and early abort
            if (s.beforeSend && (s.beforeSend.call(callbackContext, jqXHR, s) === !1 || 2 === state)) // Abort if not done already and return
            return jqXHR.abort();
            // aborting is no longer a cancellation
            strAbort = "abort";
            // Install callbacks on deferreds
            for (i in {
                success: 1,
                error: 1,
                complete: 1
            }) jqXHR[i](s[i]);
            // If no transport, we auto-abort
            if (// Get transport
            transport = inspectPrefiltersOrTransports(transports, s, options, jqXHR)) {
                jqXHR.readyState = 1, // Send global event
                fireGlobals && globalEventContext.trigger("ajaxSend", [ jqXHR, s ]), // Timeout
                s.async && s.timeout > 0 && (timeoutTimer = setTimeout(function() {
                    jqXHR.abort("timeout");
                }, s.timeout));
                try {
                    state = 1, transport.send(requestHeaders, done);
                } catch (e) {
                    // Propagate exception as error if not done
                    if (!(2 > state)) throw e;
                    done(-1, e);
                }
            } else done(-1, "No Transport");
            return jqXHR;
        },
        // Counter for holding the number of active queries
        active: 0,
        // Last-Modified header cache for next request
        lastModified: {},
        etag: {}
    });
    var oldCallbacks = [], rquestion = /\?/, rjsonp = /(=)\?(?=&|$)|\?\?/, nonce = jQuery.now();
    // Default jsonp settings
    jQuery.ajaxSetup({
        jsonp: "callback",
        jsonpCallback: function() {
            var callback = oldCallbacks.pop() || jQuery.expando + "_" + nonce++;
            return this[callback] = !0, callback;
        }
    }), // Detect, normalize options and install callbacks for jsonp requests
    jQuery.ajaxPrefilter("json jsonp", function(s, originalSettings, jqXHR) {
        var callbackName, overwritten, responseContainer, data = s.data, url = s.url, hasCallback = s.jsonp !== !1, replaceInUrl = hasCallback && rjsonp.test(url), replaceInData = hasCallback && !replaceInUrl && "string" == typeof data && !(s.contentType || "").indexOf("application/x-www-form-urlencoded") && rjsonp.test(data);
        // Handle iff the expected data type is "jsonp" or we have a parameter to set
        // Handle iff the expected data type is "jsonp" or we have a parameter to set
        // Get callback name, remembering preexisting value associated with it
        // Insert callback into url or form data
        // Use data converter to retrieve json after script execution
        // force json dataType
        // Install callback
        // Clean-up function (fires after converters)
        return "jsonp" === s.dataTypes[0] || replaceInUrl || replaceInData ? (callbackName = s.jsonpCallback = jQuery.isFunction(s.jsonpCallback) ? s.jsonpCallback() : s.jsonpCallback, 
        overwritten = window[callbackName], replaceInUrl ? s.url = url.replace(rjsonp, "$1" + callbackName) : replaceInData ? s.data = data.replace(rjsonp, "$1" + callbackName) : hasCallback && (s.url += (rquestion.test(url) ? "&" : "?") + s.jsonp + "=" + callbackName), 
        s.converters["script json"] = function() {
            return responseContainer || jQuery.error(callbackName + " was not called"), responseContainer[0];
        }, s.dataTypes[0] = "json", window[callbackName] = function() {
            responseContainer = arguments;
        }, jqXHR.always(function() {
            // Restore preexisting value
            window[callbackName] = overwritten, // Save back as free
            s[callbackName] && (// make sure that re-using the options doesn't screw things around
            s.jsonpCallback = originalSettings.jsonpCallback, // save the callback name for future use
            oldCallbacks.push(callbackName)), // Call if it was a function and we have a response
            responseContainer && jQuery.isFunction(overwritten) && overwritten(responseContainer[0]), 
            responseContainer = overwritten = undefined;
        }), "script") : void 0;
    }), // Install script dataType
    jQuery.ajaxSetup({
        accepts: {
            script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
        },
        contents: {
            script: /javascript|ecmascript/
        },
        converters: {
            "text script": function(text) {
                return jQuery.globalEval(text), text;
            }
        }
    }), // Handle cache's special case and global
    jQuery.ajaxPrefilter("script", function(s) {
        s.cache === undefined && (s.cache = !1), s.crossDomain && (s.type = "GET", s.global = !1);
    }), // Bind script tag hack transport
    jQuery.ajaxTransport("script", function(s) {
        // This transport only deals with cross domain requests
        if (s.crossDomain) {
            var script, head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
            return {
                send: function(_, callback) {
                    script = document.createElement("script"), script.async = "async", s.scriptCharset && (script.charset = s.scriptCharset), 
                    script.src = s.url, // Attach handlers for all browsers
                    script.onload = script.onreadystatechange = function(_, isAbort) {
                        (isAbort || !script.readyState || /loaded|complete/.test(script.readyState)) && (// Handle memory leak in IE
                        script.onload = script.onreadystatechange = null, // Remove the script
                        head && script.parentNode && head.removeChild(script), // Dereference the script
                        script = undefined, // Callback if not abort
                        isAbort || callback(200, "success"));
                    }, // Use insertBefore instead of appendChild  to circumvent an IE6 bug.
                    // This arises when a base node is used (#2709 and #4378).
                    head.insertBefore(script, head.firstChild);
                },
                abort: function() {
                    script && script.onload(0, 1);
                }
            };
        }
    });
    var xhrCallbacks, // #5280: Internet Explorer will keep connections alive if we don't abort on unload
    xhrOnUnloadAbort = window.ActiveXObject ? function() {
        // Abort all pending requests
        for (var key in xhrCallbacks) xhrCallbacks[key](0, 1);
    } : !1, xhrId = 0;
    // Create the request object
    // (This is still attached to ajaxSettings for backward compatibility)
    jQuery.ajaxSettings.xhr = window.ActiveXObject ? /* Microsoft failed to properly
         * implement the XMLHttpRequest in IE7 (can't request local files),
         * so we use the ActiveXObject when it is available
         * Additionally XMLHttpRequest can be disabled in IE7/IE8 so
         * we need a fallback.
         */
    function() {
        return !this.isLocal && createStandardXHR() || createActiveXHR();
    } : // For all other browsers, use the standard XMLHttpRequest object
    createStandardXHR, // Determine support properties
    function(xhr) {
        jQuery.extend(jQuery.support, {
            ajax: !!xhr,
            cors: !!xhr && "withCredentials" in xhr
        });
    }(jQuery.ajaxSettings.xhr()), // Create transport if the browser can provide an xhr
    jQuery.support.ajax && jQuery.ajaxTransport(function(s) {
        // Cross domain only allowed if supported through XMLHttpRequest
        if (!s.crossDomain || jQuery.support.cors) {
            var callback;
            return {
                send: function(headers, complete) {
                    // Get a new xhr
                    var handle, i, xhr = s.xhr();
                    // Apply custom fields if provided
                    if (// Open the socket
                    // Passing null username, generates a login popup on Opera (#2865)
                    s.username ? xhr.open(s.type, s.url, s.async, s.username, s.password) : xhr.open(s.type, s.url, s.async), 
                    s.xhrFields) for (i in s.xhrFields) xhr[i] = s.xhrFields[i];
                    // Override mime type if needed
                    s.mimeType && xhr.overrideMimeType && xhr.overrideMimeType(s.mimeType), // X-Requested-With header
                    // For cross-domain requests, seeing as conditions for a preflight are
                    // akin to a jigsaw puzzle, we simply never set it to be sure.
                    // (it can always be set on a per-request basis or even using ajaxSetup)
                    // For same-domain requests, won't change header if already provided.
                    s.crossDomain || headers["X-Requested-With"] || (headers["X-Requested-With"] = "XMLHttpRequest");
                    // Need an extra try/catch for cross domain requests in Firefox 3
                    try {
                        for (i in headers) xhr.setRequestHeader(i, headers[i]);
                    } catch (_) {}
                    // Do send the request
                    // This may raise an exception which is actually
                    // handled in jQuery.ajax (so no try/catch here)
                    xhr.send(s.hasContent && s.data || null), // Listener
                    callback = function(_, isAbort) {
                        var status, statusText, responseHeaders, responses, xml;
                        // Firefox throws exceptions when accessing properties
                        // of an xhr when a network error occurred
                        // http://helpful.knobs-dials.com/index.php/Component_returned_failure_code:_0x80040111_(NS_ERROR_NOT_AVAILABLE)
                        try {
                            // Was never called and is aborted or complete
                            if (callback && (isAbort || 4 === xhr.readyState)) // If it's an abort
                            if (// Only called once
                            callback = undefined, // Do not keep as active anymore
                            handle && (xhr.onreadystatechange = jQuery.noop, xhrOnUnloadAbort && delete xhrCallbacks[handle]), 
                            isAbort) // Abort it manually if needed
                            4 !== xhr.readyState && xhr.abort(); else {
                                status = xhr.status, responseHeaders = xhr.getAllResponseHeaders(), responses = {}, 
                                xml = xhr.responseXML, // Construct response list
                                xml && xml.documentElement && (responses.xml = xml);
                                // When requesting binary data, IE6-9 will throw an exception
                                // on any attempt to access responseText (#11426)
                                try {
                                    responses.text = xhr.responseText;
                                } catch (e) {}
                                // Firefox throws an exception when accessing
                                // statusText for faulty cross-domain requests
                                try {
                                    statusText = xhr.statusText;
                                } catch (e) {
                                    // We normalize with Webkit giving an empty statusText
                                    statusText = "";
                                }
                                // Filter status for non standard behaviors
                                // If the request is local and we have data: assume a success
                                // (success with no data won't get notified, that's the best we
                                // can do given current implementations)
                                status || !s.isLocal || s.crossDomain ? 1223 === status && (status = 204) : status = responses.text ? 200 : 404;
                            }
                        } catch (firefoxAccessException) {
                            isAbort || complete(-1, firefoxAccessException);
                        }
                        // Call complete if needed
                        responses && complete(status, statusText, responses, responseHeaders);
                    }, s.async ? 4 === xhr.readyState ? // (IE6 & IE7) if it's in cache and has been
                    // retrieved directly we need to fire the callback
                    setTimeout(callback, 0) : (handle = ++xhrId, xhrOnUnloadAbort && (// Create the active xhrs callbacks list if needed
                    // and attach the unload handler
                    xhrCallbacks || (xhrCallbacks = {}, jQuery(window).unload(xhrOnUnloadAbort)), // Add to list of active xhrs callbacks
                    xhrCallbacks[handle] = callback), xhr.onreadystatechange = callback) : // if we're in sync mode we fire the callback
                    callback();
                },
                abort: function() {
                    callback && callback(0, 1);
                }
            };
        }
    });
    var fxNow, timerId, rfxtypes = /^(?:toggle|show|hide)$/, rfxnum = new RegExp("^(?:([-+])=|)(" + core_pnum + ")([a-z%]*)$", "i"), rrun = /queueHooks$/, animationPrefilters = [ defaultPrefilter ], tweeners = {
        "*": [ function(prop, value) {
            var end, unit, tween = this.createTween(prop, value), parts = rfxnum.exec(value), target = tween.cur(), start = +target || 0, scale = 1, maxIterations = 20;
            if (parts) {
                // We need to compute starting value
                if (end = +parts[2], unit = parts[3] || (jQuery.cssNumber[prop] ? "" : "px"), "px" !== unit && start) {
                    // Iteratively approximate from a nonzero starting point
                    // Prefer the current property, because this process will be trivial if it uses the same units
                    // Fallback to end or a simple constant
                    start = jQuery.css(tween.elem, prop, !0) || end || 1;
                    do // If previous iteration zeroed out, double until we get *something*
                    // Use a string for doubling factor so we don't accidentally see scale as unchanged below
                    scale = scale || ".5", // Adjust and apply
                    start /= scale, jQuery.style(tween.elem, prop, start + unit); while (scale !== (scale = tween.cur() / target) && 1 !== scale && --maxIterations);
                }
                tween.unit = unit, tween.start = start, // If a +=/-= token was provided, we're doing a relative animation
                tween.end = parts[1] ? start + (parts[1] + 1) * end : end;
            }
            return tween;
        } ]
    };
    jQuery.Animation = jQuery.extend(Animation, {
        tweener: function(props, callback) {
            jQuery.isFunction(props) ? (callback = props, props = [ "*" ]) : props = props.split(" ");
            for (var prop, index = 0, length = props.length; length > index; index++) prop = props[index], 
            tweeners[prop] = tweeners[prop] || [], tweeners[prop].unshift(callback);
        },
        prefilter: function(callback, prepend) {
            prepend ? animationPrefilters.unshift(callback) : animationPrefilters.push(callback);
        }
    }), jQuery.Tween = Tween, Tween.prototype = {
        constructor: Tween,
        init: function(elem, options, prop, end, easing, unit) {
            this.elem = elem, this.prop = prop, this.easing = easing || "swing", this.options = options, 
            this.start = this.now = this.cur(), this.end = end, this.unit = unit || (jQuery.cssNumber[prop] ? "" : "px");
        },
        cur: function() {
            var hooks = Tween.propHooks[this.prop];
            return hooks && hooks.get ? hooks.get(this) : Tween.propHooks._default.get(this);
        },
        run: function(percent) {
            var eased, hooks = Tween.propHooks[this.prop];
            return this.pos = eased = this.options.duration ? jQuery.easing[this.easing](percent, this.options.duration * percent, 0, 1, this.options.duration) : percent, 
            this.now = (this.end - this.start) * eased + this.start, this.options.step && this.options.step.call(this.elem, this.now, this), 
            hooks && hooks.set ? hooks.set(this) : Tween.propHooks._default.set(this), this;
        }
    }, Tween.prototype.init.prototype = Tween.prototype, Tween.propHooks = {
        _default: {
            get: function(tween) {
                var result;
                // passing any value as a 4th parameter to .css will automatically
                // attempt a parseFloat and fallback to a string if the parse fails
                // so, simple values such as "10px" are parsed to Float.
                // complex values such as "rotate(1rad)" are returned as is.
                return null == tween.elem[tween.prop] || tween.elem.style && null != tween.elem.style[tween.prop] ? (result = jQuery.css(tween.elem, tween.prop, !1, ""), 
                result && "auto" !== result ? result : 0) : tween.elem[tween.prop];
            },
            set: function(tween) {
                // use step hook for back compat - use cssHook if its there - use .style if its
                // available and use plain properties where available
                jQuery.fx.step[tween.prop] ? jQuery.fx.step[tween.prop](tween) : tween.elem.style && (null != tween.elem.style[jQuery.cssProps[tween.prop]] || jQuery.cssHooks[tween.prop]) ? jQuery.style(tween.elem, tween.prop, tween.now + tween.unit) : tween.elem[tween.prop] = tween.now;
            }
        }
    }, // Remove in 2.0 - this supports IE8's panic based approach
    // to setting things on disconnected nodes
    Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
        set: function(tween) {
            tween.elem.nodeType && tween.elem.parentNode && (tween.elem[tween.prop] = tween.now);
        }
    }, jQuery.each([ "toggle", "show", "hide" ], function(i, name) {
        var cssFn = jQuery.fn[name];
        jQuery.fn[name] = function(speed, easing, callback) {
            // special check for .toggle( handler, handler, ... )
            return null == speed || "boolean" == typeof speed || !i && jQuery.isFunction(speed) && jQuery.isFunction(easing) ? cssFn.apply(this, arguments) : this.animate(genFx(name, !0), speed, easing, callback);
        };
    }), jQuery.fn.extend({
        fadeTo: function(speed, to, easing, callback) {
            // show any hidden elements after setting opacity to 0
            return this.filter(isHidden).css("opacity", 0).show().end().animate({
                opacity: to
            }, speed, easing, callback);
        },
        animate: function(prop, speed, easing, callback) {
            var empty = jQuery.isEmptyObject(prop), optall = jQuery.speed(speed, easing, callback), doAnimation = function() {
                // Operate on a copy of prop so per-property easing won't be lost
                var anim = Animation(this, jQuery.extend({}, prop), optall);
                // Empty animations resolve immediately
                empty && anim.stop(!0);
            };
            return empty || optall.queue === !1 ? this.each(doAnimation) : this.queue(optall.queue, doAnimation);
        },
        stop: function(type, clearQueue, gotoEnd) {
            var stopQueue = function(hooks) {
                var stop = hooks.stop;
                delete hooks.stop, stop(gotoEnd);
            };
            return "string" != typeof type && (gotoEnd = clearQueue, clearQueue = type, type = undefined), 
            clearQueue && type !== !1 && this.queue(type || "fx", []), this.each(function() {
                var dequeue = !0, index = null != type && type + "queueHooks", timers = jQuery.timers, data = jQuery._data(this);
                if (index) data[index] && data[index].stop && stopQueue(data[index]); else for (index in data) data[index] && data[index].stop && rrun.test(index) && stopQueue(data[index]);
                for (index = timers.length; index--; ) timers[index].elem !== this || null != type && timers[index].queue !== type || (timers[index].anim.stop(gotoEnd), 
                dequeue = !1, timers.splice(index, 1));
                // start the next in the queue if the last step wasn't forced
                // timers currently will call their complete callbacks, which will dequeue
                // but only if they were gotoEnd
                (dequeue || !gotoEnd) && jQuery.dequeue(this, type);
            });
        }
    }), // Generate shortcuts for custom animations
    jQuery.each({
        slideDown: genFx("show"),
        slideUp: genFx("hide"),
        slideToggle: genFx("toggle"),
        fadeIn: {
            opacity: "show"
        },
        fadeOut: {
            opacity: "hide"
        },
        fadeToggle: {
            opacity: "toggle"
        }
    }, function(name, props) {
        jQuery.fn[name] = function(speed, easing, callback) {
            return this.animate(props, speed, easing, callback);
        };
    }), jQuery.speed = function(speed, easing, fn) {
        var opt = speed && "object" == typeof speed ? jQuery.extend({}, speed) : {
            complete: fn || !fn && easing || jQuery.isFunction(speed) && speed,
            duration: speed,
            easing: fn && easing || easing && !jQuery.isFunction(easing) && easing
        };
        // normalize opt.queue - true/undefined/null -> "fx"
        // Queueing
        return opt.duration = jQuery.fx.off ? 0 : "number" == typeof opt.duration ? opt.duration : opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[opt.duration] : jQuery.fx.speeds._default, 
        (null == opt.queue || opt.queue === !0) && (opt.queue = "fx"), opt.old = opt.complete, 
        opt.complete = function() {
            jQuery.isFunction(opt.old) && opt.old.call(this), opt.queue && jQuery.dequeue(this, opt.queue);
        }, opt;
    }, jQuery.easing = {
        linear: function(p) {
            return p;
        },
        swing: function(p) {
            return .5 - Math.cos(p * Math.PI) / 2;
        }
    }, jQuery.timers = [], jQuery.fx = Tween.prototype.init, jQuery.fx.tick = function() {
        var timer, timers = jQuery.timers, i = 0;
        for (fxNow = jQuery.now(); i < timers.length; i++) timer = timers[i], // Checks the timer has not already been removed
        timer() || timers[i] !== timer || timers.splice(i--, 1);
        timers.length || jQuery.fx.stop(), fxNow = undefined;
    }, jQuery.fx.timer = function(timer) {
        timer() && jQuery.timers.push(timer) && !timerId && (timerId = setInterval(jQuery.fx.tick, jQuery.fx.interval));
    }, jQuery.fx.interval = 13, jQuery.fx.stop = function() {
        clearInterval(timerId), timerId = null;
    }, jQuery.fx.speeds = {
        slow: 600,
        fast: 200,
        // Default speed
        _default: 400
    }, // Back Compat <1.8 extension point
    jQuery.fx.step = {}, jQuery.expr && jQuery.expr.filters && (jQuery.expr.filters.animated = function(elem) {
        return jQuery.grep(jQuery.timers, function(fn) {
            return elem === fn.elem;
        }).length;
    });
    var rroot = /^(?:body|html)$/i;
    jQuery.fn.offset = function(options) {
        if (arguments.length) return options === undefined ? this : this.each(function(i) {
            jQuery.offset.setOffset(this, options, i);
        });
        var docElem, body, win, clientTop, clientLeft, scrollTop, scrollLeft, box = {
            top: 0,
            left: 0
        }, elem = this[0], doc = elem && elem.ownerDocument;
        if (doc) // Make sure it's not a disconnected DOM node
        // If we don't have gBCR, just use 0,0 rather than error
        // BlackBerry 5, iOS 3 (original iPhone)
        return (body = doc.body) === elem ? jQuery.offset.bodyOffset(elem) : (docElem = doc.documentElement, 
        jQuery.contains(docElem, elem) ? ("undefined" != typeof elem.getBoundingClientRect && (box = elem.getBoundingClientRect()), 
        win = getWindow(doc), clientTop = docElem.clientTop || body.clientTop || 0, clientLeft = docElem.clientLeft || body.clientLeft || 0, 
        scrollTop = win.pageYOffset || docElem.scrollTop, scrollLeft = win.pageXOffset || docElem.scrollLeft, 
        {
            top: box.top + scrollTop - clientTop,
            left: box.left + scrollLeft - clientLeft
        }) : box);
    }, jQuery.offset = {
        bodyOffset: function(body) {
            var top = body.offsetTop, left = body.offsetLeft;
            return jQuery.support.doesNotIncludeMarginInBodyOffset && (top += parseFloat(jQuery.css(body, "marginTop")) || 0, 
            left += parseFloat(jQuery.css(body, "marginLeft")) || 0), {
                top: top,
                left: left
            };
        },
        setOffset: function(elem, options, i) {
            var position = jQuery.css(elem, "position");
            // set position first, in-case top/left are set even on static elem
            "static" === position && (elem.style.position = "relative");
            var curTop, curLeft, curElem = jQuery(elem), curOffset = curElem.offset(), curCSSTop = jQuery.css(elem, "top"), curCSSLeft = jQuery.css(elem, "left"), calculatePosition = ("absolute" === position || "fixed" === position) && jQuery.inArray("auto", [ curCSSTop, curCSSLeft ]) > -1, props = {}, curPosition = {};
            // need to be able to calculate position if either top or left is auto and position is either absolute or fixed
            calculatePosition ? (curPosition = curElem.position(), curTop = curPosition.top, 
            curLeft = curPosition.left) : (curTop = parseFloat(curCSSTop) || 0, curLeft = parseFloat(curCSSLeft) || 0), 
            jQuery.isFunction(options) && (options = options.call(elem, i, curOffset)), null != options.top && (props.top = options.top - curOffset.top + curTop), 
            null != options.left && (props.left = options.left - curOffset.left + curLeft), 
            "using" in options ? options.using.call(elem, props) : curElem.css(props);
        }
    }, jQuery.fn.extend({
        position: function() {
            if (this[0]) {
                var elem = this[0], // Get *real* offsetParent
                offsetParent = this.offsetParent(), // Get correct offsets
                offset = this.offset(), parentOffset = rroot.test(offsetParent[0].nodeName) ? {
                    top: 0,
                    left: 0
                } : offsetParent.offset();
                // Subtract the two offsets
                // Subtract element margins
                // note: when an element has margin: auto the offsetLeft and marginLeft
                // are the same in Safari causing offset.left to incorrectly be 0
                // Add offsetParent borders
                return offset.top -= parseFloat(jQuery.css(elem, "marginTop")) || 0, offset.left -= parseFloat(jQuery.css(elem, "marginLeft")) || 0, 
                parentOffset.top += parseFloat(jQuery.css(offsetParent[0], "borderTopWidth")) || 0, 
                parentOffset.left += parseFloat(jQuery.css(offsetParent[0], "borderLeftWidth")) || 0, 
                {
                    top: offset.top - parentOffset.top,
                    left: offset.left - parentOffset.left
                };
            }
        },
        offsetParent: function() {
            return this.map(function() {
                for (var offsetParent = this.offsetParent || document.body; offsetParent && !rroot.test(offsetParent.nodeName) && "static" === jQuery.css(offsetParent, "position"); ) offsetParent = offsetParent.offsetParent;
                return offsetParent || document.body;
            });
        }
    }), // Create scrollLeft and scrollTop methods
    jQuery.each({
        scrollLeft: "pageXOffset",
        scrollTop: "pageYOffset"
    }, function(method, prop) {
        var top = /Y/.test(prop);
        jQuery.fn[method] = function(val) {
            return jQuery.access(this, function(elem, method, val) {
                var win = getWindow(elem);
                return val === undefined ? win ? prop in win ? win[prop] : win.document.documentElement[method] : elem[method] : void (win ? win.scrollTo(top ? jQuery(win).scrollLeft() : val, top ? val : jQuery(win).scrollTop()) : elem[method] = val);
            }, method, val, arguments.length, null);
        };
    }), // Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
    jQuery.each({
        Height: "height",
        Width: "width"
    }, function(name, type) {
        jQuery.each({
            padding: "inner" + name,
            content: type,
            "": "outer" + name
        }, function(defaultExtra, funcName) {
            // margin is only for outerHeight, outerWidth
            jQuery.fn[funcName] = function(margin, value) {
                var chainable = arguments.length && (defaultExtra || "boolean" != typeof margin), extra = defaultExtra || (margin === !0 || value === !0 ? "margin" : "border");
                return jQuery.access(this, function(elem, type, value) {
                    var doc;
                    // Get document width or height
                    // Get width or height on the element, requesting but not forcing parseFloat
                    // Set width or height on the element
                    return jQuery.isWindow(elem) ? elem.document.documentElement["client" + name] : 9 === elem.nodeType ? (doc = elem.documentElement, 
                    Math.max(elem.body["scroll" + name], doc["scroll" + name], elem.body["offset" + name], doc["offset" + name], doc["client" + name])) : value === undefined ? jQuery.css(elem, type, value, extra) : jQuery.style(elem, type, value, extra);
                }, type, chainable ? margin : undefined, chainable, null);
            };
        });
    }), // Expose jQuery to the global object
    window.jQuery = window.$ = jQuery, // Expose jQuery as an AMD module, but only for AMD loaders that
    // understand the issues with loading multiple versions of jQuery
    // in a page that all might call define(). The loader will indicate
    // they have special allowances for multiple jQuery versions by
    // specifying define.amd.jQuery = true. Register as a named module,
    // since jQuery can be concatenated with other files that may use define,
    // but not use a proper concatenation script that understands anonymous
    // AMD modules. A named AMD is safest and most robust way to register.
    // Lowercase jquery is used because AMD module names are derived from
    // file names, and jQuery is normally delivered in a lowercase file name.
    // Do this after creating the global so that if an AMD module wants to call
    // noConflict to hide this version of jQuery, it will work.
    "function" == typeof define && define.amd && define.amd.jQuery && define("jquery", [], function() {
        return jQuery;
    });
}(window), /**
 * jQuery Once Plugin 1.2.6
 * http://github.com/robloach/jquery-once
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
function(factory) {
    "object" == typeof exports ? factory(require("jquery")) : "function" == typeof define && define.amd ? define("jquery-once", [ "jquery" ], factory) : factory(jQuery);
}(function($) {
    var cache = {}, uuid = 0;
    /**
   * Filters elements by whether they have not yet been processed.
   *
   * @param id
   *   (Optional) If this is a string, then it will be used as the CSS class
   *   name that is applied to the elements for determining whether it has
   *   already been processed. The elements will get a class in the form of
   *   "id-processed".
   *
   *   If the id parameter is a function, it will be passed off to the fn
   *   parameter and the id will become a unique identifier, represented as a
   *   number.
   *
   *   When the id is neither a string or a function, it becomes a unique
   *   identifier, depicted as a number. The element's class will then be
   *   represented in the form of "jquery-once-#-processed".
   *
   *   Take note that the id must be valid for usage as an element's class name.
   * @param fn
   *   (Optional) If given, this function will be called for each element that
   *   has not yet been processed. The function's return value follows the same
   *   logic as $.each(). Returning true will continue to the next matched
   *   element in the set, while returning false will entirely break the
   *   iteration.
   *
   * @api public
   */
    $.fn.once = function(id, fn) {
        "string" != typeof id && (// Generate a numeric ID if the id passed can't be used as a CSS class.
        id in cache || (cache[id] = ++uuid), // When the fn parameter is not passed, we interpret it from the id.
        fn || (fn = id), id = "jquery-once-" + cache[id]);
        // Remove elements from the set that have already been processed.
        var name = id + "-processed", elements = this.not("." + name).addClass(name);
        return $.isFunction(fn) ? elements.each(fn) : elements;
    }, /**
   * Filters elements that have been processed once already.
   *
   * @param id
   *   A required string representing the name of the class which should be used
   *   when filtering the elements. This only filters elements that have already
   *   been processed by the once function. The id should be the same id that
   *   was originally passed to the once() function.
   * @param fn
   *   (Optional) If given, this function will be called for each element that
   *   has not yet been processed. The function's return value follows the same
   *   logic as $.each(). Returning true will continue to the next matched
   *   element in the set, while returning false will entirely break the
   *   iteration.
   *
   * @api public
   */
    $.fn.removeOnce = function(id, fn) {
        var name = id + "-processed", elements = this.filter("." + name).removeClass(name);
        return $.isFunction(fn) ? elements.each(fn) : elements;
    };
}), function($) {
    $.fn.unveil = function(threshold, callback) {
        function unveil() {
            var inview = images.filter(function() {
                var $e = $(this);
                if (!$e.is(":hidden")) {
                    var wt = $w.scrollTop(), wb = wt + $w.height(), et = $e.offset().top, eb = et + $e.height();
                    return eb >= wt - th && wb + th >= et;
                }
            });
            loaded = inview.trigger("unveil"), images = images.not(loaded);
        }
        var loaded, $w = $(window), th = threshold || 0, retina = window.devicePixelRatio > 1, attrib = retina ? "data-src-retina" : "data-src", images = this;
        return this.one("unveil", function() {
            var source = this.getAttribute(attrib);
            source = source || this.getAttribute("data-src"), source && (this.setAttribute("src", source), 
            "function" == typeof callback && callback.call(this));
        }), $w.scroll(unveil), $w.resize(unveil), unveil(), this;
    };
}(window.jQuery || window.Zepto), define("jquery-unveil", [ "jquery" ], function() {});

/*
 * Mailcheck https://github.com/Kicksend/mailcheck
 * Author
 * Derrick Ko (@derrickko)
 *
 * License
 * Copyright (c) 2012 Receivd, Inc.
 *
 * Licensed under the MIT License.
 *
 * v 1.1
 */
var Kicksend = {
    mailcheck: {
        threshold: 3,
        defaultDomains: [ "yahoo.com", "google.com", "hotmail.com", "gmail.com", "me.com", "aol.com", "mac.com", "live.com", "comcast.net", "googlemail.com", "msn.com", "hotmail.co.uk", "yahoo.co.uk", "facebook.com", "verizon.net", "sbcglobal.net", "att.net", "gmx.com", "mail.com", "outlook.com", "icloud.com" ],
        defaultTopLevelDomains: [ "co.jp", "co.uk", "com", "net", "org", "info", "edu", "gov", "mil", "ca" ],
        run: function(opts) {
            opts.domains = opts.domains || Kicksend.mailcheck.defaultDomains, opts.topLevelDomains = opts.topLevelDomains || Kicksend.mailcheck.defaultTopLevelDomains, 
            opts.distanceFunction = opts.distanceFunction || Kicksend.sift3Distance;
            var defaultCallback = function(result) {
                return result;
            }, suggestedCallback = opts.suggested || defaultCallback, emptyCallback = opts.empty || defaultCallback, result = Kicksend.mailcheck.suggest(encodeURI(opts.email), opts.domains, opts.topLevelDomains, opts.distanceFunction);
            return result ? suggestedCallback(result) : emptyCallback();
        },
        suggest: function(email, domains, topLevelDomains, distanceFunction) {
            email = email.toLowerCase();
            var emailParts = this.splitEmail(email), closestDomain = this.findClosestDomain(emailParts.domain, domains, distanceFunction);
            if (closestDomain) {
                if (closestDomain != emailParts.domain) // The email address closely matches one of the supplied domains; return a suggestion
                return {
                    address: emailParts.address,
                    domain: closestDomain,
                    full: emailParts.address + "@" + closestDomain
                };
            } else {
                // The email address does not closely match one of the supplied domains
                var closestTopLevelDomain = this.findClosestDomain(emailParts.topLevelDomain, topLevelDomains);
                if (emailParts.domain && closestTopLevelDomain && closestTopLevelDomain != emailParts.topLevelDomain) {
                    // The email address may have a mispelled top-level domain; return a suggestion
                    var domain = emailParts.domain;
                    return closestDomain = domain.substring(0, domain.lastIndexOf(emailParts.topLevelDomain)) + closestTopLevelDomain, 
                    {
                        address: emailParts.address,
                        domain: closestDomain,
                        full: emailParts.address + "@" + closestDomain
                    };
                }
            }
            /* The email address exactly matches one of the supplied domains, does not closely
       * match any domain and does not appear to simply have a mispelled top-level domain,
       * or is an invalid email address; do not return a suggestion.
       */
            return !1;
        },
        findClosestDomain: function(domain, domains, distanceFunction) {
            var dist, minDist = 99, closestDomain = null;
            if (!domain || !domains) return !1;
            distanceFunction || (distanceFunction = this.sift3Distance);
            for (var i = 0; i < domains.length; i++) {
                if (domain === domains[i]) return domain;
                dist = distanceFunction(domain, domains[i]), minDist > dist && (minDist = dist, 
                closestDomain = domains[i]);
            }
            return minDist <= this.threshold && null !== closestDomain ? closestDomain : !1;
        },
        sift3Distance: function(s1, s2) {
            // sift3: http://siderite.blogspot.com/2007/04/super-fast-and-accurate-string-distance.html
            if (null == s1 || 0 === s1.length) return null == s2 || 0 === s2.length ? 0 : s2.length;
            if (null == s2 || 0 === s2.length) return s1.length;
            for (var c = 0, offset1 = 0, offset2 = 0, lcs = 0, maxOffset = 5; c + offset1 < s1.length && c + offset2 < s2.length; ) {
                if (s1.charAt(c + offset1) == s2.charAt(c + offset2)) lcs++; else {
                    offset1 = 0, offset2 = 0;
                    for (var i = 0; maxOffset > i; i++) {
                        if (c + i < s1.length && s1.charAt(c + i) == s2.charAt(c)) {
                            offset1 = i;
                            break;
                        }
                        if (c + i < s2.length && s1.charAt(c) == s2.charAt(c + i)) {
                            offset2 = i;
                            break;
                        }
                    }
                }
                c++;
            }
            return (s1.length + s2.length) / 2 - lcs;
        },
        splitEmail: function(email) {
            var parts = email.split("@");
            if (parts.length < 2) return !1;
            for (var i = 0; i < parts.length; i++) if ("" === parts[i]) return !1;
            var domain = parts.pop(), domainParts = domain.split("."), tld = "";
            if (0 == domainParts.length) // The address does not have a top-level domain
            return !1;
            if (1 == domainParts.length) // The address has only a top-level domain (valid under RFC)
            tld = domainParts[0]; else {
                // The address has a domain and a top-level domain
                for (var i = 1; i < domainParts.length; i++) tld += domainParts[i] + ".";
                domainParts.length >= 2 && (tld = tld.substring(0, tld.length - 1));
            }
            return {
                topLevelDomain: tld,
                domain: domain,
                address: parts.join("@")
            };
        }
    }
};

// Export the mailcheck object if we're in a CommonJS env (e.g. Node).
// Modeled off of Underscore.js.
"undefined" != typeof module && module.exports && (module.exports = Kicksend.mailcheck), 
"undefined" != typeof window && window.jQuery && !function($) {
    $.fn.mailcheck = function(opts) {
        var self = this;
        if (opts.suggested) {
            var oldSuggested = opts.suggested;
            opts.suggested = function(result) {
                oldSuggested(self, result);
            };
        }
        if (opts.empty) {
            var oldEmpty = opts.empty;
            opts.empty = function() {
                oldEmpty.call(null, self);
            };
        }
        opts.email = this.val(), Kicksend.mailcheck.run(opts);
    };
}(jQuery), define("mailcheck", function(global) {
    return function() {
        var ret;
        return ret || global.Kicksend.mailcheck;
    };
}(this)), function() {
    /*--------------------------------------------------------------------------*/
    /**
   * The base implementation of `_.indexOf` without support for binary searches
   * or `fromIndex` constraints.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {*} value The value to search for.
   * @param {number} [fromIndex=0] The index to search from.
   * @returns {number} Returns the index of the matched value or `-1`.
   */
    function baseIndexOf(array, value, fromIndex) {
        for (var index = (fromIndex || 0) - 1, length = array ? array.length : 0; ++index < length; ) if (array[index] === value) return index;
        return -1;
    }
    /**
   * An implementation of `_.contains` for cache objects that mimics the return
   * signature of `_.indexOf` by returning `0` if the value is found, else `-1`.
   *
   * @private
   * @param {Object} cache The cache object to inspect.
   * @param {*} value The value to search for.
   * @returns {number} Returns `0` if `value` is found, else `-1`.
   */
    function cacheIndexOf(cache, value) {
        var type = typeof value;
        if (cache = cache.cache, "boolean" == type || null == value) return cache[value] ? 0 : -1;
        "number" != type && "string" != type && (type = "object");
        var key = "number" == type ? value : keyPrefix + value;
        return cache = (cache = cache[type]) && cache[key], "object" == type ? cache && baseIndexOf(cache, value) > -1 ? 0 : -1 : cache ? 0 : -1;
    }
    /**
   * Adds a given value to the corresponding cache object.
   *
   * @private
   * @param {*} value The value to add to the cache.
   */
    function cachePush(value) {
        var cache = this.cache, type = typeof value;
        if ("boolean" == type || null == value) cache[value] = !0; else {
            "number" != type && "string" != type && (type = "object");
            var key = "number" == type ? value : keyPrefix + value, typeCache = cache[type] || (cache[type] = {});
            "object" == type ? (typeCache[key] || (typeCache[key] = [])).push(value) : typeCache[key] = !0;
        }
    }
    /**
   * Used by `_.max` and `_.min` as the default callback when a given
   * collection is a string value.
   *
   * @private
   * @param {string} value The character to inspect.
   * @returns {number} Returns the code unit of given character.
   */
    function charAtCallback(value) {
        return value.charCodeAt(0);
    }
    /**
   * Used by `sortBy` to compare transformed `collection` elements, stable sorting
   * them in ascending order.
   *
   * @private
   * @param {Object} a The object to compare to `b`.
   * @param {Object} b The object to compare to `a`.
   * @returns {number} Returns the sort order indicator of `1` or `-1`.
   */
    function compareAscending(a, b) {
        for (var ac = a.criteria, bc = b.criteria, index = -1, length = ac.length; ++index < length; ) {
            var value = ac[index], other = bc[index];
            if (value !== other) {
                if (value > other || "undefined" == typeof value) return 1;
                if (other > value || "undefined" == typeof other) return -1;
            }
        }
        // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
        // that causes it, under certain circumstances, to return the same value for
        // `a` and `b`. See https://github.com/jashkenas/underscore/pull/1247
        //
        // This also ensures a stable sort in V8 and other engines.
        // See http://code.google.com/p/v8/issues/detail?id=90
        return a.index - b.index;
    }
    /**
   * Creates a cache object to optimize linear searches of large arrays.
   *
   * @private
   * @param {Array} [array=[]] The array to search.
   * @returns {null|Object} Returns the cache object or `null` if caching should not be used.
   */
    function createCache(array) {
        var index = -1, length = array.length, first = array[0], mid = array[length / 2 | 0], last = array[length - 1];
        if (first && "object" == typeof first && mid && "object" == typeof mid && last && "object" == typeof last) return !1;
        var cache = getObject();
        cache["false"] = cache["null"] = cache["true"] = cache.undefined = !1;
        var result = getObject();
        for (result.array = array, result.cache = cache, result.push = cachePush; ++index < length; ) result.push(array[index]);
        return result;
    }
    /**
   * Used by `template` to escape characters for inclusion in compiled
   * string literals.
   *
   * @private
   * @param {string} match The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
    function escapeStringChar(match) {
        return "\\" + stringEscapes[match];
    }
    /**
   * Gets an array from the array pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Array} The array from the pool.
   */
    function getArray() {
        return arrayPool.pop() || [];
    }
    /**
   * Gets an object from the object pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Object} The object from the pool.
   */
    function getObject() {
        return objectPool.pop() || {
            array: null,
            cache: null,
            criteria: null,
            "false": !1,
            index: 0,
            "null": !1,
            number: null,
            object: null,
            push: null,
            string: null,
            "true": !1,
            undefined: !1,
            value: null
        };
    }
    /**
   * Releases the given array back to the array pool.
   *
   * @private
   * @param {Array} [array] The array to release.
   */
    function releaseArray(array) {
        array.length = 0, arrayPool.length < maxPoolSize && arrayPool.push(array);
    }
    /**
   * Releases the given object back to the object pool.
   *
   * @private
   * @param {Object} [object] The object to release.
   */
    function releaseObject(object) {
        var cache = object.cache;
        cache && releaseObject(cache), object.array = object.cache = object.criteria = object.object = object.number = object.string = object.value = null, 
        objectPool.length < maxPoolSize && objectPool.push(object);
    }
    /**
   * Slices the `collection` from the `start` index up to, but not including,
   * the `end` index.
   *
   * Note: This function is used instead of `Array#slice` to support node lists
   * in IE < 9 and to ensure dense arrays are returned.
   *
   * @private
   * @param {Array|Object|string} collection The collection to slice.
   * @param {number} start The start index.
   * @param {number} end The end index.
   * @returns {Array} Returns the new array.
   */
    function slice(array, start, end) {
        start || (start = 0), "undefined" == typeof end && (end = array ? array.length : 0);
        for (var index = -1, length = end - start || 0, result = Array(0 > length ? 0 : length); ++index < length; ) result[index] = array[start + index];
        return result;
    }
    /*--------------------------------------------------------------------------*/
    /**
   * Create a new `lodash` function using the given context object.
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @param {Object} [context=root] The context object.
   * @returns {Function} Returns the `lodash` function.
   */
    function runInContext(context) {
        /*--------------------------------------------------------------------------*/
        /**
     * Creates a `lodash` object which wraps the given value to enable intuitive
     * method chaining.
     *
     * In addition to Lo-Dash methods, wrappers also have the following `Array` methods:
     * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`, `splice`,
     * and `unshift`
     *
     * Chaining is supported in custom builds as long as the `value` method is
     * implicitly or explicitly included in the build.
     *
     * The chainable wrapper functions are:
     * `after`, `assign`, `bind`, `bindAll`, `bindKey`, `chain`, `compact`,
     * `compose`, `concat`, `countBy`, `create`, `createCallback`, `curry`,
     * `debounce`, `defaults`, `defer`, `delay`, `difference`, `filter`, `flatten`,
     * `forEach`, `forEachRight`, `forIn`, `forInRight`, `forOwn`, `forOwnRight`,
     * `functions`, `groupBy`, `indexBy`, `initial`, `intersection`, `invert`,
     * `invoke`, `keys`, `map`, `max`, `memoize`, `merge`, `min`, `object`, `omit`,
     * `once`, `pairs`, `partial`, `partialRight`, `pick`, `pluck`, `pull`, `push`,
     * `range`, `reject`, `remove`, `rest`, `reverse`, `shuffle`, `slice`, `sort`,
     * `sortBy`, `splice`, `tap`, `throttle`, `times`, `toArray`, `transform`,
     * `union`, `uniq`, `unshift`, `unzip`, `values`, `where`, `without`, `wrap`,
     * and `zip`
     *
     * The non-chainable wrapper functions are:
     * `clone`, `cloneDeep`, `contains`, `escape`, `every`, `find`, `findIndex`,
     * `findKey`, `findLast`, `findLastIndex`, `findLastKey`, `has`, `identity`,
     * `indexOf`, `isArguments`, `isArray`, `isBoolean`, `isDate`, `isElement`,
     * `isEmpty`, `isEqual`, `isFinite`, `isFunction`, `isNaN`, `isNull`, `isNumber`,
     * `isObject`, `isPlainObject`, `isRegExp`, `isString`, `isUndefined`, `join`,
     * `lastIndexOf`, `mixin`, `noConflict`, `parseInt`, `pop`, `random`, `reduce`,
     * `reduceRight`, `result`, `shift`, `size`, `some`, `sortedIndex`, `runInContext`,
     * `template`, `unescape`, `uniqueId`, and `value`
     *
     * The wrapper functions `first` and `last` return wrapped values when `n` is
     * provided, otherwise they return unwrapped values.
     *
     * Explicit chaining can be enabled by using the `_.chain` method.
     *
     * @name _
     * @constructor
     * @category Chaining
     * @param {*} value The value to wrap in a `lodash` instance.
     * @returns {Object} Returns a `lodash` instance.
     * @example
     *
     * var wrapped = _([1, 2, 3]);
     *
     * // returns an unwrapped value
     * wrapped.reduce(function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * // returns a wrapped value
     * var squares = wrapped.map(function(num) {
     *   return num * num;
     * });
     *
     * _.isArray(squares);
     * // => false
     *
     * _.isArray(squares.value());
     * // => true
     */
        function lodash(value) {
            // don't wrap if already wrapped, even if wrapped by a different `lodash` constructor
            return value && "object" == typeof value && !isArray(value) && hasOwnProperty.call(value, "__wrapped__") ? value : new lodashWrapper(value);
        }
        /**
     * A fast path for creating `lodash` wrapper objects.
     *
     * @private
     * @param {*} value The value to wrap in a `lodash` instance.
     * @param {boolean} chainAll A flag to enable chaining for all methods
     * @returns {Object} Returns a `lodash` instance.
     */
        function lodashWrapper(value, chainAll) {
            this.__chain__ = !!chainAll, this.__wrapped__ = value;
        }
        /*--------------------------------------------------------------------------*/
        /**
     * The base implementation of `_.bind` that creates the bound function and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new bound function.
     */
        function baseBind(bindData) {
            function bound() {
                // `Function#bind` spec
                // http://es5.github.io/#x15.3.4.5
                if (partialArgs) {
                    // avoid `arguments` object deoptimizations by using `slice` instead
                    // of `Array.prototype.slice.call` and not assigning `arguments` to a
                    // variable as a ternary expression
                    var args = slice(partialArgs);
                    push.apply(args, arguments);
                }
                // mimic the constructor's `return` behavior
                // http://es5.github.io/#x13.2.2
                if (this instanceof bound) {
                    // ensure `new bound` is an instance of `func`
                    var thisBinding = baseCreate(func.prototype), result = func.apply(thisBinding, args || arguments);
                    return isObject(result) ? result : thisBinding;
                }
                return func.apply(thisArg, args || arguments);
            }
            var func = bindData[0], partialArgs = bindData[2], thisArg = bindData[4];
            return setBindData(bound, bindData), bound;
        }
        /**
     * The base implementation of `_.clone` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates clones with source counterparts.
     * @returns {*} Returns the cloned value.
     */
        function baseClone(value, isDeep, callback, stackA, stackB) {
            if (callback) {
                var result = callback(value);
                if ("undefined" != typeof result) return result;
            }
            // inspect [[Class]]
            var isObj = isObject(value);
            if (!isObj) return value;
            var className = toString.call(value);
            if (!cloneableClasses[className]) return value;
            var ctor = ctorByClass[className];
            switch (className) {
              case boolClass:
              case dateClass:
                return new ctor(+value);

              case numberClass:
              case stringClass:
                return new ctor(value);

              case regexpClass:
                return result = ctor(value.source, reFlags.exec(value)), result.lastIndex = value.lastIndex, 
                result;
            }
            var isArr = isArray(value);
            if (isDeep) {
                // check for circular references and return corresponding clone
                var initedStack = !stackA;
                stackA || (stackA = getArray()), stackB || (stackB = getArray());
                for (var length = stackA.length; length--; ) if (stackA[length] == value) return stackB[length];
                result = isArr ? ctor(value.length) : {};
            } else result = isArr ? slice(value) : assign({}, value);
            // exit for shallow clone
            // add array properties assigned by `RegExp#exec`
            // exit for shallow clone
            // add the source value to the stack of traversed objects
            // and associate it with its clone
            // recursively populate clone (susceptible to call stack limits)
            return isArr && (hasOwnProperty.call(value, "index") && (result.index = value.index), 
            hasOwnProperty.call(value, "input") && (result.input = value.input)), isDeep ? (stackA.push(value), 
            stackB.push(result), (isArr ? forEach : forOwn)(value, function(objValue, key) {
                result[key] = baseClone(objValue, isDeep, callback, stackA, stackB);
            }), initedStack && (releaseArray(stackA), releaseArray(stackB)), result) : result;
        }
        /**
     * The base implementation of `_.create` without support for assigning
     * properties to the created object.
     *
     * @private
     * @param {Object} prototype The object to inherit from.
     * @returns {Object} Returns the new object.
     */
        function baseCreate(prototype) {
            return isObject(prototype) ? nativeCreate(prototype) : {};
        }
        /**
     * The base implementation of `_.createCallback` without support for creating
     * "_.pluck" or "_.where" style callbacks.
     *
     * @private
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     */
        function baseCreateCallback(func, thisArg, argCount) {
            if ("function" != typeof func) return identity;
            // exit early for no `thisArg` or already bound by `Function#bind`
            if ("undefined" == typeof thisArg || !("prototype" in func)) return func;
            var bindData = func.__bindData__;
            if ("undefined" == typeof bindData && (support.funcNames && (bindData = !func.name), 
            bindData = bindData || !support.funcDecomp, !bindData)) {
                var source = fnToString.call(func);
                support.funcNames || (bindData = !reFuncName.test(source)), bindData || (// checks if `func` references the `this` keyword and stores the result
                bindData = reThis.test(source), setBindData(func, bindData));
            }
            // exit early if there are no `this` references or `func` is bound
            if (bindData === !1 || bindData !== !0 && 1 & bindData[1]) return func;
            switch (argCount) {
              case 1:
                return function(value) {
                    return func.call(thisArg, value);
                };

              case 2:
                return function(a, b) {
                    return func.call(thisArg, a, b);
                };

              case 3:
                return function(value, index, collection) {
                    return func.call(thisArg, value, index, collection);
                };

              case 4:
                return function(accumulator, value, index, collection) {
                    return func.call(thisArg, accumulator, value, index, collection);
                };
            }
            return bind(func, thisArg);
        }
        /**
     * The base implementation of `createWrapper` that creates the wrapper and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new function.
     */
        function baseCreateWrapper(bindData) {
            function bound() {
                var thisBinding = isBind ? thisArg : this;
                if (partialArgs) {
                    var args = slice(partialArgs);
                    push.apply(args, arguments);
                }
                if ((partialRightArgs || isCurry) && (args || (args = slice(arguments)), partialRightArgs && push.apply(args, partialRightArgs), 
                isCurry && args.length < arity)) return bitmask |= 16, baseCreateWrapper([ func, isCurryBound ? bitmask : -4 & bitmask, args, null, thisArg, arity ]);
                if (args || (args = arguments), isBindKey && (func = thisBinding[key]), this instanceof bound) {
                    thisBinding = baseCreate(func.prototype);
                    var result = func.apply(thisBinding, args);
                    return isObject(result) ? result : thisBinding;
                }
                return func.apply(thisBinding, args);
            }
            var func = bindData[0], bitmask = bindData[1], partialArgs = bindData[2], partialRightArgs = bindData[3], thisArg = bindData[4], arity = bindData[5], isBind = 1 & bitmask, isBindKey = 2 & bitmask, isCurry = 4 & bitmask, isCurryBound = 8 & bitmask, key = func;
            return setBindData(bound, bindData), bound;
        }
        /**
     * The base implementation of `_.difference` that accepts a single array
     * of values to exclude.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {Array} [values] The array of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     */
        function baseDifference(array, values) {
            var index = -1, indexOf = getIndexOf(), length = array ? array.length : 0, isLarge = length >= largeArraySize && indexOf === baseIndexOf, result = [];
            if (isLarge) {
                var cache = createCache(values);
                cache ? (indexOf = cacheIndexOf, values = cache) : isLarge = !1;
            }
            for (;++index < length; ) {
                var value = array[index];
                indexOf(values, value) < 0 && result.push(value);
            }
            return isLarge && releaseObject(values), result;
        }
        /**
     * The base implementation of `_.flatten` without support for callback
     * shorthands or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {boolean} [isStrict=false] A flag to restrict flattening to arrays and `arguments` objects.
     * @param {number} [fromIndex=0] The index to start from.
     * @returns {Array} Returns a new flattened array.
     */
        function baseFlatten(array, isShallow, isStrict, fromIndex) {
            for (var index = (fromIndex || 0) - 1, length = array ? array.length : 0, result = []; ++index < length; ) {
                var value = array[index];
                if (value && "object" == typeof value && "number" == typeof value.length && (isArray(value) || isArguments(value))) {
                    // recursively flatten arrays (susceptible to call stack limits)
                    isShallow || (value = baseFlatten(value, isShallow, isStrict));
                    var valIndex = -1, valLength = value.length, resIndex = result.length;
                    for (result.length += valLength; ++valIndex < valLength; ) result[resIndex++] = value[valIndex];
                } else isStrict || result.push(value);
            }
            return result;
        }
        /**
     * The base implementation of `_.isEqual`, without support for `thisArg` binding,
     * that allows partial "_.where" style comparisons.
     *
     * @private
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {Function} [isWhere=false] A flag to indicate performing partial comparisons.
     * @param {Array} [stackA=[]] Tracks traversed `a` objects.
     * @param {Array} [stackB=[]] Tracks traversed `b` objects.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     */
        function baseIsEqual(a, b, callback, isWhere, stackA, stackB) {
            // used to indicate that when comparing objects, `a` has at least the properties of `b`
            if (callback) {
                var result = callback(a, b);
                if ("undefined" != typeof result) return !!result;
            }
            // exit early for identical values
            if (a === b) // treat `+0` vs. `-0` as not equal
            return 0 !== a || 1 / a == 1 / b;
            var type = typeof a, otherType = typeof b;
            // exit early for unlike primitive values
            if (!(a !== a || a && objectTypes[type] || b && objectTypes[otherType])) return !1;
            // exit early for `null` and `undefined` avoiding ES3's Function#call behavior
            // http://es5.github.io/#x15.3.4.4
            if (null == a || null == b) return a === b;
            // compare [[Class]] names
            var className = toString.call(a), otherClass = toString.call(b);
            if (className == argsClass && (className = objectClass), otherClass == argsClass && (otherClass = objectClass), 
            className != otherClass) return !1;
            switch (className) {
              case boolClass:
              case dateClass:
                // coerce dates and booleans to numbers, dates to milliseconds and booleans
                // to `1` or `0` treating invalid dates coerced to `NaN` as not equal
                return +a == +b;

              case numberClass:
                // treat `NaN` vs. `NaN` as equal
                return a != +a ? b != +b : 0 == a ? 1 / a == 1 / b : a == +b;

              case regexpClass:
              case stringClass:
                // coerce regexes to strings (http://es5.github.io/#x15.10.6.4)
                // treat string primitives and their corresponding object instances as equal
                return a == String(b);
            }
            var isArr = className == arrayClass;
            if (!isArr) {
                // unwrap any `lodash` wrapped values
                var aWrapped = hasOwnProperty.call(a, "__wrapped__"), bWrapped = hasOwnProperty.call(b, "__wrapped__");
                if (aWrapped || bWrapped) return baseIsEqual(aWrapped ? a.__wrapped__ : a, bWrapped ? b.__wrapped__ : b, callback, isWhere, stackA, stackB);
                // exit for functions and DOM nodes
                if (className != objectClass) return !1;
                // in older versions of Opera, `arguments` objects have `Array` constructors
                var ctorA = a.constructor, ctorB = b.constructor;
                // non `Object` object instances with different constructors are not equal
                if (ctorA != ctorB && !(isFunction(ctorA) && ctorA instanceof ctorA && isFunction(ctorB) && ctorB instanceof ctorB) && "constructor" in a && "constructor" in b) return !1;
            }
            // assume cyclic structures are equal
            // the algorithm for detecting cyclic structures is adapted from ES 5.1
            // section 15.12.3, abstract operation `JO` (http://es5.github.io/#x15.12.3)
            var initedStack = !stackA;
            stackA || (stackA = getArray()), stackB || (stackB = getArray());
            for (var length = stackA.length; length--; ) if (stackA[length] == a) return stackB[length] == b;
            var size = 0;
            // recursively compare objects and arrays (susceptible to call stack limits)
            if (result = !0, // add `a` and `b` to the stack of traversed objects
            stackA.push(a), stackB.push(b), isArr) {
                if (// compare lengths to determine if a deep comparison is necessary
                length = a.length, size = b.length, result = size == length, result || isWhere) // deep compare the contents, ignoring non-numeric properties
                for (;size--; ) {
                    var index = length, value = b[size];
                    if (isWhere) for (;index-- && !(result = baseIsEqual(a[index], value, callback, isWhere, stackA, stackB)); ) ; else if (!(result = baseIsEqual(a[size], value, callback, isWhere, stackA, stackB))) break;
                }
            } else // deep compare objects using `forIn`, instead of `forOwn`, to avoid `Object.keys`
            // which, in this case, is more costly
            forIn(b, function(value, key, b) {
                // count the number of properties.
                return hasOwnProperty.call(b, key) ? (size++, result = hasOwnProperty.call(a, key) && baseIsEqual(a[key], value, callback, isWhere, stackA, stackB)) : void 0;
            }), result && !isWhere && // ensure both objects have the same number of properties
            forIn(a, function(value, key, a) {
                return hasOwnProperty.call(a, key) ? result = --size > -1 : void 0;
            });
            return stackA.pop(), stackB.pop(), initedStack && (releaseArray(stackA), releaseArray(stackB)), 
            result;
        }
        /**
     * The base implementation of `_.merge` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates values with source counterparts.
     */
        function baseMerge(object, source, callback, stackA, stackB) {
            (isArray(source) ? forEach : forOwn)(source, function(source, key) {
                var found, isArr, result = source, value = object[key];
                if (source && ((isArr = isArray(source)) || isPlainObject(source))) {
                    for (// avoid merging previously merged cyclic sources
                    var stackLength = stackA.length; stackLength--; ) if (found = stackA[stackLength] == source) {
                        value = stackB[stackLength];
                        break;
                    }
                    if (!found) {
                        var isShallow;
                        callback && (result = callback(value, source), (isShallow = "undefined" != typeof result) && (value = result)), 
                        isShallow || (value = isArr ? isArray(value) ? value : [] : isPlainObject(value) ? value : {}), 
                        // add `source` and associated `value` to the stack of traversed objects
                        stackA.push(source), stackB.push(value), // recursively merge objects and arrays (susceptible to call stack limits)
                        isShallow || baseMerge(value, source, callback, stackA, stackB);
                    }
                } else callback && (result = callback(value, source), "undefined" == typeof result && (result = source)), 
                "undefined" != typeof result && (value = result);
                object[key] = value;
            });
        }
        /**
     * The base implementation of `_.random` without argument juggling or support
     * for returning floating-point numbers.
     *
     * @private
     * @param {number} min The minimum possible value.
     * @param {number} max The maximum possible value.
     * @returns {number} Returns a random number.
     */
        function baseRandom(min, max) {
            return min + floor(nativeRandom() * (max - min + 1));
        }
        /**
     * The base implementation of `_.uniq` without support for callback shorthands
     * or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function} [callback] The function called per iteration.
     * @returns {Array} Returns a duplicate-value-free array.
     */
        function baseUniq(array, isSorted, callback) {
            var index = -1, indexOf = getIndexOf(), length = array ? array.length : 0, result = [], isLarge = !isSorted && length >= largeArraySize && indexOf === baseIndexOf, seen = callback || isLarge ? getArray() : result;
            if (isLarge) {
                var cache = createCache(seen);
                indexOf = cacheIndexOf, seen = cache;
            }
            for (;++index < length; ) {
                var value = array[index], computed = callback ? callback(value, index, array) : value;
                (isSorted ? !index || seen[seen.length - 1] !== computed : indexOf(seen, computed) < 0) && ((callback || isLarge) && seen.push(computed), 
                result.push(value));
            }
            return isLarge ? (releaseArray(seen.array), releaseObject(seen)) : callback && releaseArray(seen), 
            result;
        }
        /**
     * Creates a function that aggregates a collection, creating an object composed
     * of keys generated from the results of running each element of the collection
     * through a callback. The given `setter` function sets the keys and values
     * of the composed object.
     *
     * @private
     * @param {Function} setter The setter function.
     * @returns {Function} Returns the new aggregator function.
     */
        function createAggregator(setter) {
            return function(collection, callback, thisArg) {
                var result = {};
                callback = lodash.createCallback(callback, thisArg, 3);
                var index = -1, length = collection ? collection.length : 0;
                if ("number" == typeof length) for (;++index < length; ) {
                    var value = collection[index];
                    setter(result, value, callback(value, index, collection), collection);
                } else forOwn(collection, function(value, key, collection) {
                    setter(result, value, callback(value, key, collection), collection);
                });
                return result;
            };
        }
        /**
     * Creates a function that, when called, either curries or invokes `func`
     * with an optional `this` binding and partially applied arguments.
     *
     * @private
     * @param {Function|string} func The function or method name to reference.
     * @param {number} bitmask The bitmask of method flags to compose.
     *  The bitmask may be composed of the following flags:
     *  1 - `_.bind`
     *  2 - `_.bindKey`
     *  4 - `_.curry`
     *  8 - `_.curry` (bound)
     *  16 - `_.partial`
     *  32 - `_.partialRight`
     * @param {Array} [partialArgs] An array of arguments to prepend to those
     *  provided to the new function.
     * @param {Array} [partialRightArgs] An array of arguments to append to those
     *  provided to the new function.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new function.
     */
        function createWrapper(func, bitmask, partialArgs, partialRightArgs, thisArg, arity) {
            var isBind = 1 & bitmask, isBindKey = 2 & bitmask, isCurry = 4 & bitmask, isPartial = 16 & bitmask, isPartialRight = 32 & bitmask;
            if (!isBindKey && !isFunction(func)) throw new TypeError();
            isPartial && !partialArgs.length && (bitmask &= -17, isPartial = partialArgs = !1), 
            isPartialRight && !partialRightArgs.length && (bitmask &= -33, isPartialRight = partialRightArgs = !1);
            var bindData = func && func.__bindData__;
            if (bindData && bindData !== !0) // clone `bindData`
            // set `thisBinding` is not previously bound
            // set if previously bound but not currently (subsequent curried functions)
            // set curried arity if not yet set
            // append partial left arguments
            // append partial right arguments
            // merge flags
            return bindData = slice(bindData), bindData[2] && (bindData[2] = slice(bindData[2])), 
            bindData[3] && (bindData[3] = slice(bindData[3])), !isBind || 1 & bindData[1] || (bindData[4] = thisArg), 
            !isBind && 1 & bindData[1] && (bitmask |= 8), !isCurry || 4 & bindData[1] || (bindData[5] = arity), 
            isPartial && push.apply(bindData[2] || (bindData[2] = []), partialArgs), isPartialRight && unshift.apply(bindData[3] || (bindData[3] = []), partialRightArgs), 
            bindData[1] |= bitmask, createWrapper.apply(null, bindData);
            // fast path for `_.bind`
            var creater = 1 == bitmask || 17 === bitmask ? baseBind : baseCreateWrapper;
            return creater([ func, bitmask, partialArgs, partialRightArgs, thisArg, arity ]);
        }
        /**
     * Used by `escape` to convert characters to HTML entities.
     *
     * @private
     * @param {string} match The matched character to escape.
     * @returns {string} Returns the escaped character.
     */
        function escapeHtmlChar(match) {
            return htmlEscapes[match];
        }
        /**
     * Gets the appropriate "indexOf" function. If the `_.indexOf` method is
     * customized, this method returns the custom method, otherwise it returns
     * the `baseIndexOf` function.
     *
     * @private
     * @returns {Function} Returns the "indexOf" function.
     */
        function getIndexOf() {
            var result = (result = lodash.indexOf) === indexOf ? baseIndexOf : result;
            return result;
        }
        /**
     * Checks if `value` is a native function.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a native function, else `false`.
     */
        function isNative(value) {
            return "function" == typeof value && reNative.test(value);
        }
        /**
     * A fallback implementation of `isPlainObject` which checks if a given value
     * is an object created by the `Object` constructor, assuming objects created
     * by the `Object` constructor have no inherited enumerable properties and that
     * there are no `Object.prototype` extensions.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     */
        function shimIsPlainObject(value) {
            var ctor, result;
            // avoid non Object objects, `arguments` objects, and DOM elements
            // avoid non Object objects, `arguments` objects, and DOM elements
            // In most environments an object's own properties are iterated before
            // its inherited properties. If the last iterated property is an object's
            // own property then there are no inherited enumerable properties.
            return value && toString.call(value) == objectClass && (ctor = value.constructor, 
            !isFunction(ctor) || ctor instanceof ctor) ? (forIn(value, function(value, key) {
                result = key;
            }), "undefined" == typeof result || hasOwnProperty.call(value, result)) : !1;
        }
        /**
     * Used by `unescape` to convert HTML entities to characters.
     *
     * @private
     * @param {string} match The matched character to unescape.
     * @returns {string} Returns the unescaped character.
     */
        function unescapeHtmlChar(match) {
            return htmlUnescapes[match];
        }
        /*--------------------------------------------------------------------------*/
        /**
     * Checks if `value` is an `arguments` object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an `arguments` object, else `false`.
     * @example
     *
     * (function() { return _.isArguments(arguments); })(1, 2, 3);
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
        function isArguments(value) {
            return value && "object" == typeof value && "number" == typeof value.length && toString.call(value) == argsClass || !1;
        }
        /**
     * Creates a clone of `value`. If `isDeep` is `true` nested objects will also
     * be cloned, otherwise they will be assigned by reference. If a callback
     * is provided it will be executed to produce the cloned values. If the
     * callback returns `undefined` cloning will be handled by the method instead.
     * The callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var shallow = _.clone(characters);
     * shallow[0] === characters[0];
     * // => true
     *
     * var deep = _.clone(characters, true);
     * deep[0] === characters[0];
     * // => false
     *
     * _.mixin({
     *   'clone': _.partialRight(_.clone, function(value) {
     *     return _.isElement(value) ? value.cloneNode(false) : undefined;
     *   })
     * });
     *
     * var clone = _.clone(document.body);
     * clone.childNodes.length;
     * // => 0
     */
        function clone(value, isDeep, callback, thisArg) {
            // allows working with "Collections" methods without using their `index`
            // and `collection` arguments for `isDeep` and `callback`
            return "boolean" != typeof isDeep && null != isDeep && (thisArg = callback, callback = isDeep, 
            isDeep = !1), baseClone(value, isDeep, "function" == typeof callback && baseCreateCallback(callback, thisArg, 1));
        }
        /**
     * Creates a deep clone of `value`. If a callback is provided it will be
     * executed to produce the cloned values. If the callback returns `undefined`
     * cloning will be handled by the method instead. The callback is bound to
     * `thisArg` and invoked with one argument; (value).
     *
     * Note: This method is loosely based on the structured clone algorithm. Functions
     * and DOM nodes are **not** cloned. The enumerable properties of `arguments` objects and
     * objects created by constructors other than `Object` are cloned to plain `Object` objects.
     * See http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the deep cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var deep = _.cloneDeep(characters);
     * deep[0] === characters[0];
     * // => false
     *
     * var view = {
     *   'label': 'docs',
     *   'node': element
     * };
     *
     * var clone = _.cloneDeep(view, function(value) {
     *   return _.isElement(value) ? value.cloneNode(true) : undefined;
     * });
     *
     * clone.node == view.node;
     * // => false
     */
        function cloneDeep(value, callback, thisArg) {
            return baseClone(value, !0, "function" == typeof callback && baseCreateCallback(callback, thisArg, 1));
        }
        /**
     * Creates an object that inherits from the given `prototype` object. If a
     * `properties` object is provided its own enumerable properties are assigned
     * to the created object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} prototype The object to inherit from.
     * @param {Object} [properties] The properties to assign to the object.
     * @returns {Object} Returns the new object.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * function Circle() {
     *   Shape.call(this);
     * }
     *
     * Circle.prototype = _.create(Shape.prototype, { 'constructor': Circle });
     *
     * var circle = new Circle;
     * circle instanceof Circle;
     * // => true
     *
     * circle instanceof Shape;
     * // => true
     */
        function create(prototype, properties) {
            var result = baseCreate(prototype);
            return properties ? assign(result, properties) : result;
        }
        /**
     * This method is like `_.findIndex` except that it returns the key of the
     * first element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': false },
     *   'fred': {    'age': 40, 'blocked': true },
     *   'pebbles': { 'age': 1,  'blocked': false }
     * };
     *
     * _.findKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => 'barney' (property order is not guaranteed across environments)
     *
     * // using "_.where" callback shorthand
     * _.findKey(characters, { 'age': 1 });
     * // => 'pebbles'
     *
     * // using "_.pluck" callback shorthand
     * _.findKey(characters, 'blocked');
     * // => 'fred'
     */
        function findKey(object, callback, thisArg) {
            var result;
            return callback = lodash.createCallback(callback, thisArg, 3), forOwn(object, function(value, key, object) {
                return callback(value, key, object) ? (result = key, !1) : void 0;
            }), result;
        }
        /**
     * This method is like `_.findKey` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': true },
     *   'fred': {    'age': 40, 'blocked': false },
     *   'pebbles': { 'age': 1,  'blocked': true }
     * };
     *
     * _.findLastKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => returns `pebbles`, assuming `_.findKey` returns `barney`
     *
     * // using "_.where" callback shorthand
     * _.findLastKey(characters, { 'age': 40 });
     * // => 'fred'
     *
     * // using "_.pluck" callback shorthand
     * _.findLastKey(characters, 'blocked');
     * // => 'pebbles'
     */
        function findLastKey(object, callback, thisArg) {
            var result;
            return callback = lodash.createCallback(callback, thisArg, 3), forOwnRight(object, function(value, key, object) {
                return callback(value, key, object) ? (result = key, !1) : void 0;
            }), result;
        }
        /**
     * This method is like `_.forIn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * Shape.prototype.move = function(x, y) {
     *   this.x += x;
     *   this.y += y;
     * };
     *
     * _.forInRight(new Shape, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'move', 'y', and 'x' assuming `_.forIn ` logs 'x', 'y', and 'move'
     */
        function forInRight(object, callback, thisArg) {
            var pairs = [];
            forIn(object, function(value, key) {
                pairs.push(key, value);
            });
            var length = pairs.length;
            for (callback = baseCreateCallback(callback, thisArg, 3); length-- && callback(pairs[length--], pairs[length], object) !== !1; ) ;
            return object;
        }
        /**
     * This method is like `_.forOwn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwnRight({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs 'length', '1', and '0' assuming `_.forOwn` logs '0', '1', and 'length'
     */
        function forOwnRight(object, callback, thisArg) {
            var props = keys(object), length = props.length;
            for (callback = baseCreateCallback(callback, thisArg, 3); length--; ) {
                var key = props[length];
                if (callback(object[key], key, object) === !1) break;
            }
            return object;
        }
        /**
     * Creates a sorted array of property names of all enumerable properties,
     * own and inherited, of `object` that have function values.
     *
     * @static
     * @memberOf _
     * @alias methods
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names that have function values.
     * @example
     *
     * _.functions(_);
     * // => ['all', 'any', 'bind', 'bindAll', 'clone', 'compact', 'compose', ...]
     */
        function functions(object) {
            var result = [];
            return forIn(object, function(value, key) {
                isFunction(value) && result.push(key);
            }), result.sort();
        }
        /**
     * Checks if the specified property name exists as a direct property of `object`,
     * instead of an inherited property.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to check.
     * @returns {boolean} Returns `true` if key is a direct property, else `false`.
     * @example
     *
     * _.has({ 'a': 1, 'b': 2, 'c': 3 }, 'b');
     * // => true
     */
        function has(object, key) {
            return object ? hasOwnProperty.call(object, key) : !1;
        }
        /**
     * Creates an object composed of the inverted keys and values of the given object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to invert.
     * @returns {Object} Returns the created inverted object.
     * @example
     *
     * _.invert({ 'first': 'fred', 'second': 'barney' });
     * // => { 'fred': 'first', 'barney': 'second' }
     */
        function invert(object) {
            for (var index = -1, props = keys(object), length = props.length, result = {}; ++index < length; ) {
                var key = props[index];
                result[object[key]] = key;
            }
            return result;
        }
        /**
     * Checks if `value` is a boolean value.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a boolean value, else `false`.
     * @example
     *
     * _.isBoolean(null);
     * // => false
     */
        function isBoolean(value) {
            return value === !0 || value === !1 || value && "object" == typeof value && toString.call(value) == boolClass || !1;
        }
        /**
     * Checks if `value` is a date.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a date, else `false`.
     * @example
     *
     * _.isDate(new Date);
     * // => true
     */
        function isDate(value) {
            return value && "object" == typeof value && toString.call(value) == dateClass || !1;
        }
        /**
     * Checks if `value` is a DOM element.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a DOM element, else `false`.
     * @example
     *
     * _.isElement(document.body);
     * // => true
     */
        function isElement(value) {
            return value && 1 === value.nodeType || !1;
        }
        /**
     * Checks if `value` is empty. Arrays, strings, or `arguments` objects with a
     * length of `0` and objects with no own enumerable properties are considered
     * "empty".
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object|string} value The value to inspect.
     * @returns {boolean} Returns `true` if the `value` is empty, else `false`.
     * @example
     *
     * _.isEmpty([1, 2, 3]);
     * // => false
     *
     * _.isEmpty({});
     * // => true
     *
     * _.isEmpty('');
     * // => true
     */
        function isEmpty(value) {
            var result = !0;
            if (!value) return result;
            var className = toString.call(value), length = value.length;
            return className == arrayClass || className == stringClass || className == argsClass || className == objectClass && "number" == typeof length && isFunction(value.splice) ? !length : (forOwn(value, function() {
                return result = !1;
            }), result);
        }
        /**
     * Performs a deep comparison between two values to determine if they are
     * equivalent to each other. If a callback is provided it will be executed
     * to compare values. If the callback returns `undefined` comparisons will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (a, b).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var copy = { 'name': 'fred' };
     *
     * object == copy;
     * // => false
     *
     * _.isEqual(object, copy);
     * // => true
     *
     * var words = ['hello', 'goodbye'];
     * var otherWords = ['hi', 'goodbye'];
     *
     * _.isEqual(words, otherWords, function(a, b) {
     *   var reGreet = /^(?:hello|hi)$/i,
     *       aGreet = _.isString(a) && reGreet.test(a),
     *       bGreet = _.isString(b) && reGreet.test(b);
     *
     *   return (aGreet || bGreet) ? (aGreet == bGreet) : undefined;
     * });
     * // => true
     */
        function isEqual(a, b, callback, thisArg) {
            return baseIsEqual(a, b, "function" == typeof callback && baseCreateCallback(callback, thisArg, 2));
        }
        /**
     * Checks if `value` is, or can be coerced to, a finite number.
     *
     * Note: This is not the same as native `isFinite` which will return true for
     * booleans and empty strings. See http://es5.github.io/#x15.1.2.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is finite, else `false`.
     * @example
     *
     * _.isFinite(-101);
     * // => true
     *
     * _.isFinite('10');
     * // => true
     *
     * _.isFinite(true);
     * // => false
     *
     * _.isFinite('');
     * // => false
     *
     * _.isFinite(Infinity);
     * // => false
     */
        function isFinite(value) {
            return nativeIsFinite(value) && !nativeIsNaN(parseFloat(value));
        }
        /**
     * Checks if `value` is a function.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     */
        function isFunction(value) {
            return "function" == typeof value;
        }
        /**
     * Checks if `value` is the language type of Object.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
        function isObject(value) {
            // check if the value is the ECMAScript language type of Object
            // http://es5.github.io/#x8
            // and avoid a V8 bug
            // http://code.google.com/p/v8/issues/detail?id=2291
            return !(!value || !objectTypes[typeof value]);
        }
        /**
     * Checks if `value` is `NaN`.
     *
     * Note: This is not the same as native `isNaN` which will return `true` for
     * `undefined` and other non-numeric values. See http://es5.github.io/#x15.1.2.4.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `NaN`, else `false`.
     * @example
     *
     * _.isNaN(NaN);
     * // => true
     *
     * _.isNaN(new Number(NaN));
     * // => true
     *
     * isNaN(undefined);
     * // => true
     *
     * _.isNaN(undefined);
     * // => false
     */
        function isNaN(value) {
            // `NaN` as a primitive is the only value that is not equal to itself
            // (perform the [[Class]] check first to avoid errors with some host objects in IE)
            return isNumber(value) && value != +value;
        }
        /**
     * Checks if `value` is `null`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `null`, else `false`.
     * @example
     *
     * _.isNull(null);
     * // => true
     *
     * _.isNull(undefined);
     * // => false
     */
        function isNull(value) {
            return null === value;
        }
        /**
     * Checks if `value` is a number.
     *
     * Note: `NaN` is considered a number. See http://es5.github.io/#x8.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a number, else `false`.
     * @example
     *
     * _.isNumber(8.4 * 5);
     * // => true
     */
        function isNumber(value) {
            return "number" == typeof value || value && "object" == typeof value && toString.call(value) == numberClass || !1;
        }
        /**
     * Checks if `value` is a regular expression.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a regular expression, else `false`.
     * @example
     *
     * _.isRegExp(/fred/);
     * // => true
     */
        function isRegExp(value) {
            return value && "object" == typeof value && toString.call(value) == regexpClass || !1;
        }
        /**
     * Checks if `value` is a string.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a string, else `false`.
     * @example
     *
     * _.isString('fred');
     * // => true
     */
        function isString(value) {
            return "string" == typeof value || value && "object" == typeof value && toString.call(value) == stringClass || !1;
        }
        /**
     * Checks if `value` is `undefined`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `undefined`, else `false`.
     * @example
     *
     * _.isUndefined(void 0);
     * // => true
     */
        function isUndefined(value) {
            return "undefined" == typeof value;
        }
        /**
     * Creates an object with the same keys as `object` and values generated by
     * running each own enumerable property of `object` through the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new object with values of the results of each `callback` execution.
     * @example
     *
     * _.mapValues({ 'a': 1, 'b': 2, 'c': 3} , function(num) { return num * 3; });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     *
     * var characters = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // using "_.pluck" callback shorthand
     * _.mapValues(characters, 'age');
     * // => { 'fred': 40, 'pebbles': 1 }
     */
        function mapValues(object, callback, thisArg) {
            var result = {};
            return callback = lodash.createCallback(callback, thisArg, 3), forOwn(object, function(value, key, object) {
                result[key] = callback(value, key, object);
            }), result;
        }
        /**
     * Recursively merges own enumerable properties of the source object(s), that
     * don't resolve to `undefined` into the destination object. Subsequent sources
     * will overwrite property assignments of previous sources. If a callback is
     * provided it will be executed to produce the merged values of the destination
     * and source properties. If the callback returns `undefined` merging will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var names = {
     *   'characters': [
     *     { 'name': 'barney' },
     *     { 'name': 'fred' }
     *   ]
     * };
     *
     * var ages = {
     *   'characters': [
     *     { 'age': 36 },
     *     { 'age': 40 }
     *   ]
     * };
     *
     * _.merge(names, ages);
     * // => { 'characters': [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred', 'age': 40 }] }
     *
     * var food = {
     *   'fruits': ['apple'],
     *   'vegetables': ['beet']
     * };
     *
     * var otherFood = {
     *   'fruits': ['banana'],
     *   'vegetables': ['carrot']
     * };
     *
     * _.merge(food, otherFood, function(a, b) {
     *   return _.isArray(a) ? a.concat(b) : undefined;
     * });
     * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot] }
     */
        function merge(object) {
            var args = arguments, length = 2;
            if (!isObject(object)) return object;
            if (// allows working with `_.reduce` and `_.reduceRight` without using
            // their `index` and `collection` arguments
            "number" != typeof args[2] && (length = args.length), length > 3 && "function" == typeof args[length - 2]) var callback = baseCreateCallback(args[--length - 1], args[length--], 2); else length > 2 && "function" == typeof args[length - 1] && (callback = args[--length]);
            for (var sources = slice(arguments, 1, length), index = -1, stackA = getArray(), stackB = getArray(); ++index < length; ) baseMerge(object, sources[index], callback, stackA, stackB);
            return releaseArray(stackA), releaseArray(stackB), object;
        }
        /**
     * Creates a shallow clone of `object` excluding the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` omitting the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The properties to omit or the
     *  function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object without the omitted properties.
     * @example
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, 'age');
     * // => { 'name': 'fred' }
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, function(value) {
     *   return typeof value == 'number';
     * });
     * // => { 'name': 'fred' }
     */
        function omit(object, callback, thisArg) {
            var result = {};
            if ("function" != typeof callback) {
                var props = [];
                forIn(object, function(value, key) {
                    props.push(key);
                }), props = baseDifference(props, baseFlatten(arguments, !0, !1, 1));
                for (var index = -1, length = props.length; ++index < length; ) {
                    var key = props[index];
                    result[key] = object[key];
                }
            } else callback = lodash.createCallback(callback, thisArg, 3), forIn(object, function(value, key, object) {
                callback(value, key, object) || (result[key] = value);
            });
            return result;
        }
        /**
     * Creates a two dimensional array of an object's key-value pairs,
     * i.e. `[[key1, value1], [key2, value2]]`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns new array of key-value pairs.
     * @example
     *
     * _.pairs({ 'barney': 36, 'fred': 40 });
     * // => [['barney', 36], ['fred', 40]] (property order is not guaranteed across environments)
     */
        function pairs(object) {
            for (var index = -1, props = keys(object), length = props.length, result = Array(length); ++index < length; ) {
                var key = props[index];
                result[index] = [ key, object[key] ];
            }
            return result;
        }
        /**
     * Creates a shallow clone of `object` composed of the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` picking the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The function called per
     *  iteration or property names to pick, specified as individual property
     *  names or arrays of property names.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object composed of the picked properties.
     * @example
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, 'name');
     * // => { 'name': 'fred' }
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, function(value, key) {
     *   return key.charAt(0) != '_';
     * });
     * // => { 'name': 'fred' }
     */
        function pick(object, callback, thisArg) {
            var result = {};
            if ("function" != typeof callback) for (var index = -1, props = baseFlatten(arguments, !0, !1, 1), length = isObject(object) ? props.length : 0; ++index < length; ) {
                var key = props[index];
                key in object && (result[key] = object[key]);
            } else callback = lodash.createCallback(callback, thisArg, 3), forIn(object, function(value, key, object) {
                callback(value, key, object) && (result[key] = value);
            });
            return result;
        }
        /**
     * An alternative to `_.reduce` this method transforms `object` to a new
     * `accumulator` object which is the result of running each of its own
     * enumerable properties through a callback, with each callback execution
     * potentially mutating the `accumulator` object. The callback is bound to
     * `thisArg` and invoked with four arguments; (accumulator, value, key, object).
     * Callbacks may exit iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] The custom accumulator value.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var squares = _.transform([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], function(result, num) {
     *   num *= num;
     *   if (num % 2) {
     *     return result.push(num) < 3;
     *   }
     * });
     * // => [1, 9, 25]
     *
     * var mapped = _.transform({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     * });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
        function transform(object, callback, accumulator, thisArg) {
            var isArr = isArray(object);
            if (null == accumulator) if (isArr) accumulator = []; else {
                var ctor = object && object.constructor, proto = ctor && ctor.prototype;
                accumulator = baseCreate(proto);
            }
            return callback && (callback = lodash.createCallback(callback, thisArg, 4), (isArr ? forEach : forOwn)(object, function(value, index, object) {
                return callback(accumulator, value, index, object);
            })), accumulator;
        }
        /**
     * Creates an array composed of the own enumerable property values of `object`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property values.
     * @example
     *
     * _.values({ 'one': 1, 'two': 2, 'three': 3 });
     * // => [1, 2, 3] (property order is not guaranteed across environments)
     */
        function values(object) {
            for (var index = -1, props = keys(object), length = props.length, result = Array(length); ++index < length; ) result[index] = object[props[index]];
            return result;
        }
        /*--------------------------------------------------------------------------*/
        /**
     * Creates an array of elements from the specified indexes, or keys, of the
     * `collection`. Indexes may be specified as individual arguments or as arrays
     * of indexes.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {...(number|number[]|string|string[])} [index] The indexes of `collection`
     *   to retrieve, specified as individual indexes or arrays of indexes.
     * @returns {Array} Returns a new array of elements corresponding to the
     *  provided indexes.
     * @example
     *
     * _.at(['a', 'b', 'c', 'd', 'e'], [0, 2, 4]);
     * // => ['a', 'c', 'e']
     *
     * _.at(['fred', 'barney', 'pebbles'], 0, 2);
     * // => ['fred', 'pebbles']
     */
        function at(collection) {
            for (var args = arguments, index = -1, props = baseFlatten(args, !0, !1, 1), length = args[2] && args[2][args[1]] === collection ? 1 : props.length, result = Array(length); ++index < length; ) result[index] = collection[props[index]];
            return result;
        }
        /**
     * Checks if a given value is present in a collection using strict equality
     * for comparisons, i.e. `===`. If `fromIndex` is negative, it is used as the
     * offset from the end of the collection.
     *
     * @static
     * @memberOf _
     * @alias include
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {*} target The value to check for.
     * @param {number} [fromIndex=0] The index to search from.
     * @returns {boolean} Returns `true` if the `target` element is found, else `false`.
     * @example
     *
     * _.contains([1, 2, 3], 1);
     * // => true
     *
     * _.contains([1, 2, 3], 1, 2);
     * // => false
     *
     * _.contains({ 'name': 'fred', 'age': 40 }, 'fred');
     * // => true
     *
     * _.contains('pebbles', 'eb');
     * // => true
     */
        function contains(collection, target, fromIndex) {
            var index = -1, indexOf = getIndexOf(), length = collection ? collection.length : 0, result = !1;
            return fromIndex = (0 > fromIndex ? nativeMax(0, length + fromIndex) : fromIndex) || 0, 
            isArray(collection) ? result = indexOf(collection, target, fromIndex) > -1 : "number" == typeof length ? result = (isString(collection) ? collection.indexOf(target, fromIndex) : indexOf(collection, target, fromIndex)) > -1 : forOwn(collection, function(value) {
                return ++index >= fromIndex ? !(result = value === target) : void 0;
            }), result;
        }
        /**
     * Checks if the given callback returns truey value for **all** elements of
     * a collection. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias all
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if all elements passed the callback check,
     *  else `false`.
     * @example
     *
     * _.every([true, 1, null, 'yes']);
     * // => false
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.every(characters, 'age');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.every(characters, { 'age': 36 });
     * // => false
     */
        function every(collection, callback, thisArg) {
            var result = !0;
            callback = lodash.createCallback(callback, thisArg, 3);
            var index = -1, length = collection ? collection.length : 0;
            if ("number" == typeof length) for (;++index < length && (result = !!callback(collection[index], index, collection)); ) ; else forOwn(collection, function(value, index, collection) {
                return result = !!callback(value, index, collection);
            });
            return result;
        }
        /**
     * Iterates over elements of a collection, returning an array of all elements
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias select
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that passed the callback check.
     * @example
     *
     * var evens = _.filter([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [2, 4, 6]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.filter(characters, 'blocked');
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     *
     * // using "_.where" callback shorthand
     * _.filter(characters, { 'age': 36 });
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     */
        function filter(collection, callback, thisArg) {
            var result = [];
            callback = lodash.createCallback(callback, thisArg, 3);
            var index = -1, length = collection ? collection.length : 0;
            if ("number" == typeof length) for (;++index < length; ) {
                var value = collection[index];
                callback(value, index, collection) && result.push(value);
            } else forOwn(collection, function(value, index, collection) {
                callback(value, index, collection) && result.push(value);
            });
            return result;
        }
        /**
     * Iterates over elements of a collection, returning the first element that
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias detect, findWhere
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.find(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => { 'name': 'barney', 'age': 36, 'blocked': false }
     *
     * // using "_.where" callback shorthand
     * _.find(characters, { 'age': 1 });
     * // =>  { 'name': 'pebbles', 'age': 1, 'blocked': false }
     *
     * // using "_.pluck" callback shorthand
     * _.find(characters, 'blocked');
     * // => { 'name': 'fred', 'age': 40, 'blocked': true }
     */
        function find(collection, callback, thisArg) {
            callback = lodash.createCallback(callback, thisArg, 3);
            var index = -1, length = collection ? collection.length : 0;
            if ("number" != typeof length) {
                var result;
                return forOwn(collection, function(value, index, collection) {
                    return callback(value, index, collection) ? (result = value, !1) : void 0;
                }), result;
            }
            for (;++index < length; ) {
                var value = collection[index];
                if (callback(value, index, collection)) return value;
            }
        }
        /**
     * This method is like `_.find` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * _.findLast([1, 2, 3, 4], function(num) {
     *   return num % 2 == 1;
     * });
     * // => 3
     */
        function findLast(collection, callback, thisArg) {
            var result;
            return callback = lodash.createCallback(callback, thisArg, 3), forEachRight(collection, function(value, index, collection) {
                return callback(value, index, collection) ? (result = value, !1) : void 0;
            }), result;
        }
        /**
     * Iterates over elements of a collection, executing the callback for each
     * element. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * Note: As with other "Collections" methods, objects with a `length` property
     * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
     * may be used for object iteration.
     *
     * @static
     * @memberOf _
     * @alias each
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEach(function(num) { console.log(num); }).join(',');
     * // => logs each number and returns '1,2,3'
     *
     * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { console.log(num); });
     * // => logs each number and returns the object (property order is not guaranteed across environments)
     */
        function forEach(collection, callback, thisArg) {
            var index = -1, length = collection ? collection.length : 0;
            if (callback = callback && "undefined" == typeof thisArg ? callback : baseCreateCallback(callback, thisArg, 3), 
            "number" == typeof length) for (;++index < length && callback(collection[index], index, collection) !== !1; ) ; else forOwn(collection, callback);
            return collection;
        }
        /**
     * This method is like `_.forEach` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias eachRight
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEachRight(function(num) { console.log(num); }).join(',');
     * // => logs each number from right to left and returns '3,2,1'
     */
        function forEachRight(collection, callback, thisArg) {
            var length = collection ? collection.length : 0;
            if (callback = callback && "undefined" == typeof thisArg ? callback : baseCreateCallback(callback, thisArg, 3), 
            "number" == typeof length) for (;length-- && callback(collection[length], length, collection) !== !1; ) ; else {
                var props = keys(collection);
                length = props.length, forOwn(collection, function(value, key, collection) {
                    return key = props ? props[--length] : --length, callback(collection[key], key, collection);
                });
            }
            return collection;
        }
        /**
     * Invokes the method named by `methodName` on each element in the `collection`
     * returning an array of the results of each invoked method. Additional arguments
     * will be provided to each invoked method. If `methodName` is a function it
     * will be invoked for, and `this` bound to, each element in the `collection`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|string} methodName The name of the method to invoke or
     *  the function invoked per iteration.
     * @param {...*} [arg] Arguments to invoke the method with.
     * @returns {Array} Returns a new array of the results of each invoked method.
     * @example
     *
     * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
     * // => [[1, 5, 7], [1, 2, 3]]
     *
     * _.invoke([123, 456], String.prototype.split, '');
     * // => [['1', '2', '3'], ['4', '5', '6']]
     */
        function invoke(collection, methodName) {
            var args = slice(arguments, 2), index = -1, isFunc = "function" == typeof methodName, length = collection ? collection.length : 0, result = Array("number" == typeof length ? length : 0);
            return forEach(collection, function(value) {
                result[++index] = (isFunc ? methodName : value[methodName]).apply(value, args);
            }), result;
        }
        /**
     * Creates an array of values by running each element in the collection
     * through the callback. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias collect
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of the results of each `callback` execution.
     * @example
     *
     * _.map([1, 2, 3], function(num) { return num * 3; });
     * // => [3, 6, 9]
     *
     * _.map({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { return num * 3; });
     * // => [3, 6, 9] (property order is not guaranteed across environments)
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(characters, 'name');
     * // => ['barney', 'fred']
     */
        function map(collection, callback, thisArg) {
            var index = -1, length = collection ? collection.length : 0;
            if (callback = lodash.createCallback(callback, thisArg, 3), "number" == typeof length) for (var result = Array(length); ++index < length; ) result[index] = callback(collection[index], index, collection); else result = [], 
            forOwn(collection, function(value, key, collection) {
                result[++index] = callback(value, key, collection);
            });
            return result;
        }
        /**
     * Retrieves the maximum value of a collection. If the collection is empty or
     * falsey `-Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the maximum value.
     * @example
     *
     * _.max([4, 2, 8, 6]);
     * // => 8
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.max(characters, function(chr) { return chr.age; });
     * // => { 'name': 'fred', 'age': 40 };
     *
     * // using "_.pluck" callback shorthand
     * _.max(characters, 'age');
     * // => { 'name': 'fred', 'age': 40 };
     */
        function max(collection, callback, thisArg) {
            var computed = -1/0, result = computed;
            if (// allows working with functions like `_.map` without using
            // their `index` argument as a callback
            "function" != typeof callback && thisArg && thisArg[callback] === collection && (callback = null), 
            null == callback && isArray(collection)) for (var index = -1, length = collection.length; ++index < length; ) {
                var value = collection[index];
                value > result && (result = value);
            } else callback = null == callback && isString(collection) ? charAtCallback : lodash.createCallback(callback, thisArg, 3), 
            forEach(collection, function(value, index, collection) {
                var current = callback(value, index, collection);
                current > computed && (computed = current, result = value);
            });
            return result;
        }
        /**
     * Retrieves the minimum value of a collection. If the collection is empty or
     * falsey `Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the minimum value.
     * @example
     *
     * _.min([4, 2, 8, 6]);
     * // => 2
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.min(characters, function(chr) { return chr.age; });
     * // => { 'name': 'barney', 'age': 36 };
     *
     * // using "_.pluck" callback shorthand
     * _.min(characters, 'age');
     * // => { 'name': 'barney', 'age': 36 };
     */
        function min(collection, callback, thisArg) {
            var computed = 1/0, result = computed;
            if (// allows working with functions like `_.map` without using
            // their `index` argument as a callback
            "function" != typeof callback && thisArg && thisArg[callback] === collection && (callback = null), 
            null == callback && isArray(collection)) for (var index = -1, length = collection.length; ++index < length; ) {
                var value = collection[index];
                result > value && (result = value);
            } else callback = null == callback && isString(collection) ? charAtCallback : lodash.createCallback(callback, thisArg, 3), 
            forEach(collection, function(value, index, collection) {
                var current = callback(value, index, collection);
                computed > current && (computed = current, result = value);
            });
            return result;
        }
        /**
     * Reduces a collection to a value which is the accumulated result of running
     * each element in the collection through the callback, where each successive
     * callback execution consumes the return value of the previous execution. If
     * `accumulator` is not provided the first element of the collection will be
     * used as the initial `accumulator` value. The callback is bound to `thisArg`
     * and invoked with four arguments; (accumulator, value, index|key, collection).
     *
     * @static
     * @memberOf _
     * @alias foldl, inject
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var sum = _.reduce([1, 2, 3], function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * var mapped = _.reduce({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     *   return result;
     * }, {});
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
        function reduce(collection, callback, accumulator, thisArg) {
            if (!collection) return accumulator;
            var noaccum = arguments.length < 3;
            callback = lodash.createCallback(callback, thisArg, 4);
            var index = -1, length = collection.length;
            if ("number" == typeof length) for (noaccum && (accumulator = collection[++index]); ++index < length; ) accumulator = callback(accumulator, collection[index], index, collection); else forOwn(collection, function(value, index, collection) {
                accumulator = noaccum ? (noaccum = !1, value) : callback(accumulator, value, index, collection);
            });
            return accumulator;
        }
        /**
     * This method is like `_.reduce` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias foldr
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var list = [[0, 1], [2, 3], [4, 5]];
     * var flat = _.reduceRight(list, function(a, b) { return a.concat(b); }, []);
     * // => [4, 5, 2, 3, 0, 1]
     */
        function reduceRight(collection, callback, accumulator, thisArg) {
            var noaccum = arguments.length < 3;
            return callback = lodash.createCallback(callback, thisArg, 4), forEachRight(collection, function(value, index, collection) {
                accumulator = noaccum ? (noaccum = !1, value) : callback(accumulator, value, index, collection);
            }), accumulator;
        }
        /**
     * The opposite of `_.filter` this method returns the elements of a
     * collection that the callback does **not** return truey for.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that failed the callback check.
     * @example
     *
     * var odds = _.reject([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [1, 3, 5]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.reject(characters, 'blocked');
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     *
     * // using "_.where" callback shorthand
     * _.reject(characters, { 'age': 36 });
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     */
        function reject(collection, callback, thisArg) {
            return callback = lodash.createCallback(callback, thisArg, 3), filter(collection, function(value, index, collection) {
                return !callback(value, index, collection);
            });
        }
        /**
     * Retrieves a random element or `n` random elements from a collection.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to sample.
     * @param {number} [n] The number of elements to sample.
     * @param- {Object} [guard] Allows working with functions like `_.map`
     *  without using their `index` arguments as `n`.
     * @returns {Array} Returns the random sample(s) of `collection`.
     * @example
     *
     * _.sample([1, 2, 3, 4]);
     * // => 2
     *
     * _.sample([1, 2, 3, 4], 2);
     * // => [3, 1]
     */
        function sample(collection, n, guard) {
            if (collection && "number" != typeof collection.length && (collection = values(collection)), 
            null == n || guard) return collection ? collection[baseRandom(0, collection.length - 1)] : undefined;
            var result = shuffle(collection);
            return result.length = nativeMin(nativeMax(0, n), result.length), result;
        }
        /**
     * Creates an array of shuffled values, using a version of the Fisher-Yates
     * shuffle. See http://en.wikipedia.org/wiki/Fisher-Yates_shuffle.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to shuffle.
     * @returns {Array} Returns a new shuffled collection.
     * @example
     *
     * _.shuffle([1, 2, 3, 4, 5, 6]);
     * // => [4, 1, 6, 3, 5, 2]
     */
        function shuffle(collection) {
            var index = -1, length = collection ? collection.length : 0, result = Array("number" == typeof length ? length : 0);
            return forEach(collection, function(value) {
                var rand = baseRandom(0, ++index);
                result[index] = result[rand], result[rand] = value;
            }), result;
        }
        /**
     * Gets the size of the `collection` by returning `collection.length` for arrays
     * and array-like objects or the number of own enumerable properties for objects.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to inspect.
     * @returns {number} Returns `collection.length` or number of own enumerable properties.
     * @example
     *
     * _.size([1, 2]);
     * // => 2
     *
     * _.size({ 'one': 1, 'two': 2, 'three': 3 });
     * // => 3
     *
     * _.size('pebbles');
     * // => 7
     */
        function size(collection) {
            var length = collection ? collection.length : 0;
            return "number" == typeof length ? length : keys(collection).length;
        }
        /**
     * Checks if the callback returns a truey value for **any** element of a
     * collection. The function returns as soon as it finds a passing value and
     * does not iterate over the entire collection. The callback is bound to
     * `thisArg` and invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias any
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if any element passed the callback check,
     *  else `false`.
     * @example
     *
     * _.some([null, 0, 'yes', false], Boolean);
     * // => true
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.some(characters, 'blocked');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.some(characters, { 'age': 1 });
     * // => false
     */
        function some(collection, callback, thisArg) {
            var result;
            callback = lodash.createCallback(callback, thisArg, 3);
            var index = -1, length = collection ? collection.length : 0;
            if ("number" == typeof length) for (;++index < length && !(result = callback(collection[index], index, collection)); ) ; else forOwn(collection, function(value, index, collection) {
                return !(result = callback(value, index, collection));
            });
            return !!result;
        }
        /**
     * Creates an array of elements, sorted in ascending order by the results of
     * running each element in a collection through the callback. This method
     * performs a stable sort, that is, it will preserve the original sort order
     * of equal elements. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an array of property names is provided for `callback` the collection
     * will be sorted by each property value.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Array|Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of sorted elements.
     * @example
     *
     * _.sortBy([1, 2, 3], function(num) { return Math.sin(num); });
     * // => [3, 1, 2]
     *
     * _.sortBy([1, 2, 3], function(num) { return this.sin(num); }, Math);
     * // => [3, 1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'barney',  'age': 26 },
     *   { 'name': 'fred',    'age': 30 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(_.sortBy(characters, 'age'), _.values);
     * // => [['barney', 26], ['fred', 30], ['barney', 36], ['fred', 40]]
     *
     * // sorting by multiple properties
     * _.map(_.sortBy(characters, ['name', 'age']), _.values);
     * // = > [['barney', 26], ['barney', 36], ['fred', 30], ['fred', 40]]
     */
        function sortBy(collection, callback, thisArg) {
            var index = -1, isArr = isArray(callback), length = collection ? collection.length : 0, result = Array("number" == typeof length ? length : 0);
            for (isArr || (callback = lodash.createCallback(callback, thisArg, 3)), forEach(collection, function(value, key, collection) {
                var object = result[++index] = getObject();
                isArr ? object.criteria = map(callback, function(key) {
                    return value[key];
                }) : (object.criteria = getArray())[0] = callback(value, key, collection), object.index = index, 
                object.value = value;
            }), length = result.length, result.sort(compareAscending); length--; ) {
                var object = result[length];
                result[length] = object.value, isArr || releaseArray(object.criteria), releaseObject(object);
            }
            return result;
        }
        /**
     * Converts the `collection` to an array.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to convert.
     * @returns {Array} Returns the new converted array.
     * @example
     *
     * (function() { return _.toArray(arguments).slice(1); })(1, 2, 3, 4);
     * // => [2, 3, 4]
     */
        function toArray(collection) {
            return collection && "number" == typeof collection.length ? slice(collection) : values(collection);
        }
        /*--------------------------------------------------------------------------*/
        /**
     * Creates an array with all falsey values removed. The values `false`, `null`,
     * `0`, `""`, `undefined`, and `NaN` are all falsey.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to compact.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.compact([0, 1, false, 2, '', 3]);
     * // => [1, 2, 3]
     */
        function compact(array) {
            for (var index = -1, length = array ? array.length : 0, result = []; ++index < length; ) {
                var value = array[index];
                value && result.push(value);
            }
            return result;
        }
        /**
     * Creates an array excluding all values of the provided arrays using strict
     * equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {...Array} [values] The arrays of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.difference([1, 2, 3, 4, 5], [5, 2, 10]);
     * // => [1, 3, 4]
     */
        function difference(array) {
            return baseDifference(array, baseFlatten(arguments, !0, !0, 1));
        }
        /**
     * This method is like `_.find` except that it returns the index of the first
     * element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.findIndex(characters, function(chr) {
     *   return chr.age < 20;
     * });
     * // => 2
     *
     * // using "_.where" callback shorthand
     * _.findIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findIndex(characters, 'blocked');
     * // => 1
     */
        function findIndex(array, callback, thisArg) {
            var index = -1, length = array ? array.length : 0;
            for (callback = lodash.createCallback(callback, thisArg, 3); ++index < length; ) if (callback(array[index], index, array)) return index;
            return -1;
        }
        /**
     * This method is like `_.findIndex` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': true },
     *   { 'name': 'fred',    'age': 40, 'blocked': false },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': true }
     * ];
     *
     * _.findLastIndex(characters, function(chr) {
     *   return chr.age > 30;
     * });
     * // => 1
     *
     * // using "_.where" callback shorthand
     * _.findLastIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findLastIndex(characters, 'blocked');
     * // => 2
     */
        function findLastIndex(array, callback, thisArg) {
            var length = array ? array.length : 0;
            for (callback = lodash.createCallback(callback, thisArg, 3); length--; ) if (callback(array[length], length, array)) return length;
            return -1;
        }
        /**
     * Gets the first element or first `n` elements of an array. If a callback
     * is provided elements at the beginning of the array are returned as long
     * as the callback returns truey. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias head, take
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the first element(s) of `array`.
     * @example
     *
     * _.first([1, 2, 3]);
     * // => 1
     *
     * _.first([1, 2, 3], 2);
     * // => [1, 2]
     *
     * _.first([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false, 'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.first(characters, 'blocked');
     * // => [{ 'name': 'barney', 'blocked': true, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.first(characters, { 'employer': 'slate' }), 'name');
     * // => ['barney', 'fred']
     */
        function first(array, callback, thisArg) {
            var n = 0, length = array ? array.length : 0;
            if ("number" != typeof callback && null != callback) {
                var index = -1;
                for (callback = lodash.createCallback(callback, thisArg, 3); ++index < length && callback(array[index], index, array); ) n++;
            } else if (n = callback, null == n || thisArg) return array ? array[0] : undefined;
            return slice(array, 0, nativeMin(nativeMax(0, n), length));
        }
        /**
     * Flattens a nested array (the nesting can be to any depth). If `isShallow`
     * is truey, the array will only be flattened a single level. If a callback
     * is provided each element of the array is passed through the callback before
     * flattening. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new flattened array.
     * @example
     *
     * _.flatten([1, [2], [3, [[4]]]]);
     * // => [1, 2, 3, 4];
     *
     * _.flatten([1, [2], [3, [[4]]]], true);
     * // => [1, 2, 3, [[4]]];
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 30, 'pets': ['hoppy'] },
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.flatten(characters, 'pets');
     * // => ['hoppy', 'baby puss', 'dino']
     */
        function flatten(array, isShallow, callback, thisArg) {
            // juggle arguments
            return "boolean" != typeof isShallow && null != isShallow && (thisArg = callback, 
            callback = "function" != typeof isShallow && thisArg && thisArg[isShallow] === array ? null : isShallow, 
            isShallow = !1), null != callback && (array = map(array, callback, thisArg)), baseFlatten(array, isShallow);
        }
        /**
     * Gets the index at which the first occurrence of `value` is found using
     * strict equality for comparisons, i.e. `===`. If the array is already sorted
     * providing `true` for `fromIndex` will run a faster binary search.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {boolean|number} [fromIndex=0] The index to search from or `true`
     *  to perform a binary search on a sorted array.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 1
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 4
     *
     * _.indexOf([1, 1, 2, 2, 3, 3], 2, true);
     * // => 2
     */
        function indexOf(array, value, fromIndex) {
            if ("number" == typeof fromIndex) {
                var length = array ? array.length : 0;
                fromIndex = 0 > fromIndex ? nativeMax(0, length + fromIndex) : fromIndex || 0;
            } else if (fromIndex) {
                var index = sortedIndex(array, value);
                return array[index] === value ? index : -1;
            }
            return baseIndexOf(array, value, fromIndex);
        }
        /**
     * Gets all but the last element or last `n` elements of an array. If a
     * callback is provided elements at the end of the array are excluded from
     * the result as long as the callback returns truey. The callback is bound
     * to `thisArg` and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.initial([1, 2, 3]);
     * // => [1, 2]
     *
     * _.initial([1, 2, 3], 2);
     * // => [1]
     *
     * _.initial([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [1]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.initial(characters, 'blocked');
     * // => [{ 'name': 'barney',  'blocked': false, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.initial(characters, { 'employer': 'na' }), 'name');
     * // => ['barney', 'fred']
     */
        function initial(array, callback, thisArg) {
            var n = 0, length = array ? array.length : 0;
            if ("number" != typeof callback && null != callback) {
                var index = length;
                for (callback = lodash.createCallback(callback, thisArg, 3); index-- && callback(array[index], index, array); ) n++;
            } else n = null == callback || thisArg ? 1 : callback || n;
            return slice(array, 0, nativeMin(nativeMax(0, length - n), length));
        }
        /**
     * Creates an array of unique values present in all provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of shared values.
     * @example
     *
     * _.intersection([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2]
     */
        function intersection() {
            for (var args = [], argsIndex = -1, argsLength = arguments.length, caches = getArray(), indexOf = getIndexOf(), trustIndexOf = indexOf === baseIndexOf, seen = getArray(); ++argsIndex < argsLength; ) {
                var value = arguments[argsIndex];
                (isArray(value) || isArguments(value)) && (args.push(value), caches.push(trustIndexOf && value.length >= largeArraySize && createCache(argsIndex ? args[argsIndex] : seen)));
            }
            var array = args[0], index = -1, length = array ? array.length : 0, result = [];
            outer: for (;++index < length; ) {
                var cache = caches[0];
                if (value = array[index], (cache ? cacheIndexOf(cache, value) : indexOf(seen, value)) < 0) {
                    for (argsIndex = argsLength, (cache || seen).push(value); --argsIndex; ) if (cache = caches[argsIndex], 
                    (cache ? cacheIndexOf(cache, value) : indexOf(args[argsIndex], value)) < 0) continue outer;
                    result.push(value);
                }
            }
            for (;argsLength--; ) cache = caches[argsLength], cache && releaseObject(cache);
            return releaseArray(caches), releaseArray(seen), result;
        }
        /**
     * Gets the last element or last `n` elements of an array. If a callback is
     * provided elements at the end of the array are returned as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the last element(s) of `array`.
     * @example
     *
     * _.last([1, 2, 3]);
     * // => 3
     *
     * _.last([1, 2, 3], 2);
     * // => [2, 3]
     *
     * _.last([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [2, 3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.last(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.last(characters, { 'employer': 'na' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
        function last(array, callback, thisArg) {
            var n = 0, length = array ? array.length : 0;
            if ("number" != typeof callback && null != callback) {
                var index = length;
                for (callback = lodash.createCallback(callback, thisArg, 3); index-- && callback(array[index], index, array); ) n++;
            } else if (n = callback, null == n || thisArg) return array ? array[length - 1] : undefined;
            return slice(array, nativeMax(0, length - n));
        }
        /**
     * Gets the index at which the last occurrence of `value` is found using strict
     * equality for comparisons, i.e. `===`. If `fromIndex` is negative, it is used
     * as the offset from the end of the collection.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {number} [fromIndex=array.length-1] The index to search from.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 4
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 1
     */
        function lastIndexOf(array, value, fromIndex) {
            var index = array ? array.length : 0;
            for ("number" == typeof fromIndex && (index = (0 > fromIndex ? nativeMax(0, index + fromIndex) : nativeMin(fromIndex, index - 1)) + 1); index--; ) if (array[index] === value) return index;
            return -1;
        }
        /**
     * Removes all provided values from the given array using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {...*} [value] The values to remove.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [1, 2, 3, 1, 2, 3];
     * _.pull(array, 2, 3);
     * console.log(array);
     * // => [1, 1]
     */
        function pull(array) {
            for (var args = arguments, argsIndex = 0, argsLength = args.length, length = array ? array.length : 0; ++argsIndex < argsLength; ) for (var index = -1, value = args[argsIndex]; ++index < length; ) array[index] === value && (splice.call(array, index--, 1), 
            length--);
            return array;
        }
        /**
     * Creates an array of numbers (positive and/or negative) progressing from
     * `start` up to but not including `end`. If `start` is less than `stop` a
     * zero-length range is created unless a negative `step` is specified.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {number} [start=0] The start of the range.
     * @param {number} end The end of the range.
     * @param {number} [step=1] The value to increment or decrement by.
     * @returns {Array} Returns a new range array.
     * @example
     *
     * _.range(4);
     * // => [0, 1, 2, 3]
     *
     * _.range(1, 5);
     * // => [1, 2, 3, 4]
     *
     * _.range(0, 20, 5);
     * // => [0, 5, 10, 15]
     *
     * _.range(0, -4, -1);
     * // => [0, -1, -2, -3]
     *
     * _.range(1, 4, 0);
     * // => [1, 1, 1]
     *
     * _.range(0);
     * // => []
     */
        function range(start, end, step) {
            start = +start || 0, step = "number" == typeof step ? step : +step || 1, null == end && (end = start, 
            start = 0);
            for (// use `Array(length)` so engines like Chakra and V8 avoid slower modes
            // http://youtu.be/XAqIpGU8ZZk#t=17m25s
            var index = -1, length = nativeMax(0, ceil((end - start) / (step || 1))), result = Array(length); ++index < length; ) result[index] = start, 
            start += step;
            return result;
        }
        /**
     * Removes all elements from an array that the callback returns truey for
     * and returns an array of removed elements. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of removed elements.
     * @example
     *
     * var array = [1, 2, 3, 4, 5, 6];
     * var evens = _.remove(array, function(num) { return num % 2 == 0; });
     *
     * console.log(array);
     * // => [1, 3, 5]
     *
     * console.log(evens);
     * // => [2, 4, 6]
     */
        function remove(array, callback, thisArg) {
            var index = -1, length = array ? array.length : 0, result = [];
            for (callback = lodash.createCallback(callback, thisArg, 3); ++index < length; ) {
                var value = array[index];
                callback(value, index, array) && (result.push(value), splice.call(array, index--, 1), 
                length--);
            }
            return result;
        }
        /**
     * The opposite of `_.initial` this method gets all but the first element or
     * first `n` elements of an array. If a callback function is provided elements
     * at the beginning of the array are excluded from the result as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias drop, tail
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.rest([1, 2, 3]);
     * // => [2, 3]
     *
     * _.rest([1, 2, 3], 2);
     * // => [3]
     *
     * _.rest([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true, 'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.rest(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.rest(characters, { 'employer': 'slate' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
        function rest(array, callback, thisArg) {
            if ("number" != typeof callback && null != callback) {
                var n = 0, index = -1, length = array ? array.length : 0;
                for (callback = lodash.createCallback(callback, thisArg, 3); ++index < length && callback(array[index], index, array); ) n++;
            } else n = null == callback || thisArg ? 1 : nativeMax(0, callback);
            return slice(array, n);
        }
        /**
     * Uses a binary search to determine the smallest index at which a value
     * should be inserted into a given sorted array in order to maintain the sort
     * order of the array. If a callback is provided it will be executed for
     * `value` and each element of `array` to compute their sort ranking. The
     * callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedIndex([20, 30, 50], 40);
     * // => 2
     *
     * // using "_.pluck" callback shorthand
     * _.sortedIndex([{ 'x': 20 }, { 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');
     * // => 2
     *
     * var dict = {
     *   'wordToNumber': { 'twenty': 20, 'thirty': 30, 'fourty': 40, 'fifty': 50 }
     * };
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return dict.wordToNumber[word];
     * });
     * // => 2
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return this.wordToNumber[word];
     * }, dict);
     * // => 2
     */
        function sortedIndex(array, value, callback, thisArg) {
            var low = 0, high = array ? array.length : low;
            for (// explicitly reference `identity` for better inlining in Firefox
            callback = callback ? lodash.createCallback(callback, thisArg, 1) : identity, value = callback(value); high > low; ) {
                var mid = low + high >>> 1;
                callback(array[mid]) < value ? low = mid + 1 : high = mid;
            }
            return low;
        }
        /**
     * Creates an array of unique values, in order, of the provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of combined values.
     * @example
     *
     * _.union([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2, 3, 5, 4]
     */
        function union() {
            return baseUniq(baseFlatten(arguments, !0, !0));
        }
        /**
     * Creates a duplicate-value-free version of an array using strict equality
     * for comparisons, i.e. `===`. If the array is sorted, providing
     * `true` for `isSorted` will use a faster algorithm. If a callback is provided
     * each element of `array` is passed through the callback before uniqueness
     * is computed. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias unique
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a duplicate-value-free array.
     * @example
     *
     * _.uniq([1, 2, 1, 3, 1]);
     * // => [1, 2, 3]
     *
     * _.uniq([1, 1, 2, 2, 3], true);
     * // => [1, 2, 3]
     *
     * _.uniq(['A', 'b', 'C', 'a', 'B', 'c'], function(letter) { return letter.toLowerCase(); });
     * // => ['A', 'b', 'C']
     *
     * _.uniq([1, 2.5, 3, 1.5, 2, 3.5], function(num) { return this.floor(num); }, Math);
     * // => [1, 2.5, 3]
     *
     * // using "_.pluck" callback shorthand
     * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 1 }, { 'x': 2 }]
     */
        function uniq(array, isSorted, callback, thisArg) {
            // juggle arguments
            return "boolean" != typeof isSorted && null != isSorted && (thisArg = callback, 
            callback = "function" != typeof isSorted && thisArg && thisArg[isSorted] === array ? null : isSorted, 
            isSorted = !1), null != callback && (callback = lodash.createCallback(callback, thisArg, 3)), 
            baseUniq(array, isSorted, callback);
        }
        /**
     * Creates an array excluding all provided values using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to filter.
     * @param {...*} [value] The values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.without([1, 2, 1, 0, 3, 1, 4], 0, 1);
     * // => [2, 3, 4]
     */
        function without(array) {
            return baseDifference(array, slice(arguments, 1));
        }
        /**
     * Creates an array that is the symmetric difference of the provided arrays.
     * See http://en.wikipedia.org/wiki/Symmetric_difference.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of values.
     * @example
     *
     * _.xor([1, 2, 3], [5, 2, 1, 4]);
     * // => [3, 5, 4]
     *
     * _.xor([1, 2, 5], [2, 3, 5], [3, 4, 5]);
     * // => [1, 4, 5]
     */
        function xor() {
            for (var index = -1, length = arguments.length; ++index < length; ) {
                var array = arguments[index];
                if (isArray(array) || isArguments(array)) var result = result ? baseUniq(baseDifference(result, array).concat(baseDifference(array, result))) : array;
            }
            return result || [];
        }
        /**
     * Creates an array of grouped elements, the first of which contains the first
     * elements of the given arrays, the second of which contains the second
     * elements of the given arrays, and so on.
     *
     * @static
     * @memberOf _
     * @alias unzip
     * @category Arrays
     * @param {...Array} [array] Arrays to process.
     * @returns {Array} Returns a new array of grouped elements.
     * @example
     *
     * _.zip(['fred', 'barney'], [30, 40], [true, false]);
     * // => [['fred', 30, true], ['barney', 40, false]]
     */
        function zip() {
            for (var array = arguments.length > 1 ? arguments : arguments[0], index = -1, length = array ? max(pluck(array, "length")) : 0, result = Array(0 > length ? 0 : length); ++index < length; ) result[index] = pluck(array, index);
            return result;
        }
        /**
     * Creates an object composed from arrays of `keys` and `values`. Provide
     * either a single two dimensional array, i.e. `[[key1, value1], [key2, value2]]`
     * or two arrays, one of `keys` and one of corresponding `values`.
     *
     * @static
     * @memberOf _
     * @alias object
     * @category Arrays
     * @param {Array} keys The array of keys.
     * @param {Array} [values=[]] The array of values.
     * @returns {Object} Returns an object composed of the given keys and
     *  corresponding values.
     * @example
     *
     * _.zipObject(['fred', 'barney'], [30, 40]);
     * // => { 'fred': 30, 'barney': 40 }
     */
        function zipObject(keys, values) {
            var index = -1, length = keys ? keys.length : 0, result = {};
            for (values || !length || isArray(keys[0]) || (values = []); ++index < length; ) {
                var key = keys[index];
                values ? result[key] = values[index] : key && (result[key[0]] = key[1]);
            }
            return result;
        }
        /*--------------------------------------------------------------------------*/
        /**
     * Creates a function that executes `func`, with  the `this` binding and
     * arguments of the created function, only after being called `n` times.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {number} n The number of times the function must be called before
     *  `func` is executed.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var saves = ['profile', 'settings'];
     *
     * var done = _.after(saves.length, function() {
     *   console.log('Done saving!');
     * });
     *
     * _.forEach(saves, function(type) {
     *   asyncSave({ 'type': type, 'complete': done });
     * });
     * // => logs 'Done saving!', after all saves have completed
     */
        function after(n, func) {
            if (!isFunction(func)) throw new TypeError();
            return function() {
                return --n < 1 ? func.apply(this, arguments) : void 0;
            };
        }
        /**
     * Creates a function that, when called, invokes `func` with the `this`
     * binding of `thisArg` and prepends any additional `bind` arguments to those
     * provided to the bound function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to bind.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var func = function(greeting) {
     *   return greeting + ' ' + this.name;
     * };
     *
     * func = _.bind(func, { 'name': 'fred' }, 'hi');
     * func();
     * // => 'hi fred'
     */
        function bind(func, thisArg) {
            return arguments.length > 2 ? createWrapper(func, 17, slice(arguments, 2), null, thisArg) : createWrapper(func, 1, null, null, thisArg);
        }
        /**
     * Binds methods of an object to the object itself, overwriting the existing
     * method. Method names may be specified as individual arguments or as arrays
     * of method names. If no method names are provided all the function properties
     * of `object` will be bound.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object to bind and assign the bound methods to.
     * @param {...string} [methodName] The object method names to
     *  bind, specified as individual method names or arrays of method names.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var view = {
     *   'label': 'docs',
     *   'onClick': function() { console.log('clicked ' + this.label); }
     * };
     *
     * _.bindAll(view);
     * jQuery('#docs').on('click', view.onClick);
     * // => logs 'clicked docs', when the button is clicked
     */
        function bindAll(object) {
            for (var funcs = arguments.length > 1 ? baseFlatten(arguments, !0, !1, 1) : functions(object), index = -1, length = funcs.length; ++index < length; ) {
                var key = funcs[index];
                object[key] = createWrapper(object[key], 1, null, null, object);
            }
            return object;
        }
        /**
     * Creates a function that, when called, invokes the method at `object[key]`
     * and prepends any additional `bindKey` arguments to those provided to the bound
     * function. This method differs from `_.bind` by allowing bound functions to
     * reference methods that will be redefined or don't yet exist.
     * See http://michaux.ca/articles/lazy-function-definition-pattern.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object the method belongs to.
     * @param {string} key The key of the method.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var object = {
     *   'name': 'fred',
     *   'greet': function(greeting) {
     *     return greeting + ' ' + this.name;
     *   }
     * };
     *
     * var func = _.bindKey(object, 'greet', 'hi');
     * func();
     * // => 'hi fred'
     *
     * object.greet = function(greeting) {
     *   return greeting + 'ya ' + this.name + '!';
     * };
     *
     * func();
     * // => 'hiya fred!'
     */
        function bindKey(object, key) {
            return arguments.length > 2 ? createWrapper(key, 19, slice(arguments, 2), null, object) : createWrapper(key, 3, null, null, object);
        }
        /**
     * Creates a function that is the composition of the provided functions,
     * where each function consumes the return value of the function that follows.
     * For example, composing the functions `f()`, `g()`, and `h()` produces `f(g(h()))`.
     * Each function is executed with the `this` binding of the composed function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {...Function} [func] Functions to compose.
     * @returns {Function} Returns the new composed function.
     * @example
     *
     * var realNameMap = {
     *   'pebbles': 'penelope'
     * };
     *
     * var format = function(name) {
     *   name = realNameMap[name.toLowerCase()] || name;
     *   return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
     * };
     *
     * var greet = function(formatted) {
     *   return 'Hiya ' + formatted + '!';
     * };
     *
     * var welcome = _.compose(greet, format);
     * welcome('pebbles');
     * // => 'Hiya Penelope!'
     */
        function compose() {
            for (var funcs = arguments, length = funcs.length; length--; ) if (!isFunction(funcs[length])) throw new TypeError();
            return function() {
                for (var args = arguments, length = funcs.length; length--; ) args = [ funcs[length].apply(this, args) ];
                return args[0];
            };
        }
        /**
     * Creates a function which accepts one or more arguments of `func` that when
     * invoked either executes `func` returning its result, if all `func` arguments
     * have been provided, or returns a function that accepts one or more of the
     * remaining `func` arguments, and so on. The arity of `func` can be specified
     * if `func.length` is not sufficient.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to curry.
     * @param {number} [arity=func.length] The arity of `func`.
     * @returns {Function} Returns the new curried function.
     * @example
     *
     * var curried = _.curry(function(a, b, c) {
     *   console.log(a + b + c);
     * });
     *
     * curried(1)(2)(3);
     * // => 6
     *
     * curried(1, 2)(3);
     * // => 6
     *
     * curried(1, 2, 3);
     * // => 6
     */
        function curry(func, arity) {
            return arity = "number" == typeof arity ? arity : +arity || func.length, createWrapper(func, 4, null, null, null, arity);
        }
        /**
     * Creates a function that will delay the execution of `func` until after
     * `wait` milliseconds have elapsed since the last time it was invoked.
     * Provide an options object to indicate that `func` should be invoked on
     * the leading and/or trailing edge of the `wait` timeout. Subsequent calls
     * to the debounced function will return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the debounced function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to debounce.
     * @param {number} wait The number of milliseconds to delay.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=false] Specify execution on the leading edge of the timeout.
     * @param {number} [options.maxWait] The maximum time `func` is allowed to be delayed before it's called.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // avoid costly calculations while the window size is in flux
     * var lazyLayout = _.debounce(calculateLayout, 150);
     * jQuery(window).on('resize', lazyLayout);
     *
     * // execute `sendMail` when the click event is fired, debouncing subsequent calls
     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * });
     *
     * // ensure `batchLog` is executed once after 1 second of debounced calls
     * var source = new EventSource('/stream');
     * source.addEventListener('message', _.debounce(batchLog, 250, {
     *   'maxWait': 1000
     * }, false);
     */
        function debounce(func, wait, options) {
            var args, maxTimeoutId, result, stamp, thisArg, timeoutId, trailingCall, lastCalled = 0, maxWait = !1, trailing = !0;
            if (!isFunction(func)) throw new TypeError();
            if (wait = nativeMax(0, wait) || 0, options === !0) {
                var leading = !0;
                trailing = !1;
            } else isObject(options) && (leading = options.leading, maxWait = "maxWait" in options && (nativeMax(wait, options.maxWait) || 0), 
            trailing = "trailing" in options ? options.trailing : trailing);
            var delayed = function() {
                var remaining = wait - (now() - stamp);
                if (0 >= remaining) {
                    maxTimeoutId && clearTimeout(maxTimeoutId);
                    var isCalled = trailingCall;
                    maxTimeoutId = timeoutId = trailingCall = undefined, isCalled && (lastCalled = now(), 
                    result = func.apply(thisArg, args), timeoutId || maxTimeoutId || (args = thisArg = null));
                } else timeoutId = setTimeout(delayed, remaining);
            }, maxDelayed = function() {
                timeoutId && clearTimeout(timeoutId), maxTimeoutId = timeoutId = trailingCall = undefined, 
                (trailing || maxWait !== wait) && (lastCalled = now(), result = func.apply(thisArg, args), 
                timeoutId || maxTimeoutId || (args = thisArg = null));
            };
            return function() {
                if (args = arguments, stamp = now(), thisArg = this, trailingCall = trailing && (timeoutId || !leading), 
                maxWait === !1) var leadingCall = leading && !timeoutId; else {
                    maxTimeoutId || leading || (lastCalled = stamp);
                    var remaining = maxWait - (stamp - lastCalled), isCalled = 0 >= remaining;
                    isCalled ? (maxTimeoutId && (maxTimeoutId = clearTimeout(maxTimeoutId)), lastCalled = stamp, 
                    result = func.apply(thisArg, args)) : maxTimeoutId || (maxTimeoutId = setTimeout(maxDelayed, remaining));
                }
                return isCalled && timeoutId ? timeoutId = clearTimeout(timeoutId) : timeoutId || wait === maxWait || (timeoutId = setTimeout(delayed, wait)), 
                leadingCall && (isCalled = !0, result = func.apply(thisArg, args)), !isCalled || timeoutId || maxTimeoutId || (args = thisArg = null), 
                result;
            };
        }
        /**
     * Defers executing the `func` function until the current call stack has cleared.
     * Additional arguments will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to defer.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.defer(function(text) { console.log(text); }, 'deferred');
     * // logs 'deferred' after one or more milliseconds
     */
        function defer(func) {
            if (!isFunction(func)) throw new TypeError();
            var args = slice(arguments, 1);
            return setTimeout(function() {
                func.apply(undefined, args);
            }, 1);
        }
        /**
     * Executes the `func` function after `wait` milliseconds. Additional arguments
     * will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay execution.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.delay(function(text) { console.log(text); }, 1000, 'later');
     * // => logs 'later' after one second
     */
        function delay(func, wait) {
            if (!isFunction(func)) throw new TypeError();
            var args = slice(arguments, 2);
            return setTimeout(function() {
                func.apply(undefined, args);
            }, wait);
        }
        /**
     * Creates a function that memoizes the result of `func`. If `resolver` is
     * provided it will be used to determine the cache key for storing the result
     * based on the arguments provided to the memoized function. By default, the
     * first argument provided to the memoized function is used as the cache key.
     * The `func` is executed with the `this` binding of the memoized function.
     * The result cache is exposed as the `cache` property on the memoized function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to have its output memoized.
     * @param {Function} [resolver] A function used to resolve the cache key.
     * @returns {Function} Returns the new memoizing function.
     * @example
     *
     * var fibonacci = _.memoize(function(n) {
     *   return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
     * });
     *
     * fibonacci(9)
     * // => 34
     *
     * var data = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // modifying the result cache
     * var get = _.memoize(function(name) { return data[name]; }, _.identity);
     * get('pebbles');
     * // => { 'name': 'pebbles', 'age': 1 }
     *
     * get.cache.pebbles.name = 'penelope';
     * get('pebbles');
     * // => { 'name': 'penelope', 'age': 1 }
     */
        function memoize(func, resolver) {
            if (!isFunction(func)) throw new TypeError();
            var memoized = function() {
                var cache = memoized.cache, key = resolver ? resolver.apply(this, arguments) : keyPrefix + arguments[0];
                return hasOwnProperty.call(cache, key) ? cache[key] : cache[key] = func.apply(this, arguments);
            };
            return memoized.cache = {}, memoized;
        }
        /**
     * Creates a function that is restricted to execute `func` once. Repeat calls to
     * the function will return the value of the first call. The `func` is executed
     * with the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var initialize = _.once(createApplication);
     * initialize();
     * initialize();
     * // `initialize` executes `createApplication` once
     */
        function once(func) {
            var ran, result;
            if (!isFunction(func)) throw new TypeError();
            return function() {
                // clear the `func` variable so the function may be garbage collected
                return ran ? result : (ran = !0, result = func.apply(this, arguments), func = null, 
                result);
            };
        }
        /**
     * Creates a function that, when called, invokes `func` with any additional
     * `partial` arguments prepended to those provided to the new function. This
     * method is similar to `_.bind` except it does **not** alter the `this` binding.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var greet = function(greeting, name) { return greeting + ' ' + name; };
     * var hi = _.partial(greet, 'hi');
     * hi('fred');
     * // => 'hi fred'
     */
        function partial(func) {
            return createWrapper(func, 16, slice(arguments, 1));
        }
        /**
     * This method is like `_.partial` except that `partial` arguments are
     * appended to those provided to the new function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var defaultsDeep = _.partialRight(_.merge, _.defaults);
     *
     * var options = {
     *   'variable': 'data',
     *   'imports': { 'jq': $ }
     * };
     *
     * defaultsDeep(options, _.templateSettings);
     *
     * options.variable
     * // => 'data'
     *
     * options.imports
     * // => { '_': _, 'jq': $ }
     */
        function partialRight(func) {
            return createWrapper(func, 32, null, slice(arguments, 1));
        }
        /**
     * Creates a function that, when executed, will only call the `func` function
     * at most once per every `wait` milliseconds. Provide an options object to
     * indicate that `func` should be invoked on the leading and/or trailing edge
     * of the `wait` timeout. Subsequent calls to the throttled function will
     * return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the throttled function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to throttle.
     * @param {number} wait The number of milliseconds to throttle executions to.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=true] Specify execution on the leading edge of the timeout.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // avoid excessively updating the position while scrolling
     * var throttled = _.throttle(updatePosition, 100);
     * jQuery(window).on('scroll', throttled);
     *
     * // execute `renewToken` when the click event is fired, but not more than once every 5 minutes
     * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
     *   'trailing': false
     * }));
     */
        function throttle(func, wait, options) {
            var leading = !0, trailing = !0;
            if (!isFunction(func)) throw new TypeError();
            return options === !1 ? leading = !1 : isObject(options) && (leading = "leading" in options ? options.leading : leading, 
            trailing = "trailing" in options ? options.trailing : trailing), debounceOptions.leading = leading, 
            debounceOptions.maxWait = wait, debounceOptions.trailing = trailing, debounce(func, wait, debounceOptions);
        }
        /**
     * Creates a function that provides `value` to the wrapper function as its
     * first argument. Additional arguments provided to the function are appended
     * to those provided to the wrapper function. The wrapper is executed with
     * the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {*} value The value to wrap.
     * @param {Function} wrapper The wrapper function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var p = _.wrap(_.escape, function(func, text) {
     *   return '<p>' + func(text) + '</p>';
     * });
     *
     * p('Fred, Wilma, & Pebbles');
     * // => '<p>Fred, Wilma, &amp; Pebbles</p>'
     */
        function wrap(value, wrapper) {
            return createWrapper(wrapper, 16, [ value ]);
        }
        /*--------------------------------------------------------------------------*/
        /**
     * Creates a function that returns `value`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value The value to return from the new function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var getter = _.constant(object);
     * getter() === object;
     * // => true
     */
        function constant(value) {
            return function() {
                return value;
            };
        }
        /**
     * Produces a callback bound to an optional `thisArg`. If `func` is a property
     * name the created callback will return the property value for a given element.
     * If `func` is an object the created callback will return `true` for elements
     * that contain the equivalent object properties, otherwise it will return `false`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // wrap to create custom callback shorthands
     * _.createCallback = _.wrap(_.createCallback, function(func, callback, thisArg) {
     *   var match = /^(.+?)__([gl]t)(.+)$/.exec(callback);
     *   return !match ? func(callback, thisArg) : function(object) {
     *     return match[2] == 'gt' ? object[match[1]] > match[3] : object[match[1]] < match[3];
     *   };
     * });
     *
     * _.filter(characters, 'age__gt38');
     * // => [{ 'name': 'fred', 'age': 40 }]
     */
        function createCallback(func, thisArg, argCount) {
            var type = typeof func;
            if (null == func || "function" == type) return baseCreateCallback(func, thisArg, argCount);
            // handle "_.pluck" style callback shorthands
            if ("object" != type) return property(func);
            var props = keys(func), key = props[0], a = func[key];
            // handle "_.where" style callback shorthands
            // handle "_.where" style callback shorthands
            return 1 != props.length || a !== a || isObject(a) ? function(object) {
                for (var length = props.length, result = !1; length-- && (result = baseIsEqual(object[props[length]], func[props[length]], null, !0)); ) ;
                return result;
            } : function(object) {
                var b = object[key];
                return a === b && (0 !== a || 1 / a == 1 / b);
            };
        }
        /**
     * Converts the characters `&`, `<`, `>`, `"`, and `'` in `string` to their
     * corresponding HTML entities.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to escape.
     * @returns {string} Returns the escaped string.
     * @example
     *
     * _.escape('Fred, Wilma, & Pebbles');
     * // => 'Fred, Wilma, &amp; Pebbles'
     */
        function escape(string) {
            return null == string ? "" : String(string).replace(reUnescapedHtml, escapeHtmlChar);
        }
        /**
     * This method returns the first argument provided to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.identity(object) === object;
     * // => true
     */
        function identity(value) {
            return value;
        }
        /**
     * Adds function properties of a source object to the destination object.
     * If `object` is a function methods will be added to its prototype as well.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Function|Object} [object=lodash] object The destination object.
     * @param {Object} source The object of functions to add.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.chain=true] Specify whether the functions added are chainable.
     * @example
     *
     * function capitalize(string) {
     *   return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
     * }
     *
     * _.mixin({ 'capitalize': capitalize });
     * _.capitalize('fred');
     * // => 'Fred'
     *
     * _('fred').capitalize().value();
     * // => 'Fred'
     *
     * _.mixin({ 'capitalize': capitalize }, { 'chain': false });
     * _('fred').capitalize();
     * // => 'Fred'
     */
        function mixin(object, source, options) {
            var chain = !0, methodNames = source && functions(source);
            source && (options || methodNames.length) || (null == options && (options = source), 
            ctor = lodashWrapper, source = object, object = lodash, methodNames = functions(source)), 
            options === !1 ? chain = !1 : isObject(options) && "chain" in options && (chain = options.chain);
            var ctor = object, isFunc = isFunction(ctor);
            forEach(methodNames, function(methodName) {
                var func = object[methodName] = source[methodName];
                isFunc && (ctor.prototype[methodName] = function() {
                    var chainAll = this.__chain__, value = this.__wrapped__, args = [ value ];
                    push.apply(args, arguments);
                    var result = func.apply(object, args);
                    if (chain || chainAll) {
                        if (value === result && isObject(result)) return this;
                        result = new ctor(result), result.__chain__ = chainAll;
                    }
                    return result;
                });
            });
        }
        /**
     * Reverts the '_' variable to its previous value and returns a reference to
     * the `lodash` function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @returns {Function} Returns the `lodash` function.
     * @example
     *
     * var lodash = _.noConflict();
     */
        function noConflict() {
            return context._ = oldDash, this;
        }
        /**
     * A no-operation function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.noop(object) === undefined;
     * // => true
     */
        function noop() {}
        /**
     * Creates a "_.pluck" style function, which returns the `key` value of a
     * given object.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} key The name of the property to retrieve.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var characters = [
     *   { 'name': 'fred',   'age': 40 },
     *   { 'name': 'barney', 'age': 36 }
     * ];
     *
     * var getName = _.property('name');
     *
     * _.map(characters, getName);
     * // => ['barney', 'fred']
     *
     * _.sortBy(characters, getName);
     * // => [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred',   'age': 40 }]
     */
        function property(key) {
            return function(object) {
                return object[key];
            };
        }
        /**
     * Produces a random number between `min` and `max` (inclusive). If only one
     * argument is provided a number between `0` and the given number will be
     * returned. If `floating` is truey or either `min` or `max` are floats a
     * floating-point number will be returned instead of an integer.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} [min=0] The minimum possible value.
     * @param {number} [max=1] The maximum possible value.
     * @param {boolean} [floating=false] Specify returning a floating-point number.
     * @returns {number} Returns a random number.
     * @example
     *
     * _.random(0, 5);
     * // => an integer between 0 and 5
     *
     * _.random(5);
     * // => also an integer between 0 and 5
     *
     * _.random(5, true);
     * // => a floating-point number between 0 and 5
     *
     * _.random(1.2, 5.2);
     * // => a floating-point number between 1.2 and 5.2
     */
        function random(min, max, floating) {
            var noMin = null == min, noMax = null == max;
            if (null == floating && ("boolean" == typeof min && noMax ? (floating = min, min = 1) : noMax || "boolean" != typeof max || (floating = max, 
            noMax = !0)), noMin && noMax && (max = 1), min = +min || 0, noMax ? (max = min, 
            min = 0) : max = +max || 0, floating || min % 1 || max % 1) {
                var rand = nativeRandom();
                return nativeMin(min + rand * (max - min + parseFloat("1e-" + ((rand + "").length - 1))), max);
            }
            return baseRandom(min, max);
        }
        /**
     * Resolves the value of property `key` on `object`. If `key` is a function
     * it will be invoked with the `this` binding of `object` and its result returned,
     * else the property value is returned. If `object` is falsey then `undefined`
     * is returned.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to resolve.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = {
     *   'cheese': 'crumpets',
     *   'stuff': function() {
     *     return 'nonsense';
     *   }
     * };
     *
     * _.result(object, 'cheese');
     * // => 'crumpets'
     *
     * _.result(object, 'stuff');
     * // => 'nonsense'
     */
        function result(object, key) {
            if (object) {
                var value = object[key];
                return isFunction(value) ? object[key]() : value;
            }
        }
        /**
     * A micro-templating method that handles arbitrary delimiters, preserves
     * whitespace, and correctly escapes quotes within interpolated code.
     *
     * Note: In the development build, `_.template` utilizes sourceURLs for easier
     * debugging. See http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
     *
     * For more information on precompiling templates see:
     * http://lodash.com/custom-builds
     *
     * For more information on Chrome extension sandboxes see:
     * http://developer.chrome.com/stable/extensions/sandboxingEval.html
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} text The template text.
     * @param {Object} data The data object used to populate the text.
     * @param {Object} [options] The options object.
     * @param {RegExp} [options.escape] The "escape" delimiter.
     * @param {RegExp} [options.evaluate] The "evaluate" delimiter.
     * @param {Object} [options.imports] An object to import into the template as local variables.
     * @param {RegExp} [options.interpolate] The "interpolate" delimiter.
     * @param {string} [sourceURL] The sourceURL of the template's compiled source.
     * @param {string} [variable] The data object variable name.
     * @returns {Function|string} Returns a compiled function when no `data` object
     *  is given, else it returns the interpolated text.
     * @example
     *
     * // using the "interpolate" delimiter to create a compiled template
     * var compiled = _.template('hello <%= name %>');
     * compiled({ 'name': 'fred' });
     * // => 'hello fred'
     *
     * // using the "escape" delimiter to escape HTML in data property values
     * _.template('<b><%- value %></b>', { 'value': '<script>' });
     * // => '<b>&lt;script&gt;</b>'
     *
     * // using the "evaluate" delimiter to generate HTML
     * var list = '<% _.forEach(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the ES6 delimiter as an alternative to the default "interpolate" delimiter
     * _.template('hello ${ name }', { 'name': 'pebbles' });
     * // => 'hello pebbles'
     *
     * // using the internal `print` function in "evaluate" delimiters
     * _.template('<% print("hello " + name); %>!', { 'name': 'barney' });
     * // => 'hello barney!'
     *
     * // using a custom template delimiters
     * _.templateSettings = {
     *   'interpolate': /{{([\s\S]+?)}}/g
     * };
     *
     * _.template('hello {{ name }}!', { 'name': 'mustache' });
     * // => 'hello mustache!'
     *
     * // using the `imports` option to import jQuery
     * var list = '<% jq.each(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] }, { 'imports': { 'jq': jQuery } });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the `sourceURL` option to specify a custom sourceURL for the template
     * var compiled = _.template('hello <%= name %>', null, { 'sourceURL': '/basic/greeting.jst' });
     * compiled(data);
     * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
     *
     * // using the `variable` option to ensure a with-statement isn't used in the compiled template
     * var compiled = _.template('hi <%= data.name %>!', null, { 'variable': 'data' });
     * compiled.source;
     * // => function(data) {
     *   var __t, __p = '', __e = _.escape;
     *   __p += 'hi ' + ((__t = ( data.name )) == null ? '' : __t) + '!';
     *   return __p;
     * }
     *
     * // using the `source` property to inline compiled templates for meaningful
     * // line numbers in error messages and a stack trace
     * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
     *   var JST = {\
     *     "main": ' + _.template(mainText).source + '\
     *   };\
     * ');
     */
        function template(text, data, options) {
            // based on John Resig's `tmpl` implementation
            // http://ejohn.org/blog/javascript-micro-templating/
            // and Laura Doktorova's doT.js
            // https://github.com/olado/doT
            var settings = lodash.templateSettings;
            text = String(text || ""), // avoid missing dependencies when `iteratorTemplate` is not defined
            options = defaults({}, options, settings);
            var isEvaluating, imports = defaults({}, options.imports, settings.imports), importsKeys = keys(imports), importsValues = values(imports), index = 0, interpolate = options.interpolate || reNoMatch, source = "__p += '", reDelimiters = RegExp((options.escape || reNoMatch).source + "|" + interpolate.source + "|" + (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + "|" + (options.evaluate || reNoMatch).source + "|$", "g");
            text.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
                // the JS engine embedded in Adobe products requires returning the `match`
                // string in order to produce the correct `offset` value
                // escape characters that cannot be included in string literals
                // replace delimiters with snippets
                return interpolateValue || (interpolateValue = esTemplateValue), source += text.slice(index, offset).replace(reUnescapedString, escapeStringChar), 
                escapeValue && (source += "' +\n__e(" + escapeValue + ") +\n'"), evaluateValue && (isEvaluating = !0, 
                source += "';\n" + evaluateValue + ";\n__p += '"), interpolateValue && (source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'"), 
                index = offset + match.length, match;
            }), source += "';\n";
            // if `variable` is not specified, wrap a with-statement around the generated
            // code to add the data object to the top of the scope chain
            var variable = options.variable, hasVariable = variable;
            hasVariable || (variable = "obj", source = "with (" + variable + ") {\n" + source + "\n}\n"), 
            // cleanup code by stripping empty strings
            source = (isEvaluating ? source.replace(reEmptyStringLeading, "") : source).replace(reEmptyStringMiddle, "$1").replace(reEmptyStringTrailing, "$1;"), 
            // frame code as the function body
            source = "function(" + variable + ") {\n" + (hasVariable ? "" : variable + " || (" + variable + " = {});\n") + "var __t, __p = '', __e = _.escape" + (isEvaluating ? ", __j = Array.prototype.join;\nfunction print() { __p += __j.call(arguments, '') }\n" : ";\n") + source + "return __p\n}";
            // Use a sourceURL for easier debugging.
            // http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
            var sourceURL = "\n/*\n//# sourceURL=" + (options.sourceURL || "/lodash/template/source[" + templateCounter++ + "]") + "\n*/";
            try {
                var result = Function(importsKeys, "return " + source + sourceURL).apply(undefined, importsValues);
            } catch (e) {
                throw e.source = source, e;
            }
            // provide the compiled function's source by its `toString` method, in
            // supported environments, or the `source` property as a convenience for
            // inlining compiled templates during the build process
            return data ? result(data) : (result.source = source, result);
        }
        /**
     * Executes the callback `n` times, returning an array of the results
     * of each callback execution. The callback is bound to `thisArg` and invoked
     * with one argument; (index).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} n The number of times to execute the callback.
     * @param {Function} callback The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns an array of the results of each `callback` execution.
     * @example
     *
     * var diceRolls = _.times(3, _.partial(_.random, 1, 6));
     * // => [3, 6, 4]
     *
     * _.times(3, function(n) { mage.castSpell(n); });
     * // => calls `mage.castSpell(n)` three times, passing `n` of `0`, `1`, and `2` respectively
     *
     * _.times(3, function(n) { this.cast(n); }, mage);
     * // => also calls `mage.castSpell(n)` three times
     */
        function times(n, callback, thisArg) {
            n = (n = +n) > -1 ? n : 0;
            var index = -1, result = Array(n);
            for (callback = baseCreateCallback(callback, thisArg, 1); ++index < n; ) result[index] = callback(index);
            return result;
        }
        /**
     * The inverse of `_.escape` this method converts the HTML entities
     * `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&#39;` in `string` to their
     * corresponding characters.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to unescape.
     * @returns {string} Returns the unescaped string.
     * @example
     *
     * _.unescape('Fred, Barney &amp; Pebbles');
     * // => 'Fred, Barney & Pebbles'
     */
        function unescape(string) {
            return null == string ? "" : String(string).replace(reEscapedHtml, unescapeHtmlChar);
        }
        /**
     * Generates a unique ID. If `prefix` is provided the ID will be appended to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} [prefix] The value to prefix the ID with.
     * @returns {string} Returns the unique ID.
     * @example
     *
     * _.uniqueId('contact_');
     * // => 'contact_104'
     *
     * _.uniqueId();
     * // => '105'
     */
        function uniqueId(prefix) {
            var id = ++idCounter;
            return String(null == prefix ? "" : prefix) + id;
        }
        /*--------------------------------------------------------------------------*/
        /**
     * Creates a `lodash` object that wraps the given value with explicit
     * method chaining enabled.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to wrap.
     * @returns {Object} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'pebbles', 'age': 1 }
     * ];
     *
     * var youngest = _.chain(characters)
     *     .sortBy('age')
     *     .map(function(chr) { return chr.name + ' is ' + chr.age; })
     *     .first()
     *     .value();
     * // => 'pebbles is 1'
     */
        function chain(value) {
            return value = new lodashWrapper(value), value.__chain__ = !0, value;
        }
        /**
     * Invokes `interceptor` with the `value` as the first argument and then
     * returns `value`. The purpose of this method is to "tap into" a method
     * chain in order to perform operations on intermediate results within
     * the chain.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to provide to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @returns {*} Returns `value`.
     * @example
     *
     * _([1, 2, 3, 4])
     *  .tap(function(array) { array.pop(); })
     *  .reverse()
     *  .value();
     * // => [3, 2, 1]
     */
        function tap(value, interceptor) {
            return interceptor(value), value;
        }
        /**
     * Enables explicit method chaining on the wrapper object.
     *
     * @name chain
     * @memberOf _
     * @category Chaining
     * @returns {*} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // without explicit chaining
     * _(characters).first();
     * // => { 'name': 'barney', 'age': 36 }
     *
     * // with explicit chaining
     * _(characters).chain()
     *   .first()
     *   .pick('age')
     *   .value();
     * // => { 'age': 36 }
     */
        function wrapperChain() {
            return this.__chain__ = !0, this;
        }
        /**
     * Produces the `toString` result of the wrapped value.
     *
     * @name toString
     * @memberOf _
     * @category Chaining
     * @returns {string} Returns the string result.
     * @example
     *
     * _([1, 2, 3]).toString();
     * // => '1,2,3'
     */
        function wrapperToString() {
            return String(this.__wrapped__);
        }
        /**
     * Extracts the wrapped value.
     *
     * @name valueOf
     * @memberOf _
     * @alias value
     * @category Chaining
     * @returns {*} Returns the wrapped value.
     * @example
     *
     * _([1, 2, 3]).valueOf();
     * // => [1, 2, 3]
     */
        function wrapperValueOf() {
            return this.__wrapped__;
        }
        // Avoid issues with some ES3 environments that attempt to use values, named
        // after built-in constructors like `Object`, for the creation of literals.
        // ES5 clears this up by stating that literals must use built-in constructors.
        // See http://es5.github.io/#x11.1.5.
        context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;
        /** Native constructor references */
        var Array = context.Array, Boolean = context.Boolean, Date = context.Date, Function = context.Function, Math = context.Math, Number = context.Number, Object = context.Object, RegExp = context.RegExp, String = context.String, TypeError = context.TypeError, arrayRef = [], objectProto = Object.prototype, oldDash = context._, toString = objectProto.toString, reNative = RegExp("^" + String(toString).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/toString| for [^\]]+/g, ".*?") + "$"), ceil = Math.ceil, clearTimeout = context.clearTimeout, floor = Math.floor, fnToString = Function.prototype.toString, getPrototypeOf = isNative(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf, hasOwnProperty = objectProto.hasOwnProperty, push = arrayRef.push, setTimeout = context.setTimeout, splice = arrayRef.splice, unshift = arrayRef.unshift, defineProperty = function() {
            // IE 8 only accepts DOM elements
            try {
                var o = {}, func = isNative(func = Object.defineProperty) && func, result = func(o, o, o) && func;
            } catch (e) {}
            return result;
        }(), nativeCreate = isNative(nativeCreate = Object.create) && nativeCreate, nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray, nativeIsFinite = context.isFinite, nativeIsNaN = context.isNaN, nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys, nativeMax = Math.max, nativeMin = Math.min, nativeParseInt = context.parseInt, nativeRandom = Math.random, ctorByClass = {};
        ctorByClass[arrayClass] = Array, ctorByClass[boolClass] = Boolean, ctorByClass[dateClass] = Date, 
        ctorByClass[funcClass] = Function, ctorByClass[objectClass] = Object, ctorByClass[numberClass] = Number, 
        ctorByClass[regexpClass] = RegExp, ctorByClass[stringClass] = String, // ensure `new lodashWrapper` is an instance of `lodash`
        lodashWrapper.prototype = lodash.prototype;
        /**
     * An object used to flag environments features.
     *
     * @static
     * @memberOf _
     * @type Object
     */
        var support = lodash.support = {};
        /**
     * Detect if functions can be decompiled by `Function#toString`
     * (all but PS3 and older Opera mobile browsers & avoided in Windows 8 apps).
     *
     * @memberOf _.support
     * @type boolean
     */
        support.funcDecomp = !isNative(context.WinRTError) && reThis.test(runInContext), 
        /**
     * Detect if `Function#name` is supported (all but IE).
     *
     * @memberOf _.support
     * @type boolean
     */
        support.funcNames = "string" == typeof Function.name, /**
     * By default, the template delimiters used by Lo-Dash are similar to those in
     * embedded Ruby (ERB). Change the following template settings to use alternative
     * delimiters.
     *
     * @static
     * @memberOf _
     * @type Object
     */
        lodash.templateSettings = {
            /**
       * Used to detect `data` property values to be HTML-escaped.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
            escape: /<%-([\s\S]+?)%>/g,
            /**
       * Used to detect code to be evaluated.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
            evaluate: /<%([\s\S]+?)%>/g,
            /**
       * Used to detect `data` property values to inject.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
            interpolate: reInterpolate,
            /**
       * Used to reference the data object in the template text.
       *
       * @memberOf _.templateSettings
       * @type string
       */
            variable: "",
            /**
       * Used to import variables into the compiled template.
       *
       * @memberOf _.templateSettings
       * @type Object
       */
            imports: {
                /**
         * A reference to the `lodash` function.
         *
         * @memberOf _.templateSettings.imports
         * @type Function
         */
                _: lodash
            }
        }, // fallback for browsers without `Object.create`
        nativeCreate || (baseCreate = function() {
            function Object() {}
            return function(prototype) {
                if (isObject(prototype)) {
                    Object.prototype = prototype;
                    var result = new Object();
                    Object.prototype = null;
                }
                return result || context.Object();
            };
        }());
        /**
     * Sets `this` binding data on a given function.
     *
     * @private
     * @param {Function} func The function to set data on.
     * @param {Array} value The data array to set.
     */
        var setBindData = defineProperty ? function(func, value) {
            descriptor.value = value, defineProperty(func, "__bindData__", descriptor);
        } : noop, isArray = nativeIsArray || function(value) {
            return value && "object" == typeof value && "number" == typeof value.length && toString.call(value) == arrayClass || !1;
        }, shimKeys = function(object) {
            var index, iterable = object, result = [];
            if (!iterable) return result;
            if (!objectTypes[typeof object]) return result;
            for (index in iterable) hasOwnProperty.call(iterable, index) && result.push(index);
            return result;
        }, keys = nativeKeys ? function(object) {
            return isObject(object) ? nativeKeys(object) : [];
        } : shimKeys, htmlEscapes = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }, htmlUnescapes = invert(htmlEscapes), reEscapedHtml = RegExp("(" + keys(htmlUnescapes).join("|") + ")", "g"), reUnescapedHtml = RegExp("[" + keys(htmlEscapes).join("") + "]", "g"), assign = function(object, source, guard) {
            var index, iterable = object, result = iterable;
            if (!iterable) return result;
            var args = arguments, argsIndex = 0, argsLength = "number" == typeof guard ? 2 : args.length;
            if (argsLength > 3 && "function" == typeof args[argsLength - 2]) var callback = baseCreateCallback(args[--argsLength - 1], args[argsLength--], 2); else argsLength > 2 && "function" == typeof args[argsLength - 1] && (callback = args[--argsLength]);
            for (;++argsIndex < argsLength; ) if (iterable = args[argsIndex], iterable && objectTypes[typeof iterable]) for (var ownIndex = -1, ownProps = objectTypes[typeof iterable] && keys(iterable), length = ownProps ? ownProps.length : 0; ++ownIndex < length; ) index = ownProps[ownIndex], 
            result[index] = callback ? callback(result[index], iterable[index]) : iterable[index];
            return result;
        }, defaults = function(object, source, guard) {
            var index, iterable = object, result = iterable;
            if (!iterable) return result;
            for (var args = arguments, argsIndex = 0, argsLength = "number" == typeof guard ? 2 : args.length; ++argsIndex < argsLength; ) if (iterable = args[argsIndex], 
            iterable && objectTypes[typeof iterable]) for (var ownIndex = -1, ownProps = objectTypes[typeof iterable] && keys(iterable), length = ownProps ? ownProps.length : 0; ++ownIndex < length; ) index = ownProps[ownIndex], 
            "undefined" == typeof result[index] && (result[index] = iterable[index]);
            return result;
        }, forIn = function(collection, callback, thisArg) {
            var index, iterable = collection, result = iterable;
            if (!iterable) return result;
            if (!objectTypes[typeof iterable]) return result;
            callback = callback && "undefined" == typeof thisArg ? callback : baseCreateCallback(callback, thisArg, 3);
            for (index in iterable) if (callback(iterable[index], index, collection) === !1) return result;
            return result;
        }, forOwn = function(collection, callback, thisArg) {
            var index, iterable = collection, result = iterable;
            if (!iterable) return result;
            if (!objectTypes[typeof iterable]) return result;
            callback = callback && "undefined" == typeof thisArg ? callback : baseCreateCallback(callback, thisArg, 3);
            for (var ownIndex = -1, ownProps = objectTypes[typeof iterable] && keys(iterable), length = ownProps ? ownProps.length : 0; ++ownIndex < length; ) if (index = ownProps[ownIndex], 
            callback(iterable[index], index, collection) === !1) return result;
            return result;
        }, isPlainObject = getPrototypeOf ? function(value) {
            if (!value || toString.call(value) != objectClass) return !1;
            var valueOf = value.valueOf, objProto = isNative(valueOf) && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);
            return objProto ? value == objProto || getPrototypeOf(value) == objProto : shimIsPlainObject(value);
        } : shimIsPlainObject, countBy = createAggregator(function(result, value, key) {
            hasOwnProperty.call(result, key) ? result[key]++ : result[key] = 1;
        }), groupBy = createAggregator(function(result, value, key) {
            (hasOwnProperty.call(result, key) ? result[key] : result[key] = []).push(value);
        }), indexBy = createAggregator(function(result, value, key) {
            result[key] = value;
        }), pluck = map, where = filter, now = isNative(now = Date.now) && now || function() {
            return new Date().getTime();
        }, parseInt = 8 == nativeParseInt(whitespace + "08") ? nativeParseInt : function(value, radix) {
            // Firefox < 21 and Opera < 15 follow the ES3 specified implementation of `parseInt`
            return nativeParseInt(isString(value) ? value.replace(reLeadingSpacesAndZeros, "") : value, radix || 0);
        };
        /*--------------------------------------------------------------------------*/
        // add functions that return wrapped values when chaining
        // add aliases
        // add functions to `lodash.prototype`
        /*--------------------------------------------------------------------------*/
        // add functions that return unwrapped values when chaining
        // add aliases
        /*--------------------------------------------------------------------------*/
        // add functions capable of returning wrapped and unwrapped values when chaining
        // add aliases
        /*--------------------------------------------------------------------------*/
        /**
     * The semantic version number.
     *
     * @static
     * @memberOf _
     * @type string
     */
        // add "Chaining" functions to the wrapper
        // add `Array` functions that return unwrapped values
        // add `Array` functions that return the existing wrapped value
        // add `Array` functions that return new wrapped values
        return lodash.after = after, lodash.assign = assign, lodash.at = at, lodash.bind = bind, 
        lodash.bindAll = bindAll, lodash.bindKey = bindKey, lodash.chain = chain, lodash.compact = compact, 
        lodash.compose = compose, lodash.constant = constant, lodash.countBy = countBy, 
        lodash.create = create, lodash.createCallback = createCallback, lodash.curry = curry, 
        lodash.debounce = debounce, lodash.defaults = defaults, lodash.defer = defer, lodash.delay = delay, 
        lodash.difference = difference, lodash.filter = filter, lodash.flatten = flatten, 
        lodash.forEach = forEach, lodash.forEachRight = forEachRight, lodash.forIn = forIn, 
        lodash.forInRight = forInRight, lodash.forOwn = forOwn, lodash.forOwnRight = forOwnRight, 
        lodash.functions = functions, lodash.groupBy = groupBy, lodash.indexBy = indexBy, 
        lodash.initial = initial, lodash.intersection = intersection, lodash.invert = invert, 
        lodash.invoke = invoke, lodash.keys = keys, lodash.map = map, lodash.mapValues = mapValues, 
        lodash.max = max, lodash.memoize = memoize, lodash.merge = merge, lodash.min = min, 
        lodash.omit = omit, lodash.once = once, lodash.pairs = pairs, lodash.partial = partial, 
        lodash.partialRight = partialRight, lodash.pick = pick, lodash.pluck = pluck, lodash.property = property, 
        lodash.pull = pull, lodash.range = range, lodash.reject = reject, lodash.remove = remove, 
        lodash.rest = rest, lodash.shuffle = shuffle, lodash.sortBy = sortBy, lodash.tap = tap, 
        lodash.throttle = throttle, lodash.times = times, lodash.toArray = toArray, lodash.transform = transform, 
        lodash.union = union, lodash.uniq = uniq, lodash.values = values, lodash.where = where, 
        lodash.without = without, lodash.wrap = wrap, lodash.xor = xor, lodash.zip = zip, 
        lodash.zipObject = zipObject, lodash.collect = map, lodash.drop = rest, lodash.each = forEach, 
        lodash.eachRight = forEachRight, lodash.extend = assign, lodash.methods = functions, 
        lodash.object = zipObject, lodash.select = filter, lodash.tail = rest, lodash.unique = uniq, 
        lodash.unzip = zip, mixin(lodash), lodash.clone = clone, lodash.cloneDeep = cloneDeep, 
        lodash.contains = contains, lodash.escape = escape, lodash.every = every, lodash.find = find, 
        lodash.findIndex = findIndex, lodash.findKey = findKey, lodash.findLast = findLast, 
        lodash.findLastIndex = findLastIndex, lodash.findLastKey = findLastKey, lodash.has = has, 
        lodash.identity = identity, lodash.indexOf = indexOf, lodash.isArguments = isArguments, 
        lodash.isArray = isArray, lodash.isBoolean = isBoolean, lodash.isDate = isDate, 
        lodash.isElement = isElement, lodash.isEmpty = isEmpty, lodash.isEqual = isEqual, 
        lodash.isFinite = isFinite, lodash.isFunction = isFunction, lodash.isNaN = isNaN, 
        lodash.isNull = isNull, lodash.isNumber = isNumber, lodash.isObject = isObject, 
        lodash.isPlainObject = isPlainObject, lodash.isRegExp = isRegExp, lodash.isString = isString, 
        lodash.isUndefined = isUndefined, lodash.lastIndexOf = lastIndexOf, lodash.mixin = mixin, 
        lodash.noConflict = noConflict, lodash.noop = noop, lodash.now = now, lodash.parseInt = parseInt, 
        lodash.random = random, lodash.reduce = reduce, lodash.reduceRight = reduceRight, 
        lodash.result = result, lodash.runInContext = runInContext, lodash.size = size, 
        lodash.some = some, lodash.sortedIndex = sortedIndex, lodash.template = template, 
        lodash.unescape = unescape, lodash.uniqueId = uniqueId, lodash.all = every, lodash.any = some, 
        lodash.detect = find, lodash.findWhere = find, lodash.foldl = reduce, lodash.foldr = reduceRight, 
        lodash.include = contains, lodash.inject = reduce, mixin(function() {
            var source = {};
            return forOwn(lodash, function(func, methodName) {
                lodash.prototype[methodName] || (source[methodName] = func);
            }), source;
        }(), !1), lodash.first = first, lodash.last = last, lodash.sample = sample, lodash.take = first, 
        lodash.head = first, forOwn(lodash, function(func, methodName) {
            var callbackable = "sample" !== methodName;
            lodash.prototype[methodName] || (lodash.prototype[methodName] = function(n, guard) {
                var chainAll = this.__chain__, result = func(this.__wrapped__, n, guard);
                return chainAll || null != n && (!guard || callbackable && "function" == typeof n) ? new lodashWrapper(result, chainAll) : result;
            });
        }), lodash.VERSION = "2.4.1", lodash.prototype.chain = wrapperChain, lodash.prototype.toString = wrapperToString, 
        lodash.prototype.value = wrapperValueOf, lodash.prototype.valueOf = wrapperValueOf, 
        forEach([ "join", "pop", "shift" ], function(methodName) {
            var func = arrayRef[methodName];
            lodash.prototype[methodName] = function() {
                var chainAll = this.__chain__, result = func.apply(this.__wrapped__, arguments);
                return chainAll ? new lodashWrapper(result, chainAll) : result;
            };
        }), forEach([ "push", "reverse", "sort", "unshift" ], function(methodName) {
            var func = arrayRef[methodName];
            lodash.prototype[methodName] = function() {
                return func.apply(this.__wrapped__, arguments), this;
            };
        }), forEach([ "concat", "slice", "splice" ], function(methodName) {
            var func = arrayRef[methodName];
            lodash.prototype[methodName] = function() {
                return new lodashWrapper(func.apply(this.__wrapped__, arguments), this.__chain__);
            };
        }), lodash;
    }
    /** Used as a safe reference for `undefined` in pre ES5 environments */
    var undefined, arrayPool = [], objectPool = [], idCounter = 0, keyPrefix = +new Date() + "", largeArraySize = 75, maxPoolSize = 40, whitespace = " 	\f ﻿\n\r\u2028\u2029 ᠎             　", reEmptyStringLeading = /\b__p \+= '';/g, reEmptyStringMiddle = /\b(__p \+=) '' \+/g, reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g, reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g, reFlags = /\w*$/, reFuncName = /^\s*function[ \n\r\t]+\w/, reInterpolate = /<%=([\s\S]+?)%>/g, reLeadingSpacesAndZeros = RegExp("^[" + whitespace + "]*0+(?=.$)"), reNoMatch = /($^)/, reThis = /\bthis\b/, reUnescapedString = /['\n\r\t\u2028\u2029\\]/g, contextProps = [ "Array", "Boolean", "Date", "Function", "Math", "Number", "Object", "RegExp", "String", "_", "attachEvent", "clearTimeout", "isFinite", "isNaN", "parseInt", "setTimeout" ], templateCounter = 0, argsClass = "[object Arguments]", arrayClass = "[object Array]", boolClass = "[object Boolean]", dateClass = "[object Date]", funcClass = "[object Function]", numberClass = "[object Number]", objectClass = "[object Object]", regexpClass = "[object RegExp]", stringClass = "[object String]", cloneableClasses = {};
    cloneableClasses[funcClass] = !1, cloneableClasses[argsClass] = cloneableClasses[arrayClass] = cloneableClasses[boolClass] = cloneableClasses[dateClass] = cloneableClasses[numberClass] = cloneableClasses[objectClass] = cloneableClasses[regexpClass] = cloneableClasses[stringClass] = !0;
    /** Used as an internal `_.debounce` options object */
    var debounceOptions = {
        leading: !1,
        maxWait: 0,
        trailing: !1
    }, descriptor = {
        configurable: !1,
        enumerable: !1,
        value: null,
        writable: !1
    }, objectTypes = {
        "boolean": !1,
        "function": !0,
        object: !0,
        number: !1,
        string: !1,
        undefined: !1
    }, stringEscapes = {
        "\\": "\\",
        "'": "'",
        "\n": "n",
        "\r": "r",
        "	": "t",
        "\u2028": "u2028",
        "\u2029": "u2029"
    }, root = objectTypes[typeof window] && window || this, freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports, freeModule = objectTypes[typeof module] && module && !module.nodeType && module, moduleExports = freeModule && freeModule.exports === freeExports && freeExports, freeGlobal = objectTypes[typeof global] && global;
    !freeGlobal || freeGlobal.global !== freeGlobal && freeGlobal.window !== freeGlobal || (root = freeGlobal);
    /*--------------------------------------------------------------------------*/
    // expose Lo-Dash
    var _ = runInContext();
    // some AMD build optimizers like r.js check for condition patterns like the following:
    "function" == typeof define && "object" == typeof define.amd && define.amd ? (// Expose Lo-Dash to the global object even when an AMD loader is present in
    // case Lo-Dash is loaded with a RequireJS shim config.
    // See http://requirejs.org/docs/api.html#config-shim
    root._ = _, // define as an anonymous module so, through path mapping, it can be
    // referenced as the "underscore" module
    define("lodash", [], function() {
        return _;
    })) : freeExports && freeModule ? // in Node.js or RingoJS
    moduleExports ? (freeModule.exports = _)._ = _ : freeExports._ = _ : // in a browser or Rhino
    root._ = _;
}.call(this), define("lib", function() {});