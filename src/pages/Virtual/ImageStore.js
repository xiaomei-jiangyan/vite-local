const imgCache = new Map(); // key: msgId or url, value: blobUrl
const imgMeta = new Map();

export async function loadImage(url) {
  if (imgCache.has(url)) return imgCache.get(url);

  const blob = await fetch(url).then((r) => r.blob());
  const blobUrl = URL.createObjectURL(blob);

  imgCache.set(url, blobUrl);
  return blobUrl;
}

// 读取宽高（只算一次）
export async function loadImageMeta(url) {
  if (imgMeta.has(url)) {
    return imgMeta.get(url);
  }

  const img = new Image();
  img.src = url;

  await new Promise((resolve) => {
    img.onload = resolve;
  });

  const meta = {
    width: img.width,
    height: img.height,
    ratio: img.height / img.width,
  };

  imgMeta.set(url, meta);
  return meta;
}
