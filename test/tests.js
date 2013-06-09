 // jQUnit defines:
 // asyncTest,deepEqual,equal,expect,module,notDeepEqual,notEqual,notStrictEqual,ok,QUnit,raises,start,stop,strictEqual,test

 /*globals asyncTest,equal,expect,module,ok,QUnit,start,test */

/**
 * Tools inspired by https://github.com/jquery/jquery-ui/blob/master/tests/unit/menu/
 */
function TestHelpers() {

	var lastItem = "",
		log = [],
		$ = jQuery;

	return {
		log: function( message, clear ) {
			if ( clear ) {
				log.length = 0;
			}
			if ( message === undefined ) {
				message = lastItem;
			}
//	        window.console.log(message);
			log.push( $.trim( message ) );
		},
		logOutput: function() {
			return log.join( "," );
		},
		clearLog: function() {
			log.length = 0;
		},
		entryEvent: function( menu, item, type ) {
			lastItem = item;
//			window.console.log(type + ": ", menu.children( ":eq(" + item + ")" ).find( "a:first" ).length);
			menu.children( ":eq(" + item + ")" ).find( "a:first" ).trigger( type );
		},
		click: function( menu, item ) {
			lastItem = item;
//			window.console.log("clck: ", menu.children( ":eq(" + item + ")" ).find( "a:first" ).length);
			menu.children( ":eq(" + item + ")" ).find( "a:first" ).trigger( "click" );
		},
		entry: function( menu, item ) {
			return menu.children( ":eq(" + item + ")" );
		}
	};
}

/** Create a profile wrapper */
/*
function profile(fn, flag, opts){
	if( flag === false ){
		return fn;
	}
	var start, elap,
		count = 0,
		level = 0,
		maxLevel = 0,
		name = fn.name,
		min =  Math.pow(2, 32) - 1,
		max = 0,
		sum = 0,
		printTime = opts.printTime !== false,
		wrapper = function(){
			count += 1;
			level += 1;
			if(printTime && level === 1){
				console.time(name);
			}

			start = new Date().getTime();
			fn.apply(this, arguments);
			elap = new Date().getTime() - start;

			min = Math.min(min, elap);
			max = Math.max(max, elap);
			maxLevel = Math.max(maxLevel, elap);
			sum += elap;
			if(printTime && level === 1){
				console.timeEnd(name);
			}
			level -= 1;
		};
	wrapper.stats = function(){
		return "count";
	};
	return wrapper;
}
*/


// ****************************************************************************

