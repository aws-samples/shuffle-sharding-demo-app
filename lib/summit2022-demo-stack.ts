import {
  aws_cloudfront,
  aws_cloudwatch,
  aws_ec2,
  aws_iam,
  CfnOutput,
  Duration,
  Stack,
  StackProps,
  Tags,
} from 'aws-cdk-lib';
import * as aws_synthetics_alpha from '@aws-cdk/aws-synthetics-alpha';
import {
  CachePolicy,
  Function,
  FunctionCode,
  FunctionEventType,
  OriginProtocolPolicy,
  OriginRequestPolicy,
  OriginRequestQueryStringBehavior,
} from 'aws-cdk-lib/aws-cloudfront';
import { HttpOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import {
  ApplicationListener,
  ApplicationLoadBalancer,
  ApplicationTargetGroup,
  IApplicationLoadBalancerTarget,
  ListenerAction,
  ListenerCondition,
  Protocol,
  TargetType,
} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { InstanceTarget } from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import { Effect } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as fs from 'fs';

export class ShuffleShardingDemoSummit2022 extends Stack {
  listener: ApplicationListener;
  alb: ApplicationLoadBalancer;
  cloudwatchDashboard: aws_cloudwatch.Dashboard;
  cloudwatchWidgets: aws_cloudwatch.AlarmWidget[];
  readonly vpc: aws_ec2.Vpc;
  readonly stringParameter = 'number';
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.vpc = new aws_ec2.Vpc(this, 'vpc', { maxAzs: 3 });

    this.cloudwatchDashboard = new aws_cloudwatch.Dashboard(this, 'cw', {
      dashboardName: 'ShuffleShardingSummit2022',
    });
    this.cloudwatchWidgets = [];

    this.createALB(80);

    const instances: aws_ec2.Instance[] = this.createWorkers(4, 't3.medium');

    this.defaultRoundRobing(instances);

    const numberOfGroups = this.createGroups(instances, {
      sharding: { enabled: true, shuffle: true },
    });
    this.createDist(numberOfGroups);

    this.cloudwatchDashboard.addWidgets(...this.cloudwatchWidgets);

    new CfnOutput(this, 'Cloudwatch Dashboard URL', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${process.env.CDK_DEFAULT_REGION}#dashboards:name=ShuffleShardingSummit2022`,
    });
  }

  createDist(number: number) {
    const redirectFunction = new Function(this, 'redirectLogic', {
      code: FunctionCode.fromInline(
        `function handler(event) {
        var request = event.request;
        var querystring = request.querystring;
        var pattern = /static/;
        if(!pattern.test(request.uri))
        {
          if (!querystring['${this.stringParameter}']){
            var newUri;
            var randomkey = getRndInteger(1, ${number});
            newUri = '/?${this.stringParameter}=' + randomkey;
            var response = {
              statusCode: 302,
              statusDescription: 'Found',
              headers: {
                location: { value: newUri },
              },
            };
            return response;
          }
        }
        return request;
      }

      function getRndInteger(min, max) {
        min = Math.ceil(min); // rounds a number up to the next largest integer
        max = Math.floor(max); // returns the largest integer less than or equal to a given number
        return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
      }
`
      ),
      functionName: 'redirectToRandomShard',
      comment: `Function to redirect all incoming requests to /?${this.stringParameter}= + Random Number (i.e: /?${this.stringParameter}=1)`,
    });

    const cloudfront = new aws_cloudfront.Distribution(this, 'CloudFront', {
      defaultBehavior: {
        origin: new HttpOrigin(this.alb.loadBalancerDnsName, {
          protocolPolicy: OriginProtocolPolicy.HTTP_ONLY,
        }),
        functionAssociations: [
          {
            eventType: FunctionEventType.VIEWER_REQUEST,
            function: redirectFunction,
          },
        ],
        originRequestPolicy: {
          originRequestPolicyId: new OriginRequestPolicy(this, 'policy', {
            queryStringBehavior: OriginRequestQueryStringBehavior.all(),
          }).originRequestPolicyId,
        },
        cachePolicy: CachePolicy.CACHING_DISABLED,
      },
    });

    const cloudfronturl = `https://${cloudfront.distributionDomainName}`;
    new CfnOutput(this, `CloudfrontURL`, {
      value: cloudfronturl,
    });

    this.createCanaryAlarm(cloudfronturl, 'main', 'main (/)');
  }

  createALB(port: number) {
    this.alb = new ApplicationLoadBalancer(this, 'AppLoadBalancer', {
      vpc: this.vpc,
      internetFacing: true,
    });

    this.listener = this.alb.addListener('AppMainListener', { port: port });

    const activeConnectionsCount = new aws_cloudwatch.Alarm(
      this,
      `activeConnectionsCount`,
      {
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        threshold: 10,
        metric: this.alb.metricActiveConnectionCount(),
        comparisonOperator:
          aws_cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      }
    );

    const activeConnectionsCountWidget = new aws_cloudwatch.AlarmWidget({
      alarm: activeConnectionsCount,
      title: `activeConnectionsCount`,
    });

    this.cloudwatchWidgets.push(activeConnectionsCountWidget);

    const totalConnectionsCount = new aws_cloudwatch.Alarm(
      this,
      `totalConnectionsCount`,
      {
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        threshold: 10,
        metric: this.alb.metricRequestCount(),
        comparisonOperator:
          aws_cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      }
    );

    const totalConnectionsCountWidget = new aws_cloudwatch.AlarmWidget({
      alarm: totalConnectionsCount,
      title: `totalConnectionsCount`,
    });

    this.cloudwatchWidgets.push(totalConnectionsCountWidget);
  }

  createWorkers(number: number, size: string) {
    const userData = fs.readFileSync('./lib/userdata.sh', 'utf8');
    const idOfAzs = Array.from(Array(this.vpc.availabilityZones.length).keys());
    console.log(
      `🌎 Creating EC2 Instances in ${idOfAzs.length} Availability Zones 🌎 `
    );
    // Use Latest Amazon Linux Image
    const ami = new aws_ec2.AmazonLinuxImage({
      generation: aws_ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      cpuType: aws_ec2.AmazonLinuxCpuType.X86_64,
    });

    const instances = [];
    for (let index = 0; index < number; index++) {
      instances.push(
        this.newInstance(
          `Worker${index + 1}`,
          ami,
          size,
          userData,
          idOfAzs[(index + 1) % idOfAzs.length]
        )
      );
    }
    return instances;
  }

  defaultRoundRobing(instances: aws_ec2.Instance[]) {
    let targets: IApplicationLoadBalancerTarget[] = [];
    instances.forEach((instance) => {
      targets.push(new InstanceTarget(instance, 80));
    });
    console.log(`New virtual shard for all VMs assigned to ALB at /`);
    this.addTargetsToALB('RoundRobin', targets, 100, false);
  }

  newInstance(
    name: string,
    machineImage: aws_ec2.IMachineImage,
    size: string,
    userdata: string,
    azId: number
  ) {
    const instance = new aws_ec2.Instance(this, name, {
      vpc: this.vpc,
      instanceType: new aws_ec2.InstanceType(size),
      machineImage: machineImage,
      blockDevices: [
        {
          deviceName: '/dev/sda1',
          volume: aws_ec2.BlockDeviceVolume.ebs(50, {
            volumeType: aws_ec2.EbsDeviceVolumeType.GP3,
          }),
        },
      ],
      userData: aws_ec2.UserData.custom(userdata),
      availabilityZone: this.availabilityZones[azId],
      userDataCausesReplacement: true,
    });
    instance.connections.allowFrom(this.alb, aws_ec2.Port.tcp(80));
    instance.role.addManagedPolicy(
      aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
        'AmazonSSMManagedInstanceCore'
      )
    );
    instance.role.addManagedPolicy(
      new aws_iam.ManagedPolicy(this, name + 'readTags', {
        statements: [
          new aws_iam.PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['ec2:DescribeTags'],
            resources: ['*'],
          }),
          new aws_iam.PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['ec2:DescribeInstances'],
            resources: ['*'],
          }),
          new aws_iam.PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['elasticloadbalancing:DescribeTargetGroups'],
            resources: ['*'],
          }),
          new aws_iam.PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['elasticloadbalancing:DescribeLoadBalancers'],
            resources: ['*'],
          }),
        ],
      })
    );
    return instance;
  }

  createGroups(
    instances: aws_ec2.Instance[],
    options: { sharding: { enabled: boolean; shuffle: boolean } }
  ) {
    var numberOfGroups = 0;
    if (options.sharding.enabled) {
      const shards: [aws_ec2.Instance, aws_ec2.Instance][] = [];
      if (options.sharding.shuffle) {
        for (let a = 0; a < instances.length; a++) {
          for (let b = a + 1; b < instances.length; b++) {
            numberOfGroups += 1;
            shards.push([instances[a], instances[b]]);
            console.log(
              `New group #${numberOfGroups} : '${instances[a].node.id}' and '${instances[b].node.id}'`
            );
          }
        }
      } else {
        for (let a = 0; a < instances.length; a = a + 2) {
          numberOfGroups += 1;
          shards.push([instances[a], instances[a + 1]]);
          console.log(
            `New group #${numberOfGroups} : ${instances[a].node.id} and ${
              instances[a + 1].node.id
            }`
          );
        }
      }

      shards.forEach((shard, index) => {
        const shardName = `${shard[0].node.id}-${shard[1].node.id}`;
        console.log(
          `New virtual shard: ${shardName} assigned to ALB at /?${
            this.stringParameter
          }=${index + 1}`
        );
        const target = [
          new InstanceTarget(shard[0], 80),
          new InstanceTarget(shard[1], 80),
        ];
        this.addTargetsToALB(shardName, target, index + 1);
      });
    } else {
      instances.forEach((instance) => {
        numberOfGroups += 1;
        const shardName = `ec2-${instance.node.id}`;
        console.log(
          `New virtual shard: ${shardName} assigned to ALB at /?${this.stringParameter}=${numberOfGroups}`
        );
        this.addTargetsToALB(
          shardName,
          [new InstanceTarget(instance, 80)],
          numberOfGroups
        );
      });
    }
    console.log(
      `\n♦️ Total of ${instances.length} hosts (${instances[0].instance.instanceType}) and ${numberOfGroups} virtual shards ♦️`
    );

    const maxBlastRadius = (100 / numberOfGroups).toFixed(2);
    const minBlastRadius = (100 / instances.length).toFixed(2);
    console.log(
      options.sharding.shuffle
        ? `💥 Blast radius = ${maxBlastRadius}% 💥\n`
        : `💥 Blast radius = ${minBlastRadius}%-${maxBlastRadius}% (Shuffle disabled) 💥\n`
    );
    return numberOfGroups;
  }

  addTargetsToALB(
    name: string,
    targets: IApplicationLoadBalancerTarget[],
    priority: number,
    queryStringEnabled?: boolean
  ) {
    const targetGroup = new ApplicationTargetGroup(this, name, {
      vpc: this.vpc,
      port: 80,
      targetType: TargetType.INSTANCE,
      targets: targets,
      healthCheck: {
        enabled: true,
        interval: Duration.seconds(5),
        path: '/',
        protocol: Protocol.HTTP,
        timeout: Duration.seconds(2),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 2,
      },
    });
    queryStringEnabled = queryStringEnabled ?? true;

    const queryStrings = { key: this.stringParameter, value: `${priority}` };

    if (queryStringEnabled) {
      this.listener.addAction(name, {
        action: ListenerAction.forward([targetGroup]),
        conditions: [ListenerCondition.queryStrings([queryStrings])],
        priority: priority,
      });
    } else {
      this.listener.addAction(name, {
        action: ListenerAction.forward([targetGroup]),
      });
    }

    // Endpoint for the specific target group with the specific query string
    const url = `http://${this.alb.loadBalancerDnsName}/?${this.stringParameter}=${priority}`;
    new CfnOutput(this, `LoadBalancerEndpoint-${name}`, {
      value: url,
    });

    this.createCanaryAlarm(
      url,
      `${priority}`,
      `/?${this.stringParameter}=${priority}`
    );
  }

  createCanaryAlarm(url: string, id: string, CWtitle: string) {
    const handler = `
    const synthetics = require('Synthetics');
    const log = require('SyntheticsLogger');
    
    const pageLoadBlueprint = async function () {
    const url = '${url}';

    const page = await synthetics.getPage();
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // Wait for page to render. Increase or decrease wait time based on endpoint being monitored.
    await page.waitFor(15000);
    // This will take a screenshot that will be included in test output artifacts.
    await synthetics.takeScreenshot('loaded', 'loaded');
    const pageTitle = await page.title();
    log.info('Page title: ' + pageTitle);
    if (response.status() !== 200) {
      throw 'Failed to load page!';
    }
    };

    exports.handler = async () => {
      return await pageLoadBlueprint();
    };
    `;

    const canary = new aws_synthetics_alpha.Canary(this, `canary-${id}`, {
      schedule: aws_synthetics_alpha.Schedule.rate(Duration.minutes(5)),
      test: aws_synthetics_alpha.Test.custom({
        code: aws_synthetics_alpha.Code.fromInline(handler),
        handler: 'index.handler',
      }),
      runtime: aws_synthetics_alpha.Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_4,
    });

    const canaryAlarm = new aws_cloudwatch.Alarm(this, `alarm-${id}`, {
      evaluationPeriods: 5,
      threshold: 90,
      metric: canary.metricSuccessPercent({ period: Duration.seconds(60) }),
      comparisonOperator: aws_cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    });

    const cwWidget = new aws_cloudwatch.AlarmWidget({
      alarm: canaryAlarm,
      title: CWtitle,
    });

    this.cloudwatchWidgets.push(cwWidget);
  }
}
