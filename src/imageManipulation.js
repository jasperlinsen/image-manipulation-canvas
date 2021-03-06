/* License: MIT 
 * http://www.github.com/jasperlinsen/image-manipulation-canvas/LICENSE.md */

/***************************************************************/
/************** Canvas ImageManipulation Library ***************/
/***************************************************************/

var ImageManipulation = {
	/* Canvas(options:Dictionary)		 -> ImageManipulation.Canvas
	 * ImageManipulation Canvas constructor */
	Canvas:		function ImageManipulation(options){
		
		"use strict";
		
		if(!options) return this;
	
		var canvasSupport   = document.createElement('canvas');
		if(!(canvasSupport.getContext && canvasSupport.getContext('2d')))
			throw('Initialisation failed: support for <canvas> is missing.');
	
		/* Values to be set in Init method */
		this.image			= options.image 	|| false;
		this.width			= options.width 	|| 0;
		this.height			= options.height 	|| 0;
		this.className		= options.className || '';
		this.input		  	= document.createElement('canvas');
		this.output		 	= document.createElement('canvas');
		this.inputContext   = this.input.getContext('2d');
		this.outputContext  = this.output.getContext('2d');
		this.ready		  	= false;
		this.queue			= [];
		
		/* options.development:Func - defaults to 'throw'. */
		this.development	= 
			options.development && options.development instanceof Function
			? options.development
			: 'throw';
		this.callback		= options.callback && options.callback instanceof Function 
			? options.callback
			: function(){};
		
		/* Source should not be changed after Init(). */
		this.source		 = false;
		/* Manipulation should be done on resource after Init() */
		this.resource	   = false;
		/* options.development:Func - defaults to 'throw'. */
		this.autoUpdate	  = options.autoUpdate || true;
	
		// Call the initialiser / set up call to initialiser
		if(options.image){
			this.image		  = document.createElement('img');
			this.image		  .addEventListener('load', this.Init.bind(this));
			this.image		  .addEventListener('error', function(){
				throw('Initialisation failed: image loading returned error.')
			});
			this.image		   .setAttribute('src', options.image);
		} else if(options.copy){
			this.Init(options.copy);
		} else {
			throw("No image or copy set, cannot initialise");
		}
		return this;
	},
	/* Init([querySelector:String])		 -> [ImageManipulation.Canvas]
	 * DOM Search Based Initialisation */
	Init:		function(querySelector){
		var result, elements;
		result 			= new Array();
		querySelector 	= querySelector || "*[data-manipulate]";
		elements 		= document.querySelectorAll(querySelector);
		function create(element){
			var src			= 
				element.getAttribute("data-src") || element.getAttribute("src") || false;
			var className 	= 
				element.getAttribute("className") || '';
			if(!src) return false;
			return new ImageManipulation.Canvas({
				image: src,
				className: className,
				callback: function(Image){
					element.parentNode.insertBefore(Image.DOM(), element);
					
					var j = {
						_j: 1, get string(){
							var r = this._j === 1 ? "" : "-" + this._j;
							this._j++; return r;
						}, set string(value){
							this._j = value;
						}
					}
					
					var manipulation;
					while(manipulation = element.getAttribute("data-manipulate" + j.string)){
						manipulation = manipulation.split("(");
						var argument = manipulation[1] 
									? manipulation[1].replace(")", "").split(",")
									: [];
						if(Image[manipulation[0]] instanceof Function){
							console.log(manipulation[0], argument)
							Image[manipulation[0]].apply(Image, argument);
						} else {
							throw("Static @element manipulation ('" + manipulation + "') is not a function.)");
						}
					}
					
					element.parentNode.removeChild(element);
					
				},
				autoUpdate: true
			});
		}
		for(var i = 0; i < elements.length; i++){
			var r = create(elements.item(i));
			if(r) result.push(r);
		}
		return result;
	}
};

