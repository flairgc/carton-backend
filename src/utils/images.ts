import sharp from 'sharp';

const maxLongSide = 2560;

type ProcessedImage = {
  data: Buffer;
  mimeType: string;
};

const supportedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export async function normalizeCardImage(input: Buffer, mimeType: string): Promise<ProcessedImage> {
  if (!supportedMimeTypes.has(mimeType)) {
    return {
      data: input,
      mimeType,
    };
  }

  const image = sharp(input, { failOn: 'none' }).rotate();
  const metadata = await image.metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;
  const longSide = Math.max(width, height);

  let pipeline = image;
  if (longSide > maxLongSide) {
    pipeline = image.resize({
      width: width >= height ? maxLongSide : undefined,
      height: height > width ? maxLongSide : undefined,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  return {
    data: await encodeImage(pipeline, mimeType),
    mimeType,
  };
}

function encodeImage(image: sharp.Sharp, mimeType: string) {
  switch (mimeType) {
    case 'image/jpeg':
      return image.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
    case 'image/png':
      return image.png({ compressionLevel: 9 }).toBuffer();
    case 'image/webp':
      return image.webp({ quality: 88 }).toBuffer();
    default:
      return image.toBuffer();
  }
}
