"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShuffleShardingDemoSummit2022 = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_synthetics_alpha = require("@aws-cdk/aws-synthetics-alpha");
const aws_cloudfront_1 = require("aws-cdk-lib/aws-cloudfront");
const aws_cloudfront_origins_1 = require("aws-cdk-lib/aws-cloudfront-origins");
const aws_elasticloadbalancingv2_1 = require("aws-cdk-lib/aws-elasticloadbalancingv2");
const aws_elasticloadbalancingv2_targets_1 = require("aws-cdk-lib/aws-elasticloadbalancingv2-targets");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const fs = require("fs");
class ShuffleShardingDemoSummit2022 extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        this.stringParameter = 'number';
        this.vpc = new aws_cdk_lib_1.aws_ec2.Vpc(this, 'vpc', { maxAzs: 3 });
        this.cloudwatchDashboard = new aws_cdk_lib_1.aws_cloudwatch.Dashboard(this, 'cw', {
            dashboardName: 'ShuffleShardingSummit2022',
        });
        this.cloudwatchWidgets = [];
        this.createALB(80);
        const instances = this.createWorkers(4, 't3.medium');
        this.defaultRoundRobing(instances);
        const numberOfGroups = this.createGroups(instances, {
            sharding: { enabled: true, shuffle: true },
        });
        this.createDist(numberOfGroups);
        this.cloudwatchDashboard.addWidgets(...this.cloudwatchWidgets);
        new aws_cdk_lib_1.CfnOutput(this, 'Cloudwatch Dashboard URL', {
            value: `https://console.aws.amazon.com/cloudwatch/home?region=${process.env.CDK_DEFAULT_REGION}#dashboards:name=ShuffleShardingSummit2022`,
        });
    }
    createDist(number) {
        const redirectFunction = new aws_cloudfront_1.Function(this, 'redirectLogic', {
            code: aws_cloudfront_1.FunctionCode.fromInline(`function handler(event) {
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
`),
            functionName: 'redirectToRandomShard',
            comment: `Function to redirect all incoming requests to /?${this.stringParameter}= + Random Number (i.e: /?${this.stringParameter}=1)`,
        });
        const cloudfront = new aws_cdk_lib_1.aws_cloudfront.Distribution(this, 'CloudFront', {
            defaultBehavior: {
                origin: new aws_cloudfront_origins_1.HttpOrigin(this.alb.loadBalancerDnsName, {
                    protocolPolicy: aws_cloudfront_1.OriginProtocolPolicy.HTTP_ONLY,
                }),
                functionAssociations: [
                    {
                        eventType: aws_cloudfront_1.FunctionEventType.VIEWER_REQUEST,
                        function: redirectFunction,
                    },
                ],
                originRequestPolicy: {
                    originRequestPolicyId: new aws_cloudfront_1.OriginRequestPolicy(this, 'policy', {
                        queryStringBehavior: aws_cloudfront_1.OriginRequestQueryStringBehavior.all(),
                    }).originRequestPolicyId,
                },
                cachePolicy: aws_cloudfront_1.CachePolicy.CACHING_DISABLED,
            },
        });
        const cloudfronturl = `https://${cloudfront.distributionDomainName}`;
        new aws_cdk_lib_1.CfnOutput(this, `CloudfrontURL`, {
            value: cloudfronturl,
        });
        this.createCanaryAlarm(cloudfronturl, 'main', 'main (/)');
    }
    createALB(port) {
        this.alb = new aws_elasticloadbalancingv2_1.ApplicationLoadBalancer(this, 'AppLoadBalancer', {
            vpc: this.vpc,
            internetFacing: true,
        });
        this.listener = this.alb.addListener('AppMainListener', { port: port });
        const activeConnectionsCount = new aws_cdk_lib_1.aws_cloudwatch.Alarm(this, `activeConnectionsCount`, {
            evaluationPeriods: 1,
            datapointsToAlarm: 1,
            threshold: 10,
            metric: this.alb.metricActiveConnectionCount(),
            comparisonOperator: aws_cdk_lib_1.aws_cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
        });
        const activeConnectionsCountWidget = new aws_cdk_lib_1.aws_cloudwatch.AlarmWidget({
            alarm: activeConnectionsCount,
            title: `activeConnectionsCount`,
        });
        this.cloudwatchWidgets.push(activeConnectionsCountWidget);
        const totalConnectionsCount = new aws_cdk_lib_1.aws_cloudwatch.Alarm(this, `totalConnectionsCount`, {
            evaluationPeriods: 1,
            datapointsToAlarm: 1,
            threshold: 10,
            metric: this.alb.metricRequestCount(),
            comparisonOperator: aws_cdk_lib_1.aws_cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
        });
        const totalConnectionsCountWidget = new aws_cdk_lib_1.aws_cloudwatch.AlarmWidget({
            alarm: totalConnectionsCount,
            title: `totalConnectionsCount`,
        });
        this.cloudwatchWidgets.push(totalConnectionsCountWidget);
    }
    createWorkers(number, size) {
        const userData = fs.readFileSync('./lib/userdata.sh', 'utf8');
        const idOfAzs = Array.from(Array(this.vpc.availabilityZones.length).keys());
        console.log(`🌎 Creating EC2 Instances in ${idOfAzs.length} Availability Zones 🌎 `);
        // Use Latest Amazon Linux Image
        const ami = new aws_cdk_lib_1.aws_ec2.AmazonLinuxImage({
            generation: aws_cdk_lib_1.aws_ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
            cpuType: aws_cdk_lib_1.aws_ec2.AmazonLinuxCpuType.X86_64,
        });
        const instances = [];
        for (let index = 0; index < number; index++) {
            instances.push(this.newInstance(`Worker${index + 1}`, ami, size, userData, idOfAzs[(index + 1) % idOfAzs.length]));
        }
        return instances;
    }
    defaultRoundRobing(instances) {
        let targets = [];
        instances.forEach((instance) => {
            targets.push(new aws_elasticloadbalancingv2_targets_1.InstanceTarget(instance, 80));
        });
        console.log(`New virtual shard for all VMs assigned to ALB at /`);
        this.addTargetsToALB('RoundRobin', targets, 100, false);
    }
    newInstance(name, machineImage, size, userdata, azId) {
        const instance = new aws_cdk_lib_1.aws_ec2.Instance(this, name, {
            vpc: this.vpc,
            instanceType: new aws_cdk_lib_1.aws_ec2.InstanceType(size),
            machineImage: machineImage,
            blockDevices: [
                {
                    deviceName: '/dev/sda1',
                    volume: aws_cdk_lib_1.aws_ec2.BlockDeviceVolume.ebs(50, {
                        volumeType: aws_cdk_lib_1.aws_ec2.EbsDeviceVolumeType.GP3,
                    }),
                },
            ],
            userData: aws_cdk_lib_1.aws_ec2.UserData.custom(userdata),
            availabilityZone: this.availabilityZones[azId],
            userDataCausesReplacement: true,
        });
        instance.connections.allowFrom(this.alb, aws_cdk_lib_1.aws_ec2.Port.tcp(80));
        instance.role.addManagedPolicy(aws_cdk_lib_1.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
        instance.role.addManagedPolicy(new aws_cdk_lib_1.aws_iam.ManagedPolicy(this, name + 'readTags', {
            statements: [
                new aws_cdk_lib_1.aws_iam.PolicyStatement({
                    effect: aws_iam_1.Effect.ALLOW,
                    actions: ['ec2:DescribeTags'],
                    resources: ['*'],
                }),
                new aws_cdk_lib_1.aws_iam.PolicyStatement({
                    effect: aws_iam_1.Effect.ALLOW,
                    actions: ['ec2:DescribeInstances'],
                    resources: ['*'],
                }),
                new aws_cdk_lib_1.aws_iam.PolicyStatement({
                    effect: aws_iam_1.Effect.ALLOW,
                    actions: ['elasticloadbalancing:DescribeTargetGroups'],
                    resources: ['*'],
                }),
                new aws_cdk_lib_1.aws_iam.PolicyStatement({
                    effect: aws_iam_1.Effect.ALLOW,
                    actions: ['elasticloadbalancing:DescribeLoadBalancers'],
                    resources: ['*'],
                }),
            ],
        }));
        return instance;
    }
    createGroups(instances, options) {
        var numberOfGroups = 0;
        if (options.sharding.enabled) {
            const shards = [];
            if (options.sharding.shuffle) {
                for (let a = 0; a < instances.length; a++) {
                    for (let b = a + 1; b < instances.length; b++) {
                        numberOfGroups += 1;
                        shards.push([instances[a], instances[b]]);
                        console.log(`New group #${numberOfGroups} : '${instances[a].node.id}' and '${instances[b].node.id}'`);
                    }
                }
            }
            else {
                for (let a = 0; a < instances.length; a = a + 2) {
                    numberOfGroups += 1;
                    shards.push([instances[a], instances[a + 1]]);
                    console.log(`New group #${numberOfGroups} : ${instances[a].node.id} and ${instances[a + 1].node.id}`);
                }
            }
            shards.forEach((shard, index) => {
                const shardName = `${shard[0].node.id}-${shard[1].node.id}`;
                console.log(`New virtual shard: ${shardName} assigned to ALB at /?${this.stringParameter}=${index + 1}`);
                const target = [
                    new aws_elasticloadbalancingv2_targets_1.InstanceTarget(shard[0], 80),
                    new aws_elasticloadbalancingv2_targets_1.InstanceTarget(shard[1], 80),
                ];
                this.addTargetsToALB(shardName, target, index + 1);
            });
        }
        else {
            instances.forEach((instance) => {
                numberOfGroups += 1;
                const shardName = `ec2-${instance.node.id}`;
                console.log(`New virtual shard: ${shardName} assigned to ALB at /?${this.stringParameter}=${numberOfGroups}`);
                this.addTargetsToALB(shardName, [new aws_elasticloadbalancingv2_targets_1.InstanceTarget(instance, 80)], numberOfGroups);
            });
        }
        console.log(`\n♦️ Total of ${instances.length} hosts (${instances[0].instance.instanceType}) and ${numberOfGroups} virtual shards ♦️`);
        const maxBlastRadius = (100 / numberOfGroups).toFixed(2);
        const minBlastRadius = (100 / instances.length).toFixed(2);
        console.log(options.sharding.shuffle
            ? `💥 Blast radius = ${maxBlastRadius}% 💥\n`
            : `💥 Blast radius = ${minBlastRadius}%-${maxBlastRadius}% (Shuffle disabled) 💥\n`);
        return numberOfGroups;
    }
    addTargetsToALB(name, targets, priority, queryStringEnabled) {
        const targetGroup = new aws_elasticloadbalancingv2_1.ApplicationTargetGroup(this, name, {
            vpc: this.vpc,
            port: 80,
            targetType: aws_elasticloadbalancingv2_1.TargetType.INSTANCE,
            targets: targets,
            healthCheck: {
                enabled: true,
                interval: aws_cdk_lib_1.Duration.seconds(5),
                path: '/',
                protocol: aws_elasticloadbalancingv2_1.Protocol.HTTP,
                timeout: aws_cdk_lib_1.Duration.seconds(2),
                healthyThresholdCount: 2,
                unhealthyThresholdCount: 2,
            },
        });
        queryStringEnabled = queryStringEnabled !== null && queryStringEnabled !== void 0 ? queryStringEnabled : true;
        const queryStrings = { key: this.stringParameter, value: `${priority}` };
        if (queryStringEnabled) {
            this.listener.addAction(name, {
                action: aws_elasticloadbalancingv2_1.ListenerAction.forward([targetGroup]),
                conditions: [aws_elasticloadbalancingv2_1.ListenerCondition.queryStrings([queryStrings])],
                priority: priority,
            });
        }
        else {
            this.listener.addAction(name, {
                action: aws_elasticloadbalancingv2_1.ListenerAction.forward([targetGroup]),
            });
        }
        // Endpoint for the specific target group with the specific query string
        const url = `http://${this.alb.loadBalancerDnsName}/?${this.stringParameter}=${priority}`;
        new aws_cdk_lib_1.CfnOutput(this, `LoadBalancerEndpoint-${name}`, {
            value: url,
        });
        this.createCanaryAlarm(url, `${priority}`, `/?${this.stringParameter}=${priority}`);
    }
    createCanaryAlarm(url, id, CWtitle) {
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
            schedule: aws_synthetics_alpha.Schedule.rate(aws_cdk_lib_1.Duration.minutes(5)),
            test: aws_synthetics_alpha.Test.custom({
                code: aws_synthetics_alpha.Code.fromInline(handler),
                handler: 'index.handler',
            }),
            runtime: aws_synthetics_alpha.Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_4,
        });
        const canaryAlarm = new aws_cdk_lib_1.aws_cloudwatch.Alarm(this, `alarm-${id}`, {
            evaluationPeriods: 5,
            threshold: 90,
            metric: canary.metricSuccessPercent({ period: aws_cdk_lib_1.Duration.seconds(60) }),
            comparisonOperator: aws_cdk_lib_1.aws_cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
        });
        const cwWidget = new aws_cdk_lib_1.aws_cloudwatch.AlarmWidget({
            alarm: canaryAlarm,
            title: CWtitle,
        });
        this.cloudwatchWidgets.push(cwWidget);
    }
}
exports.ShuffleShardingDemoSummit2022 = ShuffleShardingDemoSummit2022;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VtbWl0MjAyMi1kZW1vLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic3VtbWl0MjAyMi1kZW1vLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZDQVVxQjtBQUNyQixzRUFBc0U7QUFDdEUsK0RBUW9DO0FBQ3BDLCtFQUFnRTtBQUNoRSx1RkFTZ0Q7QUFDaEQsdUdBQWdGO0FBQ2hGLGlEQUE2QztBQUU3Qyx5QkFBeUI7QUFFekIsTUFBYSw2QkFBOEIsU0FBUSxtQkFBSztJQU90RCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQWtCO1FBQzFELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRmpCLG9CQUFlLEdBQUcsUUFBUSxDQUFDO1FBSWxDLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxxQkFBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFdkQsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksNEJBQWMsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRTtZQUNsRSxhQUFhLEVBQUUsMkJBQTJCO1NBQzNDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxpQkFBaUIsR0FBRyxFQUFFLENBQUM7UUFFNUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUVuQixNQUFNLFNBQVMsR0FBdUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFFekUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRW5DLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFO1lBQ2xELFFBQVEsRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtTQUMz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RSxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsK0JBQStCO1NBQ3RFLENBQUMsQ0FBQztRQUVILE1BQU0sV0FBVyxHQUFHLElBQUksNEJBQWMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUU7WUFDaEUsaUJBQWlCLEVBQUUsQ0FBQztZQUNwQixTQUFTLEVBQUUsRUFBRTtZQUNiLE1BQU0sRUFBRSxNQUFNLENBQUMsb0JBQW9CLENBQUMsRUFBRSxNQUFNLEVBQUUsc0JBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUNyRSxrQkFBa0IsRUFBRSw0QkFBYyxDQUFDLGtCQUFrQixDQUFDLG1CQUFtQjtTQUMxRSxDQUFDLENBQUM7UUFFSCxNQUFNLFFBQVEsR0FBRyxJQUFJLDRCQUFjLENBQUMsV0FBVyxDQUFDO1lBQzlDLEtBQUssRUFBRSxXQUFXO1lBQ2xCLEtBQUssRUFBRSxPQUFPO1NBQ2YsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN4QyxDQUFDO0NBQ0Y7QUE1WkQsc0VBNFpDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgYXdzX2Nsb3VkZnJvbnQsXG4gIGF3c19jbG91ZHdhdGNoLFxuICBhd3NfZWMyLFxuICBhd3NfaWFtLFxuICBDZm5PdXRwdXQsXG4gIER1cmF0aW9uLFxuICBTdGFjayxcbiAgU3RhY2tQcm9wcyxcbiAgVGFncyxcbn0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgYXdzX3N5bnRoZXRpY3NfYWxwaGEgZnJvbSAnQGF3cy1jZGsvYXdzLXN5bnRoZXRpY3MtYWxwaGEnO1xuaW1wb3J0IHtcbiAgQ2FjaGVQb2xpY3ksXG4gIEZ1bmN0aW9uLFxuICBGdW5jdGlvbkNvZGUsXG4gIEZ1bmN0aW9uRXZlbnRUeXBlLFxuICBPcmlnaW5Qcm90b2NvbFBvbGljeSxcbiAgT3JpZ2luUmVxdWVzdFBvbGljeSxcbiAgT3JpZ2luUmVxdWVzdFF1ZXJ5U3RyaW5nQmVoYXZpb3IsXG59IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZGZyb250JztcbmltcG9ydCB7IEh0dHBPcmlnaW4gfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udC1vcmlnaW5zJztcbmltcG9ydCB7XG4gIEFwcGxpY2F0aW9uTGlzdGVuZXIsXG4gIEFwcGxpY2F0aW9uTG9hZEJhbGFuY2VyLFxuICBBcHBsaWNhdGlvblRhcmdldEdyb3VwLFxuICBJQXBwbGljYXRpb25Mb2FkQmFsYW5jZXJUYXJnZXQsXG4gIExpc3RlbmVyQWN0aW9uLFxuICBMaXN0ZW5lckNvbmRpdGlvbixcbiAgUHJvdG9jb2wsXG4gIFRhcmdldFR5cGUsXG59IGZyb20gJ2F3cy1jZGstbGliL2F3cy1lbGFzdGljbG9hZGJhbGFuY2luZ3YyJztcbmltcG9ydCB7IEluc3RhbmNlVGFyZ2V0IH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWVsYXN0aWNsb2FkYmFsYW5jaW5ndjItdGFyZ2V0cyc7XG5pbXBvcnQgeyBFZmZlY3QgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuXG5leHBvcnQgY2xhc3MgU2h1ZmZsZVNoYXJkaW5nRGVtb1N1bW1pdDIwMjIgZXh0ZW5kcyBTdGFjayB7XG4gIGxpc3RlbmVyOiBBcHBsaWNhdGlvbkxpc3RlbmVyO1xuICBhbGI6IEFwcGxpY2F0aW9uTG9hZEJhbGFuY2VyO1xuICBjbG91ZHdhdGNoRGFzaGJvYXJkOiBhd3NfY2xvdWR3YXRjaC5EYXNoYm9hcmQ7XG4gIGNsb3Vkd2F0Y2hXaWRnZXRzOiBhd3NfY2xvdWR3YXRjaC5BbGFybVdpZGdldFtdO1xuICByZWFkb25seSB2cGM6IGF3c19lYzIuVnBjO1xuICByZWFkb25seSBzdHJpbmdQYXJhbWV0ZXIgPSAnbnVtYmVyJztcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICB0aGlzLnZwYyA9IG5ldyBhd3NfZWMyLlZwYyh0aGlzLCAndnBjJywgeyBtYXhBenM6IDMgfSk7XG5cbiAgICB0aGlzLmNsb3Vkd2F0Y2hEYXNoYm9hcmQgPSBuZXcgYXdzX2Nsb3Vkd2F0Y2guRGFzaGJvYXJkKHRoaXMsICdjdycsIHtcbiAgICAgIGRhc2hib2FyZE5hbWU6ICdTaHVmZmxlU2hhcmRpbmdTdW1taXQyMDIyJyxcbiAgICB9KTtcbiAgICB0aGlzLmNsb3Vkd2F0Y2hXaWRnZXRzID0gW107XG5cbiAgICB0aGlzLmNyZWF0ZUFMQig4MCk7XG5cbiAgICBjb25zdCBpbnN0YW5jZXM6IGF3c19lYzIuSW5zdGFuY2VbXSA9IHRoaXMuY3JlYXRlV29ya2Vycyg0LCAndDMubWVkaXVtJyk7XG5cbiAgICB0aGlzLmRlZmF1bHRSb3VuZFJvYmluZyhpbnN0YW5jZXMpO1xuXG4gICAgY29uc3QgbnVtYmVyT2ZHcm91cHMgPSB0aGlzLmNyZWF0ZUdyb3VwcyhpbnN0YW5jZXMsIHtcbiAgICAgIHNoYXJkaW5nOiB7IGVuYWJsZWQ6IHRydWUsIHNodWZmbGU6IHRydWUgfSxcbiAgICB9KTtcbiAgICB0aGlzLmNyZWF0ZURpc3QobnVtYmVyT2ZHcm91cHMpO1xuXG4gICAgdGhpcy5jbG91ZHdhdGNoRGFzaGJvYXJkLmFkZFdpZGdldHMoLi4udGhpcy5jbG91ZHdhdGNoV2lkZ2V0cyk7XG5cbiAgICBuZXcgQ2ZuT3V0cHV0KHRoaXMsICdDbG91ZHdhdGNoIERhc2hib2FyZCBVUkwnLCB7XG4gICAgICB2YWx1ZTogYGh0dHBzOi8vY29uc29sZS5hd3MuYW1hem9uLmNvbS9jbG91ZHdhdGNoL2hvbWU/cmVnaW9uPSR7cHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfUkVHSU9OfSNkYXNoYm9hcmRzOm5hbWU9U2h1ZmZsZVNoYXJkaW5nU3VtbWl0MjAyMmAsXG4gICAgfSk7XG4gIH1cblxuICBjcmVhdGVEaXN0KG51bWJlcjogbnVtYmVyKSB7XG4gICAgY29uc3QgcmVkaXJlY3RGdW5jdGlvbiA9IG5ldyBGdW5jdGlvbih0aGlzLCAncmVkaXJlY3RMb2dpYycsIHtcbiAgICAgIGNvZGU6IEZ1bmN0aW9uQ29kZS5mcm9tSW5saW5lKFxuICAgICAgICBgZnVuY3Rpb24gaGFuZGxlcihldmVudCkge1xuICAgICAgICB2YXIgcmVxdWVzdCA9IGV2ZW50LnJlcXVlc3Q7XG4gICAgICAgIHZhciBxdWVyeXN0cmluZyA9IHJlcXVlc3QucXVlcnlzdHJpbmc7XG4gICAgICAgIHZhciBwYXR0ZXJuID0gL3N0YXRpYy87XG4gICAgICAgIGlmKCFwYXR0ZXJuLnRlc3QocmVxdWVzdC51cmkpKVxuICAgICAgICB7XG4gICAgICAgICAgaWYgKCFxdWVyeXN0cmluZ1snJHt0aGlzLnN0cmluZ1BhcmFtZXRlcn0nXSl7XG4gICAgICAgICAgICB2YXIgbmV3VXJpO1xuICAgICAgICAgICAgdmFyIHJhbmRvbWtleSA9IGdldFJuZEludGVnZXIoMSwgJHtudW1iZXJ9KTtcbiAgICAgICAgICAgIG5ld1VyaSA9ICcvPyR7dGhpcy5zdHJpbmdQYXJhbWV0ZXJ9PScgKyByYW5kb21rZXk7XG4gICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSB7XG4gICAgICAgICAgICAgIHN0YXR1c0NvZGU6IDMwMixcbiAgICAgICAgICAgICAgc3RhdHVzRGVzY3JpcHRpb246ICdGb3VuZCcsXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbjogeyB2YWx1ZTogbmV3VXJpIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVxdWVzdDtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gZ2V0Um5kSW50ZWdlcihtaW4sIG1heCkge1xuICAgICAgICBtaW4gPSBNYXRoLmNlaWwobWluKTsgLy8gcm91bmRzIGEgbnVtYmVyIHVwIHRvIHRoZSBuZXh0IGxhcmdlc3QgaW50ZWdlclxuICAgICAgICBtYXggPSBNYXRoLmZsb29yKG1heCk7IC8vIHJldHVybnMgdGhlIGxhcmdlc3QgaW50ZWdlciBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gYSBnaXZlbiBudW1iZXJcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSArIG1pbik7IC8vVGhlIG1heGltdW0gaXMgaW5jbHVzaXZlIGFuZCB0aGUgbWluaW11bSBpcyBpbmNsdXNpdmVcbiAgICAgIH1cbmBcbiAgICAgICksXG4gICAgICBmdW5jdGlvbk5hbWU6ICdyZWRpcmVjdFRvUmFuZG9tU2hhcmQnLFxuICAgICAgY29tbWVudDogYEZ1bmN0aW9uIHRvIHJlZGlyZWN0IGFsbCBpbmNvbWluZyByZXF1ZXN0cyB0byAvPyR7dGhpcy5zdHJpbmdQYXJhbWV0ZXJ9PSArIFJhbmRvbSBOdW1iZXIgKGkuZTogLz8ke3RoaXMuc3RyaW5nUGFyYW1ldGVyfT0xKWAsXG4gICAgfSk7XG5cbiAgICBjb25zdCBjbG91ZGZyb250ID0gbmV3IGF3c19jbG91ZGZyb250LkRpc3RyaWJ1dGlvbih0aGlzLCAnQ2xvdWRGcm9udCcsIHtcbiAgICAgIGRlZmF1bHRCZWhhdmlvcjoge1xuICAgICAgICBvcmlnaW46IG5ldyBIdHRwT3JpZ2luKHRoaXMuYWxiLmxvYWRCYWxhbmNlckRuc05hbWUsIHtcbiAgICAgICAgICBwcm90b2NvbFBvbGljeTogT3JpZ2luUHJvdG9jb2xQb2xpY3kuSFRUUF9PTkxZLFxuICAgICAgICB9KSxcbiAgICAgICAgZnVuY3Rpb25Bc3NvY2lhdGlvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBldmVudFR5cGU6IEZ1bmN0aW9uRXZlbnRUeXBlLlZJRVdFUl9SRVFVRVNULFxuICAgICAgICAgICAgZnVuY3Rpb246IHJlZGlyZWN0RnVuY3Rpb24sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgb3JpZ2luUmVxdWVzdFBvbGljeToge1xuICAgICAgICAgIG9yaWdpblJlcXVlc3RQb2xpY3lJZDogbmV3IE9yaWdpblJlcXVlc3RQb2xpY3kodGhpcywgJ3BvbGljeScsIHtcbiAgICAgICAgICAgIHF1ZXJ5U3RyaW5nQmVoYXZpb3I6IE9yaWdpblJlcXVlc3RRdWVyeVN0cmluZ0JlaGF2aW9yLmFsbCgpLFxuICAgICAgICAgIH0pLm9yaWdpblJlcXVlc3RQb2xpY3lJZCxcbiAgICAgICAgfSxcbiAgICAgICAgY2FjaGVQb2xpY3k6IENhY2hlUG9saWN5LkNBQ0hJTkdfRElTQUJMRUQsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgY2xvdWRmcm9udHVybCA9IGBodHRwczovLyR7Y2xvdWRmcm9udC5kaXN0cmlidXRpb25Eb21haW5OYW1lfWA7XG4gICAgbmV3IENmbk91dHB1dCh0aGlzLCBgQ2xvdWRmcm9udFVSTGAsIHtcbiAgICAgIHZhbHVlOiBjbG91ZGZyb250dXJsLFxuICAgIH0pO1xuXG4gICAgdGhpcy5jcmVhdGVDYW5hcnlBbGFybShjbG91ZGZyb250dXJsLCAnbWFpbicsICdtYWluICgvKScpO1xuICB9XG5cbiAgY3JlYXRlQUxCKHBvcnQ6IG51bWJlcikge1xuICAgIHRoaXMuYWxiID0gbmV3IEFwcGxpY2F0aW9uTG9hZEJhbGFuY2VyKHRoaXMsICdBcHBMb2FkQmFsYW5jZXInLCB7XG4gICAgICB2cGM6IHRoaXMudnBjLFxuICAgICAgaW50ZXJuZXRGYWNpbmc6IHRydWUsXG4gICAgfSk7XG5cbiAgICB0aGlzLmxpc3RlbmVyID0gdGhpcy5hbGIuYWRkTGlzdGVuZXIoJ0FwcE1haW5MaXN0ZW5lcicsIHsgcG9ydDogcG9ydCB9KTtcblxuICAgIGNvbnN0IGFjdGl2ZUNvbm5lY3Rpb25zQ291bnQgPSBuZXcgYXdzX2Nsb3Vkd2F0Y2guQWxhcm0oXG4gICAgICB0aGlzLFxuICAgICAgYGFjdGl2ZUNvbm5lY3Rpb25zQ291bnRgLFxuICAgICAge1xuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICAgICAgZGF0YXBvaW50c1RvQWxhcm06IDEsXG4gICAgICAgIHRocmVzaG9sZDogMTAsXG4gICAgICAgIG1ldHJpYzogdGhpcy5hbGIubWV0cmljQWN0aXZlQ29ubmVjdGlvbkNvdW50KCksXG4gICAgICAgIGNvbXBhcmlzb25PcGVyYXRvcjpcbiAgICAgICAgICBhd3NfY2xvdWR3YXRjaC5Db21wYXJpc29uT3BlcmF0b3IuTEVTU19USEFOX1RIUkVTSE9MRCxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgY29uc3QgYWN0aXZlQ29ubmVjdGlvbnNDb3VudFdpZGdldCA9IG5ldyBhd3NfY2xvdWR3YXRjaC5BbGFybVdpZGdldCh7XG4gICAgICBhbGFybTogYWN0aXZlQ29ubmVjdGlvbnNDb3VudCxcbiAgICAgIHRpdGxlOiBgYWN0aXZlQ29ubmVjdGlvbnNDb3VudGAsXG4gICAgfSk7XG5cbiAgICB0aGlzLmNsb3Vkd2F0Y2hXaWRnZXRzLnB1c2goYWN0aXZlQ29ubmVjdGlvbnNDb3VudFdpZGdldCk7XG5cbiAgICBjb25zdCB0b3RhbENvbm5lY3Rpb25zQ291bnQgPSBuZXcgYXdzX2Nsb3Vkd2F0Y2guQWxhcm0oXG4gICAgICB0aGlzLFxuICAgICAgYHRvdGFsQ29ubmVjdGlvbnNDb3VudGAsXG4gICAgICB7XG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAxLFxuICAgICAgICBkYXRhcG9pbnRzVG9BbGFybTogMSxcbiAgICAgICAgdGhyZXNob2xkOiAxMCxcbiAgICAgICAgbWV0cmljOiB0aGlzLmFsYi5tZXRyaWNSZXF1ZXN0Q291bnQoKSxcbiAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOlxuICAgICAgICAgIGF3c19jbG91ZHdhdGNoLkNvbXBhcmlzb25PcGVyYXRvci5MRVNTX1RIQU5fVEhSRVNIT0xELFxuICAgICAgfVxuICAgICk7XG5cbiAgICBjb25zdCB0b3RhbENvbm5lY3Rpb25zQ291bnRXaWRnZXQgPSBuZXcgYXdzX2Nsb3Vkd2F0Y2guQWxhcm1XaWRnZXQoe1xuICAgICAgYWxhcm06IHRvdGFsQ29ubmVjdGlvbnNDb3VudCxcbiAgICAgIHRpdGxlOiBgdG90YWxDb25uZWN0aW9uc0NvdW50YCxcbiAgICB9KTtcblxuICAgIHRoaXMuY2xvdWR3YXRjaFdpZGdldHMucHVzaCh0b3RhbENvbm5lY3Rpb25zQ291bnRXaWRnZXQpO1xuICB9XG5cbiAgY3JlYXRlV29ya2VycyhudW1iZXI6IG51bWJlciwgc2l6ZTogc3RyaW5nKSB7XG4gICAgY29uc3QgdXNlckRhdGEgPSBmcy5yZWFkRmlsZVN5bmMoJy4vbGliL3VzZXJkYXRhLnNoJywgJ3V0ZjgnKTtcbiAgICBjb25zdCBpZE9mQXpzID0gQXJyYXkuZnJvbShBcnJheSh0aGlzLnZwYy5hdmFpbGFiaWxpdHlab25lcy5sZW5ndGgpLmtleXMoKSk7XG4gICAgY29uc29sZS5sb2coXG4gICAgICBg8J+MjiBDcmVhdGluZyBFQzIgSW5zdGFuY2VzIGluICR7aWRPZkF6cy5sZW5ndGh9IEF2YWlsYWJpbGl0eSBab25lcyDwn4yOIGBcbiAgICApO1xuICAgIC8vIFVzZSBMYXRlc3QgQW1hem9uIExpbnV4IEltYWdlXG4gICAgY29uc3QgYW1pID0gbmV3IGF3c19lYzIuQW1hem9uTGludXhJbWFnZSh7XG4gICAgICBnZW5lcmF0aW9uOiBhd3NfZWMyLkFtYXpvbkxpbnV4R2VuZXJhdGlvbi5BTUFaT05fTElOVVhfMixcbiAgICAgIGNwdVR5cGU6IGF3c19lYzIuQW1hem9uTGludXhDcHVUeXBlLlg4Nl82NCxcbiAgICB9KTtcblxuICAgIGNvbnN0IGluc3RhbmNlcyA9IFtdO1xuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBudW1iZXI7IGluZGV4KyspIHtcbiAgICAgIGluc3RhbmNlcy5wdXNoKFxuICAgICAgICB0aGlzLm5ld0luc3RhbmNlKFxuICAgICAgICAgIGBXb3JrZXIke2luZGV4ICsgMX1gLFxuICAgICAgICAgIGFtaSxcbiAgICAgICAgICBzaXplLFxuICAgICAgICAgIHVzZXJEYXRhLFxuICAgICAgICAgIGlkT2ZBenNbKGluZGV4ICsgMSkgJSBpZE9mQXpzLmxlbmd0aF1cbiAgICAgICAgKVxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIGluc3RhbmNlcztcbiAgfVxuXG4gIGRlZmF1bHRSb3VuZFJvYmluZyhpbnN0YW5jZXM6IGF3c19lYzIuSW5zdGFuY2VbXSkge1xuICAgIGxldCB0YXJnZXRzOiBJQXBwbGljYXRpb25Mb2FkQmFsYW5jZXJUYXJnZXRbXSA9IFtdO1xuICAgIGluc3RhbmNlcy5mb3JFYWNoKChpbnN0YW5jZSkgPT4ge1xuICAgICAgdGFyZ2V0cy5wdXNoKG5ldyBJbnN0YW5jZVRhcmdldChpbnN0YW5jZSwgODApKTtcbiAgICB9KTtcbiAgICBjb25zb2xlLmxvZyhgTmV3IHZpcnR1YWwgc2hhcmQgZm9yIGFsbCBWTXMgYXNzaWduZWQgdG8gQUxCIGF0IC9gKTtcbiAgICB0aGlzLmFkZFRhcmdldHNUb0FMQignUm91bmRSb2JpbicsIHRhcmdldHMsIDEwMCwgZmFsc2UpO1xuICB9XG5cbiAgbmV3SW5zdGFuY2UoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIG1hY2hpbmVJbWFnZTogYXdzX2VjMi5JTWFjaGluZUltYWdlLFxuICAgIHNpemU6IHN0cmluZyxcbiAgICB1c2VyZGF0YTogc3RyaW5nLFxuICAgIGF6SWQ6IG51bWJlclxuICApIHtcbiAgICBjb25zdCBpbnN0YW5jZSA9IG5ldyBhd3NfZWMyLkluc3RhbmNlKHRoaXMsIG5hbWUsIHtcbiAgICAgIHZwYzogdGhpcy52cGMsXG4gICAgICBpbnN0YW5jZVR5cGU6IG5ldyBhd3NfZWMyLkluc3RhbmNlVHlwZShzaXplKSxcbiAgICAgIG1hY2hpbmVJbWFnZTogbWFjaGluZUltYWdlLFxuICAgICAgYmxvY2tEZXZpY2VzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBkZXZpY2VOYW1lOiAnL2Rldi9zZGExJyxcbiAgICAgICAgICB2b2x1bWU6IGF3c19lYzIuQmxvY2tEZXZpY2VWb2x1bWUuZWJzKDUwLCB7XG4gICAgICAgICAgICB2b2x1bWVUeXBlOiBhd3NfZWMyLkVic0RldmljZVZvbHVtZVR5cGUuR1AzLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIHVzZXJEYXRhOiBhd3NfZWMyLlVzZXJEYXRhLmN1c3RvbSh1c2VyZGF0YSksXG4gICAgICBhdmFpbGFiaWxpdHlab25lOiB0aGlzLmF2YWlsYWJpbGl0eVpvbmVzW2F6SWRdLFxuICAgICAgdXNlckRhdGFDYXVzZXNSZXBsYWNlbWVudDogdHJ1ZSxcbiAgICB9KTtcbiAgICBpbnN0YW5jZS5jb25uZWN0aW9ucy5hbGxvd0Zyb20odGhpcy5hbGIsIGF3c19lYzIuUG9ydC50Y3AoODApKTtcbiAgICBpbnN0YW5jZS5yb2xlLmFkZE1hbmFnZWRQb2xpY3koXG4gICAgICBhd3NfaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKFxuICAgICAgICAnQW1hem9uU1NNTWFuYWdlZEluc3RhbmNlQ29yZSdcbiAgICAgIClcbiAgICApO1xuICAgIGluc3RhbmNlLnJvbGUuYWRkTWFuYWdlZFBvbGljeShcbiAgICAgIG5ldyBhd3NfaWFtLk1hbmFnZWRQb2xpY3kodGhpcywgbmFtZSArICdyZWFkVGFncycsIHtcbiAgICAgICAgc3RhdGVtZW50czogW1xuICAgICAgICAgIG5ldyBhd3NfaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICBlZmZlY3Q6IEVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgIGFjdGlvbnM6IFsnZWMyOkRlc2NyaWJlVGFncyddLFxuICAgICAgICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBuZXcgYXdzX2lhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgZWZmZWN0OiBFZmZlY3QuQUxMT1csXG4gICAgICAgICAgICBhY3Rpb25zOiBbJ2VjMjpEZXNjcmliZUluc3RhbmNlcyddLFxuICAgICAgICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBuZXcgYXdzX2lhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgZWZmZWN0OiBFZmZlY3QuQUxMT1csXG4gICAgICAgICAgICBhY3Rpb25zOiBbJ2VsYXN0aWNsb2FkYmFsYW5jaW5nOkRlc2NyaWJlVGFyZ2V0R3JvdXBzJ10sXG4gICAgICAgICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIG5ldyBhd3NfaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICBlZmZlY3Q6IEVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgIGFjdGlvbnM6IFsnZWxhc3RpY2xvYWRiYWxhbmNpbmc6RGVzY3JpYmVMb2FkQmFsYW5jZXJzJ10sXG4gICAgICAgICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgICAgICAgIH0pLFxuICAgICAgICBdLFxuICAgICAgfSlcbiAgICApO1xuICAgIHJldHVybiBpbnN0YW5jZTtcbiAgfVxuXG4gIGNyZWF0ZUdyb3VwcyhcbiAgICBpbnN0YW5jZXM6IGF3c19lYzIuSW5zdGFuY2VbXSxcbiAgICBvcHRpb25zOiB7IHNoYXJkaW5nOiB7IGVuYWJsZWQ6IGJvb2xlYW47IHNodWZmbGU6IGJvb2xlYW4gfSB9XG4gICkge1xuICAgIHZhciBudW1iZXJPZkdyb3VwcyA9IDA7XG4gICAgaWYgKG9wdGlvbnMuc2hhcmRpbmcuZW5hYmxlZCkge1xuICAgICAgY29uc3Qgc2hhcmRzOiBbYXdzX2VjMi5JbnN0YW5jZSwgYXdzX2VjMi5JbnN0YW5jZV1bXSA9IFtdO1xuICAgICAgaWYgKG9wdGlvbnMuc2hhcmRpbmcuc2h1ZmZsZSkge1xuICAgICAgICBmb3IgKGxldCBhID0gMDsgYSA8IGluc3RhbmNlcy5sZW5ndGg7IGErKykge1xuICAgICAgICAgIGZvciAobGV0IGIgPSBhICsgMTsgYiA8IGluc3RhbmNlcy5sZW5ndGg7IGIrKykge1xuICAgICAgICAgICAgbnVtYmVyT2ZHcm91cHMgKz0gMTtcbiAgICAgICAgICAgIHNoYXJkcy5wdXNoKFtpbnN0YW5jZXNbYV0sIGluc3RhbmNlc1tiXV0pO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICAgIGBOZXcgZ3JvdXAgIyR7bnVtYmVyT2ZHcm91cHN9IDogJyR7aW5zdGFuY2VzW2FdLm5vZGUuaWR9JyBhbmQgJyR7aW5zdGFuY2VzW2JdLm5vZGUuaWR9J2BcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGxldCBhID0gMDsgYSA8IGluc3RhbmNlcy5sZW5ndGg7IGEgPSBhICsgMikge1xuICAgICAgICAgIG51bWJlck9mR3JvdXBzICs9IDE7XG4gICAgICAgICAgc2hhcmRzLnB1c2goW2luc3RhbmNlc1thXSwgaW5zdGFuY2VzW2EgKyAxXV0pO1xuICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgYE5ldyBncm91cCAjJHtudW1iZXJPZkdyb3Vwc30gOiAke2luc3RhbmNlc1thXS5ub2RlLmlkfSBhbmQgJHtcbiAgICAgICAgICAgICAgaW5zdGFuY2VzW2EgKyAxXS5ub2RlLmlkXG4gICAgICAgICAgICB9YFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc2hhcmRzLmZvckVhY2goKHNoYXJkLCBpbmRleCkgPT4ge1xuICAgICAgICBjb25zdCBzaGFyZE5hbWUgPSBgJHtzaGFyZFswXS5ub2RlLmlkfS0ke3NoYXJkWzFdLm5vZGUuaWR9YDtcbiAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgYE5ldyB2aXJ0dWFsIHNoYXJkOiAke3NoYXJkTmFtZX0gYXNzaWduZWQgdG8gQUxCIGF0IC8/JHtcbiAgICAgICAgICAgIHRoaXMuc3RyaW5nUGFyYW1ldGVyXG4gICAgICAgICAgfT0ke2luZGV4ICsgMX1gXG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IFtcbiAgICAgICAgICBuZXcgSW5zdGFuY2VUYXJnZXQoc2hhcmRbMF0sIDgwKSxcbiAgICAgICAgICBuZXcgSW5zdGFuY2VUYXJnZXQoc2hhcmRbMV0sIDgwKSxcbiAgICAgICAgXTtcbiAgICAgICAgdGhpcy5hZGRUYXJnZXRzVG9BTEIoc2hhcmROYW1lLCB0YXJnZXQsIGluZGV4ICsgMSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zdGFuY2VzLmZvckVhY2goKGluc3RhbmNlKSA9PiB7XG4gICAgICAgIG51bWJlck9mR3JvdXBzICs9IDE7XG4gICAgICAgIGNvbnN0IHNoYXJkTmFtZSA9IGBlYzItJHtpbnN0YW5jZS5ub2RlLmlkfWA7XG4gICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgIGBOZXcgdmlydHVhbCBzaGFyZDogJHtzaGFyZE5hbWV9IGFzc2lnbmVkIHRvIEFMQiBhdCAvPyR7dGhpcy5zdHJpbmdQYXJhbWV0ZXJ9PSR7bnVtYmVyT2ZHcm91cHN9YFxuICAgICAgICApO1xuICAgICAgICB0aGlzLmFkZFRhcmdldHNUb0FMQihcbiAgICAgICAgICBzaGFyZE5hbWUsXG4gICAgICAgICAgW25ldyBJbnN0YW5jZVRhcmdldChpbnN0YW5jZSwgODApXSxcbiAgICAgICAgICBudW1iZXJPZkdyb3Vwc1xuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYFxcbuKZpu+4jyBUb3RhbCBvZiAke2luc3RhbmNlcy5sZW5ndGh9IGhvc3RzICgke2luc3RhbmNlc1swXS5pbnN0YW5jZS5pbnN0YW5jZVR5cGV9KSBhbmQgJHtudW1iZXJPZkdyb3Vwc30gdmlydHVhbCBzaGFyZHMg4pmm77iPYFxuICAgICk7XG5cbiAgICBjb25zdCBtYXhCbGFzdFJhZGl1cyA9ICgxMDAgLyBudW1iZXJPZkdyb3VwcykudG9GaXhlZCgyKTtcbiAgICBjb25zdCBtaW5CbGFzdFJhZGl1cyA9ICgxMDAgLyBpbnN0YW5jZXMubGVuZ3RoKS50b0ZpeGVkKDIpO1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgb3B0aW9ucy5zaGFyZGluZy5zaHVmZmxlXG4gICAgICAgID8gYPCfkqUgQmxhc3QgcmFkaXVzID0gJHttYXhCbGFzdFJhZGl1c30lIPCfkqVcXG5gXG4gICAgICAgIDogYPCfkqUgQmxhc3QgcmFkaXVzID0gJHttaW5CbGFzdFJhZGl1c30lLSR7bWF4Qmxhc3RSYWRpdXN9JSAoU2h1ZmZsZSBkaXNhYmxlZCkg8J+SpVxcbmBcbiAgICApO1xuICAgIHJldHVybiBudW1iZXJPZkdyb3VwcztcbiAgfVxuXG4gIGFkZFRhcmdldHNUb0FMQihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgdGFyZ2V0czogSUFwcGxpY2F0aW9uTG9hZEJhbGFuY2VyVGFyZ2V0W10sXG4gICAgcHJpb3JpdHk6IG51bWJlcixcbiAgICBxdWVyeVN0cmluZ0VuYWJsZWQ/OiBib29sZWFuXG4gICkge1xuICAgIGNvbnN0IHRhcmdldEdyb3VwID0gbmV3IEFwcGxpY2F0aW9uVGFyZ2V0R3JvdXAodGhpcywgbmFtZSwge1xuICAgICAgdnBjOiB0aGlzLnZwYyxcbiAgICAgIHBvcnQ6IDgwLFxuICAgICAgdGFyZ2V0VHlwZTogVGFyZ2V0VHlwZS5JTlNUQU5DRSxcbiAgICAgIHRhcmdldHM6IHRhcmdldHMsXG4gICAgICBoZWFsdGhDaGVjazoge1xuICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICBpbnRlcnZhbDogRHVyYXRpb24uc2Vjb25kcyg1KSxcbiAgICAgICAgcGF0aDogJy8nLFxuICAgICAgICBwcm90b2NvbDogUHJvdG9jb2wuSFRUUCxcbiAgICAgICAgdGltZW91dDogRHVyYXRpb24uc2Vjb25kcygyKSxcbiAgICAgICAgaGVhbHRoeVRocmVzaG9sZENvdW50OiAyLFxuICAgICAgICB1bmhlYWx0aHlUaHJlc2hvbGRDb3VudDogMixcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgcXVlcnlTdHJpbmdFbmFibGVkID0gcXVlcnlTdHJpbmdFbmFibGVkID8/IHRydWU7XG5cbiAgICBjb25zdCBxdWVyeVN0cmluZ3MgPSB7IGtleTogdGhpcy5zdHJpbmdQYXJhbWV0ZXIsIHZhbHVlOiBgJHtwcmlvcml0eX1gIH07XG5cbiAgICBpZiAocXVlcnlTdHJpbmdFbmFibGVkKSB7XG4gICAgICB0aGlzLmxpc3RlbmVyLmFkZEFjdGlvbihuYW1lLCB7XG4gICAgICAgIGFjdGlvbjogTGlzdGVuZXJBY3Rpb24uZm9yd2FyZChbdGFyZ2V0R3JvdXBdKSxcbiAgICAgICAgY29uZGl0aW9uczogW0xpc3RlbmVyQ29uZGl0aW9uLnF1ZXJ5U3RyaW5ncyhbcXVlcnlTdHJpbmdzXSldLFxuICAgICAgICBwcmlvcml0eTogcHJpb3JpdHksXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5saXN0ZW5lci5hZGRBY3Rpb24obmFtZSwge1xuICAgICAgICBhY3Rpb246IExpc3RlbmVyQWN0aW9uLmZvcndhcmQoW3RhcmdldEdyb3VwXSksXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBFbmRwb2ludCBmb3IgdGhlIHNwZWNpZmljIHRhcmdldCBncm91cCB3aXRoIHRoZSBzcGVjaWZpYyBxdWVyeSBzdHJpbmdcbiAgICBjb25zdCB1cmwgPSBgaHR0cDovLyR7dGhpcy5hbGIubG9hZEJhbGFuY2VyRG5zTmFtZX0vPyR7dGhpcy5zdHJpbmdQYXJhbWV0ZXJ9PSR7cHJpb3JpdHl9YDtcbiAgICBuZXcgQ2ZuT3V0cHV0KHRoaXMsIGBMb2FkQmFsYW5jZXJFbmRwb2ludC0ke25hbWV9YCwge1xuICAgICAgdmFsdWU6IHVybCxcbiAgICB9KTtcblxuICAgIHRoaXMuY3JlYXRlQ2FuYXJ5QWxhcm0oXG4gICAgICB1cmwsXG4gICAgICBgJHtwcmlvcml0eX1gLFxuICAgICAgYC8/JHt0aGlzLnN0cmluZ1BhcmFtZXRlcn09JHtwcmlvcml0eX1gXG4gICAgKTtcbiAgfVxuXG4gIGNyZWF0ZUNhbmFyeUFsYXJtKHVybDogc3RyaW5nLCBpZDogc3RyaW5nLCBDV3RpdGxlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBoYW5kbGVyID0gYFxuICAgIGNvbnN0IHN5bnRoZXRpY3MgPSByZXF1aXJlKCdTeW50aGV0aWNzJyk7XG4gICAgY29uc3QgbG9nID0gcmVxdWlyZSgnU3ludGhldGljc0xvZ2dlcicpO1xuICAgIFxuICAgIGNvbnN0IHBhZ2VMb2FkQmx1ZXByaW50ID0gYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IHVybCA9ICcke3VybH0nO1xuXG4gICAgY29uc3QgcGFnZSA9IGF3YWl0IHN5bnRoZXRpY3MuZ2V0UGFnZSgpO1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcGFnZS5nb3RvKHVybCwgeyB3YWl0VW50aWw6ICdkb21jb250ZW50bG9hZGVkJywgdGltZW91dDogMzAwMDAgfSk7XG4gICAgLy8gV2FpdCBmb3IgcGFnZSB0byByZW5kZXIuIEluY3JlYXNlIG9yIGRlY3JlYXNlIHdhaXQgdGltZSBiYXNlZCBvbiBlbmRwb2ludCBiZWluZyBtb25pdG9yZWQuXG4gICAgYXdhaXQgcGFnZS53YWl0Rm9yKDE1MDAwKTtcbiAgICAvLyBUaGlzIHdpbGwgdGFrZSBhIHNjcmVlbnNob3QgdGhhdCB3aWxsIGJlIGluY2x1ZGVkIGluIHRlc3Qgb3V0cHV0IGFydGlmYWN0cy5cbiAgICBhd2FpdCBzeW50aGV0aWNzLnRha2VTY3JlZW5zaG90KCdsb2FkZWQnLCAnbG9hZGVkJyk7XG4gICAgY29uc3QgcGFnZVRpdGxlID0gYXdhaXQgcGFnZS50aXRsZSgpO1xuICAgIGxvZy5pbmZvKCdQYWdlIHRpdGxlOiAnICsgcGFnZVRpdGxlKTtcbiAgICBpZiAocmVzcG9uc2Uuc3RhdHVzKCkgIT09IDIwMCkge1xuICAgICAgdGhyb3cgJ0ZhaWxlZCB0byBsb2FkIHBhZ2UhJztcbiAgICB9XG4gICAgfTtcblxuICAgIGV4cG9ydHMuaGFuZGxlciA9IGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBhd2FpdCBwYWdlTG9hZEJsdWVwcmludCgpO1xuICAgIH07XG4gICAgYDtcblxuICAgIGNvbnN0IGNhbmFyeSA9IG5ldyBhd3Nfc3ludGhldGljc19hbHBoYS5DYW5hcnkodGhpcywgYGNhbmFyeS0ke2lkfWAsIHtcbiAgICAgIHNjaGVkdWxlOiBhd3Nfc3ludGhldGljc19hbHBoYS5TY2hlZHVsZS5yYXRlKER1cmF0aW9uLm1pbnV0ZXMoNSkpLFxuICAgICAgdGVzdDogYXdzX3N5bnRoZXRpY3NfYWxwaGEuVGVzdC5jdXN0b20oe1xuICAgICAgICBjb2RlOiBhd3Nfc3ludGhldGljc19hbHBoYS5Db2RlLmZyb21JbmxpbmUoaGFuZGxlciksXG4gICAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgICAgIH0pLFxuICAgICAgcnVudGltZTogYXdzX3N5bnRoZXRpY3NfYWxwaGEuUnVudGltZS5TWU5USEVUSUNTX05PREVKU19QVVBQRVRFRVJfM180LFxuICAgIH0pO1xuXG4gICAgY29uc3QgY2FuYXJ5QWxhcm0gPSBuZXcgYXdzX2Nsb3Vkd2F0Y2guQWxhcm0odGhpcywgYGFsYXJtLSR7aWR9YCwge1xuICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDUsXG4gICAgICB0aHJlc2hvbGQ6IDkwLFxuICAgICAgbWV0cmljOiBjYW5hcnkubWV0cmljU3VjY2Vzc1BlcmNlbnQoeyBwZXJpb2Q6IER1cmF0aW9uLnNlY29uZHMoNjApIH0pLFxuICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOiBhd3NfY2xvdWR3YXRjaC5Db21wYXJpc29uT3BlcmF0b3IuTEVTU19USEFOX1RIUkVTSE9MRCxcbiAgICB9KTtcblxuICAgIGNvbnN0IGN3V2lkZ2V0ID0gbmV3IGF3c19jbG91ZHdhdGNoLkFsYXJtV2lkZ2V0KHtcbiAgICAgIGFsYXJtOiBjYW5hcnlBbGFybSxcbiAgICAgIHRpdGxlOiBDV3RpdGxlLFxuICAgIH0pO1xuXG4gICAgdGhpcy5jbG91ZHdhdGNoV2lkZ2V0cy5wdXNoKGN3V2lkZ2V0KTtcbiAgfVxufVxuIl19