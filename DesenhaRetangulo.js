/**
 * Rotina para desenhar um retângulo
 */

var gl;
var shaderProgram;
var vertexColorBuffer;
var indexBuffer;
var mMatrix = mat4.create();
var pMatrix = mat4.create();
var vMatrix = mat4.create();
var camera;

//============================================== Operações Lineares ==============================================

// Produto interno entre dois vetores de dimeção 4
// Retorna o produto interno entre u e v se u e v forem vetores de dimenção 4
function produtoInterno(u,v)
{
	return u[0]*v[0]+u[1]*v[1]+u[2]*v[2];
};

function produtoVetorial(u,v)
{
	return [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
};

function normalize(v)
{
	var moduloV = Math.sqrt(produtoInterno(v,v));
	return [v[0]/moduloV, v[1]/moduloV, v[2]/moduloV];
};

//++++++++++++++++++++++++++++++++++++++++++++++ Operações Lineares ++++++++++++++++++++++++++++++++++++++++++++++

//Iniciar o ambiente quando a página for carregada
function main()
{
	iniciaWebGL();
};

//Iniciar o ambiente
function iniciaWebGL()
{
	var canvas = $('#window')[0];
	iniciarGL(canvas); // Definir como um canvas 3D
	iniciarShaders();  // Obter e processar os Shaders
	iniciarBuffers();  // Enviar o triângulo e quadrado na GPU
	iniciarAmbiente(); // Definir background e cor do objeto
	desenharCena();    // Usar os itens anteriores e desenhar
}

function iniciarGL(canvas)
{
	try
	{
		gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
	}
	catch(e)
	{
		if(!gl)
		{
			alert("Não pode inicializar WebGL, desculpe");
		}
	}
}

function iniciarShaders()
{
	var vertexShader = getShader(gl, "#shader-vs");
	var fragmentShader = getShader(gl, "#shader-fs");

	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
	{
		alert("Não pode inicializar shaders");
	}

	gl.useProgram(shaderProgram);

	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");

	shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, 'aVertexColor');

	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.vMatrixUniform = gl.getUniformLocation(shaderProgram, "uVMatrix");
	shaderProgram.mMatrixUniform = gl.getUniformLocation(shaderProgram, "uMMatrix");


}

function getShader(gl, id)
{
	var shaderScript = $(id)[0];
	if(!shaderScript) 
	{
		return null;
	}

	var str = "";
	var k = shaderScript.firstChild;
	while(k)
	{
		if(k.nodeType == 3)
			str += k.textContent;
		k = k.nextSibling;
	}

	var shader;
	if(shaderScript.type == "x-shader/x-fragment")
	{
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	}
	else if(shaderScript.type == "x-shader/x-vertex")
	{
		shader = gl.createShader(gl.VERTEX_SHADER);
	}
	else
	{
		return null;
	}

	gl.shaderSource(shader, str);
	gl.compileShader(shader);

	if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
	{
		alert(gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
}

function iniciarBuffers()
{
	// ================================================== Entrada De dados ==================================================
	// Create a cube
	//    v6----- v5
	//   /|      /|
	//  v1------v0|
	//  | |     | |
	//  | |v7---|-|v4
	//  |/      |/
	//  v2------v3
	var verticesColors = new Float32Array([
	                 	                  // Vertex coordinates and color
	                	                  1.0,  1.0,  1.0,     1.0,  1.0,  1.0,  // v0 White
	                	                  -1.0,  1.0,  1.0,     1.0,  0.0,  1.0,  // v1 Magenta
	                	                  -1.0, -1.0,  1.0,     1.0,  0.0,  0.0,  // v2 Red
	                	                  1.0, -1.0,  1.0,     1.0,  1.0,  0.0,  // v3 Yellow
	                	                  1.0, -1.0, -1.0,     0.0,  1.0,  0.0,  // v4 Green
	                	                  1.0,  1.0, -1.0,     0.0,  1.0,  1.0,  // v5 Cyan
	                	                  -1.0,  1.0, -1.0,     0.0,  0.0,  1.0,  // v6 Blue
	                	                  -1.0, -1.0, -1.0,     0.0,  0.0,  0.0   // v7 Black
	                	                  ]);

	// Indices of the vertices
	var indices = new Uint8Array([
	               	           0, 1, 2,   0, 2, 3,    // front
	            	           0, 3, 4,   0, 4, 5,    // right
	            	           0, 5, 6,   0, 6, 1,    // up
	            	           1, 6, 7,   1, 7, 2,    // left
	            	           7, 4, 3,   7, 3, 2,    // down
	            	           4, 7, 6,   4, 6, 5     // back
	            	           ]);
	// ++++++++++++++++++++++++++++++++++++++++++++++++++ Entrada De dados ++++++++++++++++++++++++++++++++++++++++++++++++++
	
	// ================================================== configurando a GPU para vértice (posição e cor) ==================================================
	vertexColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);
	var elementSize = verticesColors.BYTES_PER_ELEMENT;
	vertexColorBuffer.vertexSize = 6 * elementSize;
	vertexColorBuffer.positionOffset = 0;
	vertexColorBuffer.positionElementsNumber = 3; // Atribui o número de elementos do atributo posição do vétice
	vertexColorBuffer.colorOffset = vertexColorBuffer.positionElementsNumber * elementSize;
	vertexColorBuffer.colorElementsNumber = 3; // Atribui o número de elementos do atributo cor do vétice
	gl.vertexAttribPointer(
			shaderProgram.vertexPositionAttribute,
			vertexColorBuffer.positionElementsNumber,
			gl.FLOAT,
			false,
			vertexColorBuffer.vertexSize,
			vertexColorBuffer.positionOffset
			);
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
	gl.vertexAttribPointer(
			shaderProgram.vertexColorAttribute,
			vertexColorBuffer.colorElementsNumber,
			gl.FLOAT,
			false,
			vertexColorBuffer.vertexSize,
			vertexColorBuffer.colorOffset
			);
	gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
	// ++++++++++++++++++++++++++++++++++++++++++++++++++ configurando a GPU para vértice (posição e cor) ++++++++++++++++++++++++++++++++++++++++++++++++++
	
	// ================================================== configurando a GPU para index ==================================================
	indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
	indexBuffer.length = indices.length;
	// ================================================== configurando a GPU para index ==================================================
}

function iniciarAmbiente()
{
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);
}

