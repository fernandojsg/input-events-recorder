// Maps mouse coordinate from element CSS pixels to normalized [ 0, 1 ] range.
function computeNormalizedPos(element, evt) {
  var rect = element.getBoundingClientRect();
  var x = evt.clientX - rect.left;
  var y = evt.clientY - rect.top;
  x /= element.clientWidth;
  y /= element.clientHeight;
  return [x, y];
}

export class InputRecorder {
  constructor(element, options) {
    this.element = element;
    this.clear();
    this.options = options || {};
  }

  enable(forceReset) {
    this.initTime = performance.now();
    if (forceReset) {
      this.clear();
    }
    this.injectListeners();
  }
/*
  disable() {
    this.removeListeners();
  }
*/

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
      this.addEvent('mouse', 'down', {x: pos[0], y: pos[1], button: evt.button});
    });
  
    this.element.addEventListener('mouseup', evt => {
      var pos = computeNormalizedPos(this.element, evt);
      this.addEvent('mouse', 'up', {x: pos[0], y: pos[1], button: evt.button});
    });
  
    this.element.addEventListener('mousemove', evt => {
      var pos = computeNormalizedPos(this.element, evt);
      this.addEvent('mouse', 'move', {x: pos[0], y: pos[1], button: evt.button});

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