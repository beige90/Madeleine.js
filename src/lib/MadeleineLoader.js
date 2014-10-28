/**
 * @author    Junho Jin[junho.jin@kaist.ac.kr] | https://github.com/JinJunho
 * @version   1.0.0
 *
 * [Project] Madeleine.js, Pure JavaScript STL Parser & Renderer. 
 * [Module] MadeleineLoader.js
 * 
 * [Description] MadeleineLoader takes raw arrayBuffer data of a stl file and
 * parses the data properly by checking if its format is binary of ASCII. For
 * better performance, MadeleineLoader runs in the background, not affecting
 * any performance degradation of browser rendering or script execution.
 */

var workerFacadeMessage;

MadeleineLoader = function(event) {

  var arrbuf = event.data.arrbuf;
  var rawText = event.data.rawtext;
  var reader = new DataReader(arrbuf);

  var checkSTLType, parseBinarySTL, parseASCIISTL;
  var hasColors = false, colors, alpha;
  var normals, vertices;

  // STL file type checker
  checkSTLType = function() {
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

    reader.skip(80);

    // reader.readUInt32() == number of facets
    dataSize = 80 + 4 + 50 * reader.readUInt32();
    realSize = reader.getLength();
    isBinary = dataSize == realSize;

    // Send data type
    workerFacadeMessage({
      type: "info",
      prop: "type",
      data: isBinary ? "binary" : "ascii"
    });

    // Send data size
    workerFacadeMessage({
      type: "info",
      prop: "size",
      data: (function(bytes) {
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes == 0) return '0 Byte';
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
      })(realSize)
    });

    return isBinary;
  };

  // Parse binary stl file
  parseBinarySTL = function() {
    var facets, index, i, j;
    var normalX, normalY, normalZ;

    var color, colorR, colorG, colorB;
    var defaultR, defaultG, defaultB;

    // Point head of reader.
    reader.reset();

    // Get color information from the first 80 bytes if exists.
    for (i = 0; i < 80 - 10; i++) {
      if ((reader.getUInt32(i, false) == 0x434F4C4F /*COLO*/) && (reader.getUInt8(i + 4) == 0x52 /*'R'*/) && (reader.getUInt8(index + 5) == 0x3D /*'='*/)) {
        hasColors = true;
        colors = new Float32Array(facets * 3 * 3);
        defaultR = reader.getUInt8(i + 6) / 255;
        defaultG = reader.getUInt8(i + 7) / 255;
        defaultB = reader.getUInt8(i + 8) / 255;
        alpha = reader.getUInt8(i + 9) / 255;
      }
    }
    reader.skip(80);

    // Get the number of triangular facets, and initialize
    // normals and vertices with the size of facets.
    index = 0;
    facets = reader.readUInt32();
    normals = new Float32Array(facets * 3 * 3);
    vertices = new Float32Array(facets * 3 * 3);

    // iterate triangular facets
    for (i = 0; i < facets; i++) {
      // Send current progress
      if (i % 100 == 0) {
        workerFacadeMessage({
          type: "progress",
          data: Math.round((i/facets) * 100)
        });
      }
      // Get color information from attribute bytes 
      if (hasColors) {
        color = reader.getUInt16(reader.getCurrIndex() + 48);
        if ((color & 0x8000) === 0) { // facet has its own unique color
          colorR = (color & 0x1F) / 31;
          colorG = ((color >> 5) & 0x1F) / 31;
          colorB = ((color >> 10) & 0x1F) / 31;
        } else {
          colorR = defaultR;
          colorG = defaultG;
          colorB = defaultB;
        }
      }
      // Read normal vector
      normalX = reader.readFloat32();
      normalY = reader.readFloat32();
      normalZ = reader.readFloat32();
      // Get vertices for each coordinate
      for (j = 0; j < 3; j++) {
        // Add vertex vector
        vertices[index]     = reader.readFloat32();
        vertices[index + 1] = reader.readFloat32();
        vertices[index + 2] = reader.readFloat32();
        // Add normal vector
        normals[index]      = normalX;
        normals[index + 1]  = normalY;
        normals[index + 2]  = normalZ;
        // Set color if exists
        if (hasColors) {
          colors[index]     = colorR;
          colors[index + 1] = colorG;
          colors[index + 2] = colorB;
        }
        index += 3;
      }
      // Skip the attribute byte count
      reader.readUInt16();
    }
  };

  // Parse ASCII stl file
  parseASCIISTL = function() {
    var normalX, normalY, normalZ;
    var figures, count, data;
    var index, i, j;

    // To parse the ASCII STL file, we need to read the data itself.
    // STL file is written as below. We need to remove the structures
    // and extract numbers only.
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

    data = rawText.replace(/\r/g, "\n");                      // make linebreak
    data = data.replace(/(\s)+\1/g, "\n");                    // remove first whitespaces of each line
    data = data.replace(/(solid|endsolid)[^.\n]+(\n?)/g, ""); // remove first and last lines
    data = data.replace(/\n/g, " ");                          // remove linebreaks
    data = data.replace(/facet normal /g, "");                // remove 'facet normal'
    data = data.replace(/outer loop /g, "");                  // remove 'outer loop'
    data = data.replace(/vertex /g, "");                      // remove 'vertex'
    data = data.replace(/endloop /g, "");                     // remove 'endloop'
    data = data.replace(/endfacet(\s?)/g, "");                // remove 'endfacet'

    figures = data.split(" ");
    count = (figures.length - 1) / 12;
    index = 0;

    normals = new Float32Array(count * 3 * 3);
    vertices = new Float32Array(count * 3 * 3);
    vertexCount = 0;

    for (i = 0; i < count; i++) {
      // Send current progress
      if (i % 100 == 0) {
        workerFacadeMessage({
          type: "progress",
          data: Math.round((i/count) * 100)
        });
      }
      // Get normal vector
      normalX = figures[i*12];
      normalY = figures[i*12 + 1];
      normalZ = figures[i*12 + 2];
      for (j = 1; j <= 3; j++) {
        // Add vertex vector
        vertices[index]     = figures[i*12 + j*3];
        vertices[index + 1] = figures[i*12 + j*3 + 1];
        vertices[index + 2] = figures[i*12 + j*3 + 2];
        // Add normal vector
        normals[index]      = normalX;
        normals[index + 1]  = normalY;
        normals[index + 2]  = normalZ;
        // Increase index
        index += 3;
      }
    }

    // Send parsing result 
    workerFacadeMessage({
      type: "convert",
      data: data
    });
  };

  // Check STL File type and parse it.
  if (checkSTLType(reader)) parseBinarySTL();
  else parseASCIISTL();

  // Send parsing result 
  workerFacadeMessage({
    type: "done",
    data: {
      hasColors: hasColors,
      vertices: vertices,
      normals: normals,
      colors: colors,
      alpha: alpha
    }
  });
};

