/**
 * Dollar framework
 *
 * This implements a small subset of jQuery in a forwards-compatible manner,
 * for our current needs.  Supports modern browsers and MSIE 8+.
 *
 * @package   Dollar
 * @author    Stéphane Lavergne <http://www.imars.com/>
 * @copyright 2013 Stéphane Lavergne
 * @license   http://www.gnu.org/licenses/lgpl-3.0.txt  GNU LGPL version 3
 */

/*jslint node: false, browser: true, es5: false, white: true, nomen: true, plusplus: true, continue: true */
/*global $: true, JSON: true */

// TODO:
//
// - Test $.ajax() to make sure it truly works.
//
// - JRPC, refactor to stand alone from jQuery/Dollar?
//
// load(...)  // Shortcut around $.ajax() and html() I think
//
// on('click', s, f)
// click(f)
// trigger('click')

"use strict";

// Polyfill: String.trim()
if (!String.prototype.trim) {
	String.prototype.trim = function () {
		return this.replace(/^\s+|\s+$/g,'');
	};
}

// Polyfill: dummy JSON if missing
if (typeof JSON !== 'object') {
	// We silently fail for MSIE 5-7 in .find(), so no need for json2.js here.
	window.JSON = {
		stringify: function () { return "{}"; },
		parse: function () { return null; }
	};
}

