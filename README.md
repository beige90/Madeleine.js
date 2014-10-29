# Madeleine.js

Madeleine.js is a 3D Model parser & renderer for STL files (ASCII and binary both). 

Madeleine.js uses [Three.js (r68)](http://github.com/mrdoob/three.js) as its 3D Engine, and was inspired by the demo code of [tonylukasavage](https://github.com/tonylukasavage/jsstl).

Madeleine.js is smart enough to distinguish whether stl files are ASCII or binary, and is able to create and handle multiple 3D model viewers (WARNING: Multiple rendering may slow down the speed). Also, Madeleine.js helps you to immediately render any stl file as you upload!

## Features

- Parse, render and visualize STL format files.
- Automatically distinguish binary and ASCII, and parse it properly.
- Accept STL file from external url or user file upload.
- Support rendering multiple models (also multi upload).
- Provide various themes for model viewer.
- Allow user to interact with the model via mouse actions.
- Support capturing the rendered 3D model (Implementing)
- Support downloading the original stl file (Implementing)
- Support different viewpoint (Implementing)
- Support fullscreen mode (Implementing)
- And more features will be added later!


## DEMO

Visit [DEMO Website](http://jinjunho.github.io/Madeleine.js/) to see the demo!

For developers, [download](https://github.com/JinJunho/Madeleine.js/archive/master.zip) or clone this repository and locate it on your web server root. You can check working demo by visiting **repo/examples/index.html** from your browser. Download any stl file and see how well it works!

## Getting Started 

First, include resources into <head> element of your code.

```html
<link href="src/css/Madeleine.css" rel="stylesheet">
<script src="src/lib/stats.js"></script>
<script src="src/lib/detector.js"></script>
<script src="src/lib/three.min.js"></script>
<script src="src/Madeleine.js"></script>
```

### 1. Immediate File Upload

All you need to do is simply asking Lily (is Madeleine's sister) to get ready for file upload. She will take care of taking files, parsing, rendering and visualizing them.

```html
<form id="myForm" name="myForm">
    <input type="file" id="myForm" name="myForm" multiple>
</form>
<div id="target"></div>

<script>
window.onload = function(){
    Lily.ready({
        target: 'target',  // target div id
        file: 'files',  // file input id
        path: '../src' // path to source directory from current html file
    });
}; 
</script>
```

### 2. Render from file path

If you know the url or path to the stl file, call Madeleine directly with target div id and the file path.

```html
<div id="target" class="madeleine"></div>

<script>
window.onload = function(){
    var madeleine = new Madeleine({
      target: 'target', // target div id
      data: 'path/to/file.stl', // data path
      path: '../src' // path to source directory from current html file
    });
}; 
</script>
```

## License

This code is under [MIT License](http://choosealicense.com/licenses/mit/). You can do anything you want with my code, as long as you leave the attribution. It will be grateful if you contact me for interesting ideas to do with Madeleine.js. I'm willing to co-work with you!

## Who am I?

I'm [Junho Jin](http://plrg.kaist.ac.kr/jjh) :)
