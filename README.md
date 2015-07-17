# Javascript Image Manipulation With Canvas

ImageManipulation is a simple Javascript library (without dependencies) that can be used to manipulate images in certain ways by replacing them with canvas elements and manipulating their direct source content. It is in many ways an experiment to learn how to manipulate images and image data itself, but can be very useful to support IE for browser `filter` effects. Over time I hope this can expand to include better ways to redraw images, and to include more effects as well as some basic Computer Vision capabilities.

## Implementation

First of, you will have to include the `imageManipulation.min.js` file. You can do this either in your `<head>` tag or just before the closing `</body>` tag.

```html
<script type="text/javascript" src="build/imageManipulation.min.js"></script>
```

### Using DOM elements

There are two ways you can use ImageManipulation, the easiest of which is by using the DOM itself to designate elements to be changed by adding a `data-manipulate` attribute to them.

```html
<img src="path/to/myImage.jpg" data-manipulate="GrayScale" />
``` 

After this, all you need to do is call the `Init` method. Insert the following lines before the closing `</body>` tag (make sure it is placed _after_ your inclusion of the `imageManipulation.min.js` script):

```javascript
<script>ImageManipulation.Init();</script>
```

You can add multiple manipulations (applied in order of appearance) by adding more data-manipulate attributes to your element, appending a `-n`:

```html
<img src="path/to/myImage.jpg" data-manipulate="GrayScale" data-manipulate-2="Desaturate(50)" />
```

Passing arguments is the same as calling a function, just include the arguments in between `(` and `)`. Use your console to see if errors are thrown, and check out the documentation below to see what functions are available. If you want to use an alternative resource (if, for example, you want to use a loading image that gets replaced by a high-resolution one), use the `data-src` attribute to assign a different source. If no `data-src` is found, it will look for `src`, if that is not found, the script will ignore the element.

```html
<img src="path/to/loader.gif" data-src="path/to/highResImage.jpg" data-manipulate="GrayScale" data-manipulate-2="Desaturate(50)" />
```

### Using Javascript

With Javascript, you get a lot more versatility. You have the choice of two basic syntaxes. There is one with a callback:

```javascript
var myImage = new ImageManipulation.Canvas({
	image: "path/to/image.jpg",
	callback: function(Image){
		Image.DOM(document.body);
	}
});
```

And one without a callback: 

```javascript
var myImage = new ImageManipulation.Canvas({image: "path/to/image.jpg",});
myImage.DOM(document.body);
```

They are in essence the same, but the callback will only be executed when the image was successfully loaded, guaranteeing that whatever manipulations done afterwards are going to work. The syntax that omits the callback will queue any of the changes made to the object and apply them as soon as the image is loaded.

Important to note is that if the `autoUpdate` option is passed as `false`, queueing will be disabled and an error will be thrown. If you use  a callback, but still run some manipulations outside of it and before the load has completed, it will also be added to the queue and executed _before_ the `callback`.

After that, it is simple to chain the preferred manipulations:

```javascript
var myImage = new ImageManipulation.Canvas({
	image: "path/to/image.jpg",
	callback: function(Image){
		myImage.Desaturate(20).Channel('r').Blur(2).DOM(document.body);
	}
});
```

### Combining Both

You can, however, combine both if you want to, as the `ImageManipulation.Init()` static functions returns an array of `ImageManipulation.Canvas` objects. All these support the same features as the purely javascript based ones (they are the same instances) but they default to Queuing as no `callback` can be defined in the DOM.

```javascript
var canvasImages = ImageManipulation.Init();
canvasImages.forEach(function(Image){
	Image.Desaturate(70);
});
```

## Initialiser Options

#### image
`[String, !required]`  
Path to the image.  
**DOM-based:** Uses either `data-src` or `src` attribute in DOM element.

#### callback
`[Function]`  
Path to the image. Receives 1 argument containing the ImageManipulation.Canvas
**DOM-based:** Uses either `data-src` or `src` attribute in DOM element.

#### development  
`[Function || throw]`  
Function to pass error messages to. Defaults to `throw`. Receives 1 argument containing the message string.  
**DOM-based:** Will only `throw` errors.

