const create_texture_source_list = (nodes) => {
  const source_set = new Set();

  for (const node_entry of nodes) {
    if (node_entry.image_src) {
      source_set.add(node_entry.image_src);
    }
  }

  return [...source_set];
};

const decode_texture_image = async (source, signal) => {
  if (signal.aborted) {
    return null;
  }
  const image = new Image();
  const cancel = () => {
    image.src = "";
  };
  signal.addEventListener("abort", cancel, { once: true });
  image.decoding = "async";
  image.src = source;
  try {
    await image.decode();
    if (signal.aborted || !image.complete || image.naturalWidth === 0) {
      return null;
    }
    return image;
  } catch {
    return null;
  } finally {
    signal.removeEventListener("abort", cancel);
  }
};

const create_texture_loader = () => {
  const controller = new AbortController();
  const dispose = () => controller.abort();
  const load = async (sources, accept_image, signal) => {
    signal?.addEventListener("abort", dispose, { once: true });
    if (signal?.aborted) {
      dispose();
    }
    try {
      await Promise.all(
        sources.map(async (source) => {
          const image = await decode_texture_image(source, controller.signal);
          if (image && !controller.signal.aborted) {
            accept_image(source, image);
          }
        }),
      );
    } finally {
      signal?.removeEventListener("abort", dispose);
    }
  };
  return { load, dispose };
};

export { create_texture_source_list, create_texture_loader };
