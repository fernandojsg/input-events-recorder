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
      this.options = options;
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
      this.element.addEventListener("mousedown", evt => {
        var pos = computeNormalizedPos(this.element, evt);
        this.addEvent('mouse', 'down', {
          x: pos[0],
          y: pos[1],
          button: evt.button
        });
      });
      this.element.addEventListener("mouseup", evt => {
        var pos = computeNormalizedPos(this.element, evt);
        this.addEvent('mouse', 'up', {
          x: pos[0],
          y: pos[1],
          button: evt.button
        });
      });
      this.element.addEventListener("mousemove", evt => {
        var pos = computeNormalizedPos(this.element, evt);
        this.addEvent('mouse', 'move', {
          x: pos[0],
          y: pos[1],
          button: evt.button
        });
      });
      this.element.addEventListener("wheel", evt => {
        this.addEvent('mouse', 'wheel', {
          deltaX: evt.deltaX,
          deltaY: evt.deltaY,
          deltaZ: evt.deltaZ,
          deltaMode: evt.deltaMode
        });
      });
      window.addEventListener("keydown", evt => {
        this.addEvent('key', 'down', {
          keyCode: evt.keyCode,
          charCode: evt.charCode,
          key: evt.key
        });
      });
      window.addEventListener("keyup", evt => {
        this.addEvent('key', 'up', {
          keyCode: evt.keyCode,
          charCode: evt.charCode,
          key: evt.key
        });
      });
    }
  }

  function simulateKeyEvent(element, eventType, parameters) {
    var e = document.createEventObject ? document.createEventObject() : document.createEvent("Events");
    if (e.initEvent) {
      e.initEvent(eventType, true, true);
    }
    e.keyCode = parameters.keyCode;
    e.which = parameters.keyCode;
    e.charCode = parameters.charCode;
    e.programmatic = true;
    e.key = parameters.key;
    {
      element.dispatchEvent ? element.dispatchEvent(e) : element.fireEvent("on" + eventType, e);
    }
  }
  function simulateMouseEvent(element, eventType, parameters) {
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
    {
      element.dispatchEvent(e);
    }
  }
  class InputReplayer {
    constructor(element) {
      this.element = element;
      this.recording = recording2;
      this.currentIndex = 0;
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
              simulateMouseEvent(this.element, input.type + input.event, input.parameters);
            }
            break;
          case 'key':
            {
              simulateKeyEvent(this.element, input.type + input.event, input.parameters);
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
  }

  exports.InputRecorder = InputRecorder;
  exports.InputReplayer = InputReplayer;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXQtZXZlbnRzLXJlY29yZGVyLmpzIiwic291cmNlcyI6WyIuLi9zcmMvcmVjb3JkZXIuanMiLCIuLi9zcmMvcmVwbGF5ZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gTWFwcyBtb3VzZSBjb29yZGluYXRlIGZyb20gZWxlbWVudCBDU1MgcGl4ZWxzIHRvIG5vcm1hbGl6ZWQgWyAwLCAxIF0gcmFuZ2UuXG5mdW5jdGlvbiBjb21wdXRlTm9ybWFsaXplZFBvcyhlbGVtZW50LCBldnQpIHtcbiAgdmFyIHJlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICB2YXIgeCA9IGV2dC5jbGllbnRYIC0gcmVjdC5sZWZ0O1xuICB2YXIgeSA9IGV2dC5jbGllbnRZIC0gcmVjdC50b3A7XG4gIHggLz0gZWxlbWVudC5jbGllbnRXaWR0aDtcbiAgeSAvPSBlbGVtZW50LmNsaWVudEhlaWdodDtcbiAgcmV0dXJuIFt4LCB5XTtcbn1cblxuZXhwb3J0IGNsYXNzIElucHV0UmVjb3JkZXIge1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgfVxuXG4gIGVuYWJsZShmb3JjZVJlc2V0KSB7XG4gICAgdGhpcy5pbml0VGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgIGlmIChmb3JjZVJlc2V0KSB7XG4gICAgICB0aGlzLmNsZWFyKCk7XG4gICAgfVxuICAgIHRoaXMuaW5qZWN0TGlzdGVuZXJzKCk7XG4gIH1cbi8qXG4gIGRpc2FibGUoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcnMoKTtcbiAgfVxuKi9cblxuICBjbGVhcigpIHtcbiAgICB0aGlzLmZyYW1lTnVtYmVyID0gMDtcbiAgICB0aGlzLmV2ZW50cyA9IFtdO1xuICB9XG5cbiAgYWRkRXZlbnQodHlwZSwgZXZlbnQsIHBhcmFtZXRlcnMpIHtcbiAgICB2YXIgZXZlbnREYXRhID0ge1xuICAgICAgdHlwZSxcbiAgICAgIGV2ZW50LFxuICAgICAgcGFyYW1ldGVyc1xuICAgIH07XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLnVzZVRpbWUpIHtcbiAgICAgIGV2ZW50RGF0YS50aW1lID0gcGVyZm9ybWFuY2Uubm93KCkgLSB0aGlzLmluaXRUaW1lO1xuICAgIH0gZWxzZSB7XG4gICAgICBldmVudERhdGEuZnJhbWVOdW1iZXIgPSB0aGlzLmZyYW1lTnVtYmVyO1xuICAgIH1cblxuICAgIHRoaXMuZXZlbnRzLnB1c2goZXZlbnREYXRhKTtcbiAgICBpZiAodGhpcy5vcHRpb25zLm5ld0V2ZW50Q2FsbGJhY2spIHtcbiAgICAgIHRoaXMub3B0aW9ucy5uZXdFdmVudENhbGxiYWNrKGV2ZW50RGF0YSk7XG4gICAgfVxuICB9XG4gIFxuICBpbmplY3RMaXN0ZW5lcnMoKSB7XG4gICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgZXZ0ID0+IHtcbiAgICAgIHZhciBwb3MgPSBjb21wdXRlTm9ybWFsaXplZFBvcyh0aGlzLmVsZW1lbnQsIGV2dCk7XG4gICAgICB0aGlzLmFkZEV2ZW50KCdtb3VzZScsICdkb3duJywge3g6IHBvc1swXSwgeTogcG9zWzFdLCBidXR0b246IGV2dC5idXR0b259KTtcbiAgICB9KTtcbiAgXG4gICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIGV2dCA9PiB7XG4gICAgICB2YXIgcG9zID0gY29tcHV0ZU5vcm1hbGl6ZWRQb3ModGhpcy5lbGVtZW50LCBldnQpO1xuICAgICAgdGhpcy5hZGRFdmVudCgnbW91c2UnLCAndXAnLCB7eDogcG9zWzBdLCB5OiBwb3NbMV0sIGJ1dHRvbjogZXZ0LmJ1dHRvbn0pO1xuICAgIH0pO1xuICBcbiAgICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBldnQgPT4ge1xuICAgICAgdmFyIHBvcyA9IGNvbXB1dGVOb3JtYWxpemVkUG9zKHRoaXMuZWxlbWVudCwgZXZ0KTtcbiAgICAgIHRoaXMuYWRkRXZlbnQoJ21vdXNlJywgJ21vdmUnLCB7eDogcG9zWzBdLCB5OiBwb3NbMV0sIGJ1dHRvbjogZXZ0LmJ1dHRvbn0pO1xuXG4gICAgfSk7XG4gIFxuICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwid2hlZWxcIiwgZXZ0ID0+IHtcbiAgICAgIHRoaXMuYWRkRXZlbnQoJ21vdXNlJywgJ3doZWVsJywge1xuICAgICAgICBkZWx0YVg6IGV2dC5kZWx0YVgsXG4gICAgICAgIGRlbHRhWTogZXZ0LmRlbHRhWSxcbiAgICAgICAgZGVsdGFaOiBldnQuZGVsdGFaLFxuICAgICAgICBkZWx0YU1vZGU6IGV2dC5kZWx0YU1vZGVcbiAgICAgIH0pO1xuICAgIH0pO1xuICBcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgZXZ0ID0+IHtcbiAgICAgIHRoaXMuYWRkRXZlbnQoJ2tleScsICdkb3duJywge1xuICAgICAgICBrZXlDb2RlOiBldnQua2V5Q29kZSxcbiAgICAgICAgY2hhckNvZGU6IGV2dC5jaGFyQ29kZSxcbiAgICAgICAga2V5OiBldnQua2V5XG4gICAgICB9KTtcbiAgICB9KTtcbiAgXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCBldnQgPT4ge1xuICAgICAgdGhpcy5hZGRFdmVudCgna2V5JywgJ3VwJywge1xuICAgICAgICBrZXlDb2RlOiBldnQua2V5Q29kZSxcbiAgICAgICAgY2hhckNvZGU6IGV2dC5jaGFyQ29kZSxcbiAgICAgICAga2V5OiBldnQua2V5XG4gICAgICB9KTtcbiAgICB9KTsgIFxuICB9XG59IiwiZnVuY3Rpb24gc2ltdWxhdGVLZXlFdmVudChlbGVtZW50LCBldmVudFR5cGUsIHBhcmFtZXRlcnMpIHtcbiAgLy8gRG9uJ3QgdXNlIHRoZSBLZXlib2FyZEV2ZW50IG9iamVjdCBiZWNhdXNlIG9mIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvODk0MjY3OC9rZXlib2FyZGV2ZW50LWluLWNocm9tZS1rZXljb2RlLWlzLTAvMTI1MjI3NTIjMTI1MjI3NTJcbiAgLy8gU2VlIGFsc28gaHR0cDovL291dHB1dC5qc2Jpbi5jb20vYXdlbmFxLzNcbiAgLy8gICAgdmFyIGUgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnS2V5Ym9hcmRFdmVudCcpO1xuICAvLyAgICBpZiAoZS5pbml0S2V5RXZlbnQpIHtcbiAgLy8gICAgICBlLmluaXRLZXlFdmVudChldmVudFR5cGUsIHRydWUsIHRydWUsIHdpbmRvdywgZmFsc2UsIGZhbHNlLCBmYWxzZSwgZmFsc2UsIGtleUNvZGUsIGNoYXJDb2RlKTtcbiAgLy8gIH0gZWxzZSB7XG5cbiAgdmFyIGUgPSBkb2N1bWVudC5jcmVhdGVFdmVudE9iamVjdCA/IGRvY3VtZW50LmNyZWF0ZUV2ZW50T2JqZWN0KCkgOiBkb2N1bWVudC5jcmVhdGVFdmVudChcIkV2ZW50c1wiKTtcbiAgICBpZiAoZS5pbml0RXZlbnQpIHtcbiAgICAgIGUuaW5pdEV2ZW50KGV2ZW50VHlwZSwgdHJ1ZSwgdHJ1ZSk7XG4gICAgfVxuXG4gIGUua2V5Q29kZSA9IHBhcmFtZXRlcnMua2V5Q29kZTtcbiAgZS53aGljaCA9IHBhcmFtZXRlcnMua2V5Q29kZTtcbiAgZS5jaGFyQ29kZSA9IHBhcmFtZXRlcnMuY2hhckNvZGU7XG4gIGUucHJvZ3JhbW1hdGljID0gdHJ1ZTtcbiAgZS5rZXkgPSBwYXJhbWV0ZXJzLmtleTtcblxuICAvLyAgfVxuXG4gIC8vIERpc3BhdGNoIGRpcmVjdGx5IHRvIEVtc2NyaXB0ZW4ncyBodG1sNS5oIEFQSTpcbiAgLypcbiAgaWYgKE1vZHVsZVsndXNlc0Vtc2NyaXB0ZW5IVE1MNUlucHV0QVBJJ10gJiYgdHlwZW9mIEpTRXZlbnRzICE9PSAndW5kZWZpbmVkJyAmJiBKU0V2ZW50cy5ldmVudEhhbmRsZXJzICYmIEpTRXZlbnRzLmV2ZW50SGFuZGxlcnMubGVuZ3RoID4gMCkge1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBKU0V2ZW50cy5ldmVudEhhbmRsZXJzLmxlbmd0aDsgKytpKSB7XG4gICAgICBpZiAoKEpTRXZlbnRzLmV2ZW50SGFuZGxlcnNbaV0udGFyZ2V0ID09IGVsZW1lbnQgfHwgSlNFdmVudHMuZXZlbnRIYW5kbGVyc1tpXS50YXJnZXQgPT0gd2luZG93KVxuICAgICAgICYmIEpTRXZlbnRzLmV2ZW50SGFuZGxlcnNbaV0uZXZlbnRUeXBlU3RyaW5nID09IGV2ZW50VHlwZSkge1xuICAgICAgICAgSlNFdmVudHMuZXZlbnRIYW5kbGVyc1tpXS5oYW5kbGVyRnVuYyhlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAoIU1vZHVsZVsnZGlzcGF0Y2hLZXlFdmVudHNWaWFET00nXSkge1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCByZWdpc3RlcmVkRXZlbnRMaXN0ZW5lcnMubGVuZ3RoOyArK2kpIHtcbiAgICAgIHZhciB0aGlzXyA9IHJlZ2lzdGVyZWRFdmVudExpc3RlbmVyc1tpXVswXTtcbiAgICAgIHZhciB0eXBlID0gcmVnaXN0ZXJlZEV2ZW50TGlzdGVuZXJzW2ldWzFdO1xuICAgICAgdmFyIGxpc3RlbmVyID0gcmVnaXN0ZXJlZEV2ZW50TGlzdGVuZXJzW2ldWzJdO1xuICAgICAgaWYgKHR5cGUgPT0gZXZlbnRUeXBlKSBsaXN0ZW5lci5jYWxsKHRoaXNfLCBlKTtcbiAgICB9XG4gIH0gZWxzZSAqL1xuICB7XG4gICAgLy8gRGlzcGF0Y2ggdG8gYnJvd3NlciBmb3IgcmVhbFxuICAgIGVsZW1lbnQuZGlzcGF0Y2hFdmVudCA/IGVsZW1lbnQuZGlzcGF0Y2hFdmVudChlKSA6IGVsZW1lbnQuZmlyZUV2ZW50KFwib25cIiArIGV2ZW50VHlwZSwgZSk7XG4gIH1cbn1cblxuLy8gZXZlbnRUeXBlOiBcIm1vdXNlbW92ZVwiLCBcIm1vdXNlZG93blwiIG9yIFwibW91c2V1cFwiLlxuLy8geCBhbmQgeTogTm9ybWFsaXplZCBjb29yZGluYXRlIGluIHRoZSByYW5nZSBbMCwxXSB3aGVyZSB0byBpbmplY3QgdGhlIGV2ZW50LlxuZnVuY3Rpb24gc2ltdWxhdGVNb3VzZUV2ZW50KGVsZW1lbnQsIGV2ZW50VHlwZSwgcGFyYW1ldGVycykge1xuICAvLyBSZW1hcCBmcm9tIFswLDFdIHRvIGNhbnZhcyBDU1MgcGl4ZWwgc2l6ZS5cbiAgdmFyIHggPSBwYXJhbWV0ZXJzLng7XG4gIHZhciB5ID0gcGFyYW1ldGVycy55O1xuXG4gIHggKj0gZWxlbWVudC5jbGllbnRXaWR0aDtcbiAgeSAqPSBlbGVtZW50LmNsaWVudEhlaWdodDtcbiAgdmFyIHJlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICBcbiAgLy8gT2Zmc2V0IHRoZSBpbmplY3RlZCBjb29yZGluYXRlIGZyb20gdG9wLWxlZnQgb2YgdGhlIGNsaWVudCBhcmVhIHRvIHRoZSB0b3AtbGVmdCBvZiB0aGUgY2FudmFzLlxuICB4ID0gTWF0aC5yb3VuZChyZWN0LmxlZnQgKyB4KTtcbiAgeSA9IE1hdGgucm91bmQocmVjdC50b3AgKyB5KTtcbiAgdmFyIGUgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIk1vdXNlRXZlbnRzXCIpO1xuICBlLmluaXRNb3VzZUV2ZW50KGV2ZW50VHlwZSwgdHJ1ZSwgdHJ1ZSwgd2luZG93LFxuICAgICAgICAgICAgICAgICAgIGV2ZW50VHlwZSA9PSAnbW91c2Vtb3ZlJyA/IDAgOiAxLCB4LCB5LCB4LCB5LFxuICAgICAgICAgICAgICAgICAgIDAsIDAsIDAsIDAsXG4gICAgICAgICAgICAgICAgICAgcGFyYW1ldGVycy5idXR0b24sIG51bGwpO1xuICBlLnByb2dyYW1tYXRpYyA9IHRydWU7XG4vKlxuICBpZiAoZXZlbnRUeXBlID09PSAnbW91c2Vtb3ZlJykge1xuICAgIG1vdXNlRGl2LnN0eWxlLmxlZnQgPSB4ICsgXCJweFwiO1xuICAgIG1vdXNlRGl2LnN0eWxlLnRvcCA9IHkgKyBcInB4XCI7XG4gIH1cbiovXG4gIC8qXG4gIGlmICghTW9kdWxlWydkaXNwYXRjaE1vdXNlRXZlbnRzVmlhRE9NJ10pIHtcbiAgICAvLyBQcm9ncmFtbWF0aWNhbGx5IHJlYXRpbmcgRE9NIGV2ZW50cyBkb2Vzbid0IGFsbG93IHNwZWNpZnlpbmcgb2Zmc2V0WCAmIG9mZnNldFkgcHJvcGVybHlcbiAgICAvLyBmb3IgdGhlIGVsZW1lbnQsIGJ1dCB0aGV5IG11c3QgYmUgdGhlIHNhbWUgYXMgY2xpZW50WCAmIGNsaWVudFkuIFRoZXJlZm9yZSB3ZSBjYW4ndCBoYXZlIGFcbiAgICAvLyBib3JkZXIgdGhhdCB3b3VsZCBtYWtlIHRoZXNlIGRpZmZlcmVudC5cbiAgICBpZiAoZWxlbWVudC5jbGllbnRXaWR0aCAhPSBlbGVtZW50Lm9mZnNldFdpZHRoXG4gICAgICB8fCBlbGVtZW50LmNsaWVudEhlaWdodCAhPSBlbGVtZW50Lm9mZnNldEhlaWdodCkge1xuICAgICAgdGhyb3cgXCJFUlJPUiEgQ2FudmFzIG9iamVjdCBtdXN0IGhhdmUgMHB4IGJvcmRlciBmb3IgZGlyZWN0IG1vdXNlIGRpc3BhdGNoIHRvIHdvcmshXCI7XG4gICAgfVxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCByZWdpc3RlcmVkRXZlbnRMaXN0ZW5lcnMubGVuZ3RoOyArK2kpIHtcbiAgICAgIHZhciB0aGlzXyA9IHJlZ2lzdGVyZWRFdmVudExpc3RlbmVyc1tpXVswXTtcbiAgICAgIHZhciB0eXBlID0gcmVnaXN0ZXJlZEV2ZW50TGlzdGVuZXJzW2ldWzFdO1xuICAgICAgdmFyIGxpc3RlbmVyID0gcmVnaXN0ZXJlZEV2ZW50TGlzdGVuZXJzW2ldWzJdO1xuICAgICAgaWYgKHR5cGUgPT0gZXZlbnRUeXBlKSB7XG4gICAgICAgIGlmIChNb2R1bGVbJ25lZWRzQ29tcGxldGVDdXN0b21Nb3VzZUV2ZW50RmllbGRzJ10pIHtcbiAgICAgICAgICAvLyBJZiBuZWVkc0NvbXBsZXRlQ3VzdG9tTW91c2VFdmVudEZpZWxkcyBpcyBzZXQsIHRoZSBwYWdlIG5lZWRzIGEgZnVsbCBzZXQgb2YgYXR0cmlidXRlc1xuICAgICAgICAgIC8vIHNwZWNpZmllZCBpbiB0aGUgTW91c2VFdmVudCBvYmplY3QuIEhvd2V2ZXIgbW9zdCBmaWVsZHMgb24gTW91c2VFdmVudCBhcmUgcmVhZC1vbmx5LCBzbyBjcmVhdGVcbiAgICAgICAgICAvLyBhIG5ldyBjdXN0b20gb2JqZWN0ICh3aXRob3V0IHByb3RvdHlwZSBjaGFpbikgdG8gaG9sZCB0aGUgb3ZlcnJpZGRlbiBwcm9wZXJ0aWVzLlxuICAgICAgICAgIHZhciBldnQgPSB7XG4gICAgICAgICAgICBjdXJyZW50VGFyZ2V0OiB0aGlzXyxcbiAgICAgICAgICAgIHNyY0VsZW1lbnQ6IHRoaXNfLFxuICAgICAgICAgICAgdGFyZ2V0OiB0aGlzXyxcbiAgICAgICAgICAgIGZyb21FbGVtZW50OiB0aGlzXyxcbiAgICAgICAgICAgIHRvRWxlbWVudDogdGhpc18sXG4gICAgICAgICAgICBldmVudFBoYXNlOiAyLCAvLyBFdmVudC5BVF9UQVJHRVRcbiAgICAgICAgICAgIGJ1dHRvbnM6IChldmVudFR5cGUgPT0gJ21vdXNlZG93bicpID8gMSA6IDAsXG4gICAgICAgICAgICBidXR0b246IGUuYnV0dG9uLFxuICAgICAgICAgICAgYWx0S2V5OiBlLmFsdEtleSxcbiAgICAgICAgICAgIGJ1YmJsZXM6IGUuYnViYmxlcyxcbiAgICAgICAgICAgIGNhbmNlbEJ1YmJsZTogZS5jYW5jZWxCdWJibGUsXG4gICAgICAgICAgICBjYW5jZWxhYmxlOiBlLmNhbmNlbGFibGUsXG4gICAgICAgICAgICBjbGllbnRYOiBlLmNsaWVudFgsXG4gICAgICAgICAgICBjbGllbnRZOiBlLmNsaWVudFksXG4gICAgICAgICAgICBjdHJsS2V5OiBlLmN0cmxLZXksXG4gICAgICAgICAgICBkZWZhdWx0UHJldmVudGVkOiBlLmRlZmF1bHRQcmV2ZW50ZWQsXG4gICAgICAgICAgICBkZXRhaWw6IGUuZGV0YWlsLFxuICAgICAgICAgICAgaWRlbnRpZmllcjogZS5pZGVudGlmaWVyLFxuICAgICAgICAgICAgaXNUcnVzdGVkOiBlLmlzVHJ1c3RlZCxcbiAgICAgICAgICAgIGxheWVyWDogZS5sYXllclgsXG4gICAgICAgICAgICBsYXllclk6IGUubGF5ZXJZLFxuICAgICAgICAgICAgbWV0YUtleTogZS5tZXRhS2V5LFxuICAgICAgICAgICAgbW92ZW1lbnRYOiBlLm1vdmVtZW50WCxcbiAgICAgICAgICAgIG1vdmVtZW50WTogZS5tb3ZlbWVudFksXG4gICAgICAgICAgICBvZmZzZXRYOiBlLm9mZnNldFgsXG4gICAgICAgICAgICBvZmZzZXRZOiBlLm9mZnNldFksXG4gICAgICAgICAgICBwYWdlWDogZS5wYWdlWCxcbiAgICAgICAgICAgIHBhZ2VZOiBlLnBhZ2VZLFxuICAgICAgICAgICAgcGF0aDogZS5wYXRoLFxuICAgICAgICAgICAgcmVsYXRlZFRhcmdldDogZS5yZWxhdGVkVGFyZ2V0LFxuICAgICAgICAgICAgcmV0dXJuVmFsdWU6IGUucmV0dXJuVmFsdWUsXG4gICAgICAgICAgICBzY3JlZW5YOiBlLnNjcmVlblgsXG4gICAgICAgICAgICBzY3JlZW5ZOiBlLnNjcmVlblksXG4gICAgICAgICAgICBzaGlmdEtleTogZS5zaGlmdEtleSxcbiAgICAgICAgICAgIHNvdXJjZUNhcGFiaWxpdGllczogZS5zb3VyY2VDYXBhYmlsaXRpZXMsXG4gICAgICAgICAgICB0aW1lU3RhbXA6IHBlcmZvcm1hbmNlLm5vdygpLFxuICAgICAgICAgICAgdHlwZTogZS50eXBlLFxuICAgICAgICAgICAgdmlldzogZS52aWV3LFxuICAgICAgICAgICAgd2hpY2g6IGUud2hpY2gsXG4gICAgICAgICAgICB4OiBlLngsXG4gICAgICAgICAgICB5OiBlLnlcbiAgICAgICAgICB9O1xuICAgICAgICAgIGxpc3RlbmVyLmNhbGwodGhpc18sIGV2dCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gVGhlIHJlZ3VsYXIgJ2UnIG9iamVjdCBpcyBlbm91Z2ggKGl0IGRvZXNuJ3QgcG9wdWxhdGUgYWxsIG9mIHRoZSBzYW1lIGZpZWxkcyB0aGFuIGEgcmVhbCBtb3VzZSBldmVudCBkb2VzLCBcbiAgICAgICAgICAvLyBzbyB0aGlzIG1pZ2h0IG5vdCB3b3JrIG9uIHNvbWUgZGVtb3MpXG4gICAgICAgICAgbGlzdGVuZXIuY2FsbCh0aGlzXywgZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSAqL1xuICB7XG4gICAgLy8gRGlzcGF0Y2ggZGlyZWN0bHkgdG8gYnJvd3NlclxuICAgIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChlKTtcbiAgfVxufVxuXG5cblxuLy8gdmFyIG1vdXNlRGl2O1xuZXhwb3J0IGNsYXNzIElucHV0UmVwbGF5ZXIge1xuICBjb25zdHJ1Y3RvcihlbGVtZW50KSB7XG4gICAgLypcbiAgICBLZXlzdHJva2VWaXN1YWxpemVyLmVuYWJsZSh7dW5tb2RpZmllZEtleTogZmFsc2V9KTtcbiAgICBtb3VzZURpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIG1vdXNlRGl2LnN0eWxlLmNzc1RleHQ9XCJwb3NpdGlvbjphYnNvbHV0ZTt3aWR0aDozMHB4OyBoZWlnaHQ6MzBweDsgbGVmdDowcHg7IHRvcDowcHg7IGJhY2tncm91bmQtaW1hZ2U6dXJsKCcuLi9jdXJzb3Iuc3ZnJyk7XCI7XG4gICAgbW91c2VEaXYuaWQgPSAnbG9sYXNvJztcbiAgICBpZiAod2luZG93LmxvY2F0aW9uLmhyZWYuaW5kZXhPZignc2hvdy1tb3VzZScpID09PSAtMSkge1xuICAgICAgbW91c2VEaXYuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICB9XG4gICAgZWxlbWVudC5wYXJlbnROb2RlLmFwcGVuZENoaWxkKG1vdXNlRGl2KTtcbiAgICAqL1xuICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5yZWNvcmRpbmcgPSByZWNvcmRpbmcyO1xuICAgIHRoaXMuY3VycmVudEluZGV4ID0gMDtcbiAgfVxuXG4gIHRpY2sgKGZyYW1lTnVtYmVyKSB7XG4gICAgaWYgKHRoaXMuY3VycmVudEluZGV4ID49IHRoaXMucmVjb3JkaW5nLmxlbmd0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnJlY29yZGluZ1t0aGlzLmN1cnJlbnRJbmRleF0uZnJhbWVOdW1iZXIgPiBmcmFtZU51bWJlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHdoaWxlICh0aGlzLmN1cnJlbnRJbmRleCA8IHRoaXMucmVjb3JkaW5nLmxlbmd0aCAmJiB0aGlzLnJlY29yZGluZ1t0aGlzLmN1cnJlbnRJbmRleF0uZnJhbWVOdW1iZXIgPT09IGZyYW1lTnVtYmVyKSB7XG4gICAgICBjb25zdCBpbnB1dCA9IHRoaXMucmVjb3JkaW5nW3RoaXMuY3VycmVudEluZGV4XTtcbiAgICAgIHN3aXRjaCAoaW5wdXQudHlwZSkge1xuICAgICAgICBjYXNlICdtb3VzZSc6IHtcbiAgICAgICAgICBzaW11bGF0ZU1vdXNlRXZlbnQodGhpcy5lbGVtZW50LCBpbnB1dC50eXBlICsgaW5wdXQuZXZlbnQsIGlucHV0LnBhcmFtZXRlcnMpO1xuICAgICAgICB9IGJyZWFrO1xuICAgICAgICBjYXNlICdrZXknOiB7XG4gICAgICAgICAgc2ltdWxhdGVLZXlFdmVudCh0aGlzLmVsZW1lbnQsIGlucHV0LnR5cGUgKyBpbnB1dC5ldmVudCwgaW5wdXQucGFyYW1ldGVycyk7XG4gICAgICAgIH0gYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnU3RpbGwgbm90IGltcGxlbWVudGVkIGV2ZW50JywgaW5wdXQudHlwZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuY3VycmVudEluZGV4Kys7XG4gICAgfVxuICB9XG59XG4iXSwibmFtZXMiOlsiY29tcHV0ZU5vcm1hbGl6ZWRQb3MiLCJlbGVtZW50IiwiZXZ0IiwicmVjdCIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsIngiLCJjbGllbnRYIiwibGVmdCIsInkiLCJjbGllbnRZIiwidG9wIiwiY2xpZW50V2lkdGgiLCJjbGllbnRIZWlnaHQiLCJJbnB1dFJlY29yZGVyIiwiY29uc3RydWN0b3IiLCJvcHRpb25zIiwiY2xlYXIiLCJlbmFibGUiLCJmb3JjZVJlc2V0IiwiaW5pdFRpbWUiLCJwZXJmb3JtYW5jZSIsIm5vdyIsImluamVjdExpc3RlbmVycyIsImZyYW1lTnVtYmVyIiwiZXZlbnRzIiwiYWRkRXZlbnQiLCJ0eXBlIiwiZXZlbnQiLCJwYXJhbWV0ZXJzIiwiZXZlbnREYXRhIiwidXNlVGltZSIsInRpbWUiLCJwdXNoIiwibmV3RXZlbnRDYWxsYmFjayIsImFkZEV2ZW50TGlzdGVuZXIiLCJwb3MiLCJidXR0b24iLCJkZWx0YVgiLCJkZWx0YVkiLCJkZWx0YVoiLCJkZWx0YU1vZGUiLCJ3aW5kb3ciLCJrZXlDb2RlIiwiY2hhckNvZGUiLCJrZXkiLCJzaW11bGF0ZUtleUV2ZW50IiwiZXZlbnRUeXBlIiwiZSIsImRvY3VtZW50IiwiY3JlYXRlRXZlbnRPYmplY3QiLCJjcmVhdGVFdmVudCIsImluaXRFdmVudCIsIndoaWNoIiwicHJvZ3JhbW1hdGljIiwiZGlzcGF0Y2hFdmVudCIsImZpcmVFdmVudCIsInNpbXVsYXRlTW91c2VFdmVudCIsIk1hdGgiLCJyb3VuZCIsImluaXRNb3VzZUV2ZW50IiwiSW5wdXRSZXBsYXllciIsInJlY29yZGluZyIsInJlY29yZGluZzIiLCJjdXJyZW50SW5kZXgiLCJ0aWNrIiwibGVuZ3RoIiwiaW5wdXQiLCJjb25zb2xlIiwibG9nIl0sIm1hcHBpbmdzIjoiOzs7Ozs7RUFDQSxTQUFTQSxvQkFBVCxDQUE4QkMsT0FBOUIsRUFBdUNDLEdBQXZDLEVBQTRDO0VBQzFDLE1BQUlDLElBQUksR0FBR0YsT0FBTyxDQUFDRyxxQkFBUixFQUFYO0VBQ0EsTUFBSUMsQ0FBQyxHQUFHSCxHQUFHLENBQUNJLE9BQUosR0FBY0gsSUFBSSxDQUFDSSxJQUEzQjtFQUNBLE1BQUlDLENBQUMsR0FBR04sR0FB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