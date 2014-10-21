/**
 * @author    Junho Jin[junho.jin@kaist.ac.kr] | https://github.com/JinJunho
 * @version   0.9.5
 *
 * [Project] Madeleine.js, Pure JavaScript STL Parser & Renderer. 
 *
 * [Description] Madeleine.js constists of three part: DataReader, Madeleine and Lily. 
 * DataReader is a helper function to read binary data, which is a customized version
 * of DataView. Lily is a helper Object that manages created Madeleines and logs 
 * messages to console. Madeleine is the part that deals with actual parsing, rendering
 * and showing your stl files. Customize them however you want. This project is under
 * MIT License (see the LICENSE file for details). You are allowed to do anything with
 * this code, as long as you leave the attribution (MUST!). It will be glad if you 
 * contact me for any bug you found or interesting ideas to do with Madeleine.js.
 * I'm willing to co-work with you!
 */


(function() {

  // Source: http://threejs.org/examples/js/loaders/STLLoader.js 
  // In case DataView is not supported from the browser, create it.
  // if (typeof DataView === 'undefined') {
  //   var newScript = document.createElement('script');
  //   newScript.setAttribute("type", "text/javascript");
  //   newScript.setAttribute("src", "libraries/dataview.js");
  //   document.getElementsByTagName('head').appendChild(newScript);
  // }

  // Message alias
  var SAY_HI                = "START";
  var DONE_LOAD             = "LoadDone";
  var ALL_FINISHED          = "DrawDone";
  var LOG_DISABLED          = "DisableLog";
  var LOG_ENABLED           = "EnableLog";
  var TYPE_CHECK            = "TypeCheck";
  var DONE_TYPE_CHECK       = "TypeCheckDone";
  var PARSE_PROCESS         = "ParsingBegin";
  var PARSE_SUCCESS         = "ParseSTLDone";
  var WORK_QUEUED           = "WorkQueued";
  var FLUSH_QUEUE           = "QueueFlushed";
  var PROCESS_QUEUE         = "QueueProcess";
  var DRAW_START            = "StartDraw";
  var PARSE_START           = "StartParse";
  var RENDER_CREAT          = "RenderCreated";
  var VIEWER_CREAT          = "ViewerCreated";
  var RENDER_ERROR          = "RenderLater";
  var VIEWER_ERROR          = "ViewerLater";
  var VIEWER_EXISTS         = "ViewerAgain";
  var DATA_GET_SUCCESS      = "DataReceived";
  var AJAX_SUCCESS          = "AjaxDataReceived";
  var AJAX_FAIL             = "AjaxFailed";
  var DONE_DRAW             = "DrawFinished";
  var TIME_CONSUMED         = "TimeConsumed";
  var EVENT_ATTACHED        = "EventAttached";
  var INVALID_TARGET        = "TargetInvalid";
  var INVALID_OPTION        = "OptionInvalid";
  var INVALID_OPTION2       = "OptionInvalid2";
  var INVALID_DRAW_TYPE     = "InvalidDrawType";
  var FILEAPI_NOT_SUPPORTED = "NoFileAPI";

  // Custom Data Reader.
  // Caution: May exceeds the size limit.
  var DataReader = function(binary) {
    this.idx = 0; // in bytes
    this.data = binary;
    this.buffer = null;
    this.reader = new DataView(binary); 
    this.littleEndian = true;

    // Helper functions
    this.skip         = function(idx) { this.idx += idx };
    this.reset        = function() { this.idx = 0 };
    this.getLength    = function() { return this.data.byteLength };
    this.getCurrIndex = function() { return this.idx };

    // Simply get the data at specified index.
    this.getInt8      = function(idx) { return this.reader.getInt8(idx, this.littleEndian) };
    this.getInt16     = function(idx) { return this.reader.getInt16(idx, this.littleEndian) };
    this.getInt32     = function(idx) { return this.reader.getInt32(idx, this.littleEndian) };
    this.getUInt8     = function(idx) { return this.reader.getuint8(idx, this.littleEndian) };
    this.getUInt16    = function(idx) { return this.reader.getUint16(idx, this.littleEndian) };
    this.getUInt32    = function(idx) { return this.reader.getUint32(idx, this.littleEndian) };
    this.getFloat32   = function(idx) { return this.reader.getFloat32(idx, this.littleEndian) };
    this.getFloat64   = function(idx) { return this.reader.getFloat64(idx, this.littleEndian) };

    // Read the data from the current index.
    // After reading the data, the index moves as much the data read.
    this.readInt8 = function() { 
      this.buffer = this.reader.getInt8(this.idx, this.littleEndian);
      this.idx += 1; return this.buffer;
    };
    this.readInt16 = function() { 
      this.buffer = this.reader.getInt16(this.idx, this.littleEndian);
      this.idx += 2; return this.buffer;
    };
    this.readInt32 = function() { 
      this.buffer = this.reader.getInt32(this.idx, this.littleEndian);
      this.idx += 4; return this.buffer;
    };
    this.readUInt8 = function() { 
      this.buffer = this.reader.getUint8(this.idx, this.littleEndian);
      this.idx += 1; return this.buffer;
    };
    this.readUInt16 = function() { 
      this.buffer = this.reader.getUint16(this.idx, this.littleEndian);
      this.idx += 2; return this.buffer;
    };
    this.readUInt32 = function() { 
      this.buffer = this.reader.getUint32(this.idx, this.littleEndian);
      this.idx += 4; return this.buffer;
    };
    this.readFloat32 = function() { 
      this.buffer = this.reader.getFloat32(this.idx, this.littleEndian);
      this.idx += 4; return this.buffer;
    };
    this.readFloat64 = function() { 
      this.buffer = this.reader.getFloat64(this.idx, this.littleEndian);
      this.idx += 8; return this.buffer;
    };
  };


  // Madeleine constructor
  window.Madeleine = function(options) {


    var Madeleine;


    // Constants for default setting
    var OBJECT_MATERIAL   = "skin"; 
    var OBJECT_STATUS     = false;
    var OBJECT_COLOR      = [255, 255, 255]; 
    var OBJECT_PLANE      = false;
    var OBJECT_PLANEWIRE  = false;

    var CAMERA_SIGHT     = 45;
    var CAMERA_NEARFIELD = 1;
    var CAMERA_FARFIELD  = 100000;

    var VIEWER_THEME  = "lime";
    var VIEWER_PREFIX = "mad-";
    var VIEWER_CREATE = true;
    var VIEWER_HEIGHT = 400;
    var VIEWER_WIDTH  = 640;

    var USER_ROTATE_SENSITIVITY = 0.009;
    var USER_ZOOM_SENSITIVITY   = 100;


    // Necessary option check 
    if (!document.getElementById(options.target)) {
      Lily.log(INVALID_TARGET);
      return null;
    } else if (!options.data) {
      Lily.log(INVALID_OPTION);
      return null;
    }


    // Construct new Madeleine
    Madeleine = function(options) {

      // Internal properties
      this.__id           = Lily.push(this);
      this.__containerID  = options.target;
      this.__timer        = {start: (new Date).getTime(), end: null};
      this.__workQueue    = [];

      // About 3d model
      this.__data = null;
      this.__info = null;
      this.__stats = null;
      this.__object = null;

      // About visualization
      this.__pov    = null;
      this.__plane  = null;
      this.__scene  = null;
      this.__camera = null;
      this.__viewer = null;

      this.__ambientLight     = null;
      this.__directionalLight = null;

      // About rendering
      this.__geometry = null;
      this.__renderer = null;

      // About camera view
      this.__width     = null;
      this.__height    = null;
      this.__sizeRatio = 1;

      // About user interaction
      this.__zoomable  = true;
      this.__rotatable = true;
      this.__rotating  = false;

      // Crucial properties to render 3d model
      this.data = options.data;
      this.type = options.type ? options.type : 'file';
      this.container = document.getElementById(this.__containerID);
      this.container.innerHTML = "";

      // User configuration 
      this.options = Lily.extend({}, { // Default option
        material   : OBJECT_MATERIAL,
        showStatus : OBJECT_STATUS,
        objectColor : OBJECT_COLOR,
        viewer : {
          create  : VIEWER_CREATE,  // Create new viewer?
          height  : VIEWER_HEIGHT,  // Viewer height
          width   : VIEWER_WIDTH,   // Viewer width
          theme   : VIEWER_THEME,   // Viewer theme
          prefix  : VIEWER_PREFIX,  // Viewer id prefix
        },
        camera : {
          sight : CAMERA_SIGHT,     // Vertical Field of View
          near  : CAMERA_NEARFIELD, // Near Field Distance
          far   : CAMERA_FARFIELD,  // Far Field Distance
        },
        rotateSensitivity : USER_ROTATE_SENSITIVITY,
        zoomSensitivity : USER_ZOOM_SENSITIVITY,
      }, options);

      // Event Listeners
      this.scrollHandler = (function(scope) {
        return function(e) {
          var zoomFactor = e.wheelDelta ? e.wheelDelta/40 : (e.detail ? -e.detail : 0); 
          var delta = scope.__camera.position.z + zoomFactor;
          scope.__camera.position.z = delta;
          scope.__camera.updateProjectionMatrix();
          e.preventDefault();
        };
      })(this);

      // Check if option values are correct
      this.adjustUserConfiguration();

      // Initialize rendering
      Lily.log(SAY_HI);
      this.init();

    };

    // Adjust material, camera settings and sensitivities to have proper values 
    Madeleine.prototype.adjustUserConfiguration = function() {
      this.adjustRotateSensitivity();
      this.adjustZoomSensitivity();
      this.adjustFocalPoint();
      this.checkMaterial();
    };

    // Check material 
    Madeleine.prototype.checkMaterial = function() {
      if (this.options.material !== "skin" || this.options.material !== "wire") {
        this.options.material !== "skin";
      }
    };

    // Adjust camera settings to fit into proper range 
    Madeleine.prototype.adjustFocalPoint = function() {
      var sight = this.options.camera.sight;
      var near = this.options.camera.near;
      var far = this.options.camera.far;

      if (sight && typeof sight === "number" && 75 <= sight && sight <= 1000) return;
      else this.options.camera.sight = CAMERA_SIGHT;
      if (near && typeof near === "number" && 0 <= near && near <= 1000) return;
      else this.options.camera.near = CAMERA_NEARFIELD;
      if (far && typeof far === "number" && 5000 <= far && far <= 100000) return;
      else this.options.camera.far = CAMERA_FARFIELD;
    };

    // Adjust zoom sensitivity to fit into proper range 
    Madeleine.prototype.adjustZoomSensitivity = function() {
      var intensity = this.options.zoomSensitivity;
      var visibleField = this.options.camera.far - this.options.camera.near;

      if (intensity && typeof intensity === "number" && 0 < intensity && intensity <= visibleField/1000) return;
      else this.options.zoomSensitivity = visibleField/1000;
    };

    // Adjust rotate sensitivity to fit into proper range 
    Madeleine.prototype.adjustRotateSensitivity = function(intensity) {
      var intensity = this.options.rotateSensitivity;

      if (intensity && typeof intensity === "number" && 0 < intensity && intensity < 0.05) return;
      else this.options.rotateSensitivity = USER_ROTATE_SENSITIVITY;
    };

    // add work to queue
    Madeleine.prototype.enqueue = function(work) {
      this.__workQueue.push(work);
      Lily.log(WORK_QUEUED, this.__workQueue.length);
    };

    // flush all works from queue
    Madeleine.prototype.flushQueue = function() {
      this.__workQueue = [];
      Lily.log(FLUSH_QUEUE);
    };

    // do all works in queue
    Madeleine.prototype.processQueue = function() {
      var queuecount, i;
      queuecount = this.__workQueue.length;

      for (i = 0; i < queuecount; i++) {
        Lily.log(PROCESS_QUEUE, ( 100 * (i+1) / queuecount )+"%");
        this.__workQueue[i]();
      }

      Lily.log(FLUSH_QUEUE);
    };

    Madeleine.prototype.numberFormat = function(num) {
      var parts = num.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
    };

    // Initialize viewer
    Madeleine.prototype.init = function() {

      // Initialize data info object.
      this.__info = {
        type: null,
        load: this.type,
        vertices: 0,
        facets: 0,
        faces: 0
      };
      if (typeof this.data == "string") {
        this.__info["name"] = this.data.split("/").slice(-1)[0];
        this.__info["size"] = null;
      } else {
        this.__info["name"] = this.data.name;
        this.__info["size"] = this.numberFormat(this.data.size);
      }

      // If create new viewer, set canvas size to the viewer.
      if (this.options.viewer.create) {
        this.__height = this.options.viewer.height;
        this.__width  = this.options.viewer.width;
      // Get target width and height, otherwise.
      } else if (document.defaultView && document.defaultView.getComputedStyle) {
        this.__height = parseFloat(document.defaultView.getComputedStyle(this.container,null).getPropertyValue('height'));
        this.__width  = parseFloat(document.defaultView.getComputedStyle(this.container,null).getPropertyValue('width'));
      } else {
        this.__height = parseFloat(this.container.currentStyle.height);
        this.__width  = parseFloat(this.container.currentStyle.width);
      }

      // Adjust canvas width/height ratio
      this.__sizeRatio = this.__width / this.__height;

      // Create Scene
      this.__scene = new THREE.Scene();

      // Create camera
      this.__camera = new THREE.PerspectiveCamera(
        this.options.camera.sight,
        this.__sizeRatio,
        this.options.camera.near,
        this.options.camera.far
      ); 

      // Set user's point-of-view and default camera position
      this.__pov = new THREE.Vector3(0, 0, 0);
      this.__camera.position.set(0, 0, 0);
      this.__scene.add(this.__camera);

      // Create plane if required
      if (OBJECT_PLANE) {
        this.__plane = new THREE.Mesh(
          new THREE.PlaneGeometry(40, 40),  // plane width x height
          (OBJECT_PLANEWIRE ?
            new THREE.MeshBasicMaterial({ color: 0xFFFFFF, wireframe: true }) :
            new THREE.MeshPhongMaterial({ color: 0xFFFFFF, ambient: 0xFFFFFF, specular: 0xFFFFFF }))
        );
        this.__plane.rotation.x = -Math.PI/2;
        this.__plane.position.y = -0.5;
        this.__scene.add(this.__plane);
      }

      // Add lights
      this.__directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
      this.__directionalLight.position.set(0, 1, 1).normalize();
      this.__scene.add(this.__directionalLight);

      this.__ambientLight = new THREE.AmbientLight(0x202020);
      this.__scene.add(this.__ambientLight);

      Lily.log(DONE_LOAD);
      this.draw();

    };

    // Rendering start
    Madeleine.prototype.draw = function() {
      // Log start
      Lily.log(DRAW_START);

      // Check input type and get STL Binary data 
      switch (this.type) {
        case "upload":
          this.getBinaryFromBlob(this.data);break;
        case "file":
          this.getBinaryFromUrl(this.data);break;
        default:
          Lily.log(INVALID_DRAW_TYPE, this.type);break;
      }
      
      // Wait until data is fully loaded
      this.enqueue((function(scope) {
        return function() {
          // When data ready, parse and render it. 
          scope.parseObject();
          scope.renderObject();
          Lily.log(ALL_FINISHED);

          // Compute time consumed in parsing and rendering.
          scope.__timer.end = (new Date()).getTime();
          if (scope.options.showStatus) {
            var consumed = (scope.__timer.end - scope.__timer.start) / 1000;
            Lily.log(TIME_CONSUMED, consumed);
          }

          // Log status.
          scope.logStatus();
          // Run animation.
          scope.startAnimation();
          // Enable zoom.
          scope.enableZoomAsMouseScroll();
          Lily.log(DONE_DRAW);
        };
      })(this));
    };

    // Get arrayBuffer from Blob
    Madeleine.prototype.getBinaryFromBlob = function(file) {
      if (Detector.fileapi) {
        var reader = new FileReader();

        // onload function
        reader.onload = (function(scope) {
          return function() {
            Lily.log(DATA_GET_SUCCESS);
            scope.__data = reader.result;
            scope.processQueue();
          };
        })(this);

        // read arrayBuffer from Blob
        reader.readAsArrayBuffer(file);
      } else {
        Lily.log(FILEAPI_NOT_SUPPORTED);
      }
    };

    // Get arrayBuffer from external file 
    Madeleine.prototype.getBinaryFromUrl = function(url) {
      var xhr = new XMLHttpRequest();

      // Callback function
      xhr.onreadystatechange = (function(scope) {
        return function() {
          if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 0)) {
            Lily.log(AJAX_SUCCESS);
            scope.__data = xhr.response;
            scope.processQueue();
          }
        };
      })(this);

      xhr.onerror = function(e) {
        Lily.log(AJAX_FAIL);
        // console.log(e);
      };

      xhr.open("GET", url, true);
      xhr.responseType = "arraybuffer";
      xhr.send(null);
    };

    // Check type and choose appropriate parsing method
    Madeleine.prototype.parseObject = function() {
      Lily.log(PARSE_START);

      var reader = new DataReader(this.__data);

      // Check STL File type and parse it.
      if (this.checkSTLType(reader)) this.parseBinarySTL(reader);
      else this.parseASCIISTL();
    };

    // check if stl file is binary or ASCII
    Madeleine.prototype.checkSTLType = function(reader) {

      var realSize, dataSize, isBinary;

      // NOTE:
      //    Because STL files don't provide any information whether they are ASCII or binary,
      //    We have to distinguish them by looking up the file structure.
      //      - REFERENCE: http://en.wikipedia.org/wiki/STL_(file_format)

      //    STL binary file starts with 80-character header.
      //    (If a file starts with "solid" (literally), it's mostly accepted as an ASCII STL file)
      //    After header, 4 bytes unsigned ingeter follows. (number of triangular facets in the file)

      //    Now the data (triangular facets) starts, where each facet consists of 50 bytes.
      //      First 12 bytes     : 32-bit normal vector
      //      Following 36 bytes : 32-bit vertex for 3 coordinates (X|Y|Z)
      //      Last 2 bytes       : short unsigned integer for "attribute byte count"

      //    So if the file is Binary STL file, then the size must be
      //    80 + 4 + 50 * number of triangular facets

      Lily.log(TYPE_CHECK);
      reader.skip(80);
      // reader.readUInt32() == number of facets
      dataSize = 80 + 4 + 50 * reader.readUInt32();
      realSize = reader.getLength();
      Lily.log(DONE_TYPE_CHECK);
      isBinary = dataSize == realSize;
      this.__info["type"] = isBinary ? "binary" : "ascii";
      if (isBinary) this.__info["size"] = this.numberFormat(realSize);
      return isBinary;
    };

    // Parse binary stl file
    Madeleine.prototype.parseBinarySTL = function(reader) {
      var facets, normal, i, j;
      var vertices, normals, index;

      Lily.log(PARSE_PROCESS);

      // Point head of reader, and skip the first 80 bytes
      reader.reset();
      reader.skip(80);

      // Get the number of triangular facets, and initialize
      // normals and vertices with the size of facets.
      index = 0;
      facets = reader.readUInt32();
      normals = new Float32Array(facets * 3 * 3);
      vertices = new Float32Array(facets * 3 * 3);

      // iterate triangular facets
      for (i = 0; i < facets; i++) {
        // Read normal vector
        normal = [reader.readFloat32(), reader.readFloat32(), reader.readFloat32()];
        // Get vertices for each coordinate
        for (j = 0; j < 3; j++) {
          // Add vertex vector
          vertices[index]     = reader.readFloat32();
          vertices[index + 1] = reader.readFloat32();
          vertices[index + 2] = reader.readFloat32();
          // Add normal vector
          normals[index++] = normal[0];
          normals[index++] = normal[1];
          normals[index++] = normal[2];
        }
        // Skip the attribute byte count
        // TODO Some programs save color information here.
        // Find a way to distinguish color, and implement it.
        reader.readUInt16();
      }

      // Parsing done. Add vertices and normals to geometry.
      this.__geometry = new THREE.BufferGeometry();
      this.__geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3 ));
      this.__geometry.addAttribute('normal', new THREE.BufferAttribute(normals, 3));
      Lily.log(PARSE_SUCCESS);
    };

    // Parse ASCII stl file
    Madeleine.prototype.parseASCIISTL = function() {
      var vertexRegExp, normalRegExp, facetRegExp;
      var normal, face, buff, data = "";
      var match, rest;

      buff = new Uint8Array(this.__data);
      for(var i = 0; i < buff.byteLength; i++) {
        data += String.fromCharCode(buff[i]);
      }
      facetRegExp = new RegExp(/facet([\s\S]*?)endfacet/g);
      normalRegExp = new RegExp(/normal[\s]+([\-+]?[0-9]+\.?[0-9]*(?:[eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+(?:[eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+(?:[eE][\-+]?[0-9]+)?)+/g);
      vertexRegExp = new RegExp(/vertex[\s]+([\-+]?[0-9]+\.?[0-9]*(?:[eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+(?:[eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+(?:[eE][\-+]?[0-9]+)?)+/g);

      // To parse the ASCII STL file, we need to read the data itself.
      // First, Remove the structure. The file is written as below.
      // Match the structure with RegExp, and read the data.

      //  - ASCII STL File Structure:
      //      solid name
      //      facet normal ni nj nk
      //          outer loop
      //              vertex v1x v1y v1z
      //              vertex v2x v2y v2z
      //              vertex v3x v3y v3z
      //          endloop
      //      endfacet
      //      endsolid name

      idx = 0;
      this.__geometry = new THREE.Geometry();
      while ((match = facetRegExp.exec(data)) !== null) {
        // Information about a triangular facet
        rest = match[0];
        // Get normal vector
        while ((match = normalRegExp.exec(rest)) !== null) {
          normal = new THREE.Vector3(
            parseFloat(match[1]),
            parseFloat(match[2]),
            parseFloat(match[3])
          );
        }
        // Get vectors for each vertex
        while ((match = vertexRegExp.exec(rest)) !== null) {
          this.__geometry.vertices.push(new THREE.Vector3(
            parseFloat(match[1]),
            parseFloat(match[2]),
            parseFloat(match[3])
          ));
        }
        // Get a face
        this.__geometry.faces.push(new THREE.Face3(idx++, idx++, idx++, normal));
      }

      Lily.log(PARSE_SUCCESS);
    };

    // Render object
    Madeleine.prototype.renderObject = function() {
      // Create renderer
      if (!this.__object) this.createRenderer();

      // Get material
      var material = null;
      if (this.options.material == "skin") {
        material = new THREE.MeshLambertMaterial({
          color: this.getHexColor(this.options.objectColor),
          shading: THREE.FlatShading,
          doubleSided: true,
          overdraw: true
        });
      } else {
        material = new THREE.MeshBasicMaterial({
          color: this.getHexColor(this.options.objectColor),
          wireframe: true
        });
      }

      // Generate mesh for object
      this.__object = new THREE.Mesh(this.__geometry, material);
      this.__geometry.computeBoundingBox();
      this.__geometry.computeBoundingSphere();
      this.__geometry.computeVertexNormals();

      // Adjust camera and object to make object fit into screen properly
      var centerY = parseFloat(0.6 * ( this.__geometry.boundingBox.max.y - this.__geometry.boundingBox.min.y ));
      var centerZ = parseFloat(0.6 * ( this.__geometry.boundingBox.max.z - this.__geometry.boundingBox.min.z ));
      var zoomFactor = 1.37 * (125 / this.__geometry.boundingSphere.radius);

      this.__object.scale.set(zoomFactor, zoomFactor, zoomFactor);
      this.__object.position.setY(-centerY);
      this.__object.position.setZ(-centerZ);

      this.__camera.position.z = 500;
      this.__camera.updateProjectionMatrix();

      // Parsing finished
      this.__scene.add(this.__object);
      this.__object.rotation.x = 5;
    };

    // Generate Renderer
    Madeleine.prototype.createRenderer = function() {
      if (this.__data) {
        // Render parsed data.
        this.__renderer = Detector.webgl ? new THREE.WebGLRenderer({
          preserveDrawingBuffer: true,
          alpha: true
        }) : new THREE.CanvasRenderer(); 
        this.__renderer.setSize(this.__width, this.__height);
        this.__renderer.setClearColor(0x000000, 0);
        Lily.log(RENDER_CREAT);
        this.createViewer();
      } else {
        Lily.log(RENDER_ERROR);
      }
    };

    // Generate Madeleine Viewer
    Madeleine.prototype.createViewer = function() {
      if (this.__viewer) Lily.log(VIEWER_EXISTS);
      else if (!this.__renderer) Lily.log(VIEWER_ERROR);
      else {
        // Create viewer element
        this.__viewer = document.createElement("div");
        this.__viewer.id = this.options.viewer.prefix + this.__id;

        // Set default style
        this.__viewer.style.background = "transparent"; 
        this.__viewer.style.position = "relative"; 
        this.__viewer.style.height = 400; 
        this.__viewer.style.width = 640; 

        var header = document.createElement("div");
        header.style["background"] = "rgba(0,0,0,0.7)"; 
        header.style["position"] = "absolute";
        header.style["height"] = "45px";
        header.style["width"] = this.options.viewer.width+"px";
        header.style["top"] = 0;

        header.style["-webkit-box-sizing"] = "border-box";
        header.style["-moz-box-sizing"] = "border-box";
        header.style["box-sizing"] = "border-box";

        header.style["padding-left"] = "10px";
        header.style["line-height"] = "45px";
        header.style["font-size"] = "18px";
        header.style["color"] = "#FFFFFF";
        header.innerHTML = "Rendered Model: " + this.__info.name + " (type: " + this.__info.type + ") - " + this.__info.size + " bytes";

        // Append to container
        this.container.appendChild(this.__viewer);
        this.__viewer.appendChild(this.__renderer.domElement);
        this.__viewer.appendChild(header);
        this.adaptViewerTheme();
        Lily.log(VIEWER_CREAT);
      }
    };

    // Set viewer theme
    Madeleine.prototype.adaptViewerTheme = function() {
      var canvas, theme;

      canvas = this.__viewer.children[0];
      theme = arguments.length == 0 ? this.options.viewer.theme : arguments[0];

      // Adapt theme
      switch (theme) {
        case "soft":
          canvas.style.cssText = this.generateGradation({dark: "2D2D2D"});
          this.options.objectColor = OBJECT_COLOR;
          break;
        case "dark":
          canvas.style["background"] = "#000000"; 
          this.options.objectColor = OBJECT_COLOR;
          break;
        case "lime":
          canvas.style.cssText = this.generateGradation({dark: "2B2B2B"});
          this.options.objectColor = "D4FF00"; // [212, 255, 0];
          break;
        case "rose":
          canvas.style.cssText = this.generateGradation({bright: "369075"});
          this.options.objectColor = "C94C66"; // [201, 76, 102];
          break;
        case "lego":
          canvas.style.cssText = this.generateGradation({bright: "FFA400"});
          this.options.objectColor = "00A08C"; // [0, 160, 140];
          break;
        case "toxic":
          canvas.style.cssText = this.generateGradation({bright: "FFEE4D"});
          this.options.objectColor = "5254CB"; // [82, 84, 203];
          break;
        case "cobalt":
          canvas.style.cssText = this.generateGradation({bright: "FFC200"});
          this.options.objectColor = "0C6BC0"; // [12, 107, 192];
          break;
        default:  // default is light
          canvas.style.cssText = this.generateGradation({bright: "FFFFFF"});
          this.options.objectColor = OBJECT_COLOR;
          break;
      }

      // If object exists, paint color on it.
      this.__object && this.setObjectColor();
    };

    // Set canvas background color
    Madeleine.prototype.setBackgroundColor = function(code) {
      var canvas, color, code;

      code = arguments.length == 3 ? [arguments[0], arguments[1], arguments[2]] : code;
      canvas = this.__viewer.children[0];
      color = this.getHexString(code);

      canvas.style["background"] = this.makeHexString(color);
    };

    // Set object surface color
    Madeleine.prototype.setObjectColor = function() {
      var color = arguments.length != 0 ? arguments : this.options.objectColor;
      this.__object.material.color.setHex(this.getHexColor(color));
    };

    // Generate gradation css
    Madeleine.prototype.generateGradation = function(colors) {
      var darker, brighter, cssText;

      cssText = "background: BRIGHT;" +
                "background: -moz-radial-gradient(center, ellipse cover, BRIGHT 27%, DARK 100%);" +
                "background: -webkit-gradient(radial, center center, 0px, center center, 100%, color-stop(27%,BRIGHT), color-stop(100%,DARK))" +
                "background: -webkit-radial-gradient(center, ellipse cover, BRIGHT 27%,DARK 100%);" +
                "background: -o-radial-gradient(center, ellipse cover, BRIGHT 27%, DARK 100%);" +
                "background: -ms-radial-gradient(center, ellipse cover, BRIGHT 27%, DARK 100%);" +
                "background: radial-gradient(ellipse at center, BRIGHT 27%, DARK 100%);" +
                "filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='BRIGHT', endColorstr='DARK',GradientType=1 )"; 

      if (colors.dark) {
        darker = this.getHexString(colors.dark);
        brighter = this.getHexString(colors.bright ? colors.bright : this.adjustBrightness(darker));
      } else {
        brighter = this.getHexString(colors.bright);
        darker = this.getHexString(this.adjustBrightness(brighter));
      }

      return cssText.replace(/BRIGHT/g, brighter).replace(/DARK/g, darker);
    };

    // Get Hex color (0xXXXXXX format)
    Madeleine.prototype.getHexColor = function() {
      var code = arguments.length == 3 ? [arguments[0], arguments[1], arguments[2]] : arguments[0];
      var color = this.getHexString(code);
      return parseInt(color.replace(/\#/g, ''), 16); 
    };

    // Get Hex-style string (#XXXXXX format)
    Madeleine.prototype.getHexString = function(code) {
      if (typeof code == "string") return this.makeHexString(code);
      else if (typeof code == "object") return this.rgbToHex(code);
    };

    // Strip # from Hex-style string
    Madeleine.prototype.cutHexString = function(code) {
      return code.charAt(0) == "#" ? code.substring(1) : code;
    };

    // Prepend # to hex string
    Madeleine.prototype.makeHexString = function(code) {
      var color = code.length == 3 ? code.replace(/(.)/g, '$1$1') : code;
      return color.charAt(0) != "#" ? "#" + color : color;
    };

    // Convert RGB to Hex
    Madeleine.prototype.rgbToHex = function(code) {
      var i, color, hex = "#";
      for (i = 0; i < code.length; i++) {
        color = code[i].toString(16);
        hex += (color.length == 1 ? "0" + color : color);
      }
      return hex;
    };

    // Convert Hex to RGB
    Madeleine.prototype.hexToRgb = function(code) {
      var dec = this.cutHexString(code).toString(16);
      return [parseInt(dec.substring(0, 2), 16),
              parseInt(dec.substring(2, 4), 16),
              parseInt(dec.substring(4, 6), 16)];
    };

    // Get brighter or darker color from input color
    // Brightness is automatically set according to its intensity.
    Madeleine.prototype.adjustBrightness = function(code) {
      var adjustedR, adjustedG, adjustedB;
      var intensity, color, rgb, r, g, b;
      var darkFactor = 25, brightFactor = 20;

      // Get color and RGB
      color = this.cutHexString(code);
      rgb = this.hexToRgb(color);

      r = rgb[0];
      g = rgb[1];
      b = rgb[2];

      // Get grayscale intensity
      intensity = Math.sqrt(r*r + g*g + b*b) / 255 * 100;

      // New color
      adjustedR = intensity > 40 ? (0|(1<<8) + r * (1 - darkFactor / 100)) : (0|(1<<8) + r + (256 - r) * brightFactor / 100);
      adjustedG = intensity > 40 ? (0|(1<<8) + g * (1 - darkFactor / 100)) : (0|(1<<8) + g + (256 - g) * brightFactor / 100);
      adjustedB = intensity > 40 ? (0|(1<<8) + b * (1 - darkFactor / 100)) : (0|(1<<8) + b + (256 - b) * brightFactor / 100);

      return (adjustedR.toString(16)).substr(1) +
             (adjustedG.toString(16)).substr(1) +
             (adjustedB.toString(16)).substr(1);
    };

    // If not rotating, set rotate flag to true and start animation
    // Do nothing, otherwise.
    Madeleine.prototype.startAnimation = function() {
      if (this.__rotatable && !this.__rotating) {
        this.__rotating = true;
        this.triggerAnimation(this);
      }
    };

    // Stop rotating object
    Madeleine.prototype.stopAnimation = function() {
      this.options.rotateSensitivity = 0.005;
      this.__rotating = false;
    };

    // Start rotating object
    Madeleine.prototype.triggerAnimation = function(scope) {
      if (scope.__rotatable) {
        requestAnimationFrame(function(){scope.triggerAnimation(scope)});
        scope.options.showStatus && scope.__stats.update();
        scope.rotateObject();
      }
    };

    Madeleine.prototype.rotateObject = function() {
      // Rotate 3D object
      if (this.__object) this.__object.rotation.z += this.options.rotateSensitivity;
      this.__renderer.render(this.__scene, this.__camera);
    };

    // Make animation faster as much as 'speed'
    Madeleine.prototype.animationFaster = function(speed) {
      this.options.rotateSensitivity *= (speed ? speed : 2);
    };

    // Make animation slower as much as 'speed'
    Madeleine.prototype.animationSlower = function(speed) {
      this.options.rotateSensitivity /= (speed ? speed : 2);
    };

    // Disable Madeline Viewer to be zoomed by mouse scroll
    Madeleine.prototype.disableZoomAsMouseScroll = function() {
      var target = this.container;
      if (target.removeEventListener) {
        target.removeEventListener('mousewheel', this.scrollHandler, false);
        target.removeEventListener('DOMMouseScroll', this.scrollHandler, false);
      } else if (target.detachEvent) {
        target.detachEvent('onmousewheel', this.scrollHandler);
        target.detachEvent('onDOMMouseScroll', this.scrollHandler);
      } else {
        this.container['onmousewheel'] = function() {};
        this.container['onDOMMouseScroll'] = function() {};
      }

    };

    // Enable Madeline Viewer to be zoomed by mouse scroll
    Madeleine.prototype.enableZoomAsMouseScroll = function() {

      if (!this.__zoomable) return;

      // attach event handler
      if (this.container.addEventListener) {
        this.container.addEventListener('mousewheel', this.scrollHandler, false);
        this.container.addEventListener('DOMMouseScroll', this.scrollHandler, false); // firefox
      } else if (this.container.attachEvent) {
        this.container.attachEvent('onmousewheel', this.scrollHandler);
        this.container.attachEvent('onDOMMouseScroll', this.scrollHandler);
      } else {
        this.container['onmousewheel'] = this.scrollHandler;
        this.container['onDOMMouseScroll'] = this.scrollHandler;
      }

    }; 

    // Manually zoom out object
    Madeleine.prototype.manualZoomOut = function() {
      this.__camera.position.z += this.options.zoomSensitivity;
      this.__camera.updateProjectionMatrix();
    };

    // Manually zoom in object
    Madeleine.prototype.manualZoomIn = function() {
      this.__camera.position.z -= this.options.zoomSensitivity;
      this.__camera.updateProjectionMatrix();
    };

    // Show animation status
    Madeleine.prototype.logStatus = function(target) {
      if (!this.options.showStatus) return;
      this.__stats = new Stats();
      this.__stats.domElement.style.position = 'absolute';
      this.__stats.domElement.style.top = '0px';
      this.__viewer.appendChild(this.__stats.domElement);
      Lily.log(LOG_ENABLED);
    };

    // Show animation status
    Madeleine.prototype.stopLogStatus = function(target) {
      this.options.showStatus = false;
      this.__stats = null;
      Lily.log(LOG_DISABLED);
    };

    return new Madeleine(options);

  };

  // Lily helps madeleine.
  window.Lily = (function() {

    // Initialize
    var Lily = function() {
      if (!Detector.webgl) Detector.addGetWebGLMessage();
      this.verbose = 0;
      this.sisters = [];
    };

    // Attach Madeleine to file input
    Lily.prototype.ready = function(options) {
      // Check option fields
      if (!options.file || !options.target) {
        this.log(INVALID_OPTION2);
        return null;
      }
      // Check valid file input
      var target = document.getElementById(options.file);
      if (target.tagName.toLowerCase() == "input" && target.type.toLowerCase() == "file") this.onFileInputChange(target, options);
      else this.log(INVALID_INPUT);
    };

    // jQuery source of extend function
    // Reference: https://github.com/jquery/jquery/blob/master/src/core.js
    Lily.prototype.extend = function() {
      var options, name, src, copy, copyIsArray, clone,
        target = arguments[0] || {},
        i = 1,
        length = arguments.length,
        deep = false,
        toString = Object.prototype.toString,
        hasOwn = Object.prototype.hasOwnProperty,
        push = Array.prototype.push,
        slice = Array.prototype.slice,
        trim = String.prototype.trim, 
        indexOf = Array.prototype.indexOf,
        class2type = { 
          "[object Boolean]": "boolean",
          "[object Number]": "number",
          "[object String]": "string",
          "[object Function]": "function",
          "[object Array]": "array",
          "[object Date]": "date",
          "[object RegExp]": "regexp",
          "[object Object]": "object"
        },
        jQuery = {
          isFunction: function (obj) {
            return jQuery.type(obj) === "function"
          },
          isArray: Array.isArray ||
          function (obj) {
            return jQuery.type(obj) === "array"
          },
          isWindow: function (obj) {
            return obj != null && obj == obj.window
          },
          isNumeric: function (obj) {
            return !isNaN(parseFloat(obj)) && isFinite(obj)
          },
          type: function (obj) {
            return obj == null ? String(obj) : class2type[toString.call(obj)] || "object"
          },
          isPlainObject: function (obj) {
            if (!obj || jQuery.type(obj) !== "object" || obj.nodeType) {
              return false
            }
            try {
              if (obj.constructor && !hasOwn.call(obj, "constructor") && !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
                return false
              }
            } catch (e) {
              return false
            }
            var key;
            for (key in obj) {}
            return key === undefined || hasOwn.call(obj, key)
          }
        };

      // Handle a deep copy situation
      if ( typeof target === "boolean" ) {
        deep = target;

        // Skip the boolean and the target
        target = arguments[ i ] || {};
        i++;
      }

      // Handle case when target is a string or something (possible in deep copy)
      if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
        target = {};
      }

      // Extend jQuery itself if only one argument is passed
      if ( i === length ) {
        target = this;
        i--;
      }

      for ( ; i < length; i++ ) {
        // Only deal with non-null/undefined values
        if ( (options = arguments[ i ]) != null ) {
          // Extend the base object
          for ( name in options ) {
            src = target[ name ];
            copy = options[ name ];

            // Prevent never-ending loop
            if ( target === copy ) {
              continue;
            }

            // Recurse if we're merging plain objects or arrays
            if ( deep && copy && ( jQuery.isPlainObject(copy) ||
              (copyIsArray = jQuery.isArray(copy)) ) ) {

              if ( copyIsArray ) {
                copyIsArray = false;
                clone = src && jQuery.isArray(src) ? src : [];

              } else {
                clone = src && jQuery.isPlainObject(src) ? src : {};
              }

              // Never move original objects, clone them
              target[ name ] = jQuery.extend( deep, clone, copy );

            // Don't bring in undefined values
            } else if ( copy !== undefined ) {
              target[ name ] = copy;
            }
          }
        }
      }

      // Return the modified object
      return target;
    };

    // When user uploads files, call Madeleine immediately for each stl file.
    Lily.prototype.onFileInputChange = function(input, options) {

      // event handler
      var onFileInputChangeHandler = function() {
        var i, files = this.files;
        if (files.length) {
          for (i = 0; i < files.length; i++) {
            // create Madeleine for each file
            var _options = window.Lily.extend({}, options, {type: "upload", data: files[i]});
            var madeleine = new Madeleine(_options);
            // hide file input element
            input.style.display = "none";
          }
        }
      };

      // attach event handler
      if (input.addEventListener) input.addEventListener('change', onFileInputChangeHandler, false);
      else if (input.attachEvent) input.attachEvent('onchange', onFileInputChangeHandler);
      else input['onchange'] = onFileInputChangeHandler;

      this.log(EVENT_ATTACHED);

    };

    // Put madeleine to madeleine list
    Lily.prototype.push = function(madeleine) {
      this.sisters.push(madeleine);
      return this.sisters.length-1;
    };

    // Get madeleine of id 'index'
    Lily.prototype.get = function(index) {
      return this.sisters[index];
    };

    // Log message to console
    Lily.prototype.log = function(type, info) {

      var errPrefix = "[ERR] Madeleine: "; 
      var logPrefix = "[LOG] Madeleine: ";
      var description = info ? info : ""; 
      var messageList = {

        // Normal log messages
        // VERBOSE LEVEL 1
        START             : { verbose: 1, message: logPrefix + "Hi, I'm Madeleine!" },
        DrawDone          : { verbose: 1, message: logPrefix + "Voila! You're model is now on the screen!" },
        EventAttached     : { verbose: 1, message: logPrefix + "I'm ready. Upload files." },

        // VERBOSE LEVEL 2
        LoadDone          : { verbose: 2, message: logPrefix + "I'm ready to play." },
        TimeConsumed      : { verbose: 2, message: logPrefix + "Total seconds to draw your model: " },
        ParsingBegin      : { verbose: 2, message: logPrefix + "Wait for a second. I'm parsing your model..." },
        DrawFinished      : { verbose: 2, message: logPrefix + "I finished drawing your model!" },

        // VERBOSE LEVEL 3 (TOO talkative, DEBUGGING ONLY)
        RenderCreated     : { verbose: 3, message: logPrefix + "I got a renderer now. Creating a viewer..." },
        ViewerCreated     : { verbose: 3, message: logPrefix + "I got a viewer now. Ready to show!" },
        WorkQueued        : { verbose: 3, message: logPrefix + "I got a new work: " },
        QueueFlushed      : { verbose: 3, message: logPrefix + "I don't have any work now." },
        QueueProcess      : { verbose: 3, message: logPrefix + "I'm doing my work..." },
        TypeCheck         : { verbose: 3, message: logPrefix + "I'm checking your model type..." },
        TypeCheckDone     : { verbose: 3, message: logPrefix + "I finished checking your model type." },
        ParseSTLDone      : { verbose: 3, message: logPrefix + "I finished parsing your model." },
        DataReceived      : { verbose: 3, message: logPrefix + "Your model file is successfully loaded." },
        AjaxDataReceived  : { verbose: 3, message: logPrefix + "Your model file is successfully received." },
        StartDraw         : { verbose: 3, message: logPrefix + "I just started to draw your model." },
        StartParse        : { verbose: 3, message: logPrefix + "I just started to parse your model." },
        DisableLog        : { verbose: 3, message: logPrefix + "I'm logging the animation status." },
        EnableLog         : { verbose: 3, message: logPrefix + "I stopped logging the animation status." },


        // Error log messages (MUST BE HIGHER THAN VERBOSE LEVEL 1)
        RenderLater       : { verbose: 1, message: errPrefix + "Please create renderer after parsing the data." },
        ViewerLater       : { verbose: 1, message: errPrefix + "Please create viewer after creating renderer." },
        NoFileAPI         : { verbose: 1, message: errPrefix + "This browser doesn't support file API." },
        AjaxFailed        : { verbose: 1, message: errPrefix + "There was a problem in receiving your model data." },
        InvalidDrawType   : { verbose: 1, message: errPrefix + "You gave me wrong type to draw: " },
        TargetInvalid     : { verbose: 1, message: errPrefix + "Target must be a valid DOM Element." },
        OptionInvalid     : { verbose: 1, message: errPrefix + "Option must contain target and data." },
        OptionInvalid2    : { verbose: 1, message: errPrefix + "Option must contain file and target." },
        ViewerExists      : { verbose: 2, message: errPrefix + "You are so greedy! I already have a viewer." },

      };

      // Deliver the message (...If it's not too loud)
      if (this.verbose < messageList[type].verbose) return;
      else console.log(messageList[type].message + description);

    };

    return new Lily(); 

  })();

})();
