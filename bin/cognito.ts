import cognito = require('@aws-cdk/aws-cognito');
import cdk = require('@aws-cdk/cdk');

export class Cognito extends cdk.Construct {
  userPool: cognito.cloudformation.UserPoolResource;
  client: cognito.cloudformation.UserPoolClientResource;
  identity: cognito.cloudformation.IdentityPoolResource;

  constructor(parent: cdk.Construct, name: string) {
    super(parent, name);

    // Create chat room user pool
    this.userPool = new cognito.cloudformation.UserPoolResource(
      this,
      'UserPool',
      {
        adminCreateUserConfig: {
          allowAdminCreateUserOnly: false
        },
        autoVerifiedAttributes: ['email'],
        usernameAttributes: ['email'],
        policies: {
          passwordPolicy: {
            minimumLength: 6,
            requireNumbers: true
          }
        },
        schema: [
          {
            attributeDataType: 'String',
            name: 'email',
            required: true
          },
          {
            attributeDataType: 'String',
            name: 'name',
            required: true
          }
        ]
      }
    );

    // Web client
    this.client = new cognito.cloudformation.UserPoolClientResource(
      this,
      'UserPoolClient',
      {
        clientName: 'WebUserPoolClient',
        refreshTokenValidity: 30,
        userPoolId: this.userPool.ref
      }
    );

    // Identity pool
    this.identity = new cognito.cloudformation.IdentityPoolResource(
      this,
      'IdentityPool',
      {
        allowUnauthenticatedIdentities: false,
        cognitoIdentityProviders: [
          {
            clientId: this.client.userPoolClientId,
            providerName: this.userPool.userPoolProviderName
          }
        ]
      }
    );
  }
}