(function (window) {

	// The foundation
	//

	var Dollar = function (a) {
		var i = 0, n = null;
		this.a = [];
		if (!a) {
			return this;
		}
		// Catches Dollar, NodeList and HTMLCollection
		// NOTE: This will produce a manually built replica of the inbound
		// Dollar object, short of knowing how to directly return itself.
		if (a.length) {
			if (a.item) {
				for (i=0; i < a.length; i++) {
					n = a.item(i);
					if ($.isNode(n)) { this.a.push(n); }
				}
				return this;
			}
			if (a.length > 0) {
				for (i=0; i < a.length; i++) {
					if ($.isNode(a[i])) { this.a.push(a[i]); }
				}
				return this;
			}
		}
		if ($.isNode(a)) { this.a.push(a); }
		return this;
	};

	Dollar.prototype.length = function () {
		return this.a.length;
	};

	Dollar.prototype.each = function (f) {
		var i = 0;
		for (i=0; i < this.a.length; i++) {
			f.apply(this.a[i]);
		}
		return this;
	};

	Dollar.prototype.first = function () {
		return (this.a.length > 0 ? new Dollar(this.a[0]) : new Dollar());
	};

	Dollar.prototype.last = function () {
		return (this.a.length > 0 ? new Dollar(this.a[this.a.length - 1]) : new Dollar());
	};

	// MSIE 8+ and modern browsers support querySelector[All]().
	// Thus if there's white space, we drop IE 5-7 support silently, no emulation.
	Dollar.prototype.find = function (s) {
		if (!s) { return this; }
		s = s.trim();
		var a = [], i = 0, j = 0, l = [], litem,
			hint = s.charAt(0),
			ss = s.substr(1),
			is_single = (ss.search($.u.SS) < 0),
			use_id    = (is_single && hint === '#'),
			use_class = (is_single && hint === '.'),
			use_tag   = (is_single && !use_id && !use_class);
		for (i=0; i < this.a.length; i++) {
			if (use_id) {
				l.push(this.a[i].getElementById(ss));
			} else if (use_class && document.getElementsByClassName) {
				l = this.a[i].getElementsByClassName(ss);
			} else if (use_tag) {
				l = this.a[i].getElementsByTagName(s);
			} else if (document.querySelectorAll) {
				l = this.a[i].querySelectorAll(s);
			}
			if (l.length && l.length > 0) {
				for (j=0; j < l.length; j++) {
					if (l.item) {
						litem = l.item(j);
					} else {
						litem = l[j];
					}
					if ($.isNode(litem)) { a.push(litem); }
				}
			}
		}
		return new Dollar(a);
	};

	Dollar.prototype._ready = function() {
		var i = 0, f;
		// Make sure we invoke each callback only once.
		for (i=0; i < window.$.r.length; i++) {
			f = window.$.r.pop();
			f();
		}
	};

	Dollar.prototype.ready = function(f) {
		// Hack to only support jQuery-style $(document).ready(f);
		window.$.r.push(f);
		if (document.readyState === "complete") {
			this._ready();
		} else if (document.addEventListener) {
			document.addEventListener("DOMContentLoaded", this._ready, false);
		} else if (window.addEventListener) {
			window.addEventListener("load", this._ready, false);
		} else if (document.attachEvent) {
			document.attachEvent("onreadystatechange", this._ready);
		} else if (window.attachEvent) {
			window.attachEvent("onload", this._ready);
		}
		return this;
	};


	// The utility belt
	//

	Dollar.prototype.attr = function (k,v) {
		var i = 0;
		if (typeof v === 'undefined') {
			return (this.a.length > 0 ? this.a[0].getAttribute(k) : null);
		}
		for (i=0; i < this.a.length; i++) {
			this.a[i].setAttribute(k,v);
		}
		return this;
	};

	Dollar.prototype.parent = function () {
		return (this.a.length > 0 ? new Dollar(this.a[0].parentNode) : new Dollar());
	};

	Dollar.prototype.children = function () {
		var a = [], i = 0, j = 0, l;
		for (i=0; i < this.a.length; i++) {
			l = this.a[i].childNodes;
			if (l.length && l.length > 0 && l.item) {
				for (j=0; j < l.length; j++) {
					if ($.isNode(l[j])) { a.push(l[j]); }
				}
			}
		}
		return new Dollar(a);
	};

	Dollar.prototype.prev = function () {
		var a = [], i = 0, s;
		for (i=0; i < this.a.length; i++) {
			s = this.a[i].previousSibling;
			if ($.isNode(s)) {
				a.push(s);
			}
		}
		return new Dollar(a);
	};

	Dollar.prototype.next = function () {
		var a = [], i = 0, s;
		for (i=0; i < this.a.length; i++) {
			s = this.a[i].nextSibling;
			if ($.isNode(s)) {
				a.push(s);
			}
		}
		return new Dollar(a);
	};

	Dollar.prototype.remove = function () {
		var i = 0;
		for (i=0; i < this.a.length; i++) {
			if (this.a[i].parentNode) { this.a[i].parentNode.removeChild(this.a[i]); }
		}
		return null;
	};

	Dollar.prototype.empty = function () {
		var i = 0, j;
		for (i=0; i < this.a.length; i++) {
			j = this.a[i];
			while (j.firstChild) { j.removeChild(j.firstChild); }
		}
		return this;
	};

	// Per jQuery specs, only return the FIRST's .innerHTML in read mode
	// FIXME: Should support Dollar nodes as input.
	Dollar.prototype.html = function (h) {
		var i = 0, frag, div;
		if (!h) {
			if (this.a.length > 0) {
				return this.a[0].innerHTML;
			}
			return "";
		}
		// Make sure HTML is parsed only once.
		frag = document.createDocumentFragment();
		div = document.createElement('div');
		div.innerHTML = h;
		while (div.firstChild) { frag.appendChild(div.firstChild); }
		this.empty();
		for (i=0; i < this.a.length; i++) {
			this.a[i].innerHTML = h;
		}
		return this;
	};

	// Per jQuery specs, return EVERYONE's .innerText in read mode
	Dollar.prototype.text = function (t) {
		var i = 0, type;
		if (!t) {
			if (this.a.length > 0) {
				t = "";
				for (i=0; i < this.a.length; i++) {
					type = this.a[i].nodeType;
					if (type === 3 || type === 4) {
						t = t + this.a[i].nodeValue;
					} else {
						t = t + this.a[i].innerText;
					}
				}
				return t;
			}
			return "";
		}
		this.empty();
		for (i=0; i < this.a.length; i++) {
			this.a[i].appendChild(document.createTextNode(t));
		}
		return this;
	};

	// To avoid having to produce .innerHTML, append strings, then parse the
	// WHOLE THING, we instead parse the HTML once into a fragment, then append
	// said fragment to each target using DOM.
	// FIXME: Should support Dollar nodes as input.
	Dollar.prototype.append = function (h) {
		var i = 0, frag = document.createDocumentFragment(), div = document.createElement('div');
		div.innerHTML = h;
		while (div.firstChild) { frag.appendChild(div.firstChild); }
		for (i=0; i < this.a.length; i++) {
			this.a[i].appendChild(frag.cloneNode(true));
		}
		return this;
	};
	// FIXME: Should support Dollar nodes as input.
	Dollar.prototype.prepend = function (h) {
		var i = 0, frag = document.createDocumentFragment(), div = document.createElement('div');
		div.innerHTML = h;
		while (div.firstChild) { frag.appendChild(div.firstChild); }
		for (i=0; i < this.a.length; i++) {
			this.a[i].insertBefore(frag.cloneNode(true), this.a[i].firstChild);
		}
		return this;
	};

	// CSS class manipulation
	// NOTE: We only allow a SINGLE class per call.
	if (typeof document !== "undefined" && !(document.createElement("a").hasOwnProperty('classList'))) {
		Dollar.prototype.addClass = function(c) {
			var i = 0;
			for (i=0; i < this.a.length; i++) {
				this.a[i].classList.add(c);
			}
			return this;
		};

		Dollar.prototype.removeClass = function(c) {
			var i = 0;
			for (i=0; i < this.a.length; i++) {
				this.a[i].classList.remove(c);
			}
			return this;
		};

		Dollar.prototype.toggleClass = function(c) {
			var i = 0;
			for (i=0; i < this.a.length; i++) {
				this.a[i].classList.toggle(c);
			}
			return this;
		};

		Dollar.prototype.hasClass = function(c) {
			var i = 0;
			for (i=0; i < this.a.length; i++) {
				if (this.a[i].classList.contains(c)) {
					return true;
				}
			}
			return false;
		};
	} else {
		Dollar.prototype.addClass = function(c) {
			var i = 0, classes;
			this.each(function () {
				classes = this.className.trim().split($.u.sp);
				for (i=0; i < classes.length; i++) {
					if (classes[i] === c) { return; }
				}
				this.className = this.className + ' ' + c;
			});
			return this;
		};

		Dollar.prototype.removeClass = function(c) {
			this.each(function () {
				var i = 0, changed = false, classes = this.className.trim().split($.u.sp);
				for (i=0; i < classes.length; i++) {
					if (classes[i] === c) {
						classes.splice(i, 1);
						changed = true;
					}
				}
				if (changed) {
					this.className = classes.join(" ");
				}
			});
			return this;
		};

		Dollar.prototype.toggleClass = function(c) {
			this.each(function () {
				var i = 0, removed = false, classes = this.className.trim().split($.u.sp);
				for (i=0; i < classes.length; i++) {
					if (classes[i] === c) {
						classes.splice(i, 1);
						removed = true;
					}
				}
				this.className = classes.join(" ") + (removed ? "" : " "+c);
			});
			return this;
		};

		Dollar.prototype.hasClass = function(c) {
			var i = 0, j = 0, classes;
			// Not using .each() to break loop ASAP.
			for (i=0; i < this.a.length; i++) {
				classes = this.className.trim().split($.u.sp);
				for (j=0; j < classes.length; j++) {
					if (classes[j] === c) { return true; }
				}
			}
			return false;
		};

	}

	// Only supports setting a SINGLE property at a time.
	Dollar.prototype.css = function(p,v) {
		var i = 0, cc = p.toLowerCase().replace($.u.msCC, "ms-").replace($.u.cssCC, $.u.fCC);
		if (typeof v === 'undefined') {
			return (this.a.length > 0 ? this.a[0].style[cc] : null);
		}
		for (i=0; i < this.a.length; i++) {
			this.a[i].style[cc] = v;
		}
		return this;
	};

	// Show, hide, toggle
	Dollar.prototype.show = function () {
		this.each(function () {
			var s = this.style;
			if (s.display === "none") {
				s.display = s._oldDisplay || "";
			}
		});
		return this;
	};
	Dollar.prototype.hide = function () {
		this.each(function () {
			var s = this.style;
			if (s.display !== "none") {
				s._oldDisplay = s.display;
				s.display = "none";
			}
		});
		return this;
	};
	Dollar.prototype.toggle = function () {
		this.each(function () {
			var s = this.style;
			if (s.display === "none") {
				s.display = s._oldDisplay || "";
			} else {
				s._oldDisplay = s.display;
				s.display = "none";
			}
		});
		return this;
	};

	// See: http://api.jquery.com/on/
	//
	// CAUTION: Most likely unlike jQuery, we don't stop at 't' when the 's'
	// argument is supplied.
	//
	// Example:
	// $('ul#menu').on('click', '.foo', ...);
	//
	// The above will bubble up PAST 'ul#menu' all the way up to 'html' and
	// thus cover the entire document.  Selectors here are meant for declaring
	// events before matching elements exist (i.e. in changing documents).
	// If your nodes already exist, select them directly and don't use the
	// bubbling selector, like:
	//
	// $('ul#menu a').on('click', ...);
	//
	Dollar.prototype.on = function (t, s, f) {
		var i = 0,
			handler = function(e) {
				var ev = e || window.event,
					target = ev.srcElement || ev.target;
				if (!s || s === "" || s === "*") {
					if (!f.apply(target,[ev])) { ev.preventDefault(); }
				} else {
					if ($.sel(target,s)) {
						if (!f.apply(target,[ev])) { ev.preventDefault(); }
					}
				}
			};

		if (typeof s === "function") {
			f = s;
			s = false;
		}

		if (document.addEventListener) {
			for (i=0; i < this.a.length; i++) {
				this.a[i].addEventListener(t, handler, false);
			}
		} else if (document.attachEvent) {
			for (i=0; i < this.a.length; i++) {
				this.a[i].attachEvent("on"+t, handler);
			}
		}

		return this;
	};

	// 

	window.$ = function (s,e) {
		if (!e) { e = document; }
		if ($.isNode(s)) {
			return new Dollar(s);
		}
		var d = new Dollar(e);
		return d.find(s);
	};

	// Let's piggyback some global internal utilities
	window.$.u = {
		sp: /\s+/,
		sm: /^([a-zA-Z0-9_\-]*)((#|\.)([a-zA-Z0-9_\-]+))?$/,
		SS: /\s|[<#.\[]/,
		msCC:  /^-ms-/,
		cssCC: /-([0-9a-z])/gi,
		fCC:   function (z,c) { return c.toUpperCase(); }
	};
	window.$.r = [];
	window.$.isNode = function (n) {
		// + 1 Element
		//   2 Attribute
		// ? 3 Text
		// ? 4 CDATA
		//   5 Entity Reference
		//   6 Entity
		//   7 Processing Instruction
		//   8 Comment
		// + 9 Document
		//  10 Document Type
		// +11 Document Fragment
		//  12 Notation
		return (
			n
			&& n.nodeType
			&& (
				n.nodeType === 1
				|| n.nodeType === 9
				|| n.nodeType === 11
				)
			);
	};

	// Does node match selector?
	window.$.sel = function(n, s) {
		var
			sels = s.trim().split($.u.sp).reverse(),
			sm = null,
			nc,
			ncf,
			i
		;
		while (sels.length > 0  &&  n && n.nodeType === 1) {
			if (!sm) { sm = sels[0].match($.u.sm); }
			if (sm[1] && sm[1] !== "") {
				if (n.nodeName.toUpperCase() !== sm[1].toUpperCase()) {
					n = n.parentNode;
					continue;
				}
			}
			if (sm[4]) {
				if (sm[3] === "#") {
					if (n.id !== sm[4]) {
						n = n.parentNode;
						continue;
					}
				} else {
					// Redundant with .hasClass() for sake of efficiency.
					if (n.hasOwnProperty('classList')) {
						if (!n.classList.contains(sm[4])) {
							n = n.parentNode;
							continue;
						}
					} else {
						nc = n.className ? n.className.trim().split($.u.sp) : [];
						ncf = false;
						for (i=0; i < nc.length; i++) {
							if (nc[i] === sm[4]) {
								ncf = true;
								break;
							}
						}
						if (!ncf) {
							n = n.parentNode;
							continue;
						}
					}
				}
			}
			n = n.parentNode;
			sels.shift();
			sm = null;
		}
		return (sels.length === 0);
	};

	// XMLHttpRequest a.k.a. AJAX
	//
	// Only supports the ({settings}) form, with a small subset of jQuery:
	// type         GET|POST (Optional. Default: GET)
	// url          The URL
	// headers      Object with key/value headers to add to request. (Optional.)
	// username     HTTP Auth username.  (Optional.)
	// password     HTTP Auth password.  (Optional.)
	// data         String (NO OBJECT SUPPORT) to send.  (Optional.)
	// dataType     Returned data: text|html|xml|json  (Optional. Default 'html')
	// contentType  (Optional. Default: 'application/x-www-form-urlencoded; charset=UTF-8')
	// error        f(XHR, status, error)  (Optional.)
	// success      f(data, status, XHR)   (Optional.)
	//
	// TODO: Sneak peek at jQuery's ifModified for Last-Modified/etag check.
	// Also saw that somewhere in RSS feed parsers for NodeJS.
	window.$.ajax = function (args) {

		// Sanitize arguments

		// error
		if (typeof args.error !== "function") {
			args.error = null;
		}

		// success
		if (typeof args.success !== "function") {
			args.success = null;
		}

		// type
		if (typeof args.type === "string") { args.type = args.type.toUpperCase(); }
		if (args.type !== "POST") { args.type = "GET"; }

		// url
		if (!args.url) {
			if (args.error) { args.error(null, "error", "No URL specified."); }
			return null;
		}

		// dataType
		if (args.dataType !== "text" && args.dataType !== "xml" && args.dataType !== "json") {
			args.dataType = "html";
		}

		// contentType
		if (typeof args.contentType !== "string") {
			args.contentType = "application/x-www-form-urlencoded; charset=UTF-8";
		}

		// username
		if (typeof args.username !== "string") {
			args.username = null;
		}

		// password
		if (typeof args.password !== "string") {
			args.password = null;
		}

		// Bail out in error if browser doesn't support XMLHttpRequest.
		if (!window.XMLHttpRequest) {
			if (args.error) { args.error(null, "error", "This browser doesn't provide XMLHttpRequest."); }
			return null;
		}

		var n, done = false, req = new XMLHttpRequest();
		req.open(args.type, args.url, true, args.username, args.password);
		req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		req.setRequestHeader("Content-Type", args.contentType);
		if (args.headers) {
			for (n in args.headers) {
				if (args.headers.hasOwnProperty(n)) {
					req.setRequestHeader(n, args.headers[n]);
				}
			}
		}
		if (typeof args.data === "string") {
			req.send(args.data);
		} else {
			req.send(null);
		}
		req.onreadystatechange = function () {
			var data = null, statusText = "";
			if ((req.readyState === 4) && (done === false)) {
				// Avoid some browsers firing twice
				done = true;
				try {
					statusText = req.statusText;
				} catch(e) {
					statusText = "";
				}
				if (req.status >= 200  &&  req.status < 300) {
					if (args.success) {
						if (args.dataType === "xml"  ||  args.dataType === "html") {
							data = req.responseXML;
						} else if (args.dataType === "json") {
							data = JSON.parse(req.responseText);
						} else {
							data = req.responseText;
						}
						args.success(data, statusText, req);
					}
				} else {
					if (args.error) {
						args.error(req, "error", statusText);
					}
				}
			}
			return true;
		};

		return null;
	};

	// Non-jQuery extensions
	window.$.node = function (type) { return document.createElement(type); };

}(window));
