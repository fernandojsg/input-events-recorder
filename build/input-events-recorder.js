(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.InputEventsRecorder = {})));
}(this, (function (exports) { 'use strict';

  function computeNormalizedPos(element, evt) {
    var rect = element.getBoundingClientRect();
    var x = evt.clientX - rect.left;
    var y = evt.clientY - rect.top;
    x /= element.clientWidth;
    y /= element.clientHeight;
    return [x, y];
  }
  class InputRecorder {
    constructor(element, options) {
      this.element = element;
      this.clear();
      this.options = options || {};
    }
    enable(forceReset) {
      this.initTime = performance.now();
      if (forceReset) {
        this.clear();
      }
      this.injectListeners();
    }
    clear() {
      this.frameNumber = 0;
      this.events = [];
    }
    addEvent(type, event, parameters) {
      var eventData = {
        type,
        event,
        parameters
      };
      if (this.options.useTime) {
        eventData.time = performance.now() - this.initTime;
      } else {
        eventData.frameNumber = this.frameNumber;
      }
      this.events.push(eventData);
      if (this.options.newEventCallback) {
        this.options.newEventCallback(eventData);
      }
    }
    injectListeners() {
      this.element.addEventListener('mousedown', evt => {
        var pos = computeNormalizedPos(this.element, evt);
        this.addEvent('mouse', 'down', {
          x: pos[0],
          y: pos[1],
          button: evt.button
        });
      });
      this.element.addEventListener('mouseup', evt => {
        var pos = computeNormalizedPos(this.element, evt);
        this.addEvent('mouse', 'up', {
          x: pos[0],
          y: pos[1],
          button: evt.button
        });
      });
      this.element.addEventListener('mousemove', evt => {
        var pos = computeNormalizedPos(this.element, evt);
        this.addEvent('mouse', 'move', {
          x: pos[0],
          y: pos[1],
          button: evt.button
        });
      });
      this.element.addEventListener('wheel', evt => {
        this.addEvent('mouse', 'wheel', {
          deltaX: evt.deltaX,
          deltaY: evt.deltaY,
          deltaZ: evt.deltaZ,
          deltaMode: evt.deltaMode
        });
      });
      window.addEventListener('keydown', evt => {
        this.addEvent('key', 'down', {
          keyCode: evt.keyCode,
          charCode: evt.charCode,
          key: evt.key
        });
      });
      window.addEventListener('keyup', evt => {
        this.addEvent('key', 'up', {
          keyCode: evt.keyCode,
          charCode: evt.charCode,
          key: evt.key
        });
      });
    }
  }

  const DEFAULT_OPTIONS = {
    dispatchKeyEventsViaDOM: true,
    dispatchMouseEventsViaDOM: true,
    needsCompleteCustomMouseEventFields: false
  };
  class InputReplayer {
    constructor(element, recording, registeredEventListeners, options) {
      this.options = Object.assign({}, DEFAULT_OPTIONS, options);
      this.element = element;
      this.recording = recording;
      this.currentIndex = 0;
      this.registeredEventListeners = registeredEventListeners;
    }
    tick(frameNumber) {
      if (this.currentIndex >= this.recording.length) {
        return;
      }
      if (this.recording[this.currentIndex].frameNumber > frameNumber) {
        return;
      }
      while (this.currentIndex < this.recording.length && this.recording[this.currentIndex].frameNumber === frameNumber) {
        const input = this.recording[this.currentIndex];
        switch (input.type) {
          case 'mouse':
            {
              if (input.event === 'wheel') {
                this.simulateWheelEvent(this.element, input.parameters);
              } else {
                this.simulateMouseEvent(this.element, input.type + input.event, input.parameters);
              }
            }
            break;
          case 'key':
            {
              this.simulateKeyEvent(this.element, input.type + input.event, input.parameters);
            }
            break;
          default:
            {
              console.log('Still not implemented event', input.type);
            }
        }
        this.currentIndex++;
      }
    }
    simulateWheelEvent(element, parameters) {
      var e = new Event('mousewheel', {
        bubbles: true
      });
      const eventType = 'mousewheel';
      e.deltaX = parameters.deltaX;
      e.deltaY = parameters.deltaY;
      e.deltaZ = parameters.deltaZ;
      e.wheelDeltaX = parameters.deltaX;
      e.wheelDeltaY = parameters.deltaY;
      e.wheelDelta = parameters.deltaY;
      e.deltaMode = parameters.deltaMode;
      if (Array.isArray(this.registeredEventListeners) && this.options.dispatchMouseEventsViaDOM) {
        for (var i = 0; i < this.registeredEventListeners.length; i++) {
          var this_ = this.registeredEventListeners[i].context;
          var type = this.registeredEventListeners[i].type;
          var listener = this.registeredEventListeners[i].fun;
          if (type == eventType) {
            listener.call(this_, e);
          }
        }
      } else {
        element.dispatchEvent(e);
      }
    }
    simulateKeyEvent(element, eventType, parameters) {
      var e = document.createEventObject ? document.createEventObject() : document.createEvent("Events");
      if (e.initEvent) {
        e.initEvent(eventType, true, true);
      }
      e.keyCode = parameters.keyCode;
      e.which = parameters.keyCode;
      e.charCode = parameters.charCode;
      e.programmatic = true;
      e.key = parameters.key;
      if (Array.isArray(this.registeredEventListeners) && this.options.dispatchKeyEventsViaDOM) {
        for (var i = 0; i < this.registeredEventListeners.length; ++i) {
          var this_ = this.registeredEventListeners[i].context;
          var type = this.registeredEventListeners[i].type;
          var listener = this.registeredEventListeners[i].fun;
          if (type == eventType) listener.call(this_, e);
        }
      } else {
        element.dispatchEvent ? element.dispatchEvent(e) : element.fireEvent("on" + eventType, e);
      }
    }
    simulateMouseEvent(element, eventType, parameters) {
      var x = parameters.x;
      var y = parameters.y;
      x *= element.clientWidth;
      y *= element.clientHeight;
      var rect = element.getBoundingClientRect();
      x = Math.round(rect.left + x);
      y = Math.round(rect.top + y);
      var e = document.createEvent("MouseEvents");
      e.initMouseEvent(eventType, true, true, window, eventType == 'mousemove' ? 0 : 1, x, y, x, y, 0, 0, 0, 0, parameters.button, null);
      e.programmatic = true;
      if (Array.isArray(this.registeredEventListeners) && this.options.dispatchMouseEventsViaDOM) {
        if (element.clientWidth != element.offsetWidth || element.clientHeight != element.offsetHeight) {
          throw "ERROR! Canvas object must have 0px border for direct mouse dispatch to work!";
        }
        for (var i = 0; i < this.registeredEventListeners.length; i++) {
          var this_ = this.registeredEventListeners[i].context;
          var type = this.registeredEventListeners[i].type;
          var listener = this.registeredEventListeners[i].fun;
          if (type == eventType) {
            if (this.options.needsCompleteCustomMouseEventFields) {
              var evt = {
                currentTarget: this_,
                srcElement: this_,
                target: this_,
                fromElement: this_,
                toElement: this_,
                eventPhase: 2,
                buttons: eventType == 'mousedown' ? 1 : 0,
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
              listener.call(this_, e);
            }
          }
        }
      } else {
        element.dispatchEvent(e);
      }
    }
  }

  exports.InputRecorder = InputRecorder;
  exports.InputReplayer = InputReplayer;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
