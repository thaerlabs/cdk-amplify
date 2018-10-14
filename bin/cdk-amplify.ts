#!/usr/bin/env node
import sns = require('@aws-cdk/aws-sns');
import sqs = require('@aws-cdk/aws-sqs');
import cdk = require('@aws-cdk/cdk');

class CdkAmplifyStack extends cdk.Stack {
  constructor(parent: cdk.App, name: string, props?: cdk.StackProps) {
    super(parent, name, props);

    const queue = new sqs.Queue(this, 'CdkAmplifyQueue', {
      visibilityTimeoutSec: 300
    });

    const topic = new sns.Topic(this, 'CdkAmplifyTopic');

    topic.subscribeQueue(queue);
  }
}

const app = new cdk.App(process.argv);

new CdkAmplifyStack(app, 'CdkAmplifyStack');

process.stdout.write(app.run());
