import AWS_S3, {
    S3Client,
    PutObjectCommandInput, PutObjectCommand,
    GetObjectCommand,
    ListObjectsV2Command,
} from '@aws-sdk/client-s3';

let _service: S3Client | undefined;
function service() {
    if (!_service) {
        const s3 = new S3Client({
            region: 'us-east-1',
        });
        _service = s3;
        return s3;
    } else {
        return _service;
    }
}

export type Asset = AWS_S3._Object;
export type AssetBody = PutObjectCommandInput['Body'];
export async function downloadAsset(bucket: string, assetId: string): Promise<AssetBody | undefined> {
    try {
        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: assetId,
        });
        const result = await service().send(command);
        return result.Body;
    } catch (e) {
        return undefined;
    }
}

export async function uploadAsset(bucket: string, assetId: string, body: AssetBody) {
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: assetId,
        Body: body,
    });
    return service().send(command);
}

export async function* listObjects(bucket: string) {
    for await (const batch of listObjectBatches(bucket)) {
        yield* batch;
    }
}

type ContinuationToken = string;
async function* listObjectBatches(bucket: string) {
    let objects: AWS_S3.ListObjectsV2CommandOutput;
    let token: ContinuationToken | undefined = undefined;
    do {
        const command = new ListObjectsV2Command({
            Bucket: bucket,
            ContinuationToken: token,
        });
        objects = await service().send(command);
        token = objects.NextContinuationToken;
        yield objects.Contents
            ? objects.Contents
            : [];
    } while (objects.IsTruncated);
}