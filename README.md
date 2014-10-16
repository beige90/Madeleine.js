# Madeleine.js

Madeleine.js is a 3D Model parser & renderer for STL files (ASCII and binary both). 

Madeleine.js uses [Three.js](http://github.com/mrdoob/three.js) as its 3D Engine, and is based on the demo code of [tonylukasavage](https://github.com/tonylukasavage/jsstl). If you read through his code first, you will have a big picture of how Madeleine.js is designed.

Madeleine.js is smart enough to distinguish whether stl files are ASCII or binary, and is able to create and handle multiple 3D model viewers(fixing bugs...). Also, Madeleine.js helps you to immediately render any stl file as you upload.

## DEMO

[Download](https://github.com/JinJunho/Madeleine.js/archive/master.zip) or Clone this repository and locate it on your web server root. You can check working demo by visiting **repo/examples/index.html** from your browser. Download any stl file and see how well it works!

## Getting Started 

First, include libraries and Madeleine.js into your code. If you want prettier viewer, include Madeleine.css too.

```html
<link rel="stylesheet" href="css/Madeleine.css">
<script src="js/libraries/detector.js"></script>
<script src="js/libraries/three.min.js"></script>
<script src="js/Madeleine.js"></script>
```

### 1. Immediate File Upload

All you need to do is simply asking Lily (Madeleine's sister) to get ready for file upload. She will take care of taking files, parsing, rendering and showing them.

```html
<form id="myForm" name="myForm">
    <input type="file" id="myForm" name="myForm" multiple>
</form>
<div id="target" class="madeleine"></div>

<script>
window.onload = function(){
    Lily.ready('files', 'target'); // id of file input, id of container element
}; 
</script>
```

### 2. Render from file path

If you know the url or path to the stl file, call Madeleine directly with type (in this case, 'file') and the file path. Don't forget to pass the Id of target Element when you initialize Madeleine!

```html
<div id="target" class="madeleine"></div>

<script>
window.onload = function(){
    var madeleine = new Madeleine('target'); // id of target div
    madeleine.draw(
        'file', // specify draw type
        'path/to/file.stl' // data path
    ); 
}; 
</script>
```

## License

This code is under [MIT License](http://choosealicense.com/licenses/mit/). You can do anything you want with my code, as long as you leave the attribution. It will be grateful if you contact me for interesting ideas to do with Madeleine.js. I'm willing to co-work with you!

## Who am I?

My name is [Junho Jin](http://plrg.kaist.ac.kr/jjh) and I'm a newbie programmer :)

## Who are Madeleine and Lily?

[Lily and Madeleine](http://lilandmad.com) are one of my favourite singers. As a fan, I named this project after their names (hope they know it!).

This is my fuel for developing this project :)

[![Lily and Madeleine - Fumes](http://img.youtube.com/vi/hZIci_KmtbY/0.jpg)](http://youtu.be/hZIci_KmtbY)