#### className  
`[String]`  
Define classes that the canvas should inherit.  
**DOM-based:** Defaults to classes applied to DOM element.

#### autoUpdate
`[Bool || true]`  
Set if you want to image to automatically update upon changes or only when calling `Draw()`.  
**DOM-based:** Cannot be changed DOM based.

## ImageManipulation.Canvas Manipulations

#### Blur  
`Blur([radius:Int:n%2=0]) -> this`  
Blurs the image by the given radius.  
**DOM-based:** `data-attribute="Blur(radius)"`

#### GrayScale  
`GrayScale([forHumans:Bool]) -> this`  
Desaturate the image 100% (equals `Desaturate(100)`). Pass `forHumans` to adjust the graytones to be more palatable for the human eye (more green, less red and blue).  
**DOM-based:** `data-attribute="GrayScale"`

#### Desaturate  
`Desaturate(amount:Int:0<n<100) -> this`  
Equalise the r,g,b values by the passed percentage based amount.  
**DOM-based:** `data-attribute="Desaturate(amount)"`

#### Channel  
`Channel(channel:String:=r||g||b||a) -> void`  
Only display one of the color channels.  
**DOM-based:** `data-attribute="Channel(r)"`

## ImageManipulation.Canvas Core Functions

#### Init  
`Init([copy:Imagemanipulation.canvas]) -> void`  
gets called automatically. Initialises all values and resources.`Draw()`.  
**DOM-based:** Automatically called.

#### Copy  
`Copy()	 -> ImageManipulation`  
Returns a new copy of this instance.  
**DOM-based:** Not available.

#### Draw  
`Draw([source:Bool])	 -> this`  
Update the canvas. Pass source as boolean to draw the source canvas.  
**DOM-based:** Not available.

#### Apply  
`Apply()	 -> this`  
Save the changes to the source (does not update the file, just the source of the instance).  
**DOM-based:** Not available.

#### Reset   
`Reset()	 -> this`  
Reset any changes to the source.  
**DOM-based:** Not available.

#### Dom  
`DOM([element:<domElement>])	 -> Bool?<canvas>`  
Append the canvas element to the passed element and return `true` _or_ returns the canvas element if no element is passed.  
**DOM-based:** Not available.

#### Throw  
`Throw(message:String)	 -> this`  
Internal error reporting function.  
**DOM-based:** Not available.

#### Warn  
`Warn(message:String)	 -> this`  
Internal warning reporting function.  
**DOM-based:** Not available.

#### isReady  
`isReady([callee:String, withArguments:arguments?Array])	 -> Bool`  
Returns true if ready, false when not. If callee is included, that function name will be added to the queue and executed with the myArguments when the queue gets executed.  
**DOM-based:** Not available.

## ImageManipulation.Canvas Beta Functions

As this library expands, some features pushed might not be fully tested yet. The following functions have working implementations, but are not checked and don't have a great deal of utility. These features are trying to pave the path for future implementations.

**Beta functions are not necessarily in the final build yet. Beta functions will also warn you that they are beta: 'Function is under development! Use at your own risk.'**

#### BrightnessScale  
`BrightnessScale(treshold:Int:0-255,angle:Int:0-359) 	-> this`  
Find gradient map at certain angle and display in B/W.  
**DOM-based:** `data-attribute="BrightnessScale(treshold, angle)"`

#### BrightnessScaleMapper  
`BrightnessScaleMapper(treshold:Int:0-255) 	-> Array`  
Finds and returns gradient map at four angles (0,45,90,180). The returned array is structured as followed: `pixelId => (angle => brightnessDifference[, angle => brightnessDifference, ...])`  
**DOM-based:** Not available.

## ImageManipulation.Canvas Support Functions

Support function are smaller functions and never return `this`. They are used internally by functions, and should rarely be accessed from outside. On `Init`, the `Support` object will get `this` assigned to `Self`, so any usual operation can be performed using `this.Self`. The support functions are not listed here, but check out the source to find out more about them.