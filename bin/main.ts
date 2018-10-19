#!/usr/bin/env node
import cdk = require('@aws-cdk/cdk');
import { config } from './config';
import { Cognito } from './cognito';
import { ConfigGenerator } from './genconfig';

const scopeName = `${config.name}${config.stage}`;

class CdkAmplifyStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props?: cdk.StackProps) {
    super(parent, name, props);

    new Cognito(this, `${name}UserPool`);
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
