import {
  CopyObjectCommand,
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { env } from '../config/env.js';

const client = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
});

let bucketReady: Promise<void> | null = null;

export function getImageBucket() {
  return env.S3_BUCKET;
}

export async function ensureImageBucket() {
  bucketReady ??= ensureBucket();
  return bucketReady;
}

export async function putImageObject(key: string, body: Buffer, contentType: string) {
  await ensureImageBucket();
  await client.send(new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
}

export async function copyImageObject(sourceKey: string, targetKey: string) {
  await ensureImageBucket();
  await client.send(new CopyObjectCommand({
    Bucket: env.S3_BUCKET,
    CopySource: `${env.S3_BUCKET}/${encodeURIComponent(sourceKey)}`,
    Key: targetKey,
  }));
}

export async function deleteImageObject(key: string) {
  await ensureImageBucket();
  await client.send(new DeleteObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  }));
}

export async function getImageObject(key: string) {
  const result = await client.send(new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  }));

  const chunks: Buffer[] = [];
  for await (const chunk of result.Body as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

async function ensureBucket() {
  try {
    await client.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET }));
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: env.S3_BUCKET }));
  }
}
