import cdk = require('@aws-cdk/cdk');
import appsync = require('@aws-cdk/aws-appsync');
import dynamo = require('@aws-cdk/aws-dynamodb');
import iam = require('@aws-cdk/aws-iam');
import { Cognito } from '../cognito';
import { run } from './transform';

interface AppSyncProps {
  cognito: Cognito;
  region: string | undefined;
  models: {
    [name: string]: {
      table: dynamo.TableProps;
    };
  };
  schema: string;
}

/**
 * Given `Model`
 * look for the following:
 * - ModelTable
 * - ModelIAMRole
 * - ModelDataSource
 *
 * - GetModelResolver
 * - ListModelResolver
 * - CreateModelResolver
 * - UpdateModelResolver
 * - DeleteModelResolver
 */

export class AppSync extends cdk.Construct {
  constructor(parent: cdk.Construct, name: string, props: AppSyncProps) {
    super(parent, name);

    const { schema, resources } = run(props.schema);

    const api = new appsync.cloudformation.GraphQLApiResource(
      this,
      'GraphQLApi',
      {
        graphQlApiName: `${name}Api`,
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
        userPoolConfig: {
          awsRegion: props.region,
          userPoolId: props.cognito.userPool.userPoolId,
          defaultAction: 'ALLOW' // or DENY
        }
      }
    );

    new appsync.cloudformation.GraphQLSchemaResource(this, 'GraphQLSchema', {
      apiId: api.graphQlApiApiId,
      definition: schema
    });

    for (const modelName in props.models) {
      const model = props.models[modelName];

      // Create dynamoDB Table
      const table = new dynamo.Table(
        this,
        `${modelName}DynamoDBTable`,
        model.table
      );

      table.addPartitionKey({
        name: 'id',
        type: dynamo.AttributeType.String
      });

      // create Role
      const role = new iam.Role(this, `${modelName}IAMRole`, {
        roleName: `${modelName}DynamoDBTableRole`,
        assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com')
      });

      role.addToPolicy(
        new iam.PolicyStatement(iam.PolicyStatementEffect.Allow)
          .addActions(
            'dynamodb:BatchGetItem',
            'dynamodb:BatchWriteItem',
            'dynamodb:PutItem',
            'dynamodb:DeleteItem',
            'dynamodb:GetItem',
            'dynamodb:Scan',
            'dynamodb:Query',
            'dynamodb:UpdateItem'
          )
          .addResource(table.tableArn)
      );

      // create Datasource
      const datasource = new appsync.cloudformation.DataSourceResource(
        this,
        `${modelName}DynamoDBTableDataSource`,
        {
          apiId: api.graphQlApiApiId,
          dataSourceName: `${modelName}DynamoDBTable`,
          type: 'AMAZON_DYNAMODB',
          serviceRoleArn: role.roleArn,
          dynamoDbConfig: {
            awsRegion: props.region || '',
            tableName: table.tableName,
            useCallerCredentials: false
          }
        }
      );

      // Add resolvers
      addDynamoDBResolver(
        this,
        modelName,
        'Get',
        resources,
        api.graphQlApiApiId,
        datasource.dataSourceName
      );

      addDynamoDBResolver(
        this,
        modelName,
        'List',
        resources,
        api.graphQlApiApiId,
        datasource.dataSourceName
      );

      addDynamoDBResolver(
        this,
        modelName,
        'Create',
        resources,
        api.graphQlApiApiId,
        datasource.dataSourceName
      );

      addDynamoDBResolver(
        this,
        modelName,
        'Update',
        resources,
        api.graphQlApiApiId,
        datasource.dataSourceName
      );

      addDynamoDBResolver(
        this,
        modelName,
        'Delete',
        resources,
        api.graphQlApiApiId,
        datasource.dataSourceName
      );
    }
  }
}

function addDynamoDBResolver(
  parent: cdk.Construct,
  modelName: string,
  operation: string,
  resources: any,
  graphQlApiApiId: string,
  dataSourceName: string
) {
  const resolverName = `${operation}${modelName}Resolver`;
  const resolver = resources[resolverName].Properties;
  new appsync.cloudformation.ResolverResource(parent, resolverName, {
    apiId: graphQlApiApiId,
    dataSourceName: dataSourceName,
    typeName: resolver.TypeName,
    fieldName: resolver.FieldName,
    requestMappingTemplate: resolver.RequestMappingTemplate,
    responseMappingTemplate: resolver.ResponseMappingTemplate
  });
}
