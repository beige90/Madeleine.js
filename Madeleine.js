

/**
 * Madeleine.js, Pure JavaScript STL Parser & Renderer. 
 * Madeleine.js constists of three part: DataReader, Madeleine and Lily. DataReader is a helper function
 * to read binary data, which is a customized version of DataView. Lily is a helper Object that manages
 * created Madeleines and logs messages to console. Madeleine is the part that deals with actual parsing,
 * rendering and showing your stl files. Customize them however you want.
 * This project is under MIT License (see the LICENSE file for details). You are allowed to do anything
 * with this code, as long as you leave the attribution (MUST!). It will be glad if you contact me for 
 * any bug you found or interesting ideas to do with Madeleine.js. I'm willing to co-work with you!
 *
 * @version   0.9.1
 * @author    Junho Jin
 * @contact   junho.jin@kaist.ac.kr
 * @source    https://github.com/JinJunho/Madeleine.js
 */


(function() {


  // Message alias
  var SAY_HI                = "START";
  var DONE_LOAD             = "LoadDone";
  var ALL_FINISHED          = "DrawDone";
  var LOG_DISABLED          = "DisableLog";
  var LOG_ENABLED           = "EnableLog";
  var TYPE_CHECK            = "TypeCheck";
  var DONE_TYPE_CHECK       = "TypeCheckDone";
  var UNKNOWN_FILE_TYPE     = "UnknownFileType";
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
      this.__id        = Lily.push(this);
      this.__targetID  = options.target;
      this.__workQueue = [];
      this.__timer     = {start: (new Date).getTime(), end: null};

      this.__model = null;
      this.__stats = null;

      this.__mesh             = null;
      this.__scene            = null;
      this.__camera           = null;
      this.__viewer           = null;
      this.__geometry         = null;
      this.__renderer         = null;
      this.__ambientLight     = null;
      this.__directionalLight = null;

      this.__width           = null;
      this.__height          = null;
      this.__canvasSizeRatio = 1;

      this.__zoomable     = true;
      this.__zoomOutLimit = 180;
      this.__zoomInLimit  = 0

      this.__rotatable  = null;
      this.__rotating   = null;

      // Crucial properties
      this.type = options.type ? options.type : 'file';
      this.data = options.data;
      this.target = document.getElementById(this.__targetID);
      this.target.innerHTML = "";

      // User configuration 
      this.options = Lily.extend({}, { // default option
        material   : 'skin',
        showStatus : true,
        modelColor : 0x009999,
        viewer : {
          create  : true,         // Create new viewer?
          height  : 400,          // Viewer height
          width   : 640,          // Viewer width
          theme   : "madeleine",  // Viewer theme
          prefix  : "madeleine_", // Viewer id prefix
        },
        camera : {
          sight : 75,     // Vertical Field of View
          near  : 1,      // Near Field Distance
          far   : 1000,   // Far Field Distance
        },
        rotateSensitivity : 0.009,
        zoomSensitivity : 10,
      }, options);

      // Adjust material, camera settings and sensitivities to have proper values 
      this.checkMaterial();
      this.adjustFocalPoint();
      this.adjustZoomSensitivity();
      this.adjustRotateSensitivity();

      // Initialize rendering
      Lily.log(SAY_HI);
      this.init();

    };

    // Check material 
    Madeleine.prototype.checkMaterial = function() {
      if (this.options.material !== "skin" || this.options.material !== "wire") {
        this.options.material !== "skin";
      }
    };

    // Adjust camera settings to fit into proper range 
    Madeleine.prototype.adjustFocalPoint = function() {
      var defaultSight = 75;
      var defaultNearField = 1;
      var defaultFarField = 1000;

      var sight = this.options.camera.sight;
      var near = this.options.camera.near;
      var far = this.options.camera.far;

      if (sight && typeof sight === "number" && 75 <= sight && sight <= 1000) return;
      else this.options.camera.sight = defaultSight;
      if (near && typeof near === "number" && 0 <= near && near <= 1000) return;
      else this.options.camera.near = defaultNearField;
      if (far && typeof far === "number" && 5000 <= far && far <= 100000) return;
      else this.options.camera.far = defaultFarField;
    };

    // Adjust zoom sensitivity to fit into proper range 
    Madeleine.prototype.adjustZoomSensitivity = function() {
      var defaultSensitivity = 10;
      var intensity = this.options.zoomSensitivity;
      if (intensity && typeof intensity === "number" && 0 < intensity && intensity <= 20) return;
      else this.options.zoomSensitivity = defaultSensitivity;
    };

    // Adjust rotate sensitivity to fit into proper range 
    Madeleine.prototype.adjustRotateSensitivity = function(intensity) {
      var defaultSensitivity = 0.009;
      var intensity = this.options.rotateSensitivity;
      if (intensity && typeof intensity === "number" && 0 < intensity && intensity < 0.05) return;
      else this.options.rotateSensitivity = defaultSensitivity;
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

    // Initialize viewer
    Madeleine.prototype.init = function() {

      // If create new viewer, set canvas size to the viewer.
      if (this.options.viewer.create) {
        this.__height = this.options.viewer.height;
        this.__width  = this.options.viewer.width;
      // Get target width and height, otherwise.
      } else if (document.defaultView && document.defaultView.getComputedStyle) {
        this.__height = parseFloat(document.defaultView.getComputedStyle(this.target,null).getPropertyValue('height'));
        this.__width  = parseFloat(document.defaultView.getComputedStyle(this.target,null).getPropertyValue('width'));
      } else {
        this.__height = parseFloat(this.target.currentStyle.height);
        this.__width  = parseFloat(this.target.currentStyle.width);
      }

      // Adjust canvas width/height ratio
      this.__canvasSizeRatio = this.__width/this.__height;

      // Basic THREE.js setup
      this.__scene = new THREE.Scene();
      this.__camera = new THREE.PerspectiveCamera(
        this.options.camera.sight,
        this.__canvasSizeRatio,
        this.options.camera.near,
        this.options.camera.far
      ); 

      // Tilt point of view
      this.__camera.position.x = 0;
      this.__camera.position.y = 0;
      this.__camera.position.z = 70;
      this.__scene.add(this.__camera);

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
      this.enqueue((function(_this) {
        return function() {
          // When data ready, parse and render it. 
          _this.parseModel();
          _this.renderModel();
          Lily.log(ALL_FINISHED);

          _this.__timer.end = (new Date()).getTime();
          if (_this.options.showStatus) {
            var consumed = (_this.__timer.end - _this.__timer.start) / 1000;
            Lily.log(TIME_CONSUMED, consumed);
          }

          // Run animation.
          _this.logStatus();
          _this.startAnimation();
          Lily.log(DONE_DRAW);
        };
      })(this));
    };

    // Get arrayBuffer from Blob
    Madeleine.prototype.getBinaryFromBlob = function(file) {
      if (Detector.fileapi) {
        var reader = new FileReader();

        // onload function
        reader.onload = (function(_this) {
          return function() {
            Lily.log(DATA_GET_SUCCESS);
            _this.__model = reader.result;
            _this.processQueue();
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
      xhr.onreadystatechange = (function(_this) {
        return function() {
          if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 0)) {
            Lily.log(AJAX_SUCCESS);
            _this.__model = xhr.response;
            _this.processQueue();
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
    Madeleine.prototype.parseModel = function() {
      Lily.log(PARSE_START);

      this.__geometry = new THREE.Geometry();
      var reader = new DataReader(this.__model);

      // Check STL File type and parse it.
      switch(this.checkSTLType(reader)) {
        case "BIN":
          Lily.log(DONE_TYPE_CHECK);
          this.parseBinarySTL(reader);
          break;
        case "ASCII":
          Lily.log(DONE_TYPE_CHECK);
          this.parseASCIISTL();
          break;
        default:
          Lily.log(UNKNOWN_FILE_TYPE);
          break;
      }
    };

    // check if stl file is binary or ASCII
    Madeleine.prototype.checkSTLType = function(reader) {
      Lily.log(TYPE_CHECK);

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

      reader.skip(80);
      var dataSize = 80 + 4 + 50 * reader.readUInt32(); // reader.readUInt32() == number of facets
      if (dataSize == reader.getLength()) return "BIN"; // It's Binary STL file
      else return "ASCII"; // It's ASCII STL file
    };

    // Parse binary stl file
    Madeleine.prototype.parseBinarySTL = function(reader) {
      var facets, normal, i, j;

      Lily.log(PARSE_PROCESS);

      reader.reset(); // start from the beginning of the file
      reader.skip(80); // skip header
      facets = reader.readUInt32(); // number of triangular facets

      // Iterate triangular facets
      for (i = 0; i < facets; i++) {
        // Read normal vector
        normal = new THREE.Vector3(
          reader.readFloat32(),
          reader.readFloat32(),
          reader.readFloat32()
        );
        // Get vertices for each coordinate
        for (j = 0; j < 3; j++) {
          this.__geometry.vertices.push(
            new THREE.Vector3(
              reader.readFloat32(),
              reader.readFloat32(),
              reader.readFloat32()
            )
          );
        }
        // Get a new face from the vertices and the normal
        this.__geometry.faces.push(
          new THREE.Face3(
            i * 3,      // Vertex A index
            i * 3 + 1,  // Vertex B index
            i * 3 + 2,  // Vertex C index
            normal
          )
        );
        // Skip the attribute byte count
        // TODO Some programs save color information here.
        // Find a way to distinguish color, and implement it.
        reader.readUInt16();
      }

      // Parsing done. Compute the normals.
      this.__geometry.computeFaceNormals();
      this.__geometry.computeBoundingSphere();
      this.__geometry.center();
      Lily.log(PARSE_SUCCESS);
    };

    // Parse ASCII stl file
    Madeleine.prototype.parseASCIISTL = function() {
      var data = this.__model;

      // To parse the ASCII STL file, we need to read the data itself.
      // First, Remove the structure. The file is written as below.
      // After removing the structure, begin reading the data.

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

      // TODO Remove file structure

      // TODO Read data

      Lily.log(PARSE_SUCCESS);
    };

    // Render model
    Madeleine.prototype.renderModel = function() {
      // Create renderer
      if (!this.__mesh) this.createRenderer();

      // Get material
      var material = null;
      if (this.options.material == "skin") {
        material = new THREE.MeshLambertMaterial({
          color: this.options.modelColor,
          shading: THREE.FlatShading,
          doubleSided: true,
          overdraw: true
        });
      } else {
        material = new THREE.MeshBasicMaterial({
          color: this.options.modelColor,
          wireframe: true
        });
      }

      // Generate mesh for model
      this.__mesh = new THREE.Mesh(this.__geometry, material);

      // Adjust mesh postion
      var modelCenterZ = this.__geometry.boundingSphere.center.z; 
      var coveringSphereRadius = this.__geometry.boundingSphere.radius;
      this.__mesh.position.z = (modelCenterZ - coveringSphereRadius);

      // Parsing finished
      this.__scene.add(this.__mesh);
      this.__mesh.rotation.x = 5;
    };

    // Generate Renderer
    Madeleine.prototype.createRenderer = function() {
      if (this.__model) {
        // Render parsed data.
        this.__renderer = Detector.webgl ? new THREE.WebGLRenderer({
          preserveDrawingBuffer: true,
          alpha: true
        }) : new THREE.CanvasRenderer(); 
        this.__renderer.setSize(this.__width, this.__height);
        Lily.log(RENDER_CREAT);
        this.createViewer();
      } else {
        Lily.log(RENDER_ERROR);
      }
    };

    // Generate Madeleine Viewer
    Madeleine.prototype.createViewer = function() {
      if (this.__viewer) {
        Lily.log(VIEWER_EXISTS);
      } else if (!this.__renderer) {
        Lily.log(VIEWER_ERROR);
      } else {
        this.__viewer = document.createElement("div");
        this.__viewer.id = this.options.viewer.prefix + this.__id;
        this.__viewer.className = this.options.viewer.theme;
        this.target.appendChild(this.__viewer);
        this.__viewer.appendChild(this.__renderer.domElement);
        Lily.log(VIEWER_CREAT);
      }
    };

    // If not rotating, set rotate flag to true and start animation
    // Do nothing, otherwise.
    Madeleine.prototype.startAnimation = function() {
      if (!this.__rotating) {
        this.__rotatable = true;
        this.__rotating = true;
        this.triggerAnimation(this);
        this.enableZoomAsMouseScroll();
      }
    };

    // Stop rotating model
    Madeleine.prototype.stopAnimation = function() {
      this.options.rotateSensitivity = 0.005;
      this.__rotatable = false;
      this.__rotating = false;
    };

    // Start rotating model
    Madeleine.prototype.triggerAnimation = function(_this) {
      if (_this.__rotatable) {
        requestAnimationFrame(function(){_this.triggerAnimation(_this)});
        _this.options.showStatus && _this.__stats.update();
        _this.rotateModel();
      }
    };

    Madeleine.prototype.rotateModel = function() {
      // Rotate 3D model
      if (this.__mesh) this.__mesh.rotation.z += this.options.rotateSensitivity;
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

    // Enable Madeline Viewer to be zoomed by mouse scroll
    Madeleine.prototype.enableZoomAsMouseScroll = function() {

      if (!this.__zoomable) return;

      var scrollHandler = (function(_this) {
        return function(e) {
          var zoomFactor = e.wheelDelta ? e.wheelDelta/40 : (e.detail ? -e.detail : 0); 
          var delta = _this.__camera.fov + zoomFactor;
          if (_this.__zoomInLimit < delta && delta < _this.__zoomOutLimit) {
            _this.__camera.fov = delta;
          }
          _this.__camera.updateProjectionMatrix();
          e.preventDefault();
        };
      })(this);  

      // attach event handler
      if (this.target.addEventListener) {
        this.target.addEventListener('mousewheel', scrollHandler, false);
        this.target.addEventListener('DOMMouseScroll', scrollHandler, false); // firefox
      } else if (this.target.attachEvent) {
        this.target.attachEvent('mousewheel', scrollHandler);
        this.target.attachEvent('DOMMouseScroll', scrollHandler);
      } else {
        this.target['onmousewheel'] = scrollHandler;
        this.target['onDOMMouseScroll'] = scrollHandler;
      }

    }; 

    // Manually zoom out model
    Madeleine.prototype.manualZoomOut = function() {
      if (this.__camera.fov + this.options.zoomSensitivity < this.__zoomOutLimit) {
        this.__camera.fov += this.options.zoomSensitivity;
        this.__camera.updateProjectionMatrix();
      }
    };

    // Manually zoom in model
    Madeleine.prototype.manualZoomIn = function() {
      if (this.__camera.fov - this.options.zoomSensitivity > this.__zoomInLimit) {
        this.__camera.fov -= this.options.zoomSensitivity;
        this.__camera.updateProjectionMatrix();
      }
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

    // Set model color
    Madeleine.prototype.setModelColor = function(code) {
      this.options.modelColor = parseInt(color.replace(/\#/g, ''), 16);
    };

    return new Madeleine(options);

  };

  // Lily helps madeleine.
  window.Lily = (function() {

    // Initialize
    var Lily = function() {
      this.verbose = 2;
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
            var _options = this.extend({}, options, {type: "upload", data: files[i]});
            var madeleine = new Madeleine(_options);
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
        DrawDone          : { verbose: 1, message: logPrefix + "Voila! You're model is now showing!" },
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
        UnknownFileType   : { verbose: 1, message: errPrefix + "STL file must be neither binary nor ASCII format." },
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
