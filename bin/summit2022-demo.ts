#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ShuffleShardingDemoSummit2022 } from '../lib/summit2022-demo-stack';

const app = new cdk.App();
new ShuffleShardingDemoSummit2022(app, 'ShuffleShardingDemoSummit2022', {
  env: { account: '<Change Me>', region: 'us-east-1' },
});
