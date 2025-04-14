class Triangle{
    constructor(){
      this.type = 'triangle';
      this.position = [0.0, 0.0, 0.0];
      this.color = [1.0, 1.0, 1.0, 1.0]; // Default color is white
      this.size = 5.0; 
      this.rotation = 0;
    }
    render(){
      var xy = this.position;
      var rgba = this.color;
      var size = this.size;
  
      // var xy = g_points[i];
      // var rgba = g_colors[i];
      // var size = g_sizes[i];
  
      // Pass the position of a point to a_Position variable
      //gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);

      // Pass the color of a point to u_FragColor variable
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
  
      // Pass the size of a point to u_Size variable
      gl.uniform1f(u_Size, size);
  
      
      let angle = this.rotation * Math.PI / 180; // convert to radians
      let sinA = Math.sin(angle);
      let cosA = Math.cos(angle);

      // Draw
      //gl.drawArrays(gl.POINTS, 0, 1);
      var d = this.size / 200.0;
      // Local vertices centered at origin
      let localVerts = [
        0.0, 0.0,
        d, 0.0,
        0.0, d
      ];

      // Rotate and translate vertices
      let transformedVerts = [];
      for (let i = 0; i < localVerts.length; i += 2) {
        let x = localVerts[i];
        let y = localVerts[i + 1];

        let xRot = x * cosA - y * sinA;
        let yRot = x * sinA + y * cosA;

        transformedVerts.push(xRot + xy[0], yRot + xy[1]);
      }

drawTriangle(transformedVerts);
    }
  }


function drawTriangle(vertices) {
    // var vertices = new Float32Array([
    //   0, 0.5,   -0.5, -0.5,   0.5, -0.5
    // ]);
    var n = 3; // The number of vertices
  
    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      console.log('Failed to create the buffer object');
      return -1;
    }
  
    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    //gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  
    // var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    // if (a_Position < 0) {
    //   console.log('Failed to get the storage location of a_Position');
    //   return -1;
    // }

    // Assign the buffer object to a_Position variable
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  
    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);
  
    gl.drawArrays(gl.TRIANGLES, 0, n);
   // return n;
  }
  