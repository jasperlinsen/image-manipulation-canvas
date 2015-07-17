/* License: MIT 
 * http://www.github.com/jasperlinsen/image-manipulation-canvas/LICENSE.md */

/***************************************************************/
/************** Canvas ImageManipulation Library ***************/
/***************************************************************/

"use strict";

var ImageManipulation = {
	/* Canvas(options:Dictionary)		 -> ImageManipulation.Canvas
	 * ImageManipulation Canvas constructor */
	Canvas:		function ImageManipulation(options){
	
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
		for(var i = 0; i < elements.length; i++){
			var element, src;
			var element = elements.item(i);
			var src		= element.getAttribute("data-src") || element.getAttribute("src") || false;
			var className = element.getAttribute("className") || '';
			if(!src) continue;
			result.push(new ImageManipulation.Canvas({
				image: src,
				className: className,
				callback: function(Image){
					element.parentNode.insertBefore(Image.DOM(), element);
					element.parentNode.removeChild(element);
					
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
							Image[manipulation[0]].apply(Image, argument);
						} else {
							throw("Static @element manipulation ('" + manipulation + "') is not a function.)");
						}
					}
				},
				autoUpdate: true
			}));
			return result;
		};
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
		
		this.source		  = copy.source   || this.inputContext.getImageData(0, 0, this.width, this.height);
		this.resource		= copy.resource || this.inputContext.getImageData(0, 0, this.width, this.height);
		
		this.Support.Self   = this;
		
		this.ready		  = true;
		
		if(!copy && this.queue.length){
			for(var i = 0; i < this.queue.length; i++){
				if(this.queue[i] && this[this.queue[i][0]] instanceof Function){
					var args = this.queue[i][1] ? this.queue[i][0] : [];
					this[this.queue[i][0]].call(this, args);
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
	/* Draw()	 -> this 
	 * update the canvas. */
	Draw:		function(){
		if(this.resource){
			this.outputContext.putImageData(new ImageData(
				this.resource.data, this.width, this.height
			), 0, 0);
		}
		return this;
	},
	/* Apply()	 -> this 
	 * save the changes to the source. */
	Apply:		function(){
		this.source = this.resource;
		if(this.autoUpdate) this.Draw();
		return this;
	},
	/* Reset()	 -> this
	 * reset the image to the original values (undo all manipulations). */
	Reset:		function(){
		this.resource = this.source;
		if(this.autoUpdate) this.Draw();
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
		
		if(radius > 5) 
			this.Warn("Blur @param radius:Int is large and may cause slowdown.");
			
		var blur	 = 1 / ((radius+1) * (radius+1));
		for(var e = 0; e < this.source.data.length; e+=4){
			var a = [0,0,0,255];
			for(var y = -radius/2; y <= radius/2; y++){
			for(var x = -radius/2; x <= radius/2; x++){
				var position = e - (this.width * y + x) * 4;
				for(var rgba = 0; rgba < 3; rgba++){
					if(this.source.data[position+rgba]) 
						a[rgba] += this.source.data[position+rgba] * blur;
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
		
		forHumans = forHumans
			? [.3,.4,.3]
			: [(1/3),(1/3),(1/3)];
			
		for(var p = 0; p < this.source.data.length; p+=4){
			var avg = 0;
			for(var i = 0; i < 3; i++){
				avg += this.source.data[p+i] * forHumans[i];
			}
			for(var i = 0; i < 3; i++){
				this.resource.data[p + i] = Math.round(this.source.data[p + i] + (avg - this.source.data[p + i]) / 100 * percentage);
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
		for(var i = 0; i < this.source.data.length; i += 4){
			var alpha				= channel == 3 ? this.source.data[i+3]	 : 0;
			this.resource.data[i]	 = channel == 0 ? this.source.data[i]		 : alpha;
			this.resource.data[i+1] = channel == 1 ? this.source.data[i+1]	 : alpha;
			this.resource.data[i+2] = channel == 2 ? this.source.data[i+2]	 : alpha;
			this.resource.data[i+3] = 255;
		}
		if(this.autoUpdate) this.Draw();
		return this;
	},
	
	
	/***********************************************************/
	/********************* Support Functions *******************/
	/***********************************************************/
	
	Support: {
		Self: false,
		getPixelAtAxisFromPixel: function(id, angle){
			var add, angle, addLine, Self;
			Self = this.Self || {width: 0};
			angle = angle%360;
			if(angle%45) Self.Warn("getPixelAtAxisFromPixel @angle:Int[45*n] converted to Axis");
			angle = Math.round(angle / 45) * 45;
			switch(angle){
				case 0:	 add = 1; break;
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
			if(addLine < id-1 || addLine > id+1){
				return false;
			} else {
				return add;
			}
		}
	}
	
	
};