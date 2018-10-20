import cxapi = require('@aws-cdk/cx-api');
import { AppSync, CloudFormation } from 'aws-sdk';
import { writeFileSync } from 'fs';

export class ConfigGenerator {
  config: any;
  stack: cxapi.SynthesizedStack;
  cloudformation: CloudFormation;

  constructor(stack: cxapi.SynthesizedStack) {
    this.stack = stack;

    this.cloudformation = new CloudFormation({
      region: stack.environment.region
    });

    this.run();
  }

  async run() {
    try {
      const resources = await this.fetchStackResources();
      this.config = await this.fetchResourceConfigurations(resources);
      writeFileSync(
        './client/awsConfig.json',
        JSON.stringify(this.config, null, 2),
        'utf-8'
      );
    } catch (err) {
      console.log(err.message);
    }
  }

  /**
   * Fetch a list of all the resources in the stack, processing the paged response
   */
  async fetchStackResources(): Promise<
    CloudFormation.Types.StackResourceSummaries | any
  > {
    return new Promise(async (resolve, reject) => {
      let resources: CloudFormation.Types.StackResourceSummaries = [];
      let request: CloudFormation.Types.ListStackResourcesInput = {
        StackName: this.stack.name
      };
      let morePages = false;

      try {
        do {
          let result: CloudFormation.Types.ListStackResourcesOutput = await this.cloudformation
            .listStackResources({
              StackName: this.stack.name
            })
            .promise();

          if (result.StackResourceSummaries) {
            result.StackResourceSummaries.forEach(resource => {
              if (
                resource.ResourceStatus === 'CREATE_COMPLETE' ||
                resource.ResourceStatus === 'UPDATE_COMPLETE'
              )
                resources.push(resource);
            });

            request.NextToken = result.NextToken;
            morePages = result.NextToken ? true : false;
          } else {
            morePages = false;
          }
        } while (morePages);

        resolve(resources);
      } catch (err) {
        reject(err);
      }
    });
  }

  async fetchResourceConfigurations(
    resources: CloudFormation.Types.StackResourceSummaries
  ) {
    const asyncResources: Promise<any>[] = [];
    const config: any = {
      Auth: {},
      API: {}
    };

    resources.forEach(resource => {
      switch (resource.ResourceType) {
        case 'AWS::Cognito::IdentityPool':
          config.Auth = Object.assign(config.Auth, {
            identityPoolId: resource.PhysicalResourceId,
            region: this.stack.environment.region
          });
          break;
        case 'AWS::Cognito::UserPool':
          config.Auth = Object.assign(config.Auth, {
            userPoolId: resource.PhysicalResourceId
          });
          break;
        case 'AWS::Cognito::UserPoolClient':
          config.Auth = Object.assign(config.Auth, {
            userPoolWebClientId: resource.PhysicalResourceId
          });
          break;
        case 'AWS::AppSync::GraphQLApi':
          const appsync = new AppSync({
            region: this.stack.environment.region
          });
          const apiId = resource.PhysicalResourceId
            ? resource.PhysicalResourceId.split('/')[1]
            : '';
          asyncResources.push(
            appsync
              .getGraphqlApi({
                apiId
              })
              .promise()
          );
          break;
      }
    });

    const resolvedAsyncResources = await Promise.all(asyncResources);

    resolvedAsyncResources.forEach(resource => {
      if (resource.graphqlApi) {
        config.API = {
          graphql_endpoint: resource.graphqlApi.uris.GRAPHQL,
          graphql_endpoint_iam_region: this.stack.environment.region
        };
      }
    });

    return config;
  }
}
