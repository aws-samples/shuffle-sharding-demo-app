#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ShuffleShardingDemoSummit2022 } from '../lib/summit2022-demo-stack';

const app = new cdk.App();

new ShuffleShardingDemoSummit2022(app, 'ShuffleShardingDemoSummit2022', {
  albPort: 80,
  intanceType: 't3.medium',
  numberOfInstances: 4,
  targetGroupOptions: {
    sharding: {
      enabled: false,
      shuffle: false,
    },
  },
  props: { env: { account: '<changeMe>', region: '<changeMe' } },
});
