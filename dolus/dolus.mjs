"use strict";

/*
 * Main class representing a Dolus program.
 */
class DlProgram {
	/*
	 * Constructor to initialize default values.
	 * Does not initialize WebGPU because it needs asynchronous capabilities.
	 */
	constructor() {
		this.shaderModules = [];
		this.objects = [];
		this.pipelines = [];

		this.clearColor = { r: 0, g: 0.5, b: 1, a: 1 };
	}

	/*
	 * Initialize WebGPU.
	 */
	async init(canvas) {
		if (!navigator.gpu) {
			throw new Error("WebGPU not supported");
		}

		this.adapter = await navigator.gpu.requestAdapter();
		if (!this.adapter) {
			throw new Error("No adapter found");
		}

		this.device = await this.adapter.requestDevice();

		this.context = canvas.getContext("webgpu");
		this.context.configure({
			device: this.device,
			format: navigator.gpu.getPreferredCanvasFormat(),
			alphaMode: "premultiplied",
		});
	}

	/*
	 * Load shaders and return the index of the shader module.
	 */
	loadShaders(shadersCode) {
		const shaderModule = this.device.createShaderModule({
			code: shadersCode,
		});

		this.shaderModules.push(shaderModule);

		return this.shaderModules.length - 1;
	}

	/*
	 * Create a pipeline and return the index of the pipeline.
	 */
	createPipeline(pipelineDescriptor) {
		const pipeline = this.device.createRenderPipeline(pipelineDescriptor);

		this.pipelines.push(pipeline);

		return this.pipelines.length - 1;
	}

	/*
	 * Load an object and return the index of the object.
	 */
	loadObject(vertices, pipelineIndex) {
		const vertexBuffer = this.device.createBuffer({
			size: vertices.byteLength,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
		});
		this.device.queue.writeBuffer(vertexBuffer, 0, vertices, 0, vertices.length);

		this.objects.push({
			vertexBuffer,
			pipelineIndex,
		});

		return this.objects.length - 1;
	}

	/*
	 * Loop over all registered objects and draw them.
	 */
	loop(timestamp) {
		const commandEncoder = this.device.createCommandEncoder();

		const renderPass = commandEncoder.beginRenderPass({
			colorAttachments: [
				{
					clearValue: this.clearColor,
					loadOp: "clear",
					storeOp: "store",
					view: this.context.getCurrentTexture().createView(),
				},
			],
		});

		for (const object of this.objects) {
			renderPass.setPipeline(this.pipelines[object.pipelineIndex]);

			renderPass.setVertexBuffer(0, object.vertexBuffer);

			renderPass.draw(3, 1, 0, 0);
		}

		renderPass.end();

		this.device.queue.submit([commandEncoder.finish()]);

		requestAnimationFrame(this.loop.bind(this));
	}
}

export default DlProgram;
