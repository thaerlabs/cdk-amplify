import cdk = require('@aws-cdk/cdk');
import appsync = require('@aws-cdk/aws-appsync');
import { Cognito } from './cognito';
import { run } from './graphql/schema';

interface AppSyncConfig {
  cognito: Cognito;
  region: string | undefined;
}

export class AppSync extends cdk.Construct {
  constructor(parent: cdk.Construct, name: string, config: AppSyncConfig) {
    super(parent, name);

    const schema = run();

    const api = new appsync.cloudformation.GraphQLApiResource(
      this,
      'GraphQLApi',
      {
        graphQlApiName: `${name}Api`,
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
        userPoolConfig: {
          awsRegion: config.region,
          userPoolId: config.cognito.userPool.userPoolId,
          defaultAction: 'ALLOW' // or DENY
        }
      }
    );

    new appsync.cloudformation.GraphQLSchemaResource(this, 'GraphQLSchema', {
      apiId: api.graphQlApiApiId,
      definition: schema.schema
    });
  }
}
