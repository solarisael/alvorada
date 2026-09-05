const compile_shader = (gl, shader_type, source) => {
  const shader = gl.createShader(shader_type);

  if (!shader) {
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);

    return null;
  }

  return shader;
};

const create_program = (gl, vertex_source, fragment_source) => {
  const vertex_shader = compile_shader(gl, gl.VERTEX_SHADER, vertex_source);
  const fragment_shader = compile_shader(
    gl,
    gl.FRAGMENT_SHADER,
    fragment_source,
  );

  if (!vertex_shader || !fragment_shader) {
    gl.deleteShader(vertex_shader);
    gl.deleteShader(fragment_shader);
    return null;
  }

  const program = gl.createProgram();

  if (!program) {
    gl.deleteShader(vertex_shader);
    gl.deleteShader(fragment_shader);
    return null;
  }

  gl.attachShader(program, vertex_shader);
  gl.attachShader(program, fragment_shader);
  gl.linkProgram(program);

  gl.deleteShader(vertex_shader);
  gl.deleteShader(fragment_shader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);

    return null;
  }

  return program;
};

export { compile_shader, create_program };