function desenharCena()
{
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	var camera = new Object();
	// Atributos da Câmera
	camera.position = [20,20,20];
	camera.lookAt = [0,0,-10];
	camera.up = [1,0,1];
	// Método da Câmera
	camera.update = function(){
		this.position[0] = -this.position[0];
		this.position[1] = -this.position[1];
		this.position[2] = -this.position[2];
		
		this.lookAt = [this.lookAt[0] + this.position[0], this.lookAt[1] + this.position[1], this.lookAt[2] + this.position[2]];
		
		var menosAt = new Float32Array();
		menosAt = [-this.lookAt[0], -this.lookAt[1], -this.lookAt[2]];
		menosAt = normalize(menosAt);
		
		this.up = normalize(this.up);
		var right = produtoVetorial(this.up,menosAt);
		this.up = produtoVetorial(menosAt,right);

		vMatrix = [right[0],right[1],right[2],0,
		          this.up[0],this.up[1],this.up[2],0,
		          menosAt[0],menosAt[1],menosAt[2],0,
		          0,0,0,1];
		mat4.inverse(vMatrix);
		mat4.translate(vMatrix, this.position);
	};
	camera.update();
	
	// Atributos do objeto
	var object = new Object();
	object.position = [0, 0, -10];
	object.scale = [1, 1, 1];
	object.rotate = [0, 0, 0];
	// Método do objeto
	object.draw = function(){
		// Modelo
		mat4.identity(mMatrix);
		mat4.translate(mMatrix, this.position);
		mat4.scale(mMatrix, this.scale);
		mat4.rotate(mMatrix, this.rotate[0], [1,0,0]);
		mat4.rotate(mMatrix, this.rotate[1], [0,1,0]);
		mat4.rotate(mMatrix, this.rotate[2], [0,0,1]);
		
		// Projeção
		mat4.identity(pMatrix);
		mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

		// Desenhando Cubo
		setMatrixUniforms();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
		gl.drawElements(gl.TRIANGLES, indexBuffer.length, gl.UNSIGNED_BYTE, 0);
	};
	object.draw();
}

function setMatrixUniforms()
{
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv(shaderProgram.vMatrixUniform, false, vMatrix);
	gl.uniformMatrix4fv(shaderProgram.mMatrixUniform, false, mMatrix);
}