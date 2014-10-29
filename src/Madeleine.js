/**
 * @author    Junho Jin[junho.jin@kaist.ac.kr] | https://github.com/JinJunho
 * @version   1.0.0
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

  // Madeleine constructor
  Madeleine = function(options) {

    var Madeleine;

    // Constants for default setting
    var CONVERT_TO_BINARY = true;

    var OBJECT_MATERIAL   = "matt";
    var OBJECT_STATUS     = false;
    var OBJECT_COLOR      = "FF9900";

    var CAMERA_SIGHT     = 45;
    var CAMERA_NEARFIELD = 1;
    var CAMERA_FARFIELD  = 100000;

    var VIEWER_THEME  = "default";
    var VIEWER_PREFIX = "mad-";
    var VIEWER_CREATE = true;
    var VIEWER_HEIGHT = 400;
    var VIEWER_WIDTH  = 640;

    var USER_ROTATE_SENSITIVITY = 0.005;
    var USER_ZOOM_SENSITIVITY   = 100;

    // Necessary option check 
    if (!document.getElementById(options.target)) {
      console.log("MADELEINE[ERR] Target must be a valid DOM Element.");
      return null;
    } else if (!options.data) {
      console.log("MADELEINE[ERR] Option must contain target and data.");
      return null;
    }

    // Construct new Madeleine
    Madeleine = function(options) {
      // Alias to own object
      var scope = this;
      // Internal properties
      this.__uniqueID     = Lily.push(this);
      this.__containerID  = options.target;
      this.__timer        = {start: (new Date).getTime(), end: null};
      // About 3d model
      this.__status       = null;
      this.__object       = null;
      this.__bounds       = null;
      this.__center       = null;
      this.__rawText      = null;
      this.__converted    = null;
      this.__arrayBuffer  = null;
      // Initialize data info object
      this.__info = {type: null, load: this.type, vertices: 0, facets: 0, faces: 0};
      // About visualization
      this.__scene    = new THREE.Scene();
      this.__camera   = null;
      this.__viewer   = null;
      this.__canvas   = null;
      // About rendering
      this.__geometry = null;
      this.__renderer = null;
      // About camera view
      this.__width     = null;
      this.__height    = null;
      this.__sizeRatio = 1;
      // About user interaction
      this.__firstPerson = false;
      this.__movable     = true;
      this.__zoomable    = true;
      this.__rotatable   = true;
      this.__rotating    = false;
      this.__trackMouse  = false;
      this.__mouseX      = 0;
      this.__mouseY      = 0;
      // Crucial properties to render 3d model
      this.data       = options.data;
      this.type       = options.type ? options.type : 'file';
      this.container  = document.getElementById(this.__containerID);
      this.relPath    = options.path ? options.path + (options.path[options.path.length-1] == "/" ? "" : "/") : "./";
      // User configuration 
      this.options = Lily.extend(true, {}, { // Default option
        material    : OBJECT_MATERIAL,
        showStatus  : OBJECT_STATUS,
        objectColor : OBJECT_COLOR,
        viewer : {
          create    : VIEWER_CREATE,  // Create new viewer?
          prefix    : VIEWER_PREFIX,  // Viewer id prefix
          height    : VIEWER_HEIGHT,  // Viewer height
          width     : VIEWER_WIDTH,   // Viewer width
          theme     : VIEWER_THEME,   // Viewer theme
        },
        camera : {
          sight     : CAMERA_SIGHT,     // Vertical Field of View
          near      : CAMERA_NEARFIELD, // Near Field Distance
          far       : CAMERA_FARFIELD,  // Far Field Distance
        },
        rotateSensitivity : USER_ROTATE_SENSITIVITY,
        zoomSensitivity   : USER_ZOOM_SENSITIVITY,
      }, options);

      // Event Listeners
      this.scrollHandler = function(e) {
        var delta = e.wheelDelta ? e.wheelDelta/40 : (e.detail ? -e.detail : 0);
        scope.cameraZoom(delta);
        e.preventDefault();
      };
      this.gestureHandler = function(e) {
        scope.cameraZoom(( 1 < e.scale ? "in" : "out" ));
        e.preventDefault();
      };
      this.mouseDownHandler = function(e) {
        e.preventDefault();
        if ((e.which && e.which == 3) || (e.button && e.button == 2)) {
          // alert("Right click on 3D viewer is disabled.");
        } else {
          scope.trackMouse = true;
          scope.__rotating = false;
          scope.mouseY = e.clientY;
          scope.mouseX = e.clientX;
        }
      };
      this.mouseMoveHandler = function(e) {
        if (scope.trackMouse) {
          // Top-left corner is (0, 0)
          // e.clientX grows as mouse goes down
          // e.clientY grows as mouse goes right
          scope.rotateObjectZ(scope.mouseX - e.clientX);
          scope.rotateObjectX(scope.mouseY - e.clientY);
          scope.mouseY = e.clientY;
          scope.mouseX = e.clientX;
        }
        e.preventDefault();
      };
      this.mouseUpHandler = function(e) {
        scope.trackMouse = false;
        scope.__rotating = true;
        e.preventDefault();
      };
      this.touchStartHandler = function(e) {
        if (e.changedTouches.length == 1) {
          scope.trackMouse = true;
          scope.__rotating = false;
          scope.mouseY = e.changedTouches[0].clientY;
          scope.mouseX = e.changedTouches[0].clientX;
        }
      };
      this.touchMoveHandler = function(e) {
        if (scope.trackMouse) {
          // Top-left corner is (0, 0)
          // e.clientX grows as touch goes down
          // e.clientY grows as touch goes right
          scope.rotateObjectZ(scope.mouseX - e.clientX);
          scope.rotateObjectX(scope.mouseY - e.clientY);
          scope.mouseY = e.clientY;
          scope.mouseX = e.clientX;
        }
        e.preventDefault();
      };
      this.touchEndHandler = function(e) {
        scope.trackMouse = false;
        scope.__rotating = true;
        e.preventDefault();
      };
      this.rightClickHandler = function(e) {
        e.preventDefault();
      };
      this.viewModeHandler = function(e) {
        if (scope.__firstPerson) {
          e.target.className = e.target.className.replace(" focused", "");
          scope.__firstPerson = false;
          scope.disableFirstPersonViewerMode();
        } else {
          e.target.className += " focused";
          scope.__firstPerson = true;
          scope.enableFirstPersonViewerMode();
        }
      };
      this.captureHandler = function(e) {
        // TODO capture the model
      };

      // Check if option values are correct
      this.adjustUserConfiguration();
      // Initialize rendering
      this.init();
    };

    // Initialize rendering
    Madeleine.prototype.init = function() {
      // Get file name 
      this.__info.name = (typeof this.data == "string") ? this.data.split("/").slice(-1)[0] : this.data.name;

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
      // Create viewer
      this.createViewer();

      // Adjust canvas width/height ratio
      this.__sizeRatio = this.__width / this.__height;

      // Create camera
      this.__camera = new THREE.PerspectiveCamera(
        this.options.camera.sight,
        this.__sizeRatio,
        this.options.camera.near,
        this.options.camera.far
      ); 

      // Set user's point-of-view and default camera position
      this.__camera.position.set(0, 0, 0);
      this.__scene.add(this.__camera);

      // Add lights
      if (OBJECT_MATERIAL == "shiny") {
        this.addShadowedLight(1, 1, 1, 0xFFFFFF, 1.3);
        this.addShadowedLight(0.5, 1, -1, 0xFFCC66, 1);
        var ambientLight = new THREE.AmbientLight(0x111111);
        this.__scene.add(ambientLight);
      } else {
        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
        var ambientLight = new THREE.AmbientLight(0x202020);
        directionalLight.position.set(0, 1, 1).normalize();
        this.__scene.add(directionalLight);
        this.__scene.add(ambientLight);
      }

      // Start rendering
      this.draw();
    };

    // Rendering start
    Madeleine.prototype.draw = function() {
      // Wait until data is fully loaded
      var queued = (function(scope) {
        return function() {
          // When data ready, parse and render it. 
          scope.run(scope.relPath + "lib/MadeleineLoader.js", {
            arrbuf: scope.__arrayBuffer,
            rawtext: scope.__rawText
          }, function(result) {
            var hasColors = result.hasColors;
            var vertices = result.vertices;
            var normals = result.normals;
            var colors = result.colors;
            var alpha = result.alpha;

            // Create new geometry
            scope.__geometry = new THREE.Geometry();

            // Parsing done. Add vertices and normals to geometry
            scope.__geometry = new THREE.BufferGeometry();
            scope.__geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
            scope.__geometry.addAttribute('normal', new THREE.BufferAttribute(normals, 3));

            // Set color information
            if (hasColors) {
              scope.__geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
              scope.__geometry.hasColors = true;
              scope.__geometry.alpha = alpha;
            }

            // Start rendering
            scope.renderObject();

            // Compute time consumed in parsing and rendering
            scope.__timer.end = (new Date()).getTime();
            var consumed = (scope.__timer.end - scope.__timer.start) / 1000;
            console.log("MADELEINE[LOG] Time spent: " + consumed + " sec.");

            // Render object
            scope.render();
            // Log rendering status
            scope.logStatus();
            // Start rotating animation
            scope.startAnimation();
            // Enable mouse zoom action
            scope.enableZoomAsMouseScroll();
            // Enable mouse motion action
            scope.enableUserInteraction();
          });
        };
      })(this);

      // Check input type and get STL Binary data 
      switch (this.type) {
        case "upload":
          this.getDataFromBlob(this.data, queued);break;
        case "file":
          this.getDataFromUrl(this.data, queued);break;
        default:
          break;
      }
    };

    // Get arrayBuffer from Blob
    Madeleine.prototype.getDataFromBlob = function(file, queuedWork) {
      var scope = this;

      if (Detector.fileapi) {
        var arrbuf = new FileReader();
        var rawtxt = new FileReader();
        // arraybuffer onload function
        arrbuf.onload = function() { scope.__arrayBuffer = arrbuf.result };
        // read arrayBuffer from Blob
        arrbuf.readAsArrayBuffer(file);

        // rawtext onload function
        rawtxt.onload = function() {
          scope.__rawText = rawtxt.result;
          queuedWork();
        };
        // read raw text data from Blob
        rawtxt.readAsText(file);
      }
    };

    // Get arrayBuffer from external file 
    Madeleine.prototype.getDataFromUrl = function(url, queuedWork, type) {
      var scope = this;
      var getArrayBuffer = function() {
        var arrbuf = new XMLHttpRequest();
        arrbuf.onerror = function(e) { console.log("MADELEINE[ERR] Ajax failed.") };
        arrbuf.onreadystatechange = function() {
          if (arrbuf.readyState == 4 && (arrbuf.status == 200 || arrbuf.status == 0)) {
            scope.__arrayBuffer = arrbuf.response;
            if (type == "binary") queuedWork();
            if (!type) getRawText();
          }
        };
        arrbuf.responseType = "arraybuffer";
        arrbuf.open("GET", url, true);
        arrbuf.send(null);
      };
      var getRawText = function() {
        var rawtxt = new XMLHttpRequest();
        rawtxt.onerror = function(e) { console.log("MADELEINE[ERR] Ajax failed.") };
        rawtxt.onreadystatechange = function() {
          if (rawtxt.readyState == 4 && (rawtxt.status == 200 || rawtxt.status == 0)) {
            scope.__rawText = rawtxt.response;
            queuedWork();
          }
        };
        rawtxt.responseType = "text";
        rawtxt.open("GET", url, true);
        rawtxt.send(null);
      };

      // Get data from external resource
      switch(type) {
        case "ascii":
          getRawText();
          break;
        default:
          getArrayBuffer();
          break;
      }
    };

    // Render object
    Madeleine.prototype.renderObject = function() {
      // Create renderer
      if (!this.__object) this.createRenderer();

      // Get material
      var material = null;
      if (this.options.material == "shiny") {
        material = new THREE.MeshPhongMaterial({
          color: this.getHexColor(this.options.objectColor),
          ambient: this.getHexColor(this.options.objectColor),
          specular: 0x1F1F1F,
          shininess: 25,
          side: THREE.DoubleSide,
          overdraw: true
        });
      } else {
        material = new THREE.MeshLambertMaterial({
          color: this.getHexColor(this.options.objectColor),
          shading: THREE.FlatShading,
          side: THREE.DoubleSide,
          overdraw: true
        });
      }

      // Generate mesh for object
      this.__object = new THREE.Mesh(this.__geometry, material);
      this.__geometry.computeBoundingSphere();
      this.__geometry.computeVertexNormals();
      this.__geometry.computeBoundingBox();

      // Adjust positions of camera and object to make object fit into screen properly
      var radius = this.__geometry.boundingSphere.radius;
      // 1.865 times zoomed object with radius 85 practically fits best to the screen
      var zoomFactor = 1.865 * 85 / radius;

      // Zoom object to fit into the screen. ZoomFactor is practically best to fit
      this.__object.scale.set(zoomFactor, zoomFactor, zoomFactor);
      // Height 125 fits well to the screen. If taller, lower the center of y-axis
      var maxY = this.__geometry.boundingBox.max.y;
      var minY = this.__geometry.boundingBox.min.y;
      var height = maxY - minY;
      var deltaY = (height > 125 ? parseFloat(0.99 * (height - Math.max(maxY, Math.abs(minY)))) : 15);
      this.__object.position.setY(-deltaY);

      // If object is too large to fit in, make camera look further
      // 500 (default camera distance) : 466 (view height)
      // new distance (x) : boundingSphere radius (r) * 2
      // x = (2 * r * 500) / 466 ~= 2.146 * r
      if (radius < 233) this.__camera.position.z = 500;
      else this.__camera.position.z = radius * 2.146;
      this.__camera.updateProjectionMatrix();

      // Parsing finished
      this.__scene.add(this.__object);
      this.__object.rotation.x = -1.2;
      this.__object.rotation.z = 1.2;
    };

    // Generate Renderer
    Madeleine.prototype.createRenderer = function() {
      // create renderer
      this.__renderer = Detector.webgl ?
        new THREE.WebGLRenderer({
          preserveDrawingBuffer: true,
          alpha: true
        }) : new THREE.CanvasRenderer(); 
      // attach canvas to viewer
      this.__canvas = this.__renderer.domElement;
      this.__viewer.appendChild(this.__canvas);
      // renderer configuration
      this.__renderer.setSize(this.__width, this.__height);
      this.__renderer.setClearColor(0x000000, 0);
      // this.__renderer.shadowMapCullFace = THREE.CullFaceBack;
      // this.__renderer.shadowMapEnabled = true;
      // this.__renderer.gammaOutput = true;
      // this.__renderer.gammaInput = true;
    };

    // Generate Madeleine Viewer
    Madeleine.prototype.createViewer = function() {
      if (!this.options.viewer.create) this.container.appendChild(this.__renderer.domElement);
      else {
        // Create viewer element
        this.__viewer = document.createElement("div");
        this.__viewer.id = this.options.viewer.prefix + this.__uniqueID;

        // Force viewer size
        this.container.style["max-height"] = this.__height+"px";
        this.container.style["min-height"] = this.__height+"px";
        this.__viewer.style["max-height"] = this.__height+"px";
        this.__viewer.style["min-height"] = this.__height+"px";
        this.__viewer.style.height = this.__height;
        this.__viewer.style.width = this.__width;

        // Set default style
        this.__viewer.style.background = "transparent";
        this.__viewer.style.position = "relative";
        this.__viewer.style.margin = "0 0 10px 0";

        // Progress bar
        var progress = document.createElement("div");
        progress.id = "progressBar-" + this.__uniqueID;
        progress.style["-webkit-transition"] = "width .5s ease-in-out, opacity 2s ease";
        progress.style["-moz-transition"] = "width .5s ease-in-out, opacity 2s ease";
        progress.style["-ms-transition"] = "width .5s ease-in-out, opacity 2s ease";
        progress.style["-o-transition"] = "width .5s ease-in-out, opacity 2s ease";
        progress.style["transition"] = "width .5s ease-in-out, opacity 2s ease";
        progress.style["min-height"] = "2px";
        progress.style.background = "#009999";
        progress.style.position = "absolute";
        progress.style.height = "2px";
        progress.style.width = 0;
        progress.style.left = 0;
        progress.style.top = 0;

        // Viewer iconGrid
        var iconGrid = document.createElement("div");
        iconGrid.style.cssText += "background:transparent;position:absolute;padding:15px 10px;";
        iconGrid.style.cssText += "height:50px;width:"+this.__width+"px;top:0;overflow:hidden;";
        iconGrid.className += "box";

        var logo = document.createElement("div");
        var info = document.createElement("div");
        var view = document.createElement("div");
        var capture = document.createElement("div");
        //var download = document.createElement("div");
        var fullscreen = document.createElement("div");

        info.id = "model-info-" + this.__uniqueID;
        info.className += "model-info noselect";
        info.innerHTML = this.__info.name;

        logo.className += "clickable pull-left madeleine-logo";
        view.className += "clickable pull-right icon-mad-view";
        capture.className += "clickable pull-right icon-mad-capture";
        //download.className += "clickable pull-right icon-mad-download";
        fullscreen.className += "clickable pull-right icon-mad-screen-full";

        Lily.bind(view, "click", this.viewModeHandler);
        Lily.bind(capture, "click", this.captureHandler);

        var rotator = document.createElement("div");
        var faster = document.createElement("div");
        var slower = document.createElement("div");
        var player = document.createElement("div");

        rotator.style.cssText += "background:transparent;position:absolute;padding:15px 10px;right:0;";
        rotator.style.cssText += "height:50px;width:"+this.__width+"px;top:0;overflow:hidden;";
        rotator.style.cssText += "margin-top:"+(this.__height-30)+"px;";

        player.className += "icon-clickable pull-right icon-mad-stop";
        slower.className += "icon-clickable pull-right icon-mad-slower";
        faster.className += "icon-clickable pull-right icon-mad-faster";

        rotator.appendChild(faster);
        rotator.appendChild(player);
        rotator.appendChild(slower);

        var controller = document.createElement("div");
        var trackball = document.createElement("div");
        var right = document.createElement("div");
        var left = document.createElement("div");
        var down = document.createElement("div");
        var up = document.createElement("div");
        
        iconGrid.appendChild(fullscreen);
        //iconGrid.appendChild(download);
        iconGrid.appendChild(capture);
        iconGrid.appendChild(view);
        iconGrid.appendChild(logo);
        iconGrid.appendChild(info);
        iconGrid.appendChild(rotator);

        // Append to container
        this.container.appendChild(this.__viewer);
        this.__viewer.appendChild(iconGrid);
        this.__viewer.appendChild(progress);
        this.adaptViewerTheme();
      }
    };

    // Set viewer theme
    Madeleine.prototype.adaptViewerTheme = function() {
      var theme = arguments.length == 0 ? this.options.viewer.theme : arguments[0];

      // Adapt theme
      switch (theme) {
        case "dark":
          this.__viewer.style.background  = "#000000"; 
          this.options.objectColor = "FFD300";
          break;
        case "lime":
          this.__viewer.style.cssText += this.generateGradation({dark: "2B2B2B"});
          this.options.objectColor = "D4FF00"; // [212, 255, 0];
          break;
        case "rose":
          this.__viewer.style.cssText += this.generateGradation({bright: "369075"});
          this.options.objectColor = "C94C66"; // [201, 76, 102];
          break;
        case "lego":
          this.__viewer.style.cssText += this.generateGradation({bright: "FFA400"});
          this.options.objectColor = "00A08C"; // [0, 160, 140];
          break;
        case "toxic":
          this.__viewer.style.cssText += this.generateGradation({bright: "FFEE4D"});
          this.options.objectColor = "5254CB"; // [82, 84, 203];
          break;
        case "cobalt":
          this.__viewer.style.cssText += this.generateGradation({bright: "FFC200"});
          this.options.objectColor = "0C6BC0"; // [12, 107, 192];
          break;
        case "light":
          this.__viewer.style.cssText += this.generateGradation({bright: "FFFFFF"});
          this.options.objectColor = "F00842";
          break;
        case "soft":
          this.__viewer.style.cssText += this.generateGradation({dark: "0F0F0F", bright: "4D4D4D", pos1: "0", pos2: "60"});
          this.options.objectColor = OBJECT_COLOR;
          break;
        default:
          this.__viewer.style.background  = "#DADADA"; 
          this.options.objectColor = "009999";
          break;
      }

      // If object exists, paint color on it.
      this.__object && this.setObjectColor();
    };

    // Set canvas background color
    Madeleine.prototype.setBackgroundColor = function(code) {
      var code = arguments.length == 3 ? [arguments[0], arguments[1], arguments[2]] : code;
      var color = this.getHexString(code);
      this.__viewer.style.background = this.makeHexString(color);
    };

    // Set object surface color
    Madeleine.prototype.setObjectColor = function() {
      var color = arguments.length != 0 ? arguments : this.options.objectColor;
      this.__object.material.color.setHex(this.getHexColor(color));
    };

    // Generate gradation css
    Madeleine.prototype.generateGradation = function(colors) {
      var pos1, pos2, darker, brighter, cssText;

      cssText = "background: BRIGHT;" +
                "background: -moz-radial-gradient(center, ellipse cover, BRIGHT POS1%, DARK POS2%);" +
                "background: -webkit-gradient(radial, center center, 0px, center center, POS2%, color-stop(POS1%,BRIGHT), color-stop(POS2%,DARK))" +
                "background: -webkit-radial-gradient(center, ellipse cover, BRIGHT POS1%,DARK POS2%);" +
                "background: -o-radial-gradient(center, ellipse cover, BRIGHT POS1%, DARK POS2%);" +
                "background: -ms-radial-gradient(center, ellipse cover, BRIGHT POS1%, DARK POS2%);" +
                "background: radial-gradient(ellipse at center, BRIGHT POS1%, DARK POS2%);" +
                "filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='BRIGHT', endColorstr='DARK',GradientType=1)"; 

      if (colors.dark) {
        darker = this.getHexString(colors.dark);
        brighter = this.getHexString(colors.bright ? colors.bright : this.adjustBrightness(darker));
      } else {
        brighter = this.getHexString(colors.bright);
        darker = this.getHexString(this.adjustBrightness(brighter));
      }

      pos1 = colors.pos1 ? colors.pos1 : 27;
      pos2 = colors.pos2 ? colors.pos2 : 100;

      return cssText.replace(/BRIGHT/g, brighter).replace(/DARK/g, darker).replace(/POS1/g, pos1).replace(/POS2/g, pos2);
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
      var darkFactor = 30, brightFactor = 20;

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

    // Add new background worker 
    Madeleine.prototype.run = function(path, luggage, onload) {
      var progressBar = document.getElementById("progressBar-"+this.__uniqueID);
      var worker = new WorkerFacade(path);
      var scope = this;

      worker.postMessage(luggage);
      worker.onmessage = function(event) {
        var result = event.data;
        switch (result.type) {
          case "convert-progress":
            // console.log("MADELEINE[LOG] Background converting progress: " + result.data + "%");
            break;
          case "convert":
            if (CONVERT_TO_BINARY) scope.run(scope.relPath + "lib/MadeleineConverter.js", result.data, function(result) { scope.__converted = result });
            break;
          case "progress":
            progressBar.style.width = (scope.__width * result.data / 100) + "px";
            if (result.data == 100) {
              progressBar.style["-webkit-opacity"] = 0;
              progressBar.style["-moz-opacity"] = 0;
              progressBar.style["opacity"] = 0;
            };
            // console.log("MADELEINE[LOG] Background work progress: " + result.data + "%");
            break;
          case "message":
            console.log("MADELEINE[LOG] Background work message: " + result.data);
            break;
          case "error":
            console.log("MADELEINE[ERR] Background work error: " + result.data);
            break;
          case "info":
            scope.__info[result.prop] = result.data;
            if (result.prop == "size") {
              var infoBox = document.getElementById("model-info-" + scope.__uniqueID);
              infoBox.innerHTML += " (" +result.data + ")";
            }
            break;
          case "data":
            scope["__" + result.prop] = result.data;
            break;
          case "done":
            onload(result.data);
            break;
          default:
            // Do nothing
            break;
        }
      };
    };

    // Start animation
    Madeleine.prototype.startAnimation = function() {
      if (this.__rotatable) this.__rotating = true;
      this.interact(this);
    };

    // Stop animation
    Madeleine.prototype.stopAnimation = function() {
      this.__rotating = false;
    };

    // Start rotating object
    Madeleine.prototype.startRotation = function() {
      this.options.rotateSensitivity = 0.005;
      this.__rotating = true;
    };

    // Stop rotating object
    Madeleine.prototype.stopRotation = function() {
      this.__rotating = false;
    };

    // Enable user interaction
    Madeleine.prototype.interact = function(scope) {
      requestAnimationFrame(function(){scope.interact(scope)});
      scope.options.showStatus && scope.__status.update();
      scope.render();
    };

    // Perform actual rendering object
    Madeleine.prototype.render = function() {
      this.__rotating && this.rotateObjectZ(-1);
      this.__renderer.render(this.__scene, this.__camera);
    };

    // Rotate object in X direction
    Madeleine.prototype.rotateObjectX = function(delta) {
      if (this.__movable) this.__object.rotation.x -= delta * this.options.rotateSensitivity;
    };

    // Rotate object in Y direction
    Madeleine.prototype.rotateObjectY = function(delta) {
      if (this.__movable) this.__object.rotation.y -= delta * this.options.rotateSensitivity;
    };

    // Rotate object in Z direction
    Madeleine.prototype.rotateObjectZ = function(delta) {
      if (this.__movable) this.__object.rotation.z -= delta * this.options.rotateSensitivity;
    };

    // Make animation faster as much as 'delta'
    Madeleine.prototype.animationFaster = function(delta) {
      this.options.rotateSensitivity *= (delta ? delta : 2);
    };

    // Make animation slower as much as 'delta'
    Madeleine.prototype.animationSlower = function(delta) {
      this.options.rotateSensitivity /= (delta ? delta : 2);
    };

    // Disable Madeline Viewer to be zoomed by mouse scroll
    Madeleine.prototype.disableZoomAsMouseScroll = function() {
      var target = this.container;
      // remove event handler
      Lily.remove(this.container, "mousewheel", this.scrollHandler);
      Lily.remove(this.container, "DOMMouseScroll", this.scrollHandler);
      Lily.remove(this.container, "gesturechange", this.gestureHandler);
    };

    // Enable Madeline Viewer to be zoomed by mouse scroll
    Madeleine.prototype.enableZoomAsMouseScroll = function() {
      if (!this.__zoomable) return;
      // attach event handler
      Lily.bind(this.container, "mousewheel", this.scrollHandler);
      Lily.bind(this.container, "DOMMouseScroll", this.scrollHandler);
      Lily.bind(this.container, "gesturechange", this.gestureHandler);
    }; 

    // Enable Madeline Viewer to be controlled by mouse movement 
    Madeleine.prototype.enableUserInteraction = function() {
      // block right click action
      Lily.bind(this.container, "contextmenu", this.rightClickHandler);
      if (!this.__movable) return;
      // attach event handler
      Lily.bind(this.container, "mousedown", this.mouseDownHandler);
      Lily.bind(this.container, "mousemove", this.mouseMoveHandler);
      Lily.bind(this.container, "mouseup", this.mouseUpHandler);
      // mobile support
      Lily.bind(this.container, "touchstart", this.touchStartHandler);
      Lily.bind(this.container, "touchmove", this.touchMoveHandler);
      Lily.bind(this.container, "touchend", this.touchEndHandler);
    }; 

    // Disable Madeline Viewer to be controlled by mouse movement 
    Madeleine.prototype.disableUserInteraction = function() {
      if (!this.__movable) return;
      // attach event handler
      Lily.remove(this.container, "mousedown", this.mouseDownHandler);
      Lily.remove(this.container, "mousemove", this.mouseMoveHandler);
      Lily.remove(this.container, "mouseup", this.mouseUpHandler);
      // mobile support
      Lily.remove(this.container, "touchstart", this.touchStartHandler);
      Lily.remove(this.container, "touchmove", this.touchMoveHandler);
      Lily.remove(this.container, "touchend", this.touchEndHandler);
    }; 

    // Enable first-person viewer mode 
    Madeleine.prototype.enableFirstPersonViewerMode = function() {
      this.disableUserInteraction();
      Lily.bind(document, "keypress", this.firstPersonHandler);
      Lily.bind(document, "keydown", this.firstPersonHandler);
      this.__firstPerson = true;
      this.__rotating = false;
      this.__zoomable = false;
      this.__movable = false;
    }; 

    // Disable first-person viewer mode 
    Madeleine.prototype.disableFirstPersonViewerMode = function() {
      this.enableUserInteraction();
      this.__firstPerson = false;
      this.__rotating = true;
      this.__zoomable = true;
      this.__movable = true;
    }; 

    // Adjust camera zoom in/out 
    Madeleine.prototype.cameraZoom = function() {
      if (!this.__zoomable) return;
      else {
        var delta, type;
        if (arguments.length == 1) {
          if (typeof arguments[0] == "string") {
            delta = this.options.zoomSensitivity;
            type = arguments[0];
          } else {
            delta = arguments[0];
            type = null;
          }
        } else if (arguments.length == 2) {
          delta = arguments[0];
          type = arguments[1];
        }
        if (type == "in") this.__camera.position.z += delta;
        else this.__camera.position.z -= delta;
        this.__camera.updateProjectionMatrix();
      }
    };

    // Show animation status
    Madeleine.prototype.logStatus = function(target) {
      if (!this.options.showStatus) return;
      this.__status = new Stats();
      this.__status.domElement.style.position = 'absolute';
      this.__status.domElement.style.top = '0px';
      this.__viewer.appendChild(this.__status.domElement);
    };

    // Show animation status
    Madeleine.prototype.stopLogStatus = function(target) {
      this.options.showStatus = false;
      this.__status = null;
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

    // Add directional light
    Madeleine.prototype.addShadowedLight = function(x, y, z, color, intensity) {
      var directionalLight = new THREE.DirectionalLight(color, intensity);
      var d = 1;

      directionalLight.position.set(x, y, z);
      this.__scene.add(directionalLight);

      // directionalLight.shadowCameraVisible = true;
      directionalLight.castShadow = true;
      directionalLight.shadowCameraTop = d;
      directionalLight.shadowCameraLeft = -d;
      directionalLight.shadowCameraRight = d;
      directionalLight.shadowCameraBottom = -d;

      directionalLight.shadowCameraNear = 1;
      directionalLight.shadowCameraFar = 4;

      directionalLight.shadowMapWidth = 1024;
      directionalLight.shadowMapHeight = 1024;

      directionalLight.shadowBias = -0.005;
      directionalLight.shadowDarkness = 0.15;
    };

    return new Madeleine(options);

  };

  // Lily helps madeleine.
  window.Lily = (function() {

    // Initialize
    var Lily = function() {
      if (!Detector.webgl) Detector.addGetWebGLMessage();
      this.sisters = [];
    };

    // Attach Madeleine to file input
    Lily.prototype.ready = function(options) {
      // Check option fields
      if (!options.file || !options.target) {
        console.log("MADELEINE[ERR] Option must contain target and file.");
        return null;
      }

      var target = document.getElementById(options.file);
      if (!target) {
        console.log("MADELEINE[ERR] Please provide valid input file element.");
        return null;
      }
      // Attach file upload event handler
      if (target.tagName.toLowerCase() == "input" && target.type.toLowerCase() == "file") this.onFileInputChange(target, options);

      // (Optional) Attach drag-and-drop event handler
      if (options.dropzone) {
        var dragOverHandler = function(e) {
          e.stopPropagation();
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        };
        var fileDropHandler = function(e) {
          var i, files = e.dataTransfer.files;
          e.stopPropagation();
          e.preventDefault();
          for (i = 0; i < files.length; i++) {
            // create Madeleine for each file
            var _options = window.Lily.extend({}, options, {type: "upload", data: files[i]});
            var madeleine = new Madeleine(_options);
          }
        };

        // Attach event handler
        target = document.getElementById(options.dropzone);
        this.bind(target, "dragover", dragOverHandler);
        this.bind(target, "drop", fileDropHandler);
      }
    };

    // Remove attached event handler from element
    Lily.prototype.remove = function(elem, event, doThis) {
      var attach = (elem.removeEventListener ? "removeEventListener" : (elem.detachEvent ? "detachEvent" : ""));
      var onEvent = (elem.removeEventListener ? event : "on" + event);

      if (attach == "") elem[onEvent] = doThis;
      else elem[attach](onEvent, doThis, false);
    };

    // Attach new event handler to element
    Lily.prototype.bind = function(elem, event, doThis) {
      var attach = (elem.addEventListener ? "addEventListener" : (elem.attachEvent ? "attachEvent" : ""));
      var onEvent = (elem.addEventListener ? event : "on" + event);

      if (attach == "") elem[onEvent] = doThis;
      else elem[attach](onEvent, doThis, false);
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
        class2type = {"[object Boolean]": "boolean","[object Number]": "number","[object String]": "string","[object Function]": "function",
                      "[object Array]": "array","[object Date]": "date","[object RegExp]": "regexp","[object Object]": "object"},
        helper = {
          isFunction: function (obj) {return helper.type(obj) === "function"},
          isArray: Array.isArray || function (obj) {return helper.type(obj) === "array"},
          isWindow: function (obj) {return obj != null && obj == obj.window},
          isNumeric: function (obj) {return !isNaN(parseFloat(obj)) && isFinite(obj)},
          type: function (obj) {return obj == null ? String(obj) : class2type[toString.call(obj)] || "object"},
          isPlainObject: function (obj) {if (!obj || helper.type(obj) !== "object" || obj.nodeType) {return false}
            try { if (obj.constructor && !hasOwn.call(obj, "constructor") && !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {return false}} catch (e) {return false}
            var key; for (key in obj) {}; return key === undefined || hasOwn.call(obj, key)
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
      if ( typeof target !== "object" && !helper.isFunction(target) ) {
        target = {};
      }
      // Extend helper itself if only one argument is passed
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
            if ( target === copy ) { continue; }
            // Recurse if we're merging plain objects or arrays
            if ( deep && copy && ( helper.isPlainObject(copy) ||
              (copyIsArray = helper.isArray(copy)) ) ) {
              if ( copyIsArray ) {
                copyIsArray = false;
                clone = src && helper.isArray(src) ? src : [];
              } else { clone = src && helper.isPlainObject(src) ? src : {}; }
              // Never move original objects, clone them
              target[ name ] = this.extend( deep, clone, copy );
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
      var fileInputChangeHandler = function() {
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
      this.bind(input, "change", fileInputChangeHandler);
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

    return new Lily(); 

  })();

})();

/* A facade for the Web Worker API that fakes it in case it's missing. 
 * Good when web workers aren't supported in the browser, but it's still fast enough,
 * so execution doesn't hang too badly (e.g. Opera 10.5).
 * By Stefan Wehrmeyer, licensed under MIT
 */
