// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position; 
  uniform float u_Size;
  void main()  {
  gl_Position = a_Position;
  //gl_PointSize = 10.0;
  gl_PointSize = u_Size; 
  }`

// Fragment shader program
var FSHADER_SOURCE =`
  precision mediump float;
  uniform vec4 u_FragColor;\n
  void main() {
  gl_FragColor = u_FragColor;
  }`

  //Global variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  //gl = getWebGLContext(canvas);
  gl = canvas.getContext('webgl', {preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}
function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }

}
//Constant
const POINT = 0; // Point type
const TRIANGLE = 1; // Triangle type
const CIRCLE = 2; // Circle type


//Global variables related to UI Elements
let g_selectedColor = [1.0, 1.0, 1.0, 1.0]; // Default color is white
let g_selectedSize = 5; // Default size is 10.0
let g_selectedType = POINT; // Default type is point
let g_selectedSegments = 10; // Default segments for circle is 10
let g_mousePosition = null;
let g_triangleRotation = 0;
//Add actions for HTML UI elements
function addActionsForHtmlUI() {
  //Button Events
  //document.getElementById('green').onclick = function() { g_selectColor = [0.0, 1.0, 0.0, 1.0]; };
  //document.getElementById('red').onclick =   function() { g_selectColor = [1.0, 0.0, 0.0, 1.0]; };
  document.getElementById('clearButton').onclick =   function() { 
    g_shapesList = []; 
    renderAllShapes();   
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.clear(gl.COLOR_BUFFER_BIT);};
  document.getElementById('pointButton').onclick =   function() { g_selectedType = POINT };
  document.getElementById('triButton').onclick =   function() { g_selectedType = TRIANGLE };
  document.getElementById('circleButton').onclick =   function() { g_selectedType = CIRCLE };
  document.getElementById('drawSketchButton').onclick = drawMyTriangleArt;

  //Color Slider Events
  document.getElementById('redSlider').addEventListener('mouseup', function() { 
    g_selectedColor[0] = this.value/100;
    console.log(g_selectedColor[0]);
    updateColorPreview();
  });

  document.getElementById('greenSlider').addEventListener('mouseup', function() {
    g_selectedColor[1] = this.value/100;
    console.log(g_selectedColor[1]);
    updateColorPreview();
  } );    

  document.getElementById('blueSlider').addEventListener('mouseup', function() {
    g_selectedColor[2] = this.value/100;
    console.log(g_selectedColor[2]);
    updateColorPreview();
  } );  

  //Size Slider Events  
  document.getElementById('sizeSlider').addEventListener('mouseup', function() {
    g_selectedSize = this.value;
  });

  //Segements Slider Events
  document.getElementById('segmentSlider').addEventListener('mouseup', function() {
    g_selectedSegments = this.value;
  });

  //Rotation Slider Events
  document.getElementById('rotationSlider').addEventListener('mouseup', function() {
    g_triangleRotation = this.value;
  });

}

function main() {
  //Set up canvas and gl variables
  setupWebGL();
  //set up GLSL shader programs and conenct GLSL variables 
  connectVariablesToGLSL()
 
  //Set up actions for the HTML UI elements
  addActionsForHtmlUI()


  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  //canvas.onmousemove = click;
  canvas.onmousemove = function(ev) {  
    let [x, y] = convertCoordinatesEventToGL(ev);
    g_mousePosition = [x, y];
    if (ev.buttons == 1) 
    {
      click(ev);
    }
    renderAllShapes(); // Re-render for preview 
  };
  canvas.onmouseleave = function() {
    g_mousePosition = null;
    renderAllShapes();
  };


  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  updateColorPreview();
}



var g_shapesList = []; // The array for the position of a mouse press
// var g_points = [];  // The array for the position of a mouse press
// var g_colors = [];  // The array to store the color of a point
// var g_sizes = []; // Default size is 10.0

function click(ev) {
  //Extract the event click and return it in WebGL coordinates
  let [x,y] = convertCoordinatesEventToGL(ev); 


  let point;
  if(g_selectedType == POINT){
    point = new Point(); // Create a point object
  }else if(g_selectedType == TRIANGLE){
    point = new Triangle(); // Create a triangle object
    point.rotation = g_triangleRotation;
  }else if(g_selectedType == CIRCLE){
    point = new Circle(); // Create a circle object
    point.segments = g_selectedSegments; // Set the number of segments for the circle
  }
  point.position=[x, y];
  point.color = g_selectedColor.slice(); 
  point.size = g_selectedSize; 
  g_shapesList.push(point); 

  // Store the coordinates to g_points array
  // g_points.push([x, y]);


  // g_colors.push(g_selectedColor.slice()); // Store the color to g_colors array

  // g_sizes.push(g_selectedSize); // Store the size to g_size array

  // Store the coordinates to g_points array
  /*
  if (x >= 0.0 && y >= 0.0) {      // First quadrant
    g_colors.push([1.0, 0.0, 0.0, 1.0]);  // Red
  } else if (x < 0.0 && y < 0.0) { // Third quadrant
    g_colors.push([0.0, 1.0, 0.0, 1.0]);  // Green
  } else {                         // Others
    g_colors.push([1.0, 1.0, 1.0, 1.0]);  // White
  }*/


  //Draw every shape that is supposed to be in the canvas
  renderAllShapes(); 
}

//Extract the event click and return it in WebGL coordinates
function convertCoordinatesEventToGL(ev){
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return [x, y];
}

//Draw every shape that is supposed to be in the canvas
function renderAllShapes(){
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  //var len = g_points.length;
  var len = g_shapesList.length; 

  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }

  if (g_mousePosition && g_mousePosition.length === 2) {
    let preview;
  
    if (g_selectedType == POINT) {
      preview = new Point();
    } else if (g_selectedType == TRIANGLE) {
      preview = new Triangle();
      preview.rotation = g_triangleRotation;
    } else if (g_selectedType == CIRCLE) {
      preview = new Circle();
      preview.segments = g_selectedSegments;
    }
  
    preview.position = g_mousePosition;
    preview.color = g_selectedColor.slice();
    preview.size = g_selectedSize;
  
    // Optional: make it semi-transparent to show it's a preview
   // preview.color[3] = 0.5;
  
    preview.render();
  }

}
  // Update the color preview box
  function updateColorPreview() {
    let r = Math.floor(g_selectedColor[0] * 255);
    let g = Math.floor(g_selectedColor[1] * 255);
    let b = Math.floor(g_selectedColor[2] * 255);
    document.getElementById('colorPreview').style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
  }
  function drawMyTriangleArt() {

    gl.clearColor(0.678, 0.847, 0.902, 1.0); // Light blue
  gl.clear(gl.COLOR_BUFFER_BIT); // Clear the canvas with the light blue color

    // Clear existing shapes if needed
    g_shapesList = [];
  
   // --- House Base (Square made of 2 triangles) ---
   let houseColor = [0.8, 0.5, 0.2, 1.0];
   let size = 80;
   let offset = 0.2;
 
   let tri1 = new Triangle();
   tri1.position = [-0.1, -0.5];
   tri1.size = size;
   tri1.color = houseColor;
   tri1.rotation = 0;
   g_shapesList.push(tri1);
 
   let tri2 = new Triangle();
   tri2.position = [0.3, -0.1];
   tri2.size = size;
   tri2.color = houseColor;
   tri2.rotation = 180;
   g_shapesList.push(tri2);
 
   // --- Roof (single triangle) ---
   let roof = new Triangle();
   roof.position = [0.1, -0.1];
   roof.size = 60;
   roof.color = [0.7, 0.0, 0.0, 1.0];
   roof.rotation = 0;
   g_shapesList.push(roof);

   let roof2 = new Triangle();
   roof2.position = [0.10, -0.1];
   roof2.size = 60;
   roof2.color = [0.7, 0.0, 0.0, 1.0];
   roof2.rotation = 90;
   g_shapesList.push(roof2);


   // --- Sun (circle) ---
   let sun = new Circle();
   sun.position = [0.65, 0.65];
   sun.size = 30;
   sun.color = [1.0, 1.0, 0.0, 1.0];
   sun.segments = 30;
   g_shapesList.push(sun);
 
   // --- Windows (points) ---
   let window1 = new Point();
   window1.position = [0.2, -0.2];
   window1.color = [0.1, 0.6, 1.0, 1.0];
   window1.size = 20;
   g_shapesList.push(window1);
 
   let window2 = new Point();
   window2.position = [-0.01, -0.2];
   window2.color = [0.2, 0.6, 1.0, 1.0];
   window2.size = 20;
   g_shapesList.push(window2);

   // --- Door (small brown triangle) ---
  // First half of the door
  let doorTri1 = new Triangle();
  doorTri1.position = [0.05, -0.42];
  doorTri1.size = 20;
  doorTri1.color = [0.4, 0.2, 0.1, 1.0];  // brown
  doorTri1.rotation = 0;
  g_shapesList.push(doorTri1);

  // Second half of the door
  let doorTri2 = new Triangle();
  // shift the position slightly so it forms a rectangle with the first
  doorTri2.position = [0.15, -0.32];
  doorTri2.size = 20;
  doorTri2.color = [0.4, 0.2, 0.1, 1.0];
  doorTri2.rotation = 180;
  g_shapesList.push(doorTri2);

 //Bottom part of door
  let doorTri3 = new Triangle();
  doorTri3.position = [0.05, -0.50];
  doorTri3.size = 20;
  doorTri3.color = [0.4, 0.2, 0.1, 1.0];  // brown
  doorTri3.rotation = 0;
  g_shapesList.push(doorTri3);

  // Second half of the door
  let doorTri4 = new Triangle();
  // shift the position slightly so it forms a rectangle with the first
  doorTri4.position = [0.15, -0.40];
  doorTri4.size = 20;
  doorTri4.color = [0.4, 0.2, 0.1, 1.0];
  doorTri4.rotation = 180;
  g_shapesList.push(doorTri4);
 

    // --- Grass as POINTS (single row across the bottom) ---
  // Remove your old triangle loops for grass, and use this instead:
  for (let x = -1.0; x < 1.0; x += 0.02) {
    let grassPoint = new Point();
    grassPoint.position = [x, -0.7]; // push near bottom
    grassPoint.size = 50;            // size in pixels
    grassPoint.color = [0.0, .51, 0.0, 1.0];
    g_shapesList.push(grassPoint);

    


    let grassPoint2 = new Point();
    grassPoint2.position = [x, -0.95]; // push near bottom
    grassPoint2.size = 50;            // size in pixels
    grassPoint2.color = [0.0, .51, 0.0, 1.0];
    g_shapesList.push(grassPoint2);

    let grassPoint3 = new Point();
    grassPoint3.position = [x, -0.6]; // push near bottom
    grassPoint3.size = 50;            // size in pixels
    grassPoint3.color = [0.0, .51, 0.0, 1.0];
    g_shapesList.push(grassPoint3);
  }
   // --- Grass (multiple triangles) ---

  for (let x = -1; x < 1; x += 0.1) {

    //upper
    let sq5 = new Triangle();
    // Put it near the bottom edge (y = -1.0 means the center is at -1.0, so half is out of view).
    // If you want the bottom of the square exactly at -1.0, bump the center up a bit:
    sq5.position = [x, -0.63]; 
    sq5.size = 10;                 
    sq5.color = [0.0, 1.0, 0.0, 1.0];
    sq5.rotation = 0;
    g_shapesList.push(sq5);
  
    // Second triangle (top/right half of square)
    let sq6 = new Triangle();
    // Shift this half so it meets the first triangle’s hypotenuse
    sq6.position = [x + 0.05, -0.53]; 
    sq6.size = 10;
    sq6.color = [0.0, 1.0, 0.0, 1.0];
    sq6.rotation = 180;
    g_shapesList.push(sq6);
  
    //middle
    // First triangle (bottom/left half of square)
    let sq1 = new Triangle();
    // Put it near the bottom edge (y = -1.0 means the center is at -1.0, so half is out of view).
    // If you want the bottom of the square exactly at -1.0, bump the center up a bit:
    sq1.position = [x, -0.97]; 
    sq1.size = 10;                 
    sq1.color = [0.0, 1.0, 0.0, 1.0];
    sq1.rotation = 0;
    g_shapesList.push(sq1);
  
    // Second triangle (top/right half of square)
    let sq2 = new Triangle();
    // Shift this half so it meets the first triangle’s hypotenuse
    sq2.position = [x + 0.05, -0.87]; 
    sq2.size = 10;
    sq2.color = [0.0, 1.0, 0.0, 1.0];
    sq2.rotation = 180;
    g_shapesList.push(sq2);

    //Lower
    // First triangle of the square
    let sq3 = new Triangle();
    sq3.position = [x, -0.8];
    sq3.size = 10;
    sq3.color = [0.0, 1.0, 0.0, 1.0];
    sq3.rotation = 0;
    g_shapesList.push(sq3);

    // Second triangle of the square
    let sq4 = new Triangle();
    // Shift it in +x and +y so it lines up exactly to form a square
    sq4.position = [x + 0.05, -0.7];
    sq4.size = 10;
    sq4.color = [0.0, 1.0, 0.0, 1.0];
    sq4.rotation = 180;
    g_shapesList.push(sq4);
  }

  
    // ...repeat until you’ve recreated all triangles
  
    renderAllShapes(); // Draw it!
  }

