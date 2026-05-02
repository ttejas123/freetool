/// <reference types="@webgpu/types" />
/**
 * WebGPU Image Filters
 * Provides GPU-accelerated versions of common image filters.
 */

const WGSL_SHADER = `
struct Params {
  filterType: u32,
  strength: f32,
  width: u32,
  height: u32,
  brightness: f32,
  contrast: f32,
  saturation: f32,
  _pad: f32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var inputTex: texture_2d<f32>;
@group(0) @binding(2) var outputTex: texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  if (id.x >= params.width || id.y >= params.height) {
    return;
  }
  
  let color = textureLoad(inputTex, id.xy, 0);
  var result = color;
  
  // Apply Filter
  switch (params.filterType) {
    case 1u: { // Grayscale
      let g = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
      result = vec4<f32>(g, g, g, color.a);
    }
    case 2u: { // Sepia
      let r = color.r * 0.393 + color.g * 0.769 + color.b * 0.189;
      let g = color.r * 0.349 + color.g * 0.686 + color.b * 0.168;
      let b = color.r * 0.272 + color.g * 0.534 + color.b * 0.131;
      result = vec4<f32>(r, g, b, color.a);
    }
    case 3u: { // Invert
      result = vec4<f32>(1.0 - color.r, 1.0 - color.g, 1.0 - color.b, color.a);
    }
    case 4u: { // Pixelate
      let blockSize = u32(max(2.0, floor(params.strength / 10.0)));
      let x = (id.x / blockSize) * blockSize;
      let y = (id.y / blockSize) * blockSize;
      result = textureLoad(inputTex, vec2<u32>(x, y), 0);
    }
    case 5u: { // Posterize
      let levels = max(2.0, floor(10.0 - params.strength / 15.0));
      let step = 1.0 / (levels - 1.0);
      result = vec4<f32>(round(result.rgb / step) * step, color.a);
    }
    case 6u: { // Neon
      let g2 = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
      let r2 = select(0.0, 1.0, g2 > 0.5);
      let g3 = select(0.0, min(1.0, color.g * 2.0), g2 > 0.25);
      let b2 = select(0.0, 1.0, g2 > 0.375);
      result = vec4<f32>(r2, g3, b2, color.a);
    }
    case 7u: { // Halftone
      let radius = u32(max(2.0, floor(params.strength / 15.0)));
      let diameter = radius * 2u;
      let blockX = (id.x / diameter) * diameter;
      let blockY = (id.y / diameter) * diameter;
      let centerX = f32(blockX + radius);
      let centerY = f32(blockY + radius);
      
      let centerColor = textureLoad(inputTex, vec2<u32>(blockX, blockY), 0);
      let grayH = (centerColor.r + centerColor.g + centerColor.b) / 3.0;
      let rH = f32(radius) * (1.0 - grayH);
      
      let dist = distance(vec2<f32>(f32(id.x), f32(id.y)), vec2<f32>(centerX, centerY));
      if (dist < rH) {
        result = vec4<f32>(0.0, 0.0, 0.0, 1.0);
      } else {
        result = vec4<f32>(1.0, 1.0, 1.0, 1.0);
      }
    }
    default: {
      result = color;
    }
  }

  // Apply Adjustments
  // Brightness
  result = vec4<f32>(result.rgb + params.brightness, result.a);
  
  // Contrast
  result = vec4<f32>((result.rgb - 0.5) * params.contrast + 0.5, result.a);
  
  // Saturation
  let grayVal = dot(result.rgb, vec3<f32>(0.299, 0.587, 0.114));
  result = vec4<f32>(mix(vec3<f32>(grayVal), result.rgb, params.saturation), result.a);
  
  // Clamp
  result = clamp(result, vec4<f32>(0.0), vec4<f32>(1.0));
  
  textureStore(outputTex, id.xy, result);
}
`;

let device: GPUDevice | null = null;

async function getDevice(): Promise<GPUDevice | null> {
  if (device) return device;
  if (!navigator.gpu) return null;
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) return null;
  device = await adapter.requestDevice();
  return device;
}

