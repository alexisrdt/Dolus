"use strict";

import DlProgram from "../dolus/dolus.mjs";

async function main() {
	// Get canvas
	const canvas = document.getElementById("canvas");

	// Create program
	const program = new DlProgram();
	try {
		await program.init(canvas);
	} catch (exception) {
		console.error(exception);
		return;
	}

	// Load shaders
	const shadersCode = `
		struct VertexOut {
			@builtin(position) position: vec4f,
			@location(0) color: vec4f,
		}

		@vertex
		fn vertex_main(
			@location(0) position: vec4f,
			@location(1) color: vec4f,
		) -> VertexOut {
			return VertexOut(position, color);
		}

		@fragment
		fn fragment_main(
			fragmentData: VertexOut,
		) -> @location(0) vec4f {
			return fragmentData.color;
		}
	`;
	const shaderModuleIndex = program.loadShaders(shadersCode);

	// Create pipeline
	const vertexBuffers = [
		{
			attributes: [
				{
					shaderLocation: 0,
					offset: 0,
					format: "float32x4",
				},
				{
					shaderLocation: 1,
					offset: 16,
					format: "float32x4",
				},
			],
			arrayStride: 32,
			stepMode: "vertex",
		},
	];
	const pipelineDescriptor = {
		vertex: {
			module: program.shaderModules[shaderModuleIndex],
			entryPoint: "vertex_main",
			buffers: vertexBuffers,
		},
		fragment: {
			module: program.shaderModules[shaderModuleIndex],
			entryPoint: "fragment_main",
			targets: [
				{
					format: navigator.gpu.getPreferredCanvasFormat(),
				},
			],
		},
		primitive: {
			topology: "triangle-list",
		},
		layout: "auto",
	};
	const pipelineIndex = program.createPipeline(pipelineDescriptor);

	// Create object
	const vertices = new Float32Array([
		0, 0.6, 0, 1, 1, 0, 0, 1,
		-0.5, -0.6, 0, 1, 0, 1, 0, 1,
		0.5, -0.6, 0, 1, 0, 0, 1, 1,
	]);
	program.loadObject(vertices, pipelineIndex);

	// Draw
	program.loop();
}
main();