WorkerFacade = null;
if(!!window.Worker){
  WorkerFacade = (function(){
    return function(path){
      return new window.Worker(path);
    };
  }());
} else {
  WorkerFacade = (function(){
    var workers = {}, masters = {}, loaded = false;
    var that = function(path){
      var theworker = {}, loaded = false, callings = [];
      theworker.postToWorkerFunction = function(args){
        try{
          workers[path]({"data":args});
        }catch(err){
          theworker.onerror(err);
        }
      };
      theworker.postMessage = function(params){
        if(!loaded){
          callings.push(params);
          return;
        }
        theworker.postToWorkerFunction(params);
      };
      masters[path] = theworker;
      var scr = document.createElement("SCRIPT");
      scr.src = path;
      scr.type = "text/javascript";
      scr.onload = function(){
        loaded = true;
        while(callings.length > 0){
          theworker.postToWorkerFunction(callings[0]);
          callings.shift();
        }
      };
      document.body.appendChild(scr);
      
      var binaryscr = document.createElement("SCRIPT");
      binaryscr.src = thingiurlbase + '/binaryReader.js';
      binaryscr.type = "text/javascript";
      document.body.appendChild(binaryscr);
      
      return theworker;
    };
    that.fake = true;
    that.add = function(pth, worker){
      workers[pth] = worker;
      return function(param){
        masters[pth].onmessage({"data": param});
      };
    };
    that.toString = function(){
      return "FakeWorker('"+path+"')";
    };
    return that;
  }());
};
