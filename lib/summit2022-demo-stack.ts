import {
  aws_cloudfront,
  aws_ec2,
  aws_iam,
  CfnOutput,
  Duration,
  Stack,
  StackProps,
} from 'aws-cdk-lib';
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
  readonly vpc: aws_ec2.Vpc;
  readonly stringParameter = 'number';
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.vpc = new aws_ec2.Vpc(this, 'vpc');

    this.createALB(); // New ALB and https listener

    const instances: aws_ec2.Instance[] = this.createWorkers(6); // Array of EC2 Instances

    const numberOfGroups = this.createGroups(instances, {
      sharding: { enabled: false, shuffle: false },
    });

    this.createDist(numberOfGroups); // New CloudFront Distribution with CloudFront Function to redirect clients to random group/shard
  }

  createDist(number: number) {
    const redirectFunction = new Function(this, 'redirectLogic', {
      code: FunctionCode.fromInline(
        `function handler(event) {
        var request = event.request;
        var querystring = request.querystring;
        if (!querystring['${this.stringParameter}']){
          var newUri;
          var randomkey = getRndInteger(1, ${number});
          newUri = '/${this.stringParameter}=' + randomkey;
          var response = {
            statusCode: 302,
            statusDescription: 'Found',
            headers: {
              location: { value: newUri },
            },
          };
          return response;
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

    new CfnOutput(this, `CloudfrontURL`, {
      value: `https://${cloudfront.distributionDomainName}`,
    });
  }

  createALB() {
    this.alb = new ApplicationLoadBalancer(this, 'AppLoadBalancer', {
      vpc: this.vpc,
      internetFacing: true,
    });

    this.listener = this.alb.addListener('AppMainListener', { port: 80 });

    this.listener.addAction('DefaultAction', {
      action: ListenerAction.fixedResponse(400, {
        messageBody:
          'Invalid Request. Please include customer name in the request.',
      }),
    });
  }

  createWorkers(number: number) {
    const userData = fs.readFileSync('./lib/userdata.sh', 'utf8');

    // Use Latest Amazon Linux Image
    const ami = new aws_ec2.AmazonLinuxImage({
      generation: aws_ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      cpuType: aws_ec2.AmazonLinuxCpuType.X86_64,
    });

    const instances = [];
    for (let index = 0; index < number; index++) {
      instances.push(this.newInstance(`Worker${index + 1}`, ami, userData));
    }
    return instances;
  }

  newInstance(
    name: string,
    machineImage: aws_ec2.IMachineImage,
    userdata: string
  ) {
    const instance = new aws_ec2.Instance(this, name, {
      vpc: this.vpc,
      instanceType: new aws_ec2.InstanceType('t3.medium'),
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
              `Combination number ${numberOfGroups} : ${instances[a].node.id} & ${instances[b].node.id}`
            );
          }
        }
      } else {
        for (let a = 0; a < instances.length; a = a + 2) {
          numberOfGroups += 1;
          shards.push([instances[a], instances[a + 1]]);
          console.log(
            `Combination number ${numberOfGroups} : ${instances[a].node.id} & ${
              instances[a + 1].node.id
            }`
          );
        }
      }
      var shardNumber = 0;

      shards.forEach((shard) => {
        shardNumber += 1;
        const shardName = `${shard[0].node.id}-${shard[1].node.id}`;
        console.log(
          `Adding shard: ${shardName} to ALB at /?${this.stringParameter}=${shardNumber}`
        );
        const target = [
          new InstanceTarget(shard[0], 80),
          new InstanceTarget(shard[1], 80),
        ];
        this.addTargetsToALB(shardName, target, shardNumber);
      });
    } else {
      instances.forEach((instance) => {
        numberOfGroups += 1;
        const shardName = `ec2-${instance.node.id}`;
        console.log(
          `Adding shard: ${shardName} to ALB at /?${this.stringParameter}=${numberOfGroups}`
        );
        this.addTargetsToALB(
          shardName,
          [new InstanceTarget(instance, 80)],
          numberOfGroups
        );
      });
    }
    console.log(`Total of ${numberOfGroups} combinations`);

    const blastRadius = 100 / numberOfGroups;
    console.log(`Blast radius is ${blastRadius.toFixed(2)}%`);
    return numberOfGroups;
  }

  addTargetsToALB(
    name: string,
    targets: IApplicationLoadBalancerTarget[],
    priority: number
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

    const queryStrings = { key: this.stringParameter, value: `${priority}` };

    this.listener.addAction(name, {
      action: ListenerAction.forward([targetGroup]),
      conditions: [ListenerCondition.queryStrings([queryStrings])],
      priority: priority,
    });

    new CfnOutput(this, `LoadBalancerEndpoint-${name}`, {
      value: `http://${this.alb.loadBalancerDnsName}/?${this.stringParameter}=${priority}`,
    });
  }
}
