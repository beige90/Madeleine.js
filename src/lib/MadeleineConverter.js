/**
 * @author    Junho Jin[junho.jin@kaist.ac.kr] | https://github.com/JinJunho
 * @version   1.0.0
 *
 * [Project] Madeleine.js, Pure JavaScript STL Parser & Renderer. 
 * [Module] MadeleineConverter.js
 * 
 * [Description] MadeleineConverter parses your ASCII stl file into binary
 * stl file. MadeleineConverter runs in the background without affecting any 
 * performance degradation of other script execution.
 */

var workerFacadeMessage;

MadeleineConverter = function(event) {

  var data = event.data;

  // Check if data is string
  if (typeof data != "string") {
    // Send error message
    workerFacadeMessage({
      type: "error",
      data: "You've passed ill-formed data. MadeleineConverter failed."
    });

    return;
  }

  var vertexRegExp, normalRegExp, facetRegExp;
  var blobArray, prefix, header, facets, vert, tail;
  var vertex, normal, match, rest;
  var count, progress, i;

  progress = 0;
  blobArray = new Array();
  count = (data.match(/endfacet/g) || []).length;

  header = new Uint8Array(80);
  facets = new Uint32Array([count]);
  prefix = "3CREATORS-CONVERTED-STL-BINARY-FORMAT-------------------------------------------";

  facetRegExp = new RegExp(/facet([\s\S]*?)endfacet/g);
  normalRegExp = new RegExp(/normal[\s]+([\-+]?[0-9]+\.?[0-9]*(?:[eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+(?:[eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+(?:[eE][\-+]?[0-9]+)?)+/g);
  vertexRegExp = new RegExp(/vertex[\s]+([\-+]?[0-9]+\.?[0-9]*(?:[eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+(?:[eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+(?:[eE][\-+]?[0-9]+)?)+/g);

  // Attach header array
  for (i = 0; i < 80; i++) {header[i] = prefix.charCodeAt(i)}
  blobArray.push(header);
  blobArray.push(facets);

  // Attach vector array
  while ((match = facetRegExp.exec(data)) !== null) {
    vert = new Float32Array(12);
    tail = new Uint16Array([0]);
    rest = match[0]; // a facet 
    progress++;
    i = 0;

    // Get normal vector
    while ((match = normalRegExp.exec(rest)) !== null) {
      vert[0] = parseFloat(match[1]);
      vert[1] = parseFloat(match[2]);
      vert[2] = parseFloat(match[3]);
    }
    // Get vectors for each vertex
    while ((match = vertexRegExp.exec(rest)) !== null) {
      vert[(i+1)*3 + 0] = parseFloat(match[1]);
      vert[(i+1)*3 + 1] = parseFloat(match[2]);
      vert[(i+1)*3 + 2] = parseFloat(match[3]);
      i++;
    }

    // Append vector
    blobArray.push(vert);
    blobArray.push(tail);

    // Report current progress
    if (progress % 100 == 0) {
      workerFacadeMessage({
        type: "convert-progress",
        data: Math.round((progress/count) * 100)
      });
    }
  }

  // Send done message
  workerFacadeMessage({
    type: "done",
    data: new Blob(blobArray, {type: "application/octet-binary"})
  });

};

if (typeof(window) === "undefined") {
  onmessage = MadeleineConverter;
  workerFacadeMessage = postMessage;
} else {
  workerFacadeMessage = WorkerFacade.add("../src/lib/MadeleineConverter.js", MadeleineConverter);
}