if (typeof(window) === "undefined") {
  onmessage = MadeleineLoader;
  workerFacadeMessage = postMessage;
} else {
  workerFacadeMessage = WorkerFacade.add("../src/lib/MadeleineLoader.js", MadeleineLoader);
}

// Source: http://threejs.org/examples/js/loaders/STLLoader.js 
// In case DataView is not supported from the browser, create it.
if (typeof DataView === 'undefined') {
  DataView = function(buffer, byteOffset, byteLength){
    this.buffer = buffer;
    this.byteOffset = byteOffset || 0;
    this.byteLength = byteLength || buffer.byteLength || buffer.length;
    this._isString = typeof buffer === "string";
  }
  DataView.prototype = {
    _getCharCodes:function(buffer,start,length){
      start = start || 0;
      length = length || buffer.length;
      var end = start + length;
      var codes = [];
      for (var i = start; i < end; i++) {
        codes.push(buffer.charCodeAt(i) & 0xff);
      }
      return codes;
    },
    _getBytes: function (length, byteOffset, littleEndian) {
      var result;
      // Handle the lack of endianness
      if (littleEndian === undefined) {
        littleEndian = this._littleEndian;
      }
      // Handle the lack of byteOffset
      if (byteOffset === undefined) {
        byteOffset = this.byteOffset;
      } else {
        byteOffset = this.byteOffset + byteOffset;
      }
      if (length === undefined) {
        length = this.byteLength - byteOffset;
      }
      // Error Checking
      if (typeof byteOffset !== 'number') {
        throw new TypeError('DataView byteOffset is not a number');
      }
      if (length < 0 || byteOffset + length > this.byteLength) {
        throw new Error('DataView length or (byteOffset+length) value is out of bounds');
      }
      if (this.isString){
        result = this._getCharCodes(this.buffer, byteOffset, byteOffset + length);
      } else {
        result = this.buffer.slice(byteOffset, byteOffset + length);
      }
      if (!littleEndian && length > 1) {
        if (!(result instanceof Array)) {
          result = Array.prototype.slice.call(result);
        }
        result.reverse();
      }
      return result;
    },
    // Compatibility functions on a String Buffer
    getFloat64: function (byteOffset, littleEndian) {
      var b = this._getBytes(8, byteOffset, littleEndian),
        sign = 1 - (2 * (b[7] >> 7)),
        exponent = ((((b[7] << 1) & 0xff) << 3) | (b[6] >> 4)) - ((1 << 10) - 1),
        // Binary operators such as | and << operate on 32 bit values, using + and Math.pow(2) instead
        mantissa = ((b[6] & 0x0f) * Math.pow(2, 48)) + (b[5] * Math.pow(2, 40)) + (b[4] * Math.pow(2, 32)) +
                   (b[3] * Math.pow(2, 24)) + (b[2] * Math.pow(2, 16)) + (b[1] * Math.pow(2, 8)) + b[0];
      if (exponent === 1024) {
        if (mantissa !== 0) return NaN;
        else return sign * Infinity;
      }
      if (exponent === -1023) { // Denormalized
        return sign * mantissa * Math.pow(2, -1022 - 52);
      }
      return sign * (1 + mantissa * Math.pow(2, -52)) * Math.pow(2, exponent);
    },
    getFloat32: function (byteOffset, littleEndian) {
      var b = this._getBytes(4, byteOffset, littleEndian),
        sign = 1 - (2 * (b[3] >> 7)),
        exponent = (((b[3] << 1) & 0xff) | (b[2] >> 7)) - 127,
        mantissa = ((b[2] & 0x7f) << 16) | (b[1] << 8) | b[0];
      if (exponent === 128) {
        if (mantissa !== 0) return NaN;
        else return sign * Infinity;
      }
      if (exponent === -127) { // Denormalized
        return sign * mantissa * Math.pow(2, -126 - 23);
      }
      return sign * (1 + mantissa * Math.pow(2, -23)) * Math.pow(2, exponent);
    },
    getInt32: function (byteOffset, littleEndian) {
      var b = this._getBytes(4, byteOffset, littleEndian);
      return (b[3] << 24) | (b[2] << 16) | (b[1] << 8) | b[0];
    },
    getUint32: function (byteOffset, littleEndian) {
      return this.getInt32(byteOffset, littleEndian) >>> 0;
    },
    getInt16: function (byteOffset, littleEndian) {
      return (this.getUint16(byteOffset, littleEndian) << 16) >> 16;
    },
    getUint16: function (byteOffset, littleEndian) {
      var b = this._getBytes(2, byteOffset, littleEndian);
      return (b[1] << 8) | b[0];
    },
    getInt8: function (byteOffset) {
      return (this.getUint8(byteOffset) << 24) >> 24;
    },
    getUint8: function (byteOffset) {
      return this._getBytes(1, byteOffset)[0];
    }
  };
}

