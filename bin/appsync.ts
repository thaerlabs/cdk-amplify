import cdk = require('@aws-cdk/cdk');
import appsync = require('@aws-cdk/aws-appsync');
import { Cognito } from './cognito';

interface AppSyncConfig {
  cognito: Cognito;
  region: string | undefined;
}

export class AppSync extends cdk.Construct {
  constructor(parent: cdk.Construct, name: string, config: AppSyncConfig) {
    super(parent, name);

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
      definition: `
      schema {
        query: Query
        mutation: Mutation
      }
      type Query {
          # Get a single value of type 'Note' by primary key.
          singleNote(id: ID!): Note
      }
      type Mutation {
          # Put a single value of type 'Note'.
          # If an item exists it's updated. If it does not it's created.
          putNote(id: ID!, title: String!): Note
      }
      type Note {
          id: ID!
          title: String!
      }
      `
    });
  }
}
