import { S3 } from 'aws-sdk';
import { ListObjectsV2Output } from 'aws-sdk/clients/s3';
import { ContinuationToken } from 'aws-sdk/clients/kinesisvideomedia';

const service = new S3();

export async function* listObjects(bucket: string) {
    for await (const batch of listObjectBatches(bucket)) {
        yield* batch;
    }
}

async function* listObjectBatches(bucket: string) {
    let objects: ListObjectsV2Output;
    let token: ContinuationToken | undefined = undefined;
    do {
        objects = await service.listObjectsV2({
            Bucket: bucket,
            ContinuationToken: token,
        }).promise();
        token = objects.NextContinuationToken;
        yield objects.Contents
            ? objects.Contents
            : [];
    } while (objects.IsTruncated);
}