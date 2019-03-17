
const DEFAULT_OPTIONS = {
  dispatchKeyEventsViaDOM: true,
  dispatchMouseEventsViaDOM: true,
  needsCompleteCustomMouseEventFields: false
};


export class InputReplayer {
  constructor(element, recording, registeredEventListeners, options) {
    this.options = Object.assign({}, DEFAULT_OPTIONS, options);
    this.element = element;
    this.recording = recording;
    this.currentIndex = 0;
    this.registeredEventListeners = registeredEventListeners; // If === null -> Dispatch to DOM
  }

  tick (frameNumber) {
    if (this.currentIndex >= this.recording.length) {
      return;
    }

    if (this.recording[this.currentIndex].frameNumber > frameNumber) {
      return;
    }

    while (this.currentIndex < this.recording.length && this.recording[this.currentIndex].frameNumber === frameNumber) {
      const input = this.recording[this.currentIndex];
      switch (input.type) {
        case 'mouse': {
          if (input.event === 'wheel') {
            this.simulateWheelEvent(this.element, input.parameters);
          } else {
            this.simulateMouseEvent(this.element, input.type + input.event, input.parameters);
          }
        } break;
        case 'key': {
          this.simulateKeyEvent(this.element, input.type + input.event, input.parameters);
        } break;
        default: {
          console.log('Still not implemented event', input.type);
        }
      }
      this.currentIndex++;
    }
  }

  simulateWheelEvent(element, parameters) {
    var e = new Event('mousewheel', {bubbles: true});

    const eventType = 'mousewheel';
    e.deltaX = parameters.deltaX;
    e.deltaY = parameters.deltaY;
    e.deltaZ = parameters.deltaZ;

    e.wheelDeltaX = parameters.deltaX;
    e.wheelDeltaY = parameters.deltaY;
    e.wheelDelta = parameters.deltaY;

    e.deltaMode = parameters.deltaMode;
    if (Array.isArray(this.registeredEventListeners) && this.options.dispatchMouseEventsViaDOM) {
      for(var i = 0; i < this.registeredEventListeners.length; i++) {
        var this_ = this.registeredEventListeners[i].context;
        var type = this.registeredEventListeners[i].type;
        var listener = this.registeredEventListeners[i].fun;
        if (type == eventType) {
          listener.call(this_, e);
        }
      }
    }
    else {
      element.dispatchEvent(e);
    }
  }

  simulateKeyEvent(element, eventType, parameters) {
    // Don't use the KeyboardEvent object because of http://stackoverflow.com/questions/8942678/keyboardevent-in-chrome-keycode-is-0/12522752#12522752
    // See also http://output.jsbin.com/awenaq/3
    //    var e = document.createEvent('KeyboardEvent');
    //    if (e.initKeyEvent) {
    //      e.initKeyEvent(eventType, true, true, window, false, false, false, false, keyCode, charCode);
    //  } else {
    var e = document.createEventObject ? document.createEventObject() : document.createEvent("Events");
    if (e.initEvent) {
      e.initEvent(eventType, true, true);
    }

    e.keyCode = parameters.keyCode;
    e.which = parameters.keyCode;
    e.charCode = parameters.charCode;
    e.programmatic = true;
    e.key = parameters.key;

    // Dispatch directly to Emscripten's html5.h API:
    if (Array.isArray(this.registeredEventListeners) && this.options.dispatchKeyEventsViaDOM) {
      for(var i = 0; i < this.registeredEventListeners.length; ++i) {
        var this_ = this.registeredEventListeners[i].context;
        var type = this.registeredEventListeners[i].type;
        var listener = this.registeredEventListeners[i].fun;
        if (type == eventType) listener.call(this_, e);
      }
    } else {
      // Dispatch to browser for real
      element.dispatchEvent ? element.dispatchEvent(e) : element.fireEvent("on" + eventType, e);
    }
  }

  // eventType: "mousemove", "mousedown" or "mouseup".
  // x and y: Normalized coordinate in the range [0,1] where to inject the event.
  simulateMouseEvent(element, eventType, parameters) {
    // Remap from [0,1] to canvas CSS pixel size.
    var x = parameters.x;
    var y = parameters.y;

    x *= element.clientWidth;
    y *= element.clientHeight;
    var rect = element.getBoundingClientRect();

    // Offset the injected coordinate from top-left of the client area to the top-left of the canvas.
    x = Math.round(rect.left + x);
    y = Math.round(rect.top + y);
    var e = document.createEvent("MouseEvents");
    e.initMouseEvent(eventType, true, true, window,
                    eventType == 'mousemove' ? 0 : 1, x, y, x, y,
                    0, 0, 0, 0,
                    parameters.button, null);
    e.programmatic = true;

    if (Array.isArray(this.registeredEventListeners) && this.options.dispatchMouseEventsViaDOM) {
      // Programmatically reating DOM events doesn't allow specifying offsetX & offsetY properly
      // for the element, but they must be the same as clientX & clientY. Therefore we can't have a
      // border that would make these different.
      if (element.clientWidth != element.offsetWidth
        || element.clientHeight != element.offsetHeight) {
        throw "ERROR! Canvas object must have 0px border for direct mouse dispatch to work!";
      }
      for(var i = 0; i < this.registeredEventListeners.length; i++) {
        var this_ = this.registeredEventListeners[i].context;
        var type = this.registeredEventListeners[i].type;
        var listener = this.registeredEventListeners[i].fun;
        if (type == eventType) {
          if (this.options.needsCompleteCustomMouseEventFields) {
            // If needsCompleteCustomMouseEventFields is set, the page needs a full set of attributes
            // specified in the MouseEvent object. However most fields on MouseEvent are read-only, so create
            // a new custom object (without prototype chain) to hold the overridden properties.
            var evt = {
              currentTarget: this_,
              srcElement: this_,
              target: this_,
              fromElement: this_,
              toElement: this_,
              eventPhase: 2, // Event.AT_TARGET
              buttons: (eventType == 'mousedown') ? 1 : 0,
              button: e.button,
              altKey: e.altKey,
              bubbles: e.bubbles,
              cancelBubble: e.cancelBubble,
              cancelable: e.cancelable,
              clientX: e.clientX,
              clientY: e.clientY,
              ctrlKey: e.ctrlKey,
              defaultPrevented: e.defaultPrevented,
              detail: e.detail,
              identifier: e.identifier,
              isTrusted: e.isTrusted,
              layerX: e.layerX,
              layerY: e.layerY,
              metaKey: e.metaKey,
              movementX: e.movementX,
              movementY: e.movementY,
              offsetX: e.offsetX,
              offsetY: e.offsetY,
              pageX: e.pageX,
              pageY: e.pageY,
              path: e.path,
              relatedTarget: e.relatedTarget,
              returnValue: e.returnValue,
              screenX: e.screenX,
              screenY: e.screenY,
              shiftKey: e.shiftKey,
              sourceCapabilities: e.sourceCapabilities,
              timeStamp: performance.now(),
              type: e.type,
              view: e.view,
              which: e.which,
              x: e.x,
              y: e.y
            };
            listener.call(this_, evt);
          } else {
            // The regular 'e' object is enough (it doesn't populate all of the same fields than a real mouse event does, 
            // so this might not work on some demos)
            listener.call(this_, e);
          }
        }
      }
    } else {
      // Dispatch directly to browser
      element.dispatchEvent(e);
    }
  }
}