ImageManipulation.Canvas.prototype = {

	/***********************************************************/
	/********************** Core Functions *********************/
	/***********************************************************/
	/* Init([Imagemanipulation.canvas])	 -> void
	 * gets called automatically. Initialises all values and resources. */
	Init:		function(copy){
		
		if(this.ready)
			return this.Throw("Init was ready. Cannot be called again.");
		
		if(!(copy instanceof ImageManipulation.Canvas)){
			copy = false;
		}
		
		this.width		   		= copy.width  		|| this.image.width;
		this.height		  		= copy.height 		|| this.image.height;
		this.input.width	 	= copy.width  		|| this.width;
		this.input.height		= copy.height 		|| this.height;
		this.output.width		= copy.width  		|| this.width;
		this.output.height   	= copy.height 		|| this.height;
		this.output.className   = copy.className 	|| this.className;
		
		if(this.image){
			this.inputContext	.drawImage(this.image, 0, 0);
		}
		
		this.source		  	= copy.source   || this.inputContext.getImageData(0, 0, this.width, this.height);
		this.resource		= copy.resource || this.inputContext.getImageData(0, 0, this.width, this.height);
		
		this.Support.Self   = this;
		
		this.ready		  = true;
		
		if(!copy && this.queue.length){
			for(var i = 0; i < this.queue.length; i++){
				if(this.queue[i] && this[this.queue[i][0]] instanceof Function){
					var args = this.queue[i][1] ? this.queue[i][1] : false;
					if(args) this[this.queue[i][0]].apply(this, args);
					else this[this.queue[i][0]]();
					this.queue[i] = false;
				}
			}
		}
		if(!copy) this.callback(this);
	},
	/* Copy()	 -> ImageManipulation 
	 * return a copy of this instance. */
	Copy:		function(){
		return new ImageManipulation.Canvas({copy: this});
	},
	/* Draw([source:Bool])	 -> this 
	 * update the canvas. */
	Draw:		function(source){
		if(!source && this.resource){
			this.outputContext.putImageData(new ImageData(
				this.resource.data, this.width, this.height
			), 0, 0);
		} else if(source){
			this.outputContext.putImageData(new ImageData(
				source.data, this.width, this.height
			), 0, 0);
		}
		return this;
	},
	/* Apply()	 -> this 
	 * save the changes to the source. */
	Apply:		function(){
		this.source 	= this.outputContext.getImageData(0, 0, this.width, this.height);
		this.resource 	= this.outputContext.getImageData(0, 0, this.width, this.height);
		if(this.autoUpdate) this.Draw();
		return this;
	},
	/* Reset()	 -> this
	 * reset the image to the original values (undo all manipulations). */
	Reset:		function(){
		this.resource = this.inputContext.getImageData(0, 0, this.width, this.height);
		if(this.autoUpdate) this.Draw(this.source);
		return this;
	},
	/* DOM(element?:<dom>)	 -> Bool?<canvas>
	 * returns the <canvas> DOM element or appends it to the passed element. */
	DOM:		function(element){
		this.Draw();
		if(element){
			var output = this.output;
				output.className = this.className;
			element.appendChild(output);
			return true;
		} else {
			return this.output;
		}
	},
	/* Throw(message:String) -> this
	 * internal error reporting function. */
	Throw:		function(message){
		if(this.development === 'throw') throw(message);
		else this.development(message);
		return this;
	},
	/* Warn(message:String) -> this
	 * internal warning reporting function. */
	Warn:		function(message){
		if(console && console.log) console.log(message);
		return this;
	},
	/* isReady() -> Bool
	 * return true or false and throws an error if a callee is passed. */
	isReady:	function(callee, withArguments){
		if(!this.ready){
			if(callee && this.autoUpdate){
				this.Warn(callee + " called before ready. Added to Queue.");
				this.queue.push([callee, withArguments]);
			} else if(callee){
				this.Warn(callee + " called before ready. Use callback to ensure readiness or add autoUpdate to allow queueing of manipulations.");
			}
			return false;
		} else {
			return true;
		}
	},
	
	
	
	
	/***********************************************************/
	/*********************** Manipulations *********************/
	/***********************************************************/
	
	/* Blur(radius:Int:%2=0)	 -> this
	 * Blurs by radius amount (radius needs to be even). */
	Blur:		function(radius){
	
		if(!this.isReady('Blur', arguments)) return;
	
		if(!radius || isNaN(radius))
			return this.Throw("Blur @param radius:Int is required.");
		if(radius%2)
			return this.Throw("Blur @param radius:Int needs to be even.");
		
		radius 		= parseInt(radius, 10);
		
		if(radius > 5) 
			this.Warn("Blur @param radius:Int is large and may cause slowdown.");
			
		var blur	 = 1 / ((radius+1) * (radius+1));
		
		for(var e = 0; e < this.resource.data.length; e+=4){
			var a = [0,0,0,255];
			for(var y = -radius/2; y <= radius/2; y++){
			for(var x = -radius/2; x <= radius/2; x++){
				var position = e - (this.width * y + x) * 4;
				for(var rgba = 0; rgba < 3; rgba++){
					if(this.resource.data[position+rgba]) 
						a[rgba] += this.resource.data[position+rgba] * blur;
					else a[rgba] += 255 * blur;
				}
			}}
			for(var rgba = 0; rgba < 4; rgba++){
				this.resource.data[e+rgba] = a[rgba];
			}
		}
		if(this.autoUpdate) this.Draw();
		return this;
	},
	/* GrayScale([forHumans:Bool])		 -> this
	 * Turn into grayscale. `forHumans` uses different values for human perception. */
	GrayScale:	function(forHumans){
	
		if(!this.isReady('GrayScale', arguments)) return;
		return this.Desaturate(100, forHumans);
		
	},
	/* Desaturate(percentage:Int, [forHumans:Bool])		 -> this
	 * Equalise r, g and b values to the average by the passed percentage. */
	Desaturate:	function(percentage, forHumans){
	
		if(!this.isReady('Desaturate', arguments)) return;
	
		if(!percentage || isNaN(percentage))
			return this.Throw("Desaturate @param percentage:Int is required.");
		
		percentage 		= parseInt(percentage, 10);
		percentage		= percentage > 100 	? 100 	: percentage;
		percentage		= percentage < 0 	? 0 	: percentage;
		
		forHumans = forHumans
			? [.3,.4,.3]
			: [(1/3),(1/3),(1/3)];
			
		for(var p = 0; p < this.resource.data.length; p+=4){
			var avg = 0;
			for(var i = 0; i < 3; i++){
				avg += this.resource.data[p+i] * forHumans[i];
			}
			for(var i = 0; i < 3; i++){
				this.resource.data[p + i] = Math.round(this.resource.data[p + i] + (avg - this.resource.data[p + i]) / 100 * percentage);
			}
		}
		if(this.autoUpdate) this.Draw();
		return this;
		
	},
	/* Channel(channel:Char:r,g,b,a)		 -> this
	 * Display channel in single color. Accepts `r`,`g`,`b` or `a`. */
	Channel:	function(channel){
	   
		if(!this.isReady('Channel', arguments)) return;
		
		if(channel == 'r') channel = 0;
		if(channel == 'g') channel = 1;
		if(channel == 'b') channel = 2;
		if(channel == 'a') channel = 3;
		if(channel != 0 && channel != 1 && channel != 2 && channel != 3)
			return this.Throw('Channel has to be either r, g, b or a');
		for(var i = 0; i < this.resource.data.length; i += 4){
			var alpha				= channel == 3 ? this.resource.data[i+3]	 : 0;
			this.resource.data[i]	= channel == 0 ? this.resource.data[i]		 : alpha;
			this.resource.data[i+1] = channel == 1 ? this.resource.data[i+1]	 : alpha;
			this.resource.data[i+2] = channel == 2 ? this.resource.data[i+2]	 : alpha;
			this.resource.data[i+3] = 255;
		}
		if(this.autoUpdate) this.Draw();
		return this;
	},
	/* Custom(fn:Function)		 -> this
	 * Execute cutstom drawing function. Cannot be called before ready. */
	Custom: function(fn){
		if(!this.isReady()){
			this.Throw('Cannot queue Custom function. Only use in callback.');
			return this;
		}
		try {
			fn.bind(this)();
		} catch(e){
			this.Throw(e);
		}
		return this;
	},
	
	
	
	/***********************************************************/
	/********************** Beta Functions *********************/
	/***********************************************************/
	
	/* BrightnessScale(treshold:Int:0-255,angle:Int:0-359) 	-> this
	 * Find gradient map at certain angle and display in B/W. */
	BrightnessScale: 	function(treshold, angle){
		
		this.Warn("BrightnessScale is under development! Use at your own risk.");
		
		if(!this.isReady('BrightnessScale', arguments)) return;
	
		if(!treshold || isNaN(treshold) || treshold > 255 || treshold < 0)
			return this.Throw("BrightnessScale @param treshold:Int[0-255] is required.");
	
		if(!treshold || isNaN(angle) || angle > 359 || angle < 0)
			return this.Throw("BrightnessScale @param angle:Int[0-359] is required.");
		
		var Self = this;
		
		// Convert to GrayScale
		this.GrayScale(true);
		
		var map = this.Support.BrightnessMap([], treshold, angle, function(sudden, id){
			if(sudden === true){
				Self.resource.data[id * 4] = 0;
				Self.resource.data[id * 4 + 1] = 0;
				Self.resource.data[id * 4 + 2] = 0;
				Self.resource.data[id * 4 + 3] = 255;
			} else if(sudden === false){
				Self.resource.data[id * 4] = 255;
				Self.resource.data[id * 4 + 1] = 255;
				Self.resource.data[id * 4 + 2] = 255;
				Self.resource.data[id * 4 + 3] = 255;
			} else {
				Self.resource.data[id * 4] = 255;
				Self.resource.data[id * 4 + 1] = 255;
				Self.resource.data[id * 4 + 2] = 255;
				Self.resource.data[id * 4 + 3] = 255;
			}
		});
		
		//console.log(map);
		
		if(Self.autoUpdate) Self.Draw();
		
		return this;
	},
	/* BrightnessScaleMapper(treshold:Int:0-255) 	-> Array
	 * Finds and returns gradient map four angles (0,45,90,180). */
	BrightnessScaleMapper: function(treshold){
		
		this.Warn("BrightnessScaleMapper is under development! Use at your own risk.");
		
		if(!this.isReady('BrightnessScaleMapper', arguments)) return;
	
		if(!treshold || isNaN(treshold) || treshold > 255 || treshold < 0)
			return this.Throw("BrightnessScaleMapper @param treshold:Int[0-255] is required.");
		
		var map = {};
		
		this.Support.BrightnessMap(map, treshold, 0);
		this.Support.BrightnessMap(map, treshold, 45);
		this.Support.BrightnessMap(map, treshold, 90);
		this.Support.BrightnessMap(map, treshold, 180);
		
		return map;
		
	},
	
	
	/***********************************************************/
	/********************* Support Functions *******************/
	/***********************************************************/
	
	Support: {
		Self: false,
		/* getPixelFromOffset(offset:Int) 	-> Int
		 * Get ID of the pixel by passing it the Uint8ClampedArray offset. */
		getPixelIdFromOffset: 	function(offset){
			return offset / 4;
		},
		/* getPixelOffsetFromId(id:Int) 	-> Int
		 * Get offset of the pixel by passing it the id. */
		getPixelOffsetFromId: 	function(id){
			return id * 4;
		},
		/* getPixelFromOffset(offset:Int[, fromResource:Bool]) 	-> [r,g,b,a]
		 * Get the r,g,b,a values from pixel bassed on Uint8ClampedArray offset. */
		getPixelFromOffset: 	function(offset, fromResource){
			if(fromResource) return [Self.resource.data[offset],Self.resource.data[offset+1],Self.resource.data[offset+2],Self.resource.data[offset+3]];
			else return [Self.source.data[offset],Self.source.data[offset+1],Self.source.data[offset+2],Self.source.data[offset+3]];
		},
		/* getPixelFromOffset(id:Int[, fromResource:Bool]) 	-> [r,g,b,a]
		 * Get the r,g,b,a values from pixel bassed on the id. */
		getPixelFromId: 		function(id, fromResource){
			return this.getPixelFromOffset(this.getPixelOffsetFromId(id), fromResource);
		},
		/* setPixelWithOffset(offset:Int, rgba:[r,g,b,a][, inResource:Bool]) -> Bool
		 * Set the r,g,b,a values from pixel bassed on the Uint8ClampedArray offset. */
		setPixelWithOffset: 	function(offset, rgba, inResource){
			if(inResource){
				for(var i = 0; i < 4; i++){
					Self.resource.data[offset + i] = rgba[i];
				}
			} else {
				for(var i = 0; i < 4; i++){
					Self.source.data[offset + i] = rgba[i];
				}
			}
		},
		/* setPixelWithId(id:Int[, fromResource:Bool]) 	-> [r,g,b,a]
		 * Set the r,g,b,a values from pixel bassed on the id. */
		setPixelWithId: 		function(id, rgba, inResource){
			this.setPixelWithOffset(this.getPixelOffsetFromId(id), rgba, inResource);
		},
		/* getPixelAtAxisFromPixel(id:Int, angle:Int:n%45=0]) 	-> Int
		 * Get the id of the pixel at the cardinal direction from the passed pixel. */
		getPixelAtAxisFromPixel: function(id, angle){
			var add, angle, addLine, Self;
			Self = this.Self || {width: 0};
			angle = angle%360;
			if(angle%45) Self.Warn("getPixelAtAxisFromPixel @angle:Int[45*n] converted to Axis");
			angle = Math.round(angle / 45) * 45;
			switch(angle){
				case 0:	 	add = 1; break;
				case 45:	add = Self.width + 1; break;
				case 90:	add = Self.width; break;
				case 135:   add = Self.width - 1; break;
				case 180:   add = -1; break;
				case 225:   add = -Self.width - 1; break;
				case 270:   add = -Self.width; break;
				case 315:   add = -Self.width + 1; break;
				case 360:   add = 1; break;
				default:	add = 0;
			}
			add = id + add;
			// Check whether there is a linedifference of more than 2 (edge-case)
			id = Math.floor(id / Self.width);
			addLine = Math.floor(add / Self.width);
			var linedifference = id - addLine;
			if(linedifference < -2 || linedifference > 2){
				return false;
			} else {
				return add;
			}
		},
		/* BrightnessMap(id:Int, angle:Int:n%45=0]) 	-> Array
		 * Returns or amends the passed array with brightness change values that are over (or under) the treshold. */
		BrightnessMap:	function(map, treshold, angle, callback){
			
			if(!this.Self)
				throw("Support.Self undefined. Error on Init()?");
			else var Self = this.Self;
			
			if(!map) 		map = new Array();
			if(!callback) 	callback = function(){};
	
			if(!treshold || isNaN(treshold) || treshold > 255 || treshold < 0)
				return Self.Throw("BrightnessMap @param treshold:Int[0-255] is required.");
	
			if(!treshold || isNaN(angle) || angle > 359 || angle < 0)
				return this.Throw("BrightnessMap @param angle:Int[0-359] is required.");
		
			Self.GrayScale(true);
			
			var id = 0;
			
			for(var p = 0; p < Self.source.data.length; p += 4){
			
				var atAngle = Self.Support.getPixelAtAxisFromPixel(id, angle);
				
				id++;
				
				if(!atAngle || atAngle < 0) continue;
				else atAngle *= 4;
				var difference 		= Self.source.data[atAngle] - Self.source.data[p];
				var suddenChange 	= !(difference < treshold && difference > -treshold);
				if(
					atAngle && !suddenChange
				){
					callback(false, id);
				} else if(atAngle && suddenChange){
				
					if(!map[id]) map[id] = {};
					
					map[id][angle] = difference;
					
					callback(true, id);
					
				} else {
					callback(null, id);
				}
			}
			return map;
		}
	}
	
	
};