const FILTER_MAP: Record<string, number> = {
  'grayscale': 1,
  'sepia': 2,
  'invert': 3,
  'pixelate': 4,
  'posterize': 5,
  'neon': 6,
  'halftone': 7,
};

export type Adjustments = {
  brightness: number;
  contrast: number;
  saturation: number;
};

export async function applyWebGPUFilter(
  src: HTMLCanvasElement,
  filter: string,
  strength: number,
  adjustments: Adjustments = { brightness: 0, contrast: 1, saturation: 1 }
): Promise<HTMLCanvasElement | null> {
  // Dither is sequential (Floyd-Steinberg), best kept on CPU
  if (filter === 'dither') return null;

  const gpuDevice = await getDevice();
  if (!gpuDevice) return null;

  const filterId = FILTER_MAP[filter] || 0;

  const width = src.width;
  const height = src.height;

  const shaderModule = gpuDevice.createShaderModule({ code: WGSL_SHADER });

  const computePipeline = gpuDevice.createComputePipeline({
    layout: 'auto',
    compute: {
      module: shaderModule,
      entryPoint: 'main',
    },
  });

  // Create input texture
  const inputTexture = gpuDevice.createTexture({
    size: [width, height],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  });

  gpuDevice.queue.copyExternalImageToTexture(
    { source: src },
    { texture: inputTexture },
    [width, height]
  );

  // Create output texture
  const outputTexture = gpuDevice.createTexture({
    size: [width, height],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC,
  });

  // Uniforms: 8 fields * 4 bytes = 32 bytes
  const uniformBuffer = gpuDevice.createBuffer({
    size: 32,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const uniformData = new ArrayBuffer(32);
  const uintView = new Uint32Array(uniformData);
  const floatView = new Float32Array(uniformData);
  
  uintView[0] = filterId;
  floatView[1] = strength;
  uintView[2] = width;
  uintView[3] = height;
  floatView[4] = adjustments.brightness;
  floatView[5] = adjustments.contrast;
  floatView[6] = adjustments.saturation;
  floatView[7] = 0; // padding

  gpuDevice.queue.writeBuffer(uniformBuffer, 0, uniformData);

  const bindGroup = gpuDevice.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer } },
      { binding: 1, resource: inputTexture.createView() },
      { binding: 2, resource: outputTexture.createView() },
    ],
  });

  const commandEncoder = gpuDevice.createCommandEncoder();
  const passEncoder = commandEncoder.beginComputePass();
  passEncoder.setPipeline(computePipeline);
  passEncoder.setBindGroup(0, bindGroup);
  const workgroupCountX = Math.ceil(width / 16);
  const workgroupCountY = Math.ceil(height / 16);
  passEncoder.dispatchWorkgroups(workgroupCountX, workgroupCountY);
  passEncoder.end();

  // Read back to a 2D canvas via buffer
  // WebGPU requirement: bytesPerRow must be a multiple of 256
  const bytesPerRow = width * 4;
  const paddedBytesPerRow = Math.ceil(bytesPerRow / 256) * 256;
  const readBuffer = gpuDevice.createBuffer({
    size: paddedBytesPerRow * height,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });

  commandEncoder.copyTextureToBuffer(
    { texture: outputTexture },
    { buffer: readBuffer, bytesPerRow: paddedBytesPerRow },
    [width, height]
  );

  gpuDevice.queue.submit([commandEncoder.finish()]);

  await readBuffer.mapAsync(GPUMapMode.READ);
  const mappedRange = readBuffer.getMappedRange();
  
  // Remove padding for ImageData
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    const srcOffset = y * paddedBytesPerRow;
    const destOffset = y * bytesPerRow;
    data.set(new Uint8ClampedArray(mappedRange, srcOffset, bytesPerRow), destOffset);
  }
  
  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = width;
  resultCanvas.height = height;
  const ctx = resultCanvas.getContext('2d')!;
  const imageData = new ImageData(data, width, height);
  ctx.putImageData(imageData, 0, 0);
  
  readBuffer.unmap();

  return resultCanvas;
}
