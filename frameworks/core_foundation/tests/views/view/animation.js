// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
// ========================================================================
// View Animation Unit Tests
// ========================================================================
/*global module, test, ok, equals, stop, start, expect*/


/* These unit tests verify:  animate(). */
var view, pane, originalSupportsTransitions = SC.platform.supportsCSSTransitions;

function styleFor(view) {
  return view.get('layer').style;
}

function transitionFor(view) {
  return styleFor(view)[SC.browser.experimentalStyleNameFor('transition')];
}

var commonSetup = {
  setup: function (wantsAcceleratedLayer) {

    SC.run(function () {
      pane = SC.Pane.create({
        backgroundColor: '#ccc',
        layout: { top: 0, right: 0, width: 200, height: 200, zIndex: 100 }
      });
      pane.append();

      view = SC.View.create({
        backgroundColor: '#888',
        layout: { left: 0, top: 0, height: 100, width: 100 },
        wantsAcceleratedLayer: wantsAcceleratedLayer || NO
      });
      pane.appendChild(view);
    });
  },

  teardown: function () {
    pane.remove();
  }
};

if (SC.platform.supportsCSSTransitions) {

  module("ANIMATION", commonSetup);

  test("should work", function () {
    stop(2000);
    SC.RunLoop.begin();
    view.animate('left', 100, { duration: 1 });
    SC.RunLoop.end();

    setTimeout(function () {
      equals(transitionFor(view), 'left 1s ease 0s', 'add transition');
      equals(100, view.get('layout').left, 'left is 100');

      start();
    }, 5);
  });


  test("should accept shorthand notation", function () {
    stop(2000);
    SC.RunLoop.begin();
    view.animate('left', 100, 1);
    SC.RunLoop.end();

    setTimeout(function () {
      equals(transitionFor(view), 'left 1s ease 0s', 'add transition');

      start();
    }, 5);
  });

  test("callbacks work in general", function () {
    stop(2000);

    SC.run(function () {
      view.animate('left', 100, 0.500, function () {
        ok(true, "Callback was called.");
        equals(view, this, "`this` should be the view");

        start();
      });
    });
  });

  test("callbacks work in general with target method", function () {
    stop(2000);

    var ob = SC.Object.create({
      callback: function () {
        ok(true, "Callback was called.");
        equals(ob, this, "`this` should be the target object");

        start();
      }
    });

    SC.run(function () {
      view.animate('left', 100, 0.500, ob, 'callback');
    });
  });

  test("callbacks should have appropriate data", function () {
    stop(2000);

    SC.RunLoop.begin();
    view.animate('left', 100, 0.500, function (data) {
      // TODO: Test this better
      ok(data.event, "has event");
      equals(data.view, view, "view is correct");
      equals(data.isCancelled, false, "animation is not cancelled");

      start();
    });
    SC.RunLoop.end();
  });

  test("handles delay function string", function () {
    stop(2000);

    SC.RunLoop.begin();
    view.animate('left', 100, { duration: 1, delay: 1 });
    SC.RunLoop.end();

    setTimeout(function () {
      equals(transitionFor(view), 'left 1s ease 1s', 'uses delay');

      start();
    }, 5);
  });

  test("handles timing function string", function () {
    stop(2000);

    SC.RunLoop.begin();
    view.animate('left', 100, { duration: 1, timing: 'ease-in' });
    SC.RunLoop.end();

    setTimeout(function () {
      equals(transitionFor(view), 'left 1s ease-in 0s', 'uses ease-in timing');

      start();
    }, 5);
  });

  test("handles timing function array", function () {
    stop(2000);

    SC.RunLoop.begin();
    view.animate('left', 100, { duration: 1, timing: [0.1, 0.2, 0.3, 0.4] });
    SC.RunLoop.end();

    setTimeout(function () {
      equals(transitionFor(view), 'left 1s cubic-bezier(0.1, 0.2, 0.3, 0.4) 0s', 'uses cubic-bezier timing');

      start();
    }, 5);
  });

  test("should allow multiple keys to be set at once", function () {
    stop(2000);

    SC.RunLoop.begin();
    view.animate({ top: 100, left: 100 }, 1);
    SC.RunLoop.end();

    setTimeout(function () {
      equals(transitionFor(view), 'top 1s ease 0s, left 1s ease 0s', 'should add transition');
      equals(100, view.get('layout').top, 'top is 100');
      equals(100, view.get('layout').left, 'left is 100');

      start();
    }, 5);
  });

  // Pretty sure this does the job
  test("callbacks should be called only once for a grouped animation", function () {
    stop(2000);
    var stopped = true;

    expect(1);

    SC.run(function () {
      view.animate({ top: 100, left: 100, width: 400 }, 0.50, function () {
        ok(stopped, 'callback called back');
        if (stopped) {
          stopped = false;
          // Continue on in a short moment.  Before the test times out, but after
          // enough time for a second callback to possibly come in.
          setTimeout(function () {
            start();
          }, 200);
        }
      });
    });
  });

  // This behavior should be up for debate.  Does the callback call immediately, or does it wait until the end of
  // the specified animation period?  Currently we're calling it immediately.
  test("callback should be called immediately when a property is animated to its current value.", function () {
    stop(2000);

    expect(1);

    SC.run(function () {
      view.animate('top', view.getPath('layout.top'), 0.50, function () {
        ok(true, 'callback called back');

        start();
      });
    });
  });

  test("callback should be called when a property is animated with a duration of zero.", function () {
    stop(2000);

    expect(1);

    SC.RunLoop.begin();
    view.animate('top', 20, 0, function () {
      ok(true, 'callback called back');
      start();
    });
    SC.RunLoop.end();
  });

  test("multiple animations should be able to run simultaneously", function () {
    stop(2000);

    expect(2);

    SC.run(function () {
      view.animate('top', 100, 0.250, function () {
        ok(true, 'top finished');
      });

      view.animate('left', 100, 0.500, function () {
        ok(true, 'left finished');
        start();
      });
    });
  });

  test("altering existing animation should call callback as cancelled", function () {
    stop(2000);

    var order = 0;
    expect(6);

    SC.run(function () {
      view.animate('top', 100, 0.500, function (data) {
        // Test the order to ensure that this is the proper callback that is used.
        equals(order, 0, 'should be called first');
        order = 1;
        equals(data.isCancelled, true, 'first cancelled');
      });

      // Test calling animate twice in the same run loop.
      view.animate('top', 100, 0.750, function (data) {
        // Test the order to ensure that this is the proper callback that is used.
        equals(order, 1, 'should be called second');
        order = 2;
        equals(data.isCancelled, true, 'second cancelled');
      });
    });

    setTimeout(function () {
      SC.run(function () {
        view.animate('top', 0, 0.750, function (data) {
          // Test the order to ensure that this is the proper callback that is used.
          equals(order, 2, 'should be called third');
          equals(data.isCancelled, false, 'third not cancelled');
          start();
        });
      });
    }, 100);
  });

  test("should not cancel callback when value hasn't changed", function () {
    var callbacks = 0, wasCancelled = NO, check = 0;
    stop(2000);

    SC.RunLoop.begin();
    // this triggers the initial layoutStyle code
    view.animate('left', 79, 0.500, function (data) {
      callbacks++;
      wasCancelled = data.isCancelled;
    });
    // this triggers a re-render, re-running the layoutStyle code
    view.displayDidChange();
    SC.RunLoop.end();

    setTimeout(function () {
      // capture the callbacks value
      check = callbacks;
    }, 250);

    setTimeout(function () {
      equals(check, 0, "the callback should not have been cancelled initially");
      equals(callbacks, 1, "the callback should have been fired");
      equals(wasCancelled, NO, "the callback should not have been cancelled");

      start();
    }, 1000);
  });

  // There was a bug in animation that once one property was animated, a null
  // version of it existed in _activeAnimations, such that when another property
  // was animated it would throw an exception iterating through _activeAnimations
  // and not expecting a null value.
  test("animating different attributes at different times should not throw an error", function () {
    // Run test.
    stop(2000);

    expect(0);

    // Override and wrap the problematic method to capture the error.
    view.layoutStyleCalculator.transitionDidEnd = function () {
      try {
        SC.View.LayoutStyleCalculator.prototype.transitionDidEnd.apply(this, arguments);
        ok(true);
      } catch (ex) {
        ok(false);
      }
    };

    SC.RunLoop.begin();
    view.animate('left', 75, 0.2);
    SC.RunLoop.end();

    setTimeout(function () {
      SC.RunLoop.begin();
      view.animate('top', 50, 0.2);
      SC.RunLoop.end();
    }, 400);

    setTimeout(function () {
      start();
    }, 1000);
  });

  test("should handle transform attributes", function () {
    stop(2000);

    SC.run(function () {
      view.animate('rotateX', 45, { duration: 1 });
    });

    setTimeout(function () {
      equals(transitionFor(view), SC.browser.experimentalCSSNameFor('transform') + ' 1s ease 0s', 'add transition');
      equals(styleFor(view)[SC.browser.experimentalStyleNameFor('transform')], 'rotateX(45deg)', 'has both transforms');
      equals(45, view.get('layout').rotateX, 'rotateX is 45deg');

      start();
    }, 50);
  });

  test("should handle conflicting transform animations", function () {
    /*global console*/
    stop(2000);

    var originalConsoleWarn = console.warn;
    console.warn = function (warning) {
      equals(warning, "Developer Warning: Can't animate transforms with different durations! Using first duration specified.", "proper warning");
    };

    SC.RunLoop.begin();
    view.animate('rotateX', 45, 1).animate('scale', 2, 2);
    SC.RunLoop.end();

    setTimeout(function () {
      expect(5);

      equals(transitionFor(view), SC.browser.experimentalCSSNameFor('transform') + ' 1s ease 0s', 'use duration of first');
      equals(styleFor(view)[SC.browser.experimentalStyleNameFor('transform')], 'rotateX(45deg) scale(2)');
      equals(45, view.get('layout').rotateX, 'rotateX is 45deg');
      equals(2, view.get('layout').scale, 'scale is 2');

      console.warn = originalConsoleWarn;

      start();
    }, 5);
  });

  test("removes animation property when done", function () {
    stop(2000);

    SC.RunLoop.begin();
    view.animate({ top: 100, scale: 2 }, 0.500);
    SC.RunLoop.end();

    setTimeout(function () {
      equals(view.get('layout').animateTop, undefined, "animateTop is undefined");
      equals(view.get('layout').animateScale, undefined, "animateScale is undefined");

      start();
    }, 1000);
  });

  test("Test that cancelAnimation() removes the animation style and fires the callback with isCancelled set.", function () {
    stop(2000);

    expect(7);

    SC.run(function () {
      view.animate({ left: 100 }, 0.500, function (data) {
        ok(data.isCancelled, "The isCancelled property of the data should be true.");
      });
    });

    setTimeout(function () {
      SC.run(function () {
        var style = styleFor(view);

        equals(style.left, '100px', 'Tests the left style after animate');
        equals(style.top, '0px', 'Tests the top style after animate');
        equals(transitionFor(view), 'left 0.5s ease 0s', 'Tests the CSS transition property');
        view.cancelAnimation();
      });
    }, 5);

    setTimeout(function () {
      var style = styleFor(view);

      equals(style.left, '100px', 'Tests the left style after cancel');
      equals(style.top, '0px', 'Tests the top style after cancel');
      equals(transitionFor(view), '', 'Tests the CSS transition property');
      start();
    }, 50);
  });

  test("Test that cancelAnimation(SC.ANIMATION_POSITION.current) removes the animation style, stops at the current position and fires the callback with isCancelled set.", function () {
    stop(2000);

    expect(9);

    SC.run(function () {
      view.animate({ left: 100, top: 100, width: 400 }, 0.500, function (data) {
        ok(data.isCancelled, "The isCancelled property of the data should be true.");
      });
    });

    setTimeout(function () {
      SC.run(function () {
        var style = styleFor(view);

        equals(style.left, '100px', 'Tests the left style after animate');
        equals(style.top, '100px', 'Tests the top style after animate');
        equals(style.width, '400px', 'Tests the width style after animate');
        equals(transitionFor(view), 'left 0.5s ease 0s, top 0.5s ease 0s, width 0.5s ease 0s', 'Tests the CSS transition property');
        view.cancelAnimation(SC.ANIMATION_POSITION.current);
      });
    }, 100);

    setTimeout(function () {
      var style = styleFor(view);

      ok((parseInt(style.left, 10) > 0) && (parseInt(style.left, 10) < 100), 'Tests the left style after cancel');
      ok((parseInt(style.top, 10) > 0) && (parseInt(style.top, 10) < 100), 'Tests the top style after cancel');
      ok((parseInt(style.width, 10) > 100) && (parseInt(style.width, 10) < 400), 'Tests the width style after cancel');
      equals(transitionFor(view), '', 'Tests the CSS transition property');
      start();
    }, 200);
  });

  if (SC.platform.supportsCSS3DTransforms) {
    module("ANIMATION WITH ACCELERATED LAYER", {
      setup: function () {
        commonSetup.setup(YES);
      },

      teardown: commonSetup.teardown
    });

    test("handles acceleration when appropriate", function () {
      stop(2000);

      SC.RunLoop.begin();
      view.animate('top', 100, 1);
      SC.RunLoop.end();

      setTimeout(function () {
        equals(transitionFor(view), SC.browser.experimentalCSSNameFor('transform') + ' 1s ease 0s', 'transition is on transform');

        start();
      }, 5);
    });

    test("doesn't use acceleration when not appropriate", function () {
      stop(2000);

      SC.RunLoop.begin();
      view.adjust({ height: null, bottom: 0 });
      view.animate('top', 100, 1);
      SC.RunLoop.end();

      setTimeout(function () {
        equals(transitionFor(view), 'top 1s ease 0s', 'transition is not on transform');

        start();
      }, 5);
    });

    test("combines accelerated layer animation with compatible transform animations", function () {
      stop(2000);

      SC.RunLoop.begin();
      view.animate('top', 100, 1).animate('rotateX', 45, 1);
      SC.RunLoop.end();

      setTimeout(function () {
        var transform = styleFor(view)[SC.browser.experimentalStyleNameFor('transform')];

        // We need to check these separately because in some cases we'll also have translateZ, this way we don't have to worry about it
        ok(transform.match(/translateX\(0px\) translateY\(100px\)/), 'has translate');
        ok(transform.match(/rotateX\(45deg\)/), 'has rotateX');

        start();
      }, 5);
    });

    test("should not use accelerated layer if other transforms are being animated at different speeds", function () {
      stop(2000);

      SC.RunLoop.begin();
      view.animate('rotateX', 45, 2).animate('top', 100, 1);
      SC.RunLoop.end();

      setTimeout(function () {
        var style = styleFor(view);

        equals(style[SC.browser.experimentalStyleNameFor('transform')], 'rotateX(45deg)', 'transform should only have rotateX');
        equals(style.top, '100px', 'should not accelerate top');

        start();
      }, 5);
    });

    test("callbacks should work properly with acceleration", function () {
      stop(2000);

      SC.RunLoop.begin();
      view.animate({ top: 100, left: 100, scale: 2 }, 0.25, function () {
        ok(true);

        start();
      });
      SC.RunLoop.end();
    });

    test("should not add animation for properties that have the same value as existing layout", function () {
      var callbacks = 0;

      SC.RunLoop.begin();
      // we set width to the same value, but we change height
      view.animate({width: 100, height: 50}, 0.5, function () { callbacks++; });
      SC.RunLoop.end();

      ok(callbacks === 0, "precond - callback should not have been run yet");

      stop(2000);

      // we need to test changing the width at a later time
      setTimeout(function () {
        start();

        equals(callbacks, 1, "callback should have been run once, for height change");

        SC.RunLoop.begin();
        view.animate('width', 50, 0.5);
        SC.RunLoop.end();

        equals(callbacks, 1, "callback should still have only been called once, even though width has now been animated");
      }, 1000);
    });

    test("Test that cancelAnimation() removes the animation style and fires the callback with isCancelled set.", function () {
      stop(2000);

      SC.run(function () {
        view.animate({ left: 100, top: 100, width: 400 }, 0.500, function (data) {
          ok(data.isCancelled, "The isCancelled property of the data should be true.");
        });
      });

      setTimeout(function () {
        SC.run(function () {
          var style = styleFor(view),
          transform = style[SC.browser.experimentalStyleNameFor('transform')];
          transform = transform.match(/\d+/g);

          // We need to check these separately because in some cases we'll also have translateZ, this way we don't have to worry about it
          equals(transform[0], '100',  "Test translateX after animate.");
          equals(transform[1], '100',  "Test translateY after animate.");

          equals(transitionFor(view), SC.browser.experimentalCSSNameFor('transform') + ' 0.5s ease 0s, width 0.5s ease 0s', 'Tests the CSS transition property');

          equals(style.left, '0px', 'Tests the left style after animate');
          equals(style.top, '0px', 'Tests the top style after animate');
          equals(style.width, '400px', 'Tests the width style after animate');

          view.cancelAnimation();
        });
      }, 250);

      setTimeout(function () {
        var style = styleFor(view);
        equals(style.left, '100px', 'Tests the left style after cancel');
        equals(style.top, '100px', 'Tests the top style after cancel');
        equals(style.width, '400px', 'Tests the width style after cancel');

        var transform = style[SC.browser.experimentalStyleNameFor('transform')];
        equals(transform, '', "Tests that there is no transform on the element after cancel.");
        equals(transitionFor(view), '', 'Tests that there is no CSS transition property after cancel');

        start();
      }, 350);
    });

    test("Test that cancelAnimation(SC.ANIMATION_POSITION.current) removes the animation style, stops at the current position and fires the callback with isCancelled set.", function () {
      stop(2000);


      SC.run(function () {
        view.animate({ left: 100, top: 100, width: 400 }, 0.5, function (data) {
          ok(data.isCancelled, "The isCancelled property of the data should be true.");
        });
      });

      setTimeout(function () {
        SC.run(function () {
          var style = styleFor(view),
          transform = style[SC.browser.experimentalStyleNameFor('transform')];
          transform = transform.match(/\d+/g);

          // We need to check these separately because in some cases we'll also have translateZ, this way we don't have to worry about it
          equals(transform[0], '100',  "Test translateX after animate.");
          equals(transform[1], '100',  "Test translateY after animate.");
          equals(transitionFor(view), SC.browser.experimentalCSSNameFor('transform') + ' 0.5s ease 0s, width 0.5s ease 0s', 'Tests the CSS transition property');

          equals(style.left, '0px', 'Tests the left style after animate');
          equals(style.top, '0px', 'Tests the top style after animate');
          equals(style.width, '400px', 'Tests the width style after animate');

          view.cancelAnimation(SC.ANIMATION_POSITION.current);
        });
      }, 250);

      setTimeout(function () {
        var style = styleFor(view);

        var transform = style[SC.browser.experimentalStyleNameFor('transform')];
        equals(transform, '', "Tests that there is no transform on the element after cancel.");
        equals(transitionFor(view), '', 'Tests that there is no CSS transition property after cancel');

        ok((parseInt(style.left, 10) > 0) && (parseInt(style.left, 10) < 100), 'Tests the left style, %@, after cancel is greater than 0 and less than 100'.fmt(style.left));
        ok((parseInt(style.top, 10) > 0) && (parseInt(style.top, 10) < 100), 'Tests the top style, %@, after cancel is greater than 0 and less than 100'.fmt(style.top));
        ok((parseInt(style.width, 10) > 100) && (parseInt(style.width, 10) < 400), 'Tests the width style, %@, after cancel is greater than 0 and less than 100'.fmt(style.width));
        start();
      }, 350);
    });

    test("Test that cancelAnimation(SC.ANIMATION_POSITION.original) removes the animation style, goes back to the original position and fires the callback with isCancelled set.", function () {
      stop(2000);

      // expect(12);

      SC.run(function () {
        view.animate({ left: 100, top: 100, width: 400 }, 0.500, function (data) {
          ok(data.isCancelled, "The isCancelled property of the data should be true.");
        });
      });

      setTimeout(function () {
        SC.run(function () {
          var style = styleFor(view),
          transform = style[SC.browser.experimentalStyleNameFor('transform')];
          equals(style.left, '0px', 'Tests the left style after animate');
          equals(style.top, '0px', 'Tests the top style after animate');
          equals(style.width, '400px', 'Tests the width style after animate');

          transform = transform.match(/\d+/g);

          // We need to check these separately because in some cases we'll also have translateZ, this way we don't have to worry about it
          equals(transform[0], '100',  "Test translateX after animate.");
          equals(transform[1], '100',  "Test translateY after animate.");

          equals(transitionFor(view), SC.browser.experimentalCSSNameFor('transform') + ' 0.5s ease 0s, width 0.5s ease 0s', 'Tests the CSS transition property');
          view.cancelAnimation(SC.ANIMATION_POSITION.original);
        });
      }, 250);

      setTimeout(function () {
        var style = styleFor(view);

        var transform = style[SC.browser.experimentalStyleNameFor('transform')];
        equals(transform, '', "Tests that there is no transform on the element after cancel.");
        equals(transitionFor(view), '', 'Tests that there is no CSS transition property after cancel');

        equals(style.left, '0px', 'Tests the left style after cancel');
        equals(style.top, '0px', 'Tests the top style after cancel');
        equals(style.width, '100px', 'Tests the width style after cancel');
        start();
      }, 350);
    });
  } else {
    test("This platform appears to not support CSS 3D transforms.");
  }
} else {
  test("This platform appears to not support CSS transitions.");
}

module("ANIMATION WITHOUT TRANSITIONS", {
  setup: function () {
    commonSetup.setup();
    SC.platform.supportsCSSTransitions = NO;
  },

  teardown: function () {
    commonSetup.teardown();
    SC.platform.supportsCSSTransitions = originalSupportsTransitions;
  }
});

test("should update layout", function () {
  stop(2000);
  SC.RunLoop.begin();
  view.animate('left', 100, 1);
  SC.RunLoop.end();

  setTimeout(function () {
    equals(view.get('layout').left, 100, 'left is 100');
    start();
  }, 5);
});

test("should still run callback", function () {
  stop(2000);

  expect(1);

  SC.RunLoop.begin();
  view.animate({ top: 200, left: 100 }, 1, function () {
    ok(true, "callback called");
    start();
  });
  SC.RunLoop.end();
});
