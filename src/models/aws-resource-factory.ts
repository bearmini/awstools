import { AwsLambdaResource, AwsUnknownResource, AwsResource } from "./aws-resource";
import { AwsService } from "./aws-service";

export class AwsResourceFactory {
    static new(parent: AwsService, obj: any): AwsResource {
        switch (parent.name) {
            case 'Lambda':
                return new AwsLambdaResource(parent, obj);
            default:
                return new AwsUnknownResource(parent, obj);
        }
    }
}