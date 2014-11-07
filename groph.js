/*
    Groph.js 0.7

    (c) 2014 Ricky Boyce.
    Groph may be freely distributed under the MIT license.
    For all details and documentation: https://github.com/boyyce/groph
*/

(function() {

  "use strict";

  var Tween,
    showConstruct = false,
    p = Groph.prototype,

    // Load textures once.
    dot1Tex  = "dot-profit.png",
    dot2Tex  = "dot-loss.png",
    tip1Tex  = "tooltip-profit.png",
    tip2Tex  = "tooltip-loss.png",
    tip1ArrowTex = "tooltip-arrow-profit.png",
    tip2ArrowTex = "tooltip-arrow-loss.png";


  // --- Public Methods ----------------------------

  // Constructor
  function Groph(settings) {
    var x = this,
      defaults = {
        selector : '#graph1',
        cwd: '',
        w : 1008,
        h : 365,
        pointMax : false, // Set the default max point. (higher points push this.)
        pointMin : 0,     // Set the default min point. (lower points push this.)
        displayPointer : false,
        graphScale : 1,   // Does same thing as padding.
        graphPadding : [60, 0, 55.5, 20],
        data1 : [600, 500, 700, 900, 500, 700, 600, 900, 700],
        data2 : [200, 300, 100, 200, 50, 150, 300, 200, 300]
      };

    settings = $.extend({}, defaults, settings || {});

    // Class properties.
    x.defaults  = defaults;
    x.tipTexWidth = 12; // This needs to be automated.
    x.selector  = settings.selector;
    x.target    = $(x.selector);
    x.cwd       = settings.cwd;
    x.w         = settings.w;
    x.h         = settings.h;
    x.cache     = settings.cache;
    x.pointMax  = settings.pointMax;
    x.pointMin  = settings.pointMin;
    x.displayPointer = settings.displayPointer;
    x.graphScale = settings.graphScale;
    x.graphPadding = $.extend([], settings.graphPadding);
    x.data1     = $.extend([], (!settings.data1)? defaults.data1: settings.data1);
    x.data2     = $.extend([], (!settings.data2)? defaults.data2: settings.data2);
    x._data1    = $.extend([], x.data1);
    x._data2    = $.extend([], x.data2);
    x.ctp1      = [];
    x.ctp2      = [];

    if (!x.target.length) {
      console.log('selector returned nothing.');
      return;
    }


    // Constants

    Tween = TWEEN;
    if (isString(dot1Tex)) dot1Tex = PIXI.Texture.fromImage(x.cwd + dot1Tex);
    if (isString(dot2Tex)) dot2Tex = PIXI.Texture.fromImage(x.cwd + dot2Tex);
    if (isString(tip1Tex)) tip1Tex = PIXI.Texture.fromImage(x.cwd + tip1Tex);
    if (isString(tip2Tex)) tip2Tex = PIXI.Texture.fromImage(x.cwd + tip2Tex);
    if (isString(tip1ArrowTex)) tip1ArrowTex = PIXI.Texture.fromImage(x.cwd + tip1ArrowTex);
    if (isString(tip2ArrowTex)) tip2ArrowTex = PIXI.Texture.fromImage(x.cwd + tip2ArrowTex);
    //console.time('Function #1');
    //console.timeEnd('Function #1'); 



    // --- Graph Setup--------------------------------

    // Create stage & renderer instances.
    // Add renderer view to the DOM. CanvasRenderer
    x.stage = new PIXI.Stage(0x66FF99);
    x.renderer = new PIXI.CanvasRenderer(this.w + 1, this.h, false, true);
    x.target.html(x.renderer.view);

    x.line1 = new PIXI.Graphics(); 
    x.line2 = new PIXI.Graphics(); 
    x.line1Active = false;
    x.line2Active = false;
    x.defaultIndex = Math.round((x.data1.length-1) / 2);
    x.line1.colorsRB = [0x8fd1f4, 0x56adff];
    x.line2.colorsRB = [0xafb8f8, 0xafb8f8];
      
    x.pointer  = new PIXI.DisplayObjectContainer(); 
    x.line     = new PIXI.Graphics();
    x.stand    = new PIXI.Graphics();
    x.dot1     = new PIXI.Sprite(dot1Tex);
    x.dot2     = new PIXI.Sprite(dot2Tex);
    x.tip1Box  = new PIXI.DisplayObjectContainer(); 
    x.tip2Box  = new PIXI.DisplayObjectContainer(); 


    // Pointer start alpha
    x.pointer.alpha = 0;

    // Dot
    x.dot1.anchor.set(0.5, 0.5);// tex anchor point.
    x.dot2.anchor.set(0.5, 0.5);
    x.dot1Offset = 0.5;
    x.dot2Offset = 0.5;

    // Line
    x.line.beginFill('0x0b2659', 0.43);
    x.line.drawRect(0, 0, 1, settings.h); 
    x.line.endFill();

    // Create stand.
    x.stand.beginFill('0x0b2659', 0.43);
    x.stand.drawRect(-12, settings.h-1, 24, 1); 
    x.stand.endFill();

    // Tip containers
    x.tip1Box.pivot.set(0.5, 0.5);
    x.tip2Box.pivot.set(0.5, 0.5);


    // Object settings.
    x.tip1Y = 13;
    x.tip2Y = settings.h - 27; 

    // Add objects to stage.
    x.stage.addChild(x.line2);
    x.stage.addChild(x.line1);
    x.pointer.addChild(x.line);
    x.pointer.addChild(x.stand);
    x.pointer.addChild(x.dot1);
    x.pointer.addChild(x.dot2);
    x.pointer.addChild(x.tip1Box);
    x.pointer.addChild(x.tip2Box);
    x.stage.addChild(x.pointer);


    x.init = true;
    x.start();
  }

  p.start = function(settings) {
    var i, l, x = this, dataChanged;

    // Not init & graph has not been removed.
    if (!x.init && x.target) x.remove();

    // Graph has been removed.
    if (!x.target) {
      // New parameters passed.
      settings = settings || {};
      x.selector = settings.selector || x.selector;
      x.target = $(x.selector);

      if (!x.target.length) {
        console.log('selector returned nothing.');
        return;
      }
      if (typeof settings.displayPointer !== 'undefined') {
        x.displayPointer = settings.displayPointer;
      }
      if (typeof settings.data1 !== 'undefined') {
        dataChanged = true;
        x.data1  = $.extend([], (!settings.data1)? x.defaults.data1: settings.data1);
        x._data1 = $.extend([], x.data1);
        x.ctp1   = [];
      }
      if (typeof settings.data2 !== 'undefined') {
        dataChanged = true;
        x.data2  = $.extend([], (!settings.data2)? x.defaults.data2: settings.data2);
        x._data2 = $.extend([], x.data2);
        x.ctp2   = [];
      }
      
      // Add view to DOM.
      x.target.html(x.renderer.view);
    }

    // Init or new data passed.
    if (x.init || dataChanged) {
      x.removeTooltips();
      x.dataConversion();

      // Create all tips
      x.allTips1 = [];
      x.allTips2 = [];
      x.currentTipIndex = false;
      for (i=0, l=x.data1.length; i<l; i++) {
        x.allTips1.push(x.drawTooltip(1, i));
        x.allTips2.push(x.drawTooltip(2, i));
      }
    }

    // Tracking & Default positions.
    x.init = false;
    x.tickers = [];
    x.initDelays = [];
    x.lineTweens1 = []; 
    x.lineTweens2 = [];
    x.animating = {};
    x.stageMouseOver = false; 
    x.pointerGo = false;
    x.data1Nill = [];
    x.data2Nill = [];
    x.ctp1Nill  = [];
    x.ctp2Nill  = [];

    // Duplicate data/ctp with a null y-axis to animate from.
    for (i=0, l=x.data1.length; i<l; i++) {
      x.data1Nill.push({x:x.data1[i].x, y:x.lowest});
      x.data2Nill.push({x:x.data2[i].x, y:x.lowest});

      if (i != (l-1)) {
        x.ctp1Nill.push([
          {x:x.ctp1[i][0].x, y:x.lowest}, 
          {x:x.ctp1[i][1].x, y:x.lowest}
        ]);

        x.ctp2Nill.push([
          {x:x.ctp2[i][0].x, y:x.lowest}, 
          {x:x.ctp2[i][1].x, y:x.lowest}
        ]);
      }
    }

    // Draw first line.
    x.drawLines(true);

    // Setup interative pointer.
    x.interactivePointer();

    // Start interactive ticker.
    x.tickers.push(requestAnimFrame(function(){ x.interactiveTicker(); }));
    x.interactiveTickerI = x.tickers.length - 1;

    // Start line tweens!
    x.initDelays.push( setTimeout(function() { 
      x.initDelays.splice(0, 1);
      x.startLineTweens(); 
    }, 500));

    // Auto show pointer.
    x.initDelays.push(setTimeout(function() {
      x.initDelays.splice(1, 1);
      x.pointerGo = true;
      if (x.displayPointer) {
        x.showPointerTween();
        x.movePointerTween({indexRB: x.defaultIndex});
      }
      else if (x.stageMouseOver) x.showPointerTween();
    }, 1500));
  };

  p.remove = function() {
    var i, key, obj, x = this;

     // Stop init delayers
    for (i=x.initDelays.length; i--;) 
      clearTimeout(x.initDelays[i]);

    // Stop line1/2 init animations.
    for (i=x.lineTweens1.length; i--;) 
      x.lineTweens1[i].stop();
    for (i=x.lineTweens2.length; i--;) 
      x.lineTweens2[i].stop();

    x.line1Active = false;
    x.line2Active = false;

    // Stop anything else in motion.
    for (key in x.animating) {
      obj = x.animating[key];
      if (x.animating.hasOwnProperty(obj) && obj) obj.stop();
    }
    
    // Stop tickers.
    for (i=x.tickers.length; i--;) 
      cancelAnimationFrame(x.tickers[i]);
    x.tickers = null;

    // Remove pointer
    x.removeInteractivePointer();

    // Remove dom link and jquery data.
    x.target.removeData();
    x.target.empty();
    x.target = null;
  };

  p.destroy = function() {
    this.removeTooltips();
    this.remove();
    this.stage.interactionManager.removeEvents();
  };


  // --- Stage interaction ------------------------

  p.interactivePointer = function() {
    var x = this, xpos, i, l, width, box, 
    half = Math.round(this.columnWidth / 2);

    x.boxes = new PIXI.DisplayObjectContainer(); 

    function movePointerTween(data) {
      x.movePointerTween(data);
    }
    function showPointerTween() {
      x.showPointerTween();
    }
    function hidePointerTween() {
      x.hidePointerTween();
    }

    for (i=0, l=x.data1.length; i<l; i++) {
      // Finding cordianants.
      if (i === 0) {
        xpos = 0;
        width = half;
      } else {
        xpos = ((i - 1) * x.columnWidth) + half;
        width = x.columnWidth;
      }

      // console.log(x, 0, w, settings.h);
      // Draw hitarea.
      box = new PIXI.Graphics();
      box.lineStyle(1, '0x000', 0.0);
      box.drawRect(xpos, 0, width, x.h);
      box.indexRB = i;
      box.hitArea = new PIXI.Rectangle(xpos, 0, width, x.h);
      box.mouseover = movePointerTween;
      box.interactive = true;
      x.boxes.addChild(box);
    }
    
    // Stage interaction
    x.stage.mouseover = showPointerTween;
    x.stage.mouseout  = hidePointerTween;
    x.stage.interactive = true;
    x.stage.addChild(x.boxes);
  };

  p.removeInteractivePointer = function() {
    var x = this;
    x.stage.removeChild(x.boxes);
    x.showHidePointer(0);
    x.stage.interactive = false;
    //console.log(x.stage.interactionManager);
  };


  // --- Drawing Logic ----------------------------

  p.drawLines = function(f) {
    var x = this;
    // Use nill values for the start of animation.
    if (x.line1Active || f) x.drawLine(x.line1, x.data1Nill, x.ctp1Nill);
    if (x.line2Active || f) x.drawLine(x.line2, x.data2Nill, x.ctp2Nill);
  };

  p.drawLine = function(line, data, ctp) {
    var x = this, i, l, m, off, lastPt;
    line.clear();

    for (m=2; m--;) {
      if (m === 0) {
        off = 0;
        line.lineStyle(5, line.colorsRB[0], 1);
        line.beginFill(line.colorsRB[1], 0.15);
        line.moveTo(-10, x.h + 10);
        line.lineTo(-10, data[0].y + off);
      } else {
        off = 1;
        line.lineStyle(5, '0x7d8fc2', 1);
        line.moveTo(-10, data[0].y + off);
      }

      for (i=0, l=data.length; i<l; i++) {
        if (i>=(l-1)) continue;
        //line.lineTo(data[i+1].x, data[i+1].y + off);
        line.bezierCurveTo(ctp[i][0].x, ctp[i][0].y + off, ctp[i][1].x, ctp[i][1].y + off,  data[i+1].x, data[i+1].y + off);
      }

      lastPt = last(data);
      line.bezierCurveTo(lastPt.x, lastPt.y + off, lastPt.x, lastPt.y + off, lastPt.x, lastPt.y + off);
      line.lineTo(x.w + 10, lastPt.y + off);
      if (m === 0) {
        line.lineTo(x.w + 10, x.h + 10);
        line.endFill();
      }
    } 
  };

  p.movePoints = function(dataIndex, i, y) {
    var x = this, dataNill, ctpNill, data, ctp, 
      low = this.lowest;

    if (dataIndex == 1) {
      dataNill = x.data1Nill;
      ctpNill  = x.ctp1Nill;
      data = x.data1;
      ctp  = x.ctp1;

    } else if (dataIndex == 2) {
      dataNill = x.data2Nill;
      ctpNill  = x.ctp2Nill;
      data = x.data2;
      ctp  = x.ctp2;
    }

    // Set new point position.
    dataNill[i].y = y;
    // Grab percentage of new point position
    var percent = (y - low) / (data[i].y - low) * 100;
    // When y = low, 0 / 0 is spawned.
    if (isNaN(percent)) percent = 100;
    var last = data.length - 1;

    // Set new control point(s) position. (0 and up), (max and down)
    if (i !== last) ctpNill[i][0].y = (percent * (ctp[i][0].y-low) / 100) + low; // Add back low.
    if (i !== 0)  ctpNill[i-1][1].y = (percent * (ctp[i-1][1].y-low) / 100)  + low; // Add back low.
  };

  p.showHidePointer = function(value) {
    this.pointer.alpha = value;

    // Tip start positions.
    var pos1 = -38, pos2 = 38;
    this.tip1Box.position.y = pos1 - (pos1 * value);
    this.tip2Box.position.y = pos2 - (pos2 * value);
  };

  p.showHideDots = function(value) {
    this.dot1.scale.set(value, value);
    this.dot2.scale.set(value, value);
  };

  p.movePointer = function(value) {
    // Pointer x
    this.pointer.position.x = value;
  };

  p.moveDot1 = function(value) {
    // Pointer x
    this.dot1.position.y = value;
  };

  p.moveDot2 = function(value) {
    // Pointer x
    this.dot2.position.y = value;
  };

  p.changeTips = function(value) {
    var x = this, half1, half2, index = this.currentTipIndex;
    var width1 = x.allTips1[index].width;
    var width2 = x.allTips2[index].width;

    half1 = Math.round(width1 / 2);
    half2 = Math.round(width2 / 2);

    if (index === 0) {
      // start(-200) - (-200 * 0.6)
      x.allTips1[index].position.x = -half1 - (-half1 * value);
      x.allTips2[index].position.x = -half2 - (-half2 * value);
    } else {
      x.allTips1[index].position.x = (-width1 + (x.tipTexWidth*2)) + (half1 - (half1 * value));
      x.allTips2[index].position.x = (-width2 + (x.tipTexWidth*2)) + (half2 - (half2 * value));
    }
  };

  p.drawTooltip = function(type, dataIndex) {
    var x = this, tipLeft, tipRight, tipArrow, 
      tipPadding = 12,
      tip     = new PIXI.DisplayObjectContainer(),
      tipBG   = new PIXI.Graphics(),
      tipText = new PIXI.Text("", {font:"13px Arial", fill:"white"});

    if (type == 1) {
      x.tip1Box.addChild(tip);
      tipLeft  = new PIXI.Sprite(tip1Tex);
      tipRight = new PIXI.Sprite(tip1Tex);
      tipArrow = new PIXI.Sprite(tip1ArrowTex);
      tip.position.y = -100;
      tipBG.beginFill('0x6ec0ea', 1); 
      tipText.setText("$" + x._data1[dataIndex] + " profit");
      tipArrow.position.y = 22;
    } else {
      x.tip2Box.addChild(tip);
      tipLeft  = new PIXI.Sprite(tip2Tex);
      tipRight = new PIXI.Sprite(tip2Tex);
      tipArrow = new PIXI.Sprite(tip2ArrowTex);
      tip.position.y = -100;
      tipBG.beginFill('0x90a5e8', 1);
      tipText.setText("$" + x._data2[dataIndex] + " loss");
      tipArrow.scale.y = -1;
      tipArrow.position.y = -6;
    }
    
    // Tip text
    var tipWidth = tipText.width;
    tipText.position.x = tipPadding;
    
    // Tip
    tip.pivot.set(0.5, 0.5);
    tip.position.x = - (Math.round(tipWidth / 2) + tipPadding - 1);

    // Tip BG.
    tipBG.drawRect(0, -8, tipWidth + (tipPadding * 2), 31); 
    tipBG.endFill();

    // Tip sides.
    tipLeft.position.set(-tipPadding + 1, -9);
    tipRight.position.set(tipWidth - 1 + (tipPadding * 3), -9);
    tipRight.scale.x = -1;

    // Tip arrow x
    tipArrow.position.x = (Math.round(tipWidth / 2) + tipPadding) - 8;

    // First and last tooltips.
    if (dataIndex === 0) {
      tipArrow.position.x -= Math.round(tipWidth / 2) + tipPadding;
    } else if (dataIndex === x.data1.length-1) {
      tipArrow.position.x += Math.round(tipWidth / 2) + tipPadding;
    }

    tip.addChild(tipBG);
    tip.addChild(tipLeft);
    tip.addChild(tipRight);
    tip.addChild(tipArrow);
    tip.addChild(tipText);
    return tip;
  };

  p.removeTooltips = function() {
    var i, m;

    if (this.allTips1) 
      for (i=this.allTips1.length; i--;) {
        for (m=this.allTips1[i].children.length; m--;) 
          if (this.allTips1[i].children[m].destroy) {
            this.allTips1[i].children[m].destroy();
          }
        this.tip1Box.removeChild(this.allTips1[i]);
      }

    if (this.allTips2) 
      for (i=this.allTips2.length; i--;) {
        for (m=this.allTips2[i].children.length; m--;) 
          if (this.allTips2[i].children[m].destroy) {
            this.allTips2[i].children[m].destroy();
          }
        this.tip2Box.removeChild(this.allTips2[i]);
      }
  };
  

  // --- Animation & Tickers ----------------------

  p.startLineTweens = function() {
    var x = this, i, l, tween1, tween2;

    var movePoints = function(dataIndex, i) {
      return function() { x.movePoints(dataIndex, i, this.y); };
    };
    var tween1Start = function() {
      x.line1Active = true;
    };
    var tween2Start = function() {
      x.line2Active = true;
    };
    var tween2Completed = function() {
      cancelAnimationFrame(x.tickers[x.initTickerI]);
      x.tickers[x.initTickerI] = null;
    };

    // Loop all points and create initAnim
    for (i=0, l=x.data1.length; i<l; i++) {
      tween1 = new TWEEN
        .Tween({y: x.lowest})
        .delay((i + 1) * 100)
        .to({y: x.data1[i].y}, 2500)
        .easing(TWEEN.Easing.Elastic.Out)
        .onUpdate(movePoints(1, i))
        .onStart(tween1Start)
        .start();

      tween2 = new TWEEN
        .Tween({y: x.lowest})
        .delay((i + 1) * 100 + 500)
        .to({y: x.data2[i].y}, 2500)
        .easing(TWEEN.Easing.Elastic.Out)
        .onUpdate(movePoints(2, i))
        .onStart(tween2Start)
        .start();

      x.lineTweens1.push(tween1);
      x.lineTweens2.push(tween2);
    }
    
    // Line1 finsihed, stop calculating.
    last(x.lineTweens1).onComplete(function() {
      x.line1Active = false;
    });

    // Line2 completed, stop ticker after one more render on
    // both lines for inactive tabs, otherwise the ticker 
    // would of never run if the user didn't look once.
    last(x.lineTweens2).onComplete(function() {
      x.line1Active = true;
      x.line2Active = true;
      setTimeout(tween2Completed, 24);
    });

    // Start init ticker.
    x.tickers.push(requestAnimFrame(function() { x.initTicker(); }));
    x.initTickerI = x.tickers.length-1;
  };

  p.showPointerTween = function(data) {
    this.stageMouseOver = true;
    if (!this.pointerGo) return;
    this.showHidePointerTween(true);
  };

  p.hidePointerTween = function(data) {
    this.stageMouseOver = false;
    if (!this.pointerGo) return;
    this.showHidePointerTween();
  };

  p.showHidePointerTween = function(show) {
    var x = this, to, value = this.pointer.alpha;

    // Stop prev animation.
    if (x.animating.pointer) x.animating.pointer.stop();
    if (x.animating.dots) x.animating.dots.stop();
    if (show) to = 1; 
    else to = 0;
    
    x.animating.pointer = new Tween
      .Tween({value: value})
      .to({value: to}, 250)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(function() { x.showHidePointer(this.value); })
      .onComplete(function() {x.animating.pointer = null;})
      .start();

    x.animating.dots = new Tween
      .Tween({value: value})
      .to({value: to}, (show)? 600 : 300)
      .easing((show)? TWEEN.Easing.Elastic.Out : TWEEN.Easing.Quadratic.InOut)
      .onUpdate(function() { x.showHideDots(this.value); })
      .onComplete(function() {x.animating.dots = null;})
      .start();
  };

  p.movePointerTween = function(data) {
    var x = this,
      oldpointerx = this.pointer.x,
      dot1y = this.dot1.y,
      dot2y = this.dot2.y,
      data1 = this.data1,
      data2 = this.data2,
      animating = x.animating,
      index = data.indexRB || data.target.indexRB;


    // Exchanging tooltips instantly.
    if (x.currentTipIndex !== false) {
      x.allTips1[x.currentTipIndex].position.y = -100;
      x.allTips2[x.currentTipIndex].position.y = -100;
    }
    x.currentTipIndex = index;
    if (!x.displayPointer) {
      x.allTips1[index].position.y = x.tip1Y;
      x.allTips2[index].position.y = x.tip2Y;
    }

    // Pointer is completly hidden.
    if (x.pointer.alpha === 0) {

      // Previously i did a func.call to keep it dry.
      x.pointer.position.x = data1[index].x;
      x.dot1.position.y    = data1[index].y + x.dot1Offset;
      x.dot2.position.y    = data2[index].y + x.dot2Offset;
      if (index === 0 || index === data1.length-1) x.changeTips(1);

    } else {

      // Stop prev animation.
      if (animating.pointerx) animating.pointerx.stop();
      if (animating.dot1y) animating.dot1y.stop();
      if (animating.dot2y) animating.dot2y.stop();
      if (animating.tips) animating.tips.stop();

      if (index === 0 || index === data1.length-1) 
        animating.tips = new TWEEN
          .Tween({value: 0})
          .to({value: 1}, 300)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .onUpdate(function() { x.changeTips(this.value); })
          .onComplete(function() {animating.tips = null;})
          .start();

      
      animating.pointerx = new TWEEN
        .Tween({value: oldpointerx})
        .to({value: data1[index].x}, 600)
        .easing(elasticOut)
        .onUpdate(function() { x.movePointer(this.value); })
        .onComplete(function() {animating.pointerx = null;})
        .start();

      animating.dot1y = new TWEEN
        .Tween({value: dot1y})
        .to({value: data1[index].y + x.dot1Offset}, 600)
        .easing(elasticOut)
        .onUpdate(function() { x.moveDot1(this.value); })
        .onComplete(function() {animating.dot1y = null;})
        .start();

      animating.dot2y = new TWEEN
        .Tween({value: dot2y})
        .to({value: data2[index].y + x.dot2Offset}, 600)
        .easing(elasticOut)
        .onUpdate(function() { x.moveDot2(this.value); })
        .onComplete(function() {animating.dot2y = null;})
        .start();
    } 
  };

  p.initTicker = function(time) {
    var x = this;
    x.tickers[x.initTickerI] = requestAnimFrame(function() { x.initTicker(); });
    x.drawLines();
  };

  p.interactiveTicker = function(time) {
    var x = this;
    x.tickers[x.interactiveTickerI] = requestAnimFrame(function() { x.interactiveTicker(); });
    Tween.update(time);
    x.renderer.render(x.stage);
  };


  // --- Data Algorithms -------------------------

  p.dataConversion = function() {
    var i, l,
      data1 = this.data1,
      data2 = this.data2;

    this.lowest = this.pointsToGraph();
    this.columnWidth = Math.round(this.w / (data1.length-1));

    // Add x-axis
    for (i=0, l=data1.length; i<l; i++) {
      if (i < (l-1)) data1[i] = {x: i*this.columnWidth, y: data1[i]}; 
      else data1[i] = {x: this.w, y: data1[i]}; 

      if (i < (l-1)) data2[i] = {x: i * this.columnWidth, y: data2[i]}; 
      else data2[i] = {x: this.w, y: data2[i]}; 
    }

    // Find ctrl points
    // Duplicate start & end for finding ct points.
    data1.unshift(data1[0]);
    data1.push(last(data1));
    data2.unshift(data2[0]);
    data2.push(last(data2));

    // Find control points for data.
    // Should catch 12 lines if there are 13 points.
    for (i=0, l=data1.length; i<l; i++) {
      if (i===0 || i>=(l-2)) continue;
      this.ctp1.push(this.lineControlPoints(data1[i-1], data1[i], data1[i+1], data1[i+2], 5, 0.8));
      this.ctp2.push(this.lineControlPoints(data2[i-1], data2[i], data2[i+1], data2[i+2], 5, 0.8));
    }

    // Remove start & end.
    data1.splice(0, 1);
    data1.splice(-1, 1);
    data2.splice(0, 1);
    data2.splice(-1, 1);
  };

  p.pointsToGraph = function() {
    var x = this, i, graphlen, graphMid, graphHalf, 
      percentage;

    var 
      h = x.h,
      pointMax = x.pointMax,
      pointMin = x.pointMin,
      graphPadding = x.graphPadding,
      graphScale = x.graphScale,
      data1 = x.data1,
      data2 = x.data2;

    // Graph boundaries, remember graph uses inverted values.
    var graphMax = 0 + graphPadding[0];
    var graphMin = h - graphPadding[2];

    // Calc scale.
    if (graphScale !== 1) {
      graphlen = graphMin - graphMax;
      graphMid = Math.round(graphlen / 2);
      graphHalf = Math.round((graphlen * graphScale) / 2);
      graphMax = graphMid - graphHalf;
      graphMin = graphMid + graphHalf;
    }

    // Max and low points.
    var data = data1.concat(data2); 
    if (isNumber(pointMax)) data.push(pointMax);
    if (isNumber(pointMin)) data.push(pointMin);
    pointMax = getMax(data);
    pointMin = getMin(data);

    // Calc range and offsets for percentages.
    // note: graph is inverted so the highest value is the min.
    var pointRange  = pointMax - pointMin;
    var graphRange  = graphMin - graphMax; // Min is bigger.
    var pointOffset = pointMin;

    /*
    console.table([
      {min: pointMin, max: pointMax, range: pointRange}, 
      {min: graphMax, max: graphMin, range: graphRange}
    ]);
    */

    // Scale data points into stage dimensions.
    for (i=data1.length; i--;) {

      // minus offset. Used for leveling data.
      data1[i] -= pointOffset;
      data2[i] -= pointOffset;

      // Get percentage of point. 
      percentage = (data1[i] / pointRange) * 100; 
      // If no values
      if (pointRange === 0) percentage = 0;
      // Flip percentages for inverted stage.
      percentage = 100 - percentage; 
      // Get stage value from percentage.
      data1[i] = (percentage * graphRange) / 100;
      // Add back the graph percentage offset
      data1[i] = Math.round((data1[i] + graphMax) * 10) / 10 - 1;


      // Get percentage of point. 
      percentage = (data2[i] / pointRange) * 100;
      // If no values
      if (pointRange === 0) percentage = 0;
      // Flip percentages for inverted stage.
      percentage = 100 - percentage; 
      // Get stage value from percentage.
      data2[i] = (percentage * graphRange) / 100;
      // Add back the graph percentage offset
      data2[i] = Math.round((data2[i] + graphMax) * 10) / 10 - 1;
    }

    // Return lowest graph point for animation.
    return graphMin;
  };

  p.lineControlPoints = function(s1, s2, s3, s4, step, squish) {
    step = step || 5;
    
    var 
    lowest = this.lowest-1, // All data is offsetted by 1 in pointsToGraph.
    squishFlat = false,
    S1 = this.findControlPoints(s1, s2, s3),
    S2 = this.findControlPoints(s2, s3, s4),

    //ctr = Math.floor(( (S1.l1 || S1.l2) + (S2.l2 || S2.l1) ) / step),

    p2 = S1.c2,
    p3 = S2.c1;

    if (showConstruct) {
      this.plotSquare(p2, 3, '0xff0000');//red
      this.plotLine(s2, p2, '0xfc69f7');//pink

      this.plotSquare(p3, 3, '0xff0000');//red
      this.plotLine(s3, p3, '0xfc69f7');//pink
    }

    // If its a flat line, squish more.
    if (s2.y == lowest && s3.y == lowest) squishFlat = true;

    if (squish !== false) {
      // 60 - 50 =  == 60 - 5 = 55
      p2.x = s2.x - ((s2.x - p2.x) * ((squishFlat)? 0.1 : squish));
      p2.y = s2.y - ((s2.y - p2.y) * ((squishFlat)? 0.1 : squish));
      p3.x = s3.x - ((s3.x - p3.x) * ((squishFlat)? 0.1 : squish));
      p3.y = s3.y - ((s3.y - p3.y) * ((squishFlat)? 0.1 : squish));
    }
    
    return [p2, p3];
  };

  p.findControlPoints = function(s1, s2, s3) {
    var dx1 = s1.x - s2.x, dy1 = s1.y - s2.y,
    dx2 = s2.x - s3.x, dy2 = s2.y - s3.y,

    l1 = Math.sqrt(dx1*dx1 + dy1*dy1),
    l2 = Math.sqrt(dx2*dx2 + dy2*dy2),

    m1 = {x: (s1.x + s2.x) / 2.0, y: (s1.y + s2.y) / 2.0},
    m2 = {x: (s2.x + s3.x) / 2.0, y: (s2.y + s3.y) / 2.0},

    dxm = (m1.x - m2.x),
    dym = (m1.y - m2.y),

    k = l2 / (l1 + l2),
    cm = {x: m2.x + dxm*k, y: m2.y + dym*k},
    tx = s2.x - cm.x, ty = s2.y - cm.y,

    c1 = {x: m1.x + tx, y: m1.y + ty},
    c2 = {x: m2.x + tx, y: m2.y + ty};

    if (showConstruct) {
      this.plotLine(s1, s2, '0xdfcb45');// gold
      this.plotLine(s2, s3, '0xdfcb45');// gold

      this.plotPoint(m1, 1, '0x6ae676');// green
      this.plotPoint(m2, 1, '0x1ad32b');// green
      this.plotLine(m1, m2, '0x6ae676');// pale green
      this.plotPoint(cm, 1, '0x3086e7');// blue
    }
    return {c1: c1, c2: c2, l1: Math.floor(l1), l2: Math.floor(l2)};
  };

  p.plotPoint = function(p, r, c) {
    // [xy], radius, color.
    var g = new PIXI.Graphics();
    g.lineStyle(0, c);
    g.beginFill(c);
    g.drawCircle(p.x-r/2, p.y-r/2, r);
    g.endFill();
    this.stage.addChild(g);
  };

  p.plotLine = function(p1, p2, c) {
    var g = new PIXI.Graphics();
    g.lineStyle(1, c);
    g.moveTo(p1.x, p1.y);
    g.lineTo(p2.x, p2.y);
    this.stage.addChild(g);
  };

  p.plotSquare = function(p1, s, c) {
    var g = new PIXI.Graphics();
    g.lineStyle(0, c);
    g.beginFill(c);
    g.drawRect(p1.x-s/2, p1.y-s/2, s, s);
    g.endFill();
    this.stage.addChild(g);
  };


  // --- Private Functions -----------------------

  function elasticOut(k) { 
    var s, a = 0.1, p = 0.7;
    if ( k === 0 ) return 0;
    if ( k === 1 ) return 1;
    if ( !a || a < 1 ) { a = 1; s = p / 4; }
    else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
    return ( a * Math.pow( 2, - 10 * k) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) + 1 );
  }

  function last(arr) {
    return arr[arr.length-1];
  }

  function isNumber(num) {
    return !isNaN(parseFloat(num)) && isFinite(num);
  }

  function isString(str) {
    if (typeof str == 'string' || str instanceof String) return true;
    else return false;
  }

  function getMin(arr) {
    var result = Infinity;
    for (var i=0, length=arr.length; i<length; i++) 
      if (arr[i] < result) result = arr[i];
    return result;
  }

  function getMax(arr) {
    var result = -Infinity;
    for (var i=0, length=arr.length; i<length; i++) 
      if (arr[i] > result) result = arr[i];
    return result;
  }

  // Export to browser.
  window.Groph = Groph;

})();