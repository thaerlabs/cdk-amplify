#!/usr/bin/env node
import cdk = require('@aws-cdk/cdk');
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { config } from './config';
import { Cognito } from './cognito';
import { AppSync } from './appsync';
import { ConfigGenerator } from './genconfig';

const scopeName = `${config.name}${config.stage}`;

class CdkAmplifyStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props?: cdk.StackProps) {
    super(parent, name, props);

    const cognito = new Cognito(this, `${name}Cognito`);
    new AppSync(this, `${name}AppSync`, {
      cognito,
      region: this.env.region,
      models: {
        Note: {
          table: {
            tableName: `${name}NoteTable`,
            readCapacity: 1,
            writeCapacity: 1
          }
        }
      },
      schema: readFileSync(resolve(__dirname, './schema.graphql'), 'utf-8')
    });
  }
}

const app = new cdk.App();
const amplify = new CdkAmplifyStack(app, scopeName, {
  env: {
    region: 'eu-west-1'
  }
});

app.run();

new ConfigGenerator(app.synthesizeStack(amplify.name));
