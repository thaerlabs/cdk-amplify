#!/usr/bin/env node
import cdk = require('@aws-cdk/cdk');
import { config } from './config';
import { UserPool } from './cognito';

const scopeName = `${config.name}${config.stage}`;

class CdkAmplifyStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props?: cdk.StackProps) {
    super(parent, name, props);

    new UserPool(this, `${name}UserPool`);
  }
}

const app = new cdk.App();

new CdkAmplifyStack(app, scopeName);

app.run();
