(function() {


  // Message alias
  var SAY_HI                = "START";
  var DONE_LOAD             = "LoadDone";
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
  var DATA_GET_SUCCESS      = "DataReceived";
  var AJAX_SUCCESS          = "AjaxDataReceived";
  var AJAX_FAIL             = "AjaxFailed";
  var DONE_DRAW             = "DrawFinished";
  var EVENT_ATTACHED        = "EventAttached";
  var INVALID_INPUT         = "InputInvalid";
  var INVALID_TARGET        = "TargetInvalid";
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
  window.Madeleine = function(target) {

    var Madeleine;

    // Check if target exists.
    if (!document.getElementById(target)) {
      Lily.log(INVALID_TARGET);
      return null;
    }

    Madeleine = function(target) {

      this.id = Lily.push(this);

      this.queue = [];
      
      this.model = null;
      this.targetId = target;
      this.target = document.getElementById(target);
      this.target.innerHTML = "";

      this.scene = null;
      this.camera = null;
      this.geometry = null;
      this.renderer = null;
      this.stats = null;
      this.mesh = null;

      this.directionalLight = null;

      this.rotatable = null;
      this.rotatePerFrame = 0.005;

      this.width = null;
      this.height = null;
      this.verticalFOV = 100;
      this.nearFieldDistance = 1;
      this.farFieldDistance = 10000;
      this.canvasSizeRatio = 1;

      Lily.log(SAY_HI);

      this.init();

    };

    // add work to queue
    Madeleine.prototype.enqueue = function(work) {
      this.queue.push(work);
      Lily.log(WORK_QUEUED, this.queue.length);
    };

    // flush all works from queue
    Madeleine.prototype.flushQueue = function() {
      this.queue = [];
      Lily.log(FLUSH_QUEUE);
    };

    // do all works in queue
    Madeleine.prototype.processQueue = function() {
      var queuecount, i;
      queuecount = this.queue.length;
      for (i = 0; i < queuecount; i++) {
        Lily.log(PROCESS_QUEUE, ( 100 * (i+1) / queuecount )+"%");
        this.queue[i]();
      }
      Lily.log(FLUSH_QUEUE);
    };

    // Initialize viewer
    Madeleine.prototype.init = function() {

      // Get target width and height
      if (document.defaultView && document.defaultView.getComputedStyle)
      this.width = parseFloat(document.defaultView.getComputedStyle(this.target,null).getPropertyValue('width'));
      else
      this.width = parseFloat(this.target.currentStyle.width);
      this.height  = this.width * this.canvasSizeRatio;

      // Basic THREE.js setup
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(
        this.verticalFOV,
        this.canvasSizeRatio,
        this.nearFieldDistance,
        this.farFieldDistance
      ); 

      // Tilt point of view
      this.camera.position.z = 70;
      this.camera.position.y = 0;
      this.scene.add(this.camera);

      // Add lights
      this.directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
      this.directionalLight.position.x = 0;
      this.directionalLight.position.y = 0;
      this.directionalLight.position.z = 1;
      this.directionalLight.position.normalize();
      this.scene.add(this.directionalLight);

      Lily.log(DONE_LOAD);

    };

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

    Madeleine.prototype.parseModel = function() {
      Lily.log(PARSE_START);

      this.geometry = new THREE.Geometry();
      var reader = new DataReader(this.model);

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

      // Generate mesh.
      this.mesh = new THREE.Mesh(
        this.geometry,
        new THREE.MeshLambertMaterial({
          overdraw: true,
          color: 0x009999,
          shading: THREE.FlatShading
        })
      );

      // Parsing finished.
      this.scene.add(this.mesh);
      this.mesh.rotation.x = 5;
    };

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
          this.geometry.vertices.push(
            new THREE.Vector3(
              reader.readFloat32(),
              reader.readFloat32(),
              reader.readFloat32()
            )
          );
        }
        // Get a new face from the vertices and the normal
        this.geometry.faces.push(
          new THREE.Face3(
            i * 3,      // Vertex A index
            i * 3 + 1,  // Vertex B index
            i * 3 + 2,  // Vertex C index
            normal      // Normal vector
          )
        );
        // Skip the attribute byte count
        // TODO Some programs save color information here.
        // Find a way to distinguish color, and implement it.
        reader.readUInt16();
      }

      // Parsing done. Compute the normals.
      this.geometry.computeFaceNormals();
      Lily.log(PARSE_SUCCESS);
    };

    Madeleine.prototype.parseASCIISTL = function() {
      var data = this.model;

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

    // Get arrayBuffer from Blob
    Madeleine.prototype.getBinaryFromBlob = function(file) {
      if (Detector.fileapi) {
        var reader = new FileReader();

        // onload function
        reader.onload = (function(_this) {
          return function() {
            Lily.log(DATA_GET_SUCCESS);
            _this.model = reader.result;
            _this.processQueue();
          };
        })(this);

        // read arrayBuffer from Blob
        reader.readAsArrayBuffer(file);
      } else {
        Lily.log(FILEAPI_NOT_SUPPORTED);
      }
    };

    Madeleine.prototype.getBinaryFromUrl = function(url) {
      var xhr = new XMLHttpRequest();

      // Callback function
      xhr.onreadystatechange = (function(_this) {
        return function() {
          if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 0)) {
            Lily.log(AJAX_SUCCESS);
            _this.model = xhr.response;
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

    Madeleine.prototype.draw = function(type, data) {
      // Log start
      Lily.log(DRAW_START);

      // Check input type and get STL Binary data 
      switch (type) {
        case "upload":
          this.getBinaryFromBlob(data);break;
        case "file":
          this.getBinaryFromUrl(data);break;
        default:
          Lily.log(INVALID_DRAW_TYPE, type);break;
      }
      
      // Wait until data is fully loaded
      this.enqueue((function(_this) {
        return function() {
          // When data ready, parse it. 
          _this.parseModel();

          // Render parsed data.
          _this.renderer = Detector.webgl ? new THREE.WebGLRenderer({
            preserveDrawingBuffer: true,
            alpha: true
          }) : new THREE.CanvasRenderer(); 

          _this.renderer.setSize(_this.width, _this.height);
          _this.target.appendChild(_this.renderer.domElement);

          // Run animation.
          _this.play();
        };
      })(this));
    };

    // Set rotate flag to true, and start animation
    Madeleine.prototype.play = function() {
      this.rotatable = true;
      this.animate(this);
    };

    // Start rotating model
    Madeleine.prototype.animate = function(_this) {
      if (_this.rotatable) {
        requestAnimationFrame(function(){_this.animate(_this)});
        _this.rotateModel();
      }
    };

    Madeleine.prototype.rotateModel = function() {
      // Rotate 3D model
      if (this.mesh) this.mesh.rotation.z += this.rotatePerFrame;
      this.renderer.render(this.scene, this.camera);
    };

    // Stop rotating model
    Madeleine.prototype.stop = function() {
      this.rotatable = false;
    };

    return new Madeleine(target);

  };

  // Lily helps madeleine.
  window.Lily = (function() {

    // Initialize
    var Lily = function() {

      this.verbose = 1;
      this.sisters = [];

    };

    // Attach Madeleine to file input
    Lily.prototype.ready = function(inputId, targetId) {
      // takes file input id, target div id
      var target = document.getElementById(inputId);
      if (target.tagName.toLowerCase() == "input" && target.type.toLowerCase() == "file") this.onChange(target, targetId);
      else this.log(INVALID_INPUT);
    };

    // When user uploads files, call Madeleine immediately for each stl file.
    Lily.prototype.onChange = function(input, targetId) {
      // event handler
      // create Madeleine for each file
      var onChangeHandler = function() {
        var i, files = this.files;
        if (files.length) {
          for (i = 0; i < files.length; i++) {
            var madeleine = new Madeleine(targetId);
            madeleine.draw('upload', files[i]);
          }
        }
      };

      // attach event handler
      if (input.addEventListener) input.addEventListener('change', onChangeHandler, false);
      else if (input.attachEvent) input.attachEvent('onchange', onChangeHandler);
      else input['onchange'] = onChangeHandler;

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
        LoadDone          : { verbose: 1, message: logPrefix + "I'm ready to play." },
        DrawFinished      : { verbose: 1, message: logPrefix + "I finished drawing STL file." },
        EventAttached     : { verbose: 1, message: logPrefix + "I'm ready. Upload files." },

        // VERBOSE LEVEL 2
        StartDraw         : { verbose: 2, message: logPrefix + "I started rendering 3D model." },
        StartParse        : { verbose: 2, message: logPrefix + "I started parsing the STL file." },
        ParsingBegin      : { verbose: 2, message: logPrefix + "Parsing STL data..." },
        ParseSTLDone      : { verbose: 2, message: logPrefix + "I finished parsing STL file." },
        DataReceived      : { verbose: 2, message: logPrefix + "The file is successfully loaded." },
        AjaxDataReceived  : { verbose: 2, message: logPrefix + "The Ajax data is successfully received." },

        // VERBOSE LEVEL 3 (TOO talkative, DEBUGGING ONLY)
        WorkQueued        : { verbose: 3, message: logPrefix + "I got a new work: " },
        QueueFlushed      : { verbose: 3, message: logPrefix + "I don't have any work now." },
        QueueProcess      : { verbose: 3, message: logPrefix + "I'm doing my work..." },
        TypeCheck         : { verbose: 3, message: logPrefix + "I'm checking the stl file type..." },
        TypeCheckDone     : { verbose: 3, message: logPrefix + "I finished checking the file type." },

        // Error log messages (MUST BE VERBOSE LEVEL 1)
        UnknownFileType   : { verbose: 1, message: errPrefix + "STL file is neither binary nor ASCII format." },
        TargetInvalid     : { verbose: 1, message: errPrefix + "Target must be a valid DOM Element." },
        InputInvalid      : { verbose: 1, message: errPrefix + "Please select file input as a target." },
        NoFileAPI         : { verbose: 1, message: errPrefix + "This browser doesn't support file API." },
        AjaxFailed        : { verbose: 1, message: errPrefix + "There was a problem in receiving stl file." },
        InvalidDrawType   : { verbose: 1, message: errPrefix + "Invalid type to draw: " }

      };

      // Deliver the message (...If it's not too loud)
      if (this.verbose < messageList[type].verbose) return;
      else console.log(messageList[type].message + description);

    };

    return new Lily(); 

  })();

})();
