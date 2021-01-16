import { AwsLambdaResource, AwsS3Resource, AwsUnknownResource, AwsResource } from "./aws-resource";
import { AwsService } from "./aws-service";

export class AwsResourceFactory {
    static new(parent: AwsService, obj: any): AwsResource {
        switch (parent.name) {
            case 'Lambda':
                return new AwsLambdaResource(parent, obj);
            case 'S3':
                return new AwsS3Resource(parent, obj);
            default:
                return new AwsUnknownResource(parent, obj);
        }
    }
}