// Custom Data Reader.
// Caution: No protection of accessing index over its size limit.
DataReader = function(binary) {
  this.idx = 0; // in bytes
  this.data = binary;
  this.buffer = null;
  this.reader = new DataView(binary); // binary = arrayBuffer
  this.littleEndian = true;

  // Helper functions
  this.skip         = function(idx) { this.idx += idx };
  this.reset        = function() { this.idx = 0 };
  this.getLength    = function() { return this.data.byteLength };
  this.getCurrIndex = function() { return this.idx };

  // Simply get the data at specified index.
  this.getInt8      = function() { return this.reader.getInt8(arguments[0], 1 < arguments.length ? arguments[1] : this.littleEndian) };
  this.getInt16     = function() { return this.reader.getInt16(arguments[0], 1 < arguments.length ? arguments[1] : this.littleEndian) };
  this.getInt32     = function() { return this.reader.getInt32(arguments[0], 1 < arguments.length ? arguments[1] : this.littleEndian) };
  this.getUInt8     = function() { return this.reader.getUint8(arguments[0], 1 < arguments.length ? arguments[1] : this.littleEndian) };
  this.getUInt16    = function() { return this.reader.getUint16(arguments[0], 1 < arguments.length ? arguments[1] : this.littleEndian) };
  this.getUInt32    = function() { return this.reader.getUint32(arguments[0], 1 < arguments.length ? arguments[1] : this.littleEndian) };
  this.getFloat32   = function() { return this.reader.getFloat32(arguments[0], 1 < arguments.length ? arguments[1] : this.littleEndian) };
  this.getFloat64   = function() { return this.reader.getFloat64(arguments[0], 1 < arguments.length ? arguments[1] : this.littleEndian) };

  // Read the data from the current index.
  // After reading the data, the index moves as much the data read.
  this.readInt8 = function() { 
    this.buffer = this.reader.getInt8(this.idx, 0 < arguments.length ? arguments[0] : this.littleEndian);
    this.idx += 1; return this.buffer;
  };
  this.readInt16 = function() { 
    this.buffer = this.reader.getInt16(this.idx, 0 < arguments.length ? arguments[0] : this.littleEndian);
    this.idx += 2; return this.buffer;
  };
  this.readInt32 = function() { 
    this.buffer = this.reader.getInt32(this.idx, 0 < arguments.length ? arguments[0] : this.littleEndian);
    this.idx += 4; return this.buffer;
  };
  this.readUInt8 = function() { 
    this.buffer = this.reader.getUint8(this.idx, 0 < arguments.length ? arguments[0] : this.littleEndian);
    this.idx += 1; return this.buffer;
  };
  this.readUInt16 = function() { 
    this.buffer = this.reader.getUint16(this.idx, 0 < arguments.length ? arguments[0] : this.littleEndian);
    this.idx += 2; return this.buffer;
  };
  this.readUInt32 = function() { 
    this.buffer = this.reader.getUint32(this.idx, 0 < arguments.length ? arguments[0] : this.littleEndian);
    this.idx += 4; return this.buffer;
  };
  this.readFloat32 = function() { 
    this.buffer = this.reader.getFloat32(this.idx, 0 < arguments.length ? arguments[0] : this.littleEndian);
    this.idx += 4; return this.buffer;
  };
  this.readFloat64 = function() { 
    this.buffer = this.reader.getFloat64(this.idx, 0 < arguments.length ? arguments[0] : this.littleEndian);
    this.idx += 8; return this.buffer;
  };
};
