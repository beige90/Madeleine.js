(function() {

  var DRAW_START        = "StartDraw";
  var PARSE_START       = "StartParse";
  var DATA_GET_SUCCESS  = "DataReceived";
  var AJAX_SUCCESS      = "AjaxDataReceived";
  var AJAX_FAIL         = "AjaxFailed";
  var DONE_DRAW         = "DrawFinished";
  var PARSE_SUCCESS     = "ParseSTLDone";
  var INVALID_DRAW_TYPE = "InvalidDrawType";

  window.Madeleine = function(target) {

    var Madeleine;

    // Check if target exists.
    if (!document.getElementById(target)) {
      console.log("Madeleine must take valid DOM Element as its target.");
      return null;
    }

    Madeleine = function(target) {
      
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

      this.verticalFOV = 100;
      this.nearFieldDistance = 1;
      this.farFieldDistance = 100000;
      this.canvasSizeRatio = 1;

    };

    Madeleine.prototype.init = function() {

      var width, height;

      // Get target width and height
      if (document.defaultView && document.defaultView.getComputedStyle)
      width = parseFloat(document.defaultView.getComputedStyle(container,null).getPropertyValue('width'));
      else
      width = parseFloat(container.currentStyle.width);
      height  = width * this.canvasSizeRatio;

      // Basic THREE.js setup
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(
        this.verticalFOV,
        this.canvasSizeRatio,
        this.nearFieldDistance,
        this.farFieldDistance
      ); 

      // Tilt point of view
      this.camera.position.z = 50;
      this.camera.position.y = 0;
      this.scene.add(this.camera);

      // Add lights
      this.directionalLight = new Three.DirectionalLight(0xFFFFFF, 0.8);
      this.directionalLight.position.x = 0;
      this.directionalLight.position.y = 0;
      this.directionalLight.position.z = 1;
      this.directionalLight.position.normalize();
      this.scene.add(directionalLight);      

    };

    Madeleine.prototype.parseBinarySTL = function() {
      Lily.log(PARSE_START);

      this.geometry = new THREE.Geometry();
      var dataview = new DataView(this.model);


      // TODO Parse STL file


      this.mesh = new THREE.Mesh(
        this.geometry,
        new THREE.MeshLambertMaterial({
          overdraw: true,
          color: 0x009999,
          shading: THREE.FlatShading
        })
      );

      this.scene.add(this.mesh);

      Lily.log(PARSE_SUCCESS);
    };

    Madeleine.prototype.getBinaryFromBlob = function(file) {
      var reader = new FileReader();

      reader.onload = function() {
        Lily.log(DATA_GET_SUCCESS);
        this.model = reader.result;
      };

      reader.readAsArrayBuffer(file);
    };

    Madeleine.prototype.getBinaryFromUrl = function(url) {

      var xhr = new XMLHttpRequest();

      xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 0)) {
          Lily.log(AJAX_SUCCESS);
          this.model = xhr.response;
        }
      };

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
        case "file":
          this.getBinaryFromBlob(data);break;
        case "url":
          this.getBinaryFromUrl(data);break;
        default:
          Lily.log(INVALID_DRAW_TYPE, type);break;
      }
      
      // Parse STL Binary data
      this.parseBinarySTL();

      // Render parsed data
      this.renderer = Detector.webgl ? new THREE.WebGLRenderer(
        preserveDrawingBuffer: true,
        alpha: true
      ) : new THREE.CanvasRenderer(); 

      this.renderer.setSize(width, height);
      this.target.appendChild(this.renderer.domElement);

      // Run animation
      this.play();

    };

    Madeleine.prototype.play = function() {
      this.rotatable = true;
      this.rotateModel();
    };

    Madeleine.prototype.rotateModel = function() {
      // TODO Rotate 3D model
    };

    Madeleine.prototype.stop = function() {
      this.rotatable = false;
    };

    return new Madeleine(target);

  };

  // Lily helps madeleine to parse stl, log message to console, etc.
  window.Lily = (function() {

    var Lily;

    Lily = function() {

      // Initialize

    };

    Lily.prototype.log = function(type, info) {
      var errPrefix = "[ERR] Madeleine: "; 
      var logPrefix = "[LOG] Madeleine: ";
      var messageType = {
        // Normal log messages
        StartDraw         : logPrefix + "Start rendering 3D model...",
        StartParse        : logPrefix + "Start parsing stl data...",
        DataReceived      : logPrefix + "Successfully loaded file.",
        AjaxDataReceived  : logPrefix + "Packaged received.",
        ParseSTLDone      : logPrefix + "Parsing STL file done.",
        DrawFinished      : logPrefix + "Drawing STL file done.",
        // Error log messages
        AjaxFailed        : errPrefix + "There was a problem in receiving stl file.",
        InvalidDrawType   : errPrefix + "Invalid type to draw: "
      };
      console.log(messageType[type] + (info != '' ? info : ''));
    };

    return new Lily(); 

  })();

})();