jQuery(document).ready(function(){

/*******************************************************************************
 * QUnit setup
 */
QUnit.log(function(data) {
	if (window.console && window.console.log) {
//        window.console.log(data.result + " :: " + data.message);
	}
});
QUnit.config.requireExpects = true;

var th = new TestHelpers(),
	log = th.log,
	logOutput = th.logOutput,
	click = th.click,
	entryEvent = th.entryEvent,
	entry = th.entry,
	lifecycle = {
		setup: function () {
			th.clearLog();
			// Always create a fresh copy of the menu <UL> definition
			$("#sampleMenuTemplate").clone().attr("id", "sampleMenu").appendTo("body");
		},
		teardown: function () {
			$(":moogle-contextmenu").contextmenu("destroy");
			$("#sampleMenu").remove();
		}
	},
	SAMPLE_MENU = [
		{title: "Cut", cmd: "cut", uiIcon: "ui-icon-scissors"},
		{title: "Copy", cmd: "copy", uiIcon: "ui-icon-copy"},
		{title: "Paste", cmd: "paste", uiIcon: "ui-icon-clipboard", disabled: true },
		{title: "----"},
		{title: "More", children: [
			{title: "Sub Item 1", cmd: "sub1"},
			{title: "Sub Item 2", cmd: "sub2"}
			]}
		],
	$ = jQuery;




//---------------------------------------------------------------------------

module("prototype", lifecycle);

test("globals", function(){
	expect(2);
	ok( !!$.moogle.contextmenu, "exists in ui namnespace");
	ok( !!$.moogle.contextmenu.version, "has version number");
});


// ---------------------------------------------------------------------------

module("create", lifecycle);

function _createTest(menu){
	var $ctx;

	expect(5);

	log( "constructor");
	$("#container").contextmenu({
		delegate: ".hasmenu",
		menu: menu,
		preventSelect: true,
		create: function(){
			log("create");
		},
		createMenu: function(){
			log("createMenu");
		}
	});
	log( "afterConstructor");
	$ctx = $(":moogle-contextmenu");
	equal( $ctx.length, 1, "widget created");
//    ok($("#sampleMenu").hasClass( "moogle-contextmenu" ), "Class set to menu definition");
	equal( $("head style.moogle-contextmenu-style").length, 1, "global stylesheet created");

	$ctx.contextmenu("destroy");

	equal( $(":moogle-contextmenu").length, 0, "widget destroyed");
//    ok( ! $("#sampleMenu").hasClass( "moogle-contextmenu" ), "Class removed from menu definition");
	equal( $("head style.moogle-contextmenu-style").length, 0, "global stylesheet removed");

	equal(logOutput(), "constructor,createMenu,create,afterConstructor",
		  "Event sequence OK." );
}

test("create from UL", function(){
	_createTest("ul#sampleMenu");
});


test("create from array", function(){
	_createTest(SAMPLE_MENU);
});


//---------------------------------------------------------------------------

module("open", lifecycle);

function _openTest(menu){
	var $ctx, $popup;

	expect(11);

	$("#container").contextmenu({
		delegate: ".hasmenu",
		menu: menu,
		beforeOpen: function(event, ui){
			log("beforeOpen");

			equal( event.type, "contextmenubeforeopen",
				   "beforeOpen: Got contextmenubeforeopen event" );
			equal( ui.target.text(), "AAA",
				  "beforeOpen: ui.target is set" );
			ok( $popup.is(":hidden"), "beforeOpen: Menu is hidden" );
			ok( ! entry($popup, 0).hasClass("ui-state-disabled"),
				"beforeOpen: Entry 0 is enabled" );
			ok( entry($popup, 2).hasClass("ui-state-disabled"),
				"beforeOpen: Entry 2 is disabled" );

			$("#container").contextmenu("enableEntry", "cut", false);

			ok( entry($popup, 0).hasClass("ui-state-disabled"),
				"beforeOpen: Entry 0 is disabled" );
		},
		open: function(event){
			log("open");

			ok( $popup.is(":visible"), "open: Menu is visible" );
			ok( entry($popup, 2).hasClass("ui-state-disabled"), "open: Entry is disabled" );

			equal(logOutput(), "open(),beforeOpen,after open(),open",
				  "Event sequence OK.");
			start();
		}
	});

	$ctx = $(":moogle-contextmenu");
	$popup = $ctx.contextmenu("getMenu");

	equal( $ctx.length, 1, "widget created");
	ok($popup.is(":hidden"), "Menu is hidden");
	log("open()");
	$ctx.contextmenu("open", $("span.hasmenu:first"));
	log("after open()");
}


asyncTest("UL menu", function(){
	_openTest("ul#sampleMenu");
});


asyncTest("Array menu", function(){
	_openTest(SAMPLE_MENU);
});


//---------------------------------------------------------------------------

module("click event sequence", lifecycle);

function _clickTest(menu){
	var $ctx, $popup;

	expect(3);

	$("#container").contextmenu({
		delegate: ".hasmenu",
		menu: menu,
//        show: false,
//        hide: false,
		beforeOpen: function(event, ui){
			log("beforeOpen(" + ui.target.text() + ")");
		},
		create: function(event, ui){
			log("create");
		},
		createMenu: function(event, ui){
			log("createMenu");
		},
		/*TODO: Seems that focus gets called twice in Safary, but nod PhantomJS */
//        focus: function(event, ui){
//            var t = ui.item ? $(ui.item).find("a:first").attr("href") : ui.item;
//            log("focus(" + t + ")");
////            equal( ui.cmd, "cut", "focus: ui.cmd is set" );
////            ok( !ui.target || ui.target.text() === "AAA", "focus: ui.target is set" );
//        },
//        /* blur seems always to have ui.item === null. Also called twice in Safari? */
//		blur: function(event, ui){
//		    var t = ui.item ? $(ui.item).find("a:first").attr("href") : ui.item;
//			log("blur(" + t + ")");
////            equal( ui.cmd, "cut", "blur: ui.cmd is set" );
////            equal( ui.target && ui.target.text(), "AAA", "blur: ui.target is set" );
//		},
		select: function(event, ui){
//			window.console.log("select");
			var t = ui.item ? $(ui.item).find("a:first").attr("href") : ui.item;
			log("select(" + t + ")");
			equal( ui.cmd, "cut", "select: ui.cmd is set" );
			equal( ui.target.text(), "AAA", "select: ui.target is set" );
		},
		open: function(event){
			log("open");
			setTimeout(function(){
				entryEvent($popup, 0, "mouseenter");
				click($popup, 0);
			}, 10);
		},
		close: function(event){
			log("close");
		}
	});

	$ctx = $(":moogle-contextmenu");
	$popup = $ctx.contextmenu("getMenu");

	log("open()");
	$ctx.contextmenu("open", $("span.hasmenu:first"));
	log("after open()");

	setTimeout(function(){
		// TODO: why is focus() called twice?
		equal(logOutput(), "createMenu,create,open(),beforeOpen(AAA),after open(),open,select(#cut),close",
				"Event sequence OK.");
		start();
	}, 500);
}


asyncTest("Array menu", function(){
	_clickTest(SAMPLE_MENU);
});


asyncTest("UL menu", function(){
	_clickTest("ul#sampleMenu");
});


});
