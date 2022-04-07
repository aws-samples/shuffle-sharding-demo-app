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
        this.listener.addAction('DefaultAction', {
            action: aws_elasticloadbalancingv2_1.ListenerAction.fixedResponse(400, {
                messageBody: 'Invalid Request. Please include specific key',
            }),
        });
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
    addTargetsToALB(name, targets, priority) {
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
        const queryStrings = { key: this.stringParameter, value: `${priority}` };
        this.listener.addAction(name, {
            action: aws_elasticloadbalancingv2_1.ListenerAction.forward([targetGroup]),
            conditions: [aws_elasticloadbalancingv2_1.ListenerCondition.queryStrings([queryStrings])],
            priority: priority,
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VtbWl0MjAyMi1kZW1vLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic3VtbWl0MjAyMi1kZW1vLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZDQVNxQjtBQUNyQixzRUFBc0U7QUFDdEUsK0RBUW9DO0FBQ3BDLCtFQUFnRTtBQUNoRSx1RkFTZ0Q7QUFDaEQsdUdBQWdGO0FBQ2hGLGlEQUE2QztBQUU3Qyx5QkFBeUI7QUFFekIsTUFBYSw2QkFBOEIsU0FBUSxtQkFBSztJQU90RCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQWtCO1FBQzFELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRmpCLG9CQUFlLEdBQUcsUUFBUSxDQUFDO1FBSWxDLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxxQkFBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFdkQsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksNEJBQWMsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRTtZQUNsRSxhQUFhLEVBQUUsMkJBQTJCO1NBQzNDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxpQkFBaUIsR0FBRyxFQUFFLENBQUM7UUFFNUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUVuQixNQUFNLFNBQVMsR0FBdUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFFekUsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUU7WUFDbEQsUUFBUSxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO1NBQzNDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxVQUFVLENBQUMsY0FBYyxD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LE9BQU8sRUFBRSxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsK0JBQStCO1NBQ3RFLENBQUMsQ0FBQztRQUVILE1BQU0sV0FBVyxHQUFHLElBQUksNEJBQWMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUU7WUFDaEUsaUJBQWlCLEVBQUUsQ0FBQztZQUNwQixTQUFTLEVBQUUsRUFBRTtZQUNiLE1BQU0sRUFBRSxNQUFNLENBQUMsb0JBQW9CLENBQUMsRUFBRSxNQUFNLEVBQUUsc0JBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUNyRSxrQkFBa0IsRUFBRSw0QkFBYyxDQUFDLGtCQUFrQixDQUFDLG1CQUFtQjtTQUMxRSxDQUFDLENBQUM7UUFFSCxNQUFNLFFBQVEsR0FBRyxJQUFJLDRCQUFjLENBQUMsV0FBVyxDQUFDO1lBQzlDLEtBQUssRUFBRSxXQUFXO1lBQ2xCLEtBQUssRUFBRSxPQUFPO1NBQ2YsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN4QyxDQUFDO0NBQ0Y7QUE1WEQsc0VBNFhDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgYXdzX2Nsb3VkZnJvbnQsXG4gIGF3c19jbG91ZHdhdGNoLFxuICBhd3NfZWMyLFxuICBhd3NfaWFtLFxuICBDZm5PdXRwdXQsXG4gIER1cmF0aW9uLFxuICBTdGFjayxcbiAgU3RhY2tQcm9wcyxcbn0gZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgYXdzX3N5bnRoZXRpY3NfYWxwaGEgZnJvbSAnQGF3cy1jZGsvYXdzLXN5bnRoZXRpY3MtYWxwaGEnO1xuaW1wb3J0IHtcbiAgQ2FjaGVQb2xpY3ksXG4gIEZ1bmN0aW9uLFxuICBGdW5jdGlvbkNvZGUsXG4gIEZ1bmN0aW9uRXZlbnRUeXBlLFxuICBPcmlnaW5Qcm90b2NvbFBvbGljeSxcbiAgT3JpZ2luUmVxdWVzdFBvbGljeSxcbiAgT3JpZ2luUmVxdWVzdFF1ZXJ5U3RyaW5nQmVoYXZpb3IsXG59IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZGZyb250JztcbmltcG9ydCB7IEh0dHBPcmlnaW4gfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udC1vcmlnaW5zJztcbmltcG9ydCB7XG4gIEFwcGxpY2F0aW9uTGlzdGVuZXIsXG4gIEFwcGxpY2F0aW9uTG9hZEJhbGFuY2VyLFxuICBBcHBsaWNhdGlvblRhcmdldEdyb3VwLFxuICBJQXBwbGljYXRpb25Mb2FkQmFsYW5jZXJUYXJnZXQsXG4gIExpc3RlbmVyQWN0aW9uLFxuICBMaXN0ZW5lckNvbmRpdGlvbixcbiAgUHJvdG9jb2wsXG4gIFRhcmdldFR5cGUsXG59IGZyb20gJ2F3cy1jZGstbGliL2F3cy1lbGFzdGljbG9hZGJhbGFuY2luZ3YyJztcbmltcG9ydCB7IEluc3RhbmNlVGFyZ2V0IH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWVsYXN0aWNsb2FkYmFsYW5jaW5ndjItdGFyZ2V0cyc7XG5pbXBvcnQgeyBFZmZlY3QgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuXG5leHBvcnQgY2xhc3MgU2h1ZmZsZVNoYXJkaW5nRGVtb1N1bW1pdDIwMjIgZXh0ZW5kcyBTdGFjayB7XG4gIGxpc3RlbmVyOiBBcHBsaWNhdGlvbkxpc3RlbmVyO1xuICBhbGI6IEFwcGxpY2F0aW9uTG9hZEJhbGFuY2VyO1xuICBjbG91ZHdhdGNoRGFzaGJvYXJkOiBhd3NfY2xvdWR3YXRjaC5EYXNoYm9hcmQ7XG4gIGNsb3Vkd2F0Y2hXaWRnZXRzOiBhd3NfY2xvdWR3YXRjaC5BbGFybVdpZGdldFtdO1xuICByZWFkb25seSB2cGM6IGF3c19lYzIuVnBjO1xuICByZWFkb25seSBzdHJpbmdQYXJhbWV0ZXIgPSAnbnVtYmVyJztcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICB0aGlzLnZwYyA9IG5ldyBhd3NfZWMyLlZwYyh0aGlzLCAndnBjJywgeyBtYXhBenM6IDMgfSk7XG5cbiAgICB0aGlzLmNsb3Vkd2F0Y2hEYXNoYm9hcmQgPSBuZXcgYXdzX2Nsb3Vkd2F0Y2guRGFzaGJvYXJkKHRoaXMsICdjdycsIHtcbiAgICAgIGRhc2hib2FyZE5hbWU6ICdTaHVmZmxlU2hhcmRpbmdTdW1taXQyMDIyJyxcbiAgICB9KTtcbiAgICB0aGlzLmNsb3Vkd2F0Y2hXaWRnZXRzID0gW107XG5cbiAgICB0aGlzLmNyZWF0ZUFMQig4MCk7XG5cbiAgICBjb25zdCBpbnN0YW5jZXM6IGF3c19lYzIuSW5zdGFuY2VbXSA9IHRoaXMuY3JlYXRlV29ya2Vycyg0LCAndDMubWVkaXVtJyk7XG5cbiAgICBjb25zdCBudW1iZXJPZkdyb3VwcyA9IHRoaXMuY3JlYXRlR3JvdXBzKGluc3RhbmNlcywge1xuICAgICAgc2hhcmRpbmc6IHsgZW5hYmxlZDogdHJ1ZSwgc2h1ZmZsZTogdHJ1ZSB9LFxuICAgIH0pO1xuICAgIHRoaXMuY3JlYXRlRGlzdChudW1iZXJPZkdyb3Vwcyk7XG5cbiAgICB0aGlzLmNsb3Vkd2F0Y2hEYXNoYm9hcmQuYWRkV2lkZ2V0cyguLi50aGlzLmNsb3Vkd2F0Y2hXaWRnZXRzKTtcblxuICAgIG5ldyBDZm5PdXRwdXQodGhpcywgJ0Nsb3Vkd2F0Y2ggRGFzaGJvYXJkIFVSTCcsIHtcbiAgICAgIHZhbHVlOiBgaHR0cHM6Ly9jb25zb2xlLmF3cy5hbWF6b24uY29tL2Nsb3Vkd2F0Y2gvaG9tZT9yZWdpb249JHtwcm9jZXNzLmVudi5DREtfREVGQVVMVF9SRUdJT059I2Rhc2hib2FyZHM6bmFtZT1TaHVmZmxlU2hhcmRpbmdTdW1taXQyMDIyYCxcbiAgICB9KTtcbiAgfVxuXG4gIGNyZWF0ZURpc3QobnVtYmVyOiBudW1iZXIpIHtcbiAgICBjb25zdCByZWRpcmVjdEZ1bmN0aW9uID0gbmV3IEZ1bmN0aW9uKHRoaXMsICdyZWRpcmVjdExvZ2ljJywge1xuICAgICAgY29kZTogRnVuY3Rpb25Db2RlLmZyb21JbmxpbmUoXG4gICAgICAgIGBmdW5jdGlvbiBoYW5kbGVyKGV2ZW50KSB7XG4gICAgICAgIHZhciByZXF1ZXN0ID0gZXZlbnQucmVxdWVzdDtcbiAgICAgICAgdmFyIHF1ZXJ5c3RyaW5nID0gcmVxdWVzdC5xdWVyeXN0cmluZztcbiAgICAgICAgaWYgKCFxdWVyeXN0cmluZ1snJHt0aGlzLnN0cmluZ1BhcmFtZXRlcn0nXSl7XG4gICAgICAgICAgdmFyIG5ld1VyaTtcbiAgICAgICAgICB2YXIgcmFuZG9ta2V5ID0gZ2V0Um5kSW50ZWdlcigxLCAke251bWJlcn0pO1xuICAgICAgICAgIG5ld1VyaSA9ICcvPyR7dGhpcy5zdHJpbmdQYXJhbWV0ZXJ9PScgKyByYW5kb21rZXk7XG4gICAgICAgICAgdmFyIHJlc3BvbnNlID0ge1xuICAgICAgICAgICAgc3RhdHVzQ29kZTogMzAyLFxuICAgICAgICAgICAgc3RhdHVzRGVzY3JpcHRpb246ICdGb3VuZCcsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgIGxvY2F0aW9uOiB7IHZhbHVlOiBuZXdVcmkgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfTtcbiAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcXVlc3Q7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGdldFJuZEludGVnZXIobWluLCBtYXgpIHtcbiAgICAgICAgbWluID0gTWF0aC5jZWlsKG1pbik7IC8vIHJvdW5kcyBhIG51bWJlciB1cCB0byB0aGUgbmV4dCBsYXJnZXN0IGludGVnZXJcbiAgICAgICAgbWF4ID0gTWF0aC5mbG9vcihtYXgpOyAvLyByZXR1cm5zIHRoZSBsYXJnZXN0IGludGVnZXIgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIGEgZ2l2ZW4gbnVtYmVyXG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkgKyBtaW4pOyAvL1RoZSBtYXhpbXVtIGlzIGluY2x1c2l2ZSBhbmQgdGhlIG1pbmltdW0gaXMgaW5jbHVzaXZlXG4gICAgICB9XG5gXG4gICAgICApLFxuICAgICAgZnVuY3Rpb25OYW1lOiAncmVkaXJlY3RUb1JhbmRvbVNoYXJkJyxcbiAgICAgIGNvbW1lbnQ6IGBGdW5jdGlvbiB0byByZWRpcmVjdCBhbGwgaW5jb21pbmcgcmVxdWVzdHMgdG8gLz8ke3RoaXMuc3RyaW5nUGFyYW1ldGVyfT0gKyBSYW5kb20gTnVtYmVyIChpLmU6IC8/JHt0aGlzLnN0cmluZ1BhcmFtZXRlcn09MSlgLFxuICAgIH0pO1xuXG4gICAgY29uc3QgY2xvdWRmcm9udCA9IG5ldyBhd3NfY2xvdWRmcm9udC5EaXN0cmlidXRpb24odGhpcywgJ0Nsb3VkRnJvbnQnLCB7XG4gICAgICBkZWZhdWx0QmVoYXZpb3I6IHtcbiAgICAgICAgb3JpZ2luOiBuZXcgSHR0cE9yaWdpbih0aGlzLmFsYi5sb2FkQmFsYW5jZXJEbnNOYW1lLCB7XG4gICAgICAgICAgcHJvdG9jb2xQb2xpY3k6IE9yaWdpblByb3RvY29sUG9saWN5LkhUVFBfT05MWSxcbiAgICAgICAgfSksXG4gICAgICAgIGZ1bmN0aW9uQXNzb2NpYXRpb25zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZXZlbnRUeXBlOiBGdW5jdGlvbkV2ZW50VHlwZS5WSUVXRVJfUkVRVUVTVCxcbiAgICAgICAgICAgIGZ1bmN0aW9uOiByZWRpcmVjdEZ1bmN0aW9uLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIG9yaWdpblJlcXVlc3RQb2xpY3k6IHtcbiAgICAgICAgICBvcmlnaW5SZXF1ZXN0UG9saWN5SWQ6IG5ldyBPcmlnaW5SZXF1ZXN0UG9saWN5KHRoaXMsICdwb2xpY3knLCB7XG4gICAgICAgICAgICBxdWVyeVN0cmluZ0JlaGF2aW9yOiBPcmlnaW5SZXF1ZXN0UXVlcnlTdHJpbmdCZWhhdmlvci5hbGwoKSxcbiAgICAgICAgICB9KS5vcmlnaW5SZXF1ZXN0UG9saWN5SWQsXG4gICAgICAgIH0sXG4gICAgICAgIGNhY2hlUG9saWN5OiBDYWNoZVBvbGljeS5DQUNISU5HX0RJU0FCTEVELFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGNsb3VkZnJvbnR1cmwgPSBgaHR0cHM6Ly8ke2Nsb3VkZnJvbnQuZGlzdHJpYnV0aW9uRG9tYWluTmFtZX1gO1xuICAgIG5ldyBDZm5PdXRwdXQodGhpcywgYENsb3VkZnJvbnRVUkxgLCB7XG4gICAgICB2YWx1ZTogY2xvdWRmcm9udHVybCxcbiAgICB9KTtcblxuICAgIHRoaXMuY3JlYXRlQ2FuYXJ5QWxhcm0oY2xvdWRmcm9udHVybCwgJ21haW4nLCAnbWFpbiAoLyknKTtcbiAgfVxuXG4gIGNyZWF0ZUFMQihwb3J0OiBudW1iZXIpIHtcbiAgICB0aGlzLmFsYiA9IG5ldyBBcHBsaWNhdGlvbkxvYWRCYWxhbmNlcih0aGlzLCAnQXBwTG9hZEJhbGFuY2VyJywge1xuICAgICAgdnBjOiB0aGlzLnZwYyxcbiAgICAgIGludGVybmV0RmFjaW5nOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgdGhpcy5saXN0ZW5lciA9IHRoaXMuYWxiLmFkZExpc3RlbmVyKCdBcHBNYWluTGlzdGVuZXInLCB7IHBvcnQ6IHBvcnQgfSk7XG5cbiAgICB0aGlzLmxpc3RlbmVyLmFkZEFjdGlvbignRGVmYXVsdEFjdGlvbicsIHtcbiAgICAgIGFjdGlvbjogTGlzdGVuZXJBY3Rpb24uZml4ZWRSZXNwb25zZSg0MDAsIHtcbiAgICAgICAgbWVzc2FnZUJvZHk6ICdJbnZhbGlkIFJlcXVlc3QuIFBsZWFzZSBpbmNsdWRlIHNwZWNpZmljIGtleScsXG4gICAgICB9KSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGFjdGl2ZUNvbm5lY3Rpb25zQ291bnQgPSBuZXcgYXdzX2Nsb3Vkd2F0Y2guQWxhcm0oXG4gICAgICB0aGlzLFxuICAgICAgYGFjdGl2ZUNvbm5lY3Rpb25zQ291bnRgLFxuICAgICAge1xuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICAgICAgZGF0YXBvaW50c1RvQWxhcm06IDEsXG4gICAgICAgIHRocmVzaG9sZDogMTAsXG4gICAgICAgIG1ldHJpYzogdGhpcy5hbGIubWV0cmljQWN0aXZlQ29ubmVjdGlvbkNvdW50KCksXG4gICAgICAgIGNvbXBhcmlzb25PcGVyYXRvcjpcbiAgICAgICAgICBhd3NfY2xvdWR3YXRjaC5Db21wYXJpc29uT3BlcmF0b3IuTEVTU19USEFOX1RIUkVTSE9MRCxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgY29uc3QgYWN0aXZlQ29ubmVjdGlvbnNDb3VudFdpZGdldCA9IG5ldyBhd3NfY2xvdWR3YXRjaC5BbGFybVdpZGdldCh7XG4gICAgICBhbGFybTogYWN0aXZlQ29ubmVjdGlvbnNDb3VudCxcbiAgICAgIHRpdGxlOiBgYWN0aXZlQ29ubmVjdGlvbnNDb3VudGAsXG4gICAgfSk7XG5cbiAgICB0aGlzLmNsb3Vkd2F0Y2hXaWRnZXRzLnB1c2goYWN0aXZlQ29ubmVjdGlvbnNDb3VudFdpZGdldCk7XG5cbiAgICBjb25zdCB0b3RhbENvbm5lY3Rpb25zQ291bnQgPSBuZXcgYXdzX2Nsb3Vkd2F0Y2guQWxhcm0oXG4gICAgICB0aGlzLFxuICAgICAgYHRvdGFsQ29ubmVjdGlvbnNDb3VudGAsXG4gICAgICB7XG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAxLFxuICAgICAgICBkYXRhcG9pbnRzVG9BbGFybTogMSxcbiAgICAgICAgdGhyZXNob2xkOiAxMCxcbiAgICAgICAgbWV0cmljOiB0aGlzLmFsYi5tZXRyaWNSZXF1ZXN0Q291bnQoKSxcbiAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOlxuICAgICAgICAgIGF3c19jbG91ZHdhdGNoLkNvbXBhcmlzb25PcGVyYXRvci5MRVNTX1RIQU5fVEhSRVNIT0xELFxuICAgICAgfVxuICAgICk7XG5cbiAgICBjb25zdCB0b3RhbENvbm5lY3Rpb25zQ291bnRXaWRnZXQgPSBuZXcgYXdzX2Nsb3Vkd2F0Y2guQWxhcm1XaWRnZXQoe1xuICAgICAgYWxhcm06IHRvdGFsQ29ubmVjdGlvbnNDb3VudCxcbiAgICAgIHRpdGxlOiBgdG90YWxDb25uZWN0aW9uc0NvdW50YCxcbiAgICB9KTtcblxuICAgIHRoaXMuY2xvdWR3YXRjaFdpZGdldHMucHVzaCh0b3RhbENvbm5lY3Rpb25zQ291bnRXaWRnZXQpO1xuICB9XG5cbiAgY3JlYXRlV29ya2VycyhudW1iZXI6IG51bWJlciwgc2l6ZTogc3RyaW5nKSB7XG4gICAgY29uc3QgdXNlckRhdGEgPSBmcy5yZWFkRmlsZVN5bmMoJy4vbGliL3VzZXJkYXRhLnNoJywgJ3V0ZjgnKTtcbiAgICBjb25zdCBpZE9mQXpzID0gQXJyYXkuZnJvbShBcnJheSh0aGlzLnZwYy5hdmFpbGFiaWxpdHlab25lcy5sZW5ndGgpLmtleXMoKSk7XG4gICAgY29uc29sZS5sb2coXG4gICAgICBg8J+MjiBDcmVhdGluZyBFQzIgSW5zdGFuY2VzIGluICR7aWRPZkF6cy5sZW5ndGh9IEF2YWlsYWJpbGl0eSBab25lcyDwn4yOIGBcbiAgICApO1xuICAgIC8vIFVzZSBMYXRlc3QgQW1hem9uIExpbnV4IEltYWdlXG4gICAgY29uc3QgYW1pID0gbmV3IGF3c19lYzIuQW1hem9uTGludXhJbWFnZSh7XG4gICAgICBnZW5lcmF0aW9uOiBhd3NfZWMyLkFtYXpvbkxpbnV4R2VuZXJhdGlvbi5BTUFaT05fTElOVVhfMixcbiAgICAgIGNwdVR5cGU6IGF3c19lYzIuQW1hem9uTGludXhDcHVUeXBlLlg4Nl82NCxcbiAgICB9KTtcblxuICAgIGNvbnN0IGluc3RhbmNlcyA9IFtdO1xuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBudW1iZXI7IGluZGV4KyspIHtcbiAgICAgIGluc3RhbmNlcy5wdXNoKFxuICAgICAgICB0aGlzLm5ld0luc3RhbmNlKFxuICAgICAgICAgIGBXb3JrZXIke2luZGV4ICsgMX1gLFxuICAgICAgICAgIGFtaSxcbiAgICAgICAgICBzaXplLFxuICAgICAgICAgIHVzZXJEYXRhLFxuICAgICAgICAgIGlkT2ZBenNbKGluZGV4ICsgMSkgJSBpZE9mQXpzLmxlbmd0aF1cbiAgICAgICAgKVxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIGluc3RhbmNlcztcbiAgfVxuXG4gIG5ld0luc3RhbmNlKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBtYWNoaW5lSW1hZ2U6IGF3c19lYzIuSU1hY2hpbmVJbWFnZSxcbiAgICBzaXplOiBzdHJpbmcsXG4gICAgdXNlcmRhdGE6IHN0cmluZyxcbiAgICBheklkOiBudW1iZXJcbiAgKSB7XG4gICAgY29uc3QgaW5zdGFuY2UgPSBuZXcgYXdzX2VjMi5JbnN0YW5jZSh0aGlzLCBuYW1lLCB7XG4gICAgICB2cGM6IHRoaXMudnBjLFxuICAgICAgaW5zdGFuY2VUeXBlOiBuZXcgYXdzX2VjMi5JbnN0YW5jZVR5cGUoc2l6ZSksXG4gICAgICBtYWNoaW5lSW1hZ2U6IG1hY2hpbmVJbWFnZSxcbiAgICAgIGJsb2NrRGV2aWNlczogW1xuICAgICAgICB7XG4gICAgICAgICAgZGV2aWNlTmFtZTogJy9kZXYvc2RhMScsXG4gICAgICAgICAgdm9sdW1lOiBhd3NfZWMyLkJsb2NrRGV2aWNlVm9sdW1lLmVicyg1MCwge1xuICAgICAgICAgICAgdm9sdW1lVHlwZTogYXdzX2VjMi5FYnNEZXZpY2VWb2x1bWVUeXBlLkdQMyxcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICB1c2VyRGF0YTogYXdzX2VjMi5Vc2VyRGF0YS5jdXN0b20odXNlcmRhdGEpLFxuICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogdGhpcy5hdmFpbGFiaWxpdHlab25lc1theklkXSxcbiAgICAgIHVzZXJEYXRhQ2F1c2VzUmVwbGFjZW1lbnQ6IHRydWUsXG4gICAgfSk7XG4gICAgaW5zdGFuY2UuY29ubmVjdGlvbnMuYWxsb3dGcm9tKHRoaXMuYWxiLCBhd3NfZWMyLlBvcnQudGNwKDgwKSk7XG4gICAgaW5zdGFuY2Uucm9sZS5hZGRNYW5hZ2VkUG9saWN5KFxuICAgICAgYXdzX2lhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZShcbiAgICAgICAgJ0FtYXpvblNTTU1hbmFnZWRJbnN0YW5jZUNvcmUnXG4gICAgICApXG4gICAgKTtcbiAgICBpbnN0YW5jZS5yb2xlLmFkZE1hbmFnZWRQb2xpY3koXG4gICAgICBuZXcgYXdzX2lhbS5NYW5hZ2VkUG9saWN5KHRoaXMsIG5hbWUgKyAncmVhZFRhZ3MnLCB7XG4gICAgICAgIHN0YXRlbWVudHM6IFtcbiAgICAgICAgICBuZXcgYXdzX2lhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgICAgZWZmZWN0OiBFZmZlY3QuQUxMT1csXG4gICAgICAgICAgICBhY3Rpb25zOiBbJ2VjMjpEZXNjcmliZVRhZ3MnXSxcbiAgICAgICAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgICAgICAgfSksXG4gICAgICAgIF0sXG4gICAgICB9KVxuICAgICk7XG4gICAgcmV0dXJuIGluc3RhbmNlO1xuICB9XG5cbiAgY3JlYXRlR3JvdXBzKFxuICAgIGluc3RhbmNlczogYXdzX2VjMi5JbnN0YW5jZVtdLFxuICAgIG9wdGlvbnM6IHsgc2hhcmRpbmc6IHsgZW5hYmxlZDogYm9vbGVhbjsgc2h1ZmZsZTogYm9vbGVhbiB9IH1cbiAgKSB7XG4gICAgdmFyIG51bWJlck9mR3JvdXBzID0gMDtcbiAgICBpZiAob3B0aW9ucy5zaGFyZGluZy5lbmFibGVkKSB7XG4gICAgICBjb25zdCBzaGFyZHM6IFthd3NfZWMyLkluc3RhbmNlLCBhd3NfZWMyLkluc3RhbmNlXVtdID0gW107XG4gICAgICBpZiAob3B0aW9ucy5zaGFyZGluZy5zaHVmZmxlKSB7XG4gICAgICAgIGZvciAobGV0IGEgPSAwOyBhIDwgaW5zdGFuY2VzLmxlbmd0aDsgYSsrKSB7XG4gICAgICAgICAgZm9yIChsZXQgYiA9IGEgKyAxOyBiIDwgaW5zdGFuY2VzLmxlbmd0aDsgYisrKSB7XG4gICAgICAgICAgICBudW1iZXJPZkdyb3VwcyArPSAxO1xuICAgICAgICAgICAgc2hhcmRzLnB1c2goW2luc3RhbmNlc1thXSwgaW5zdGFuY2VzW2JdXSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgICAgYE5ldyBncm91cCAjJHtudW1iZXJPZkdyb3Vwc30gOiAnJHtpbnN0YW5jZXNbYV0ubm9kZS5pZH0nIGFuZCAnJHtpbnN0YW5jZXNbYl0ubm9kZS5pZH0nYFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAobGV0IGEgPSAwOyBhIDwgaW5zdGFuY2VzLmxlbmd0aDsgYSA9IGEgKyAyKSB7XG4gICAgICAgICAgbnVtYmVyT2ZHcm91cHMgKz0gMTtcbiAgICAgICAgICBzaGFyZHMucHVzaChbaW5zdGFuY2VzW2FdLCBpbnN0YW5jZXNbYSArIDFdXSk7XG4gICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICBgTmV3IGdyb3VwICMke251bWJlck9mR3JvdXBzfSA6ICR7aW5zdGFuY2VzW2FdLm5vZGUuaWR9IGFuZCAke1xuICAgICAgICAgICAgICBpbnN0YW5jZXNbYSArIDFdLm5vZGUuaWRcbiAgICAgICAgICAgIH1gXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBzaGFyZHMuZm9yRWFjaCgoc2hhcmQsIGluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IHNoYXJkTmFtZSA9IGAke3NoYXJkWzBdLm5vZGUuaWR9LSR7c2hhcmRbMV0ubm9kZS5pZH1gO1xuICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICBgTmV3IHZpcnR1YWwgc2hhcmQ6ICR7c2hhcmROYW1lfSBhc3NpZ25lZCB0byBBTEIgYXQgLz8ke1xuICAgICAgICAgICAgdGhpcy5zdHJpbmdQYXJhbWV0ZXJcbiAgICAgICAgICB9PSR7aW5kZXggKyAxfWBcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gW1xuICAgICAgICAgIG5ldyBJbnN0YW5jZVRhcmdldChzaGFyZFswXSwgODApLFxuICAgICAgICAgIG5ldyBJbnN0YW5jZVRhcmdldChzaGFyZFsxXSwgODApLFxuICAgICAgICBdO1xuICAgICAgICB0aGlzLmFkZFRhcmdldHNUb0FMQihzaGFyZE5hbWUsIHRhcmdldCwgaW5kZXggKyAxKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBpbnN0YW5jZXMuZm9yRWFjaCgoaW5zdGFuY2UpID0+IHtcbiAgICAgICAgbnVtYmVyT2ZHcm91cHMgKz0gMTtcbiAgICAgICAgY29uc3Qgc2hhcmROYW1lID0gYGVjMi0ke2luc3RhbmNlLm5vZGUuaWR9YDtcbiAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgYE5ldyB2aXJ0dWFsIHNoYXJkOiAke3NoYXJkTmFtZX0gYXNzaWduZWQgdG8gQUxCIGF0IC8/JHt0aGlzLnN0cmluZ1BhcmFtZXRlcn09JHtudW1iZXJPZkdyb3Vwc31gXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMuYWRkVGFyZ2V0c1RvQUxCKFxuICAgICAgICAgIHNoYXJkTmFtZSxcbiAgICAgICAgICBbbmV3IEluc3RhbmNlVGFyZ2V0KGluc3RhbmNlLCA4MCldLFxuICAgICAgICAgIG51bWJlck9mR3JvdXBzXG4gICAgICAgICk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgY29uc29sZS5sb2coXG4gICAgICBgXFxu4pmm77iPIFRvdGFsIG9mICR7aW5zdGFuY2VzLmxlbmd0aH0gaG9zdHMgKCR7aW5zdGFuY2VzWzBdLmluc3RhbmNlLmluc3RhbmNlVHlwZX0pIGFuZCAke251bWJlck9mR3JvdXBzfSB2aXJ0dWFsIHNoYXJkcyDimabvuI9gXG4gICAgKTtcblxuICAgIGNvbnN0IG1heEJsYXN0UmFkaXVzID0gKDEwMCAvIG51bWJlck9mR3JvdXBzKS50b0ZpeGVkKDIpO1xuICAgIGNvbnN0IG1pbkJsYXN0UmFkaXVzID0gKDEwMCAvIGluc3RhbmNlcy5sZW5ndGgpLnRvRml4ZWQoMik7XG4gICAgY29uc29sZS5sb2coXG4gICAgICBvcHRpb25zLnNoYXJkaW5nLnNodWZmbGVcbiAgICAgICAgPyBg8J+SpSBCbGFzdCByYWRpdXMgPSAke21heEJsYXN0UmFkaXVzfSUg8J+SpVxcbmBcbiAgICAgICAgOiBg8J+SpSBCbGFzdCByYWRpdXMgPSAke21pbkJsYXN0UmFkaXVzfSUtJHttYXhCbGFzdFJhZGl1c30lIChTaHVmZmxlIGRpc2FibGVkKSDwn5KlXFxuYFxuICAgICk7XG4gICAgcmV0dXJuIG51bWJlck9mR3JvdXBzO1xuICB9XG5cbiAgYWRkVGFyZ2V0c1RvQUxCKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICB0YXJnZXRzOiBJQXBwbGljYXRpb25Mb2FkQmFsYW5jZXJUYXJnZXRbXSxcbiAgICBwcmlvcml0eTogbnVtYmVyXG4gICkge1xuICAgIGNvbnN0IHRhcmdldEdyb3VwID0gbmV3IEFwcGxpY2F0aW9uVGFyZ2V0R3JvdXAodGhpcywgbmFtZSwge1xuICAgICAgdnBjOiB0aGlzLnZwYyxcbiAgICAgIHBvcnQ6IDgwLFxuICAgICAgdGFyZ2V0VHlwZTogVGFyZ2V0VHlwZS5JTlNUQU5DRSxcbiAgICAgIHRhcmdldHM6IHRhcmdldHMsXG4gICAgICBoZWFsdGhDaGVjazoge1xuICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICBpbnRlcnZhbDogRHVyYXRpb24uc2Vjb25kcyg1KSxcbiAgICAgICAgcGF0aDogJy8nLFxuICAgICAgICBwcm90b2NvbDogUHJvdG9jb2wuSFRUUCxcbiAgICAgICAgdGltZW91dDogRHVyYXRpb24uc2Vjb25kcygyKSxcbiAgICAgICAgaGVhbHRoeVRocmVzaG9sZENvdW50OiAyLFxuICAgICAgICB1bmhlYWx0aHlUaHJlc2hvbGRDb3VudDogMixcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBxdWVyeVN0cmluZ3MgPSB7IGtleTogdGhpcy5zdHJpbmdQYXJhbWV0ZXIsIHZhbHVlOiBgJHtwcmlvcml0eX1gIH07XG5cbiAgICB0aGlzLmxpc3RlbmVyLmFkZEFjdGlvbihuYW1lLCB7XG4gICAgICBhY3Rpb246IExpc3RlbmVyQWN0aW9uLmZvcndhcmQoW3RhcmdldEdyb3VwXSksXG4gICAgICBjb25kaXRpb25zOiBbTGlzdGVuZXJDb25kaXRpb24ucXVlcnlTdHJpbmdzKFtxdWVyeVN0cmluZ3NdKV0sXG4gICAgICBwcmlvcml0eTogcHJpb3JpdHksXG4gICAgfSk7XG5cbiAgICAvLyBFbmRwb2ludCBmb3IgdGhlIHNwZWNpZmljIHRhcmdldCBncm91cCB3aXRoIHRoZSBzcGVjaWZpYyBxdWVyeSBzdHJpbmdcbiAgICBjb25zdCB1cmwgPSBgaHR0cDovLyR7dGhpcy5hbGIubG9hZEJhbGFuY2VyRG5zTmFtZX0vPyR7dGhpcy5zdHJpbmdQYXJhbWV0ZXJ9PSR7cHJpb3JpdHl9YDtcbiAgICBuZXcgQ2ZuT3V0cHV0KHRoaXMsIGBMb2FkQmFsYW5jZXJFbmRwb2ludC0ke25hbWV9YCwge1xuICAgICAgdmFsdWU6IHVybCxcbiAgICB9KTtcblxuICAgIHRoaXMuY3JlYXRlQ2FuYXJ5QWxhcm0oXG4gICAgICB1cmwsXG4gICAgICBgJHtwcmlvcml0eX1gLFxuICAgICAgYC8/JHt0aGlzLnN0cmluZ1BhcmFtZXRlcn09JHtwcmlvcml0eX1gXG4gICAgKTtcbiAgfVxuXG4gIGNyZWF0ZUNhbmFyeUFsYXJtKHVybDogc3RyaW5nLCBpZDogc3RyaW5nLCBDV3RpdGxlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBoYW5kbGVyID0gYFxuICAgIGNvbnN0IHN5bnRoZXRpY3MgPSByZXF1aXJlKCdTeW50aGV0aWNzJyk7XG4gICAgY29uc3QgbG9nID0gcmVxdWlyZSgnU3ludGhldGljc0xvZ2dlcicpO1xuICAgIFxuICAgIGNvbnN0IHBhZ2VMb2FkQmx1ZXByaW50ID0gYXN5bmMgZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IHVybCA9ICcke3VybH0nO1xuXG4gICAgY29uc3QgcGFnZSA9IGF3YWl0IHN5bnRoZXRpY3MuZ2V0UGFnZSgpO1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcGFnZS5nb3RvKHVybCwgeyB3YWl0VW50aWw6ICdkb21jb250ZW50bG9hZGVkJywgdGltZW91dDogMzAwMDAgfSk7XG4gICAgLy8gV2FpdCBmb3IgcGFnZSB0byByZW5kZXIuIEluY3JlYXNlIG9yIGRlY3JlYXNlIHdhaXQgdGltZSBiYXNlZCBvbiBlbmRwb2ludCBiZWluZyBtb25pdG9yZWQuXG4gICAgYXdhaXQgcGFnZS53YWl0Rm9yKDE1MDAwKTtcbiAgICAvLyBUaGlzIHdpbGwgdGFrZSBhIHNjcmVlbnNob3QgdGhhdCB3aWxsIGJlIGluY2x1ZGVkIGluIHRlc3Qgb3V0cHV0IGFydGlmYWN0cy5cbiAgICBhd2FpdCBzeW50aGV0aWNzLnRha2VTY3JlZW5zaG90KCdsb2FkZWQnLCAnbG9hZGVkJyk7XG4gICAgY29uc3QgcGFnZVRpdGxlID0gYXdhaXQgcGFnZS50aXRsZSgpO1xuICAgIGxvZy5pbmZvKCdQYWdlIHRpdGxlOiAnICsgcGFnZVRpdGxlKTtcbiAgICBpZiAocmVzcG9uc2Uuc3RhdHVzKCkgIT09IDIwMCkge1xuICAgICAgdGhyb3cgJ0ZhaWxlZCB0byBsb2FkIHBhZ2UhJztcbiAgICB9XG4gICAgfTtcblxuICAgIGV4cG9ydHMuaGFuZGxlciA9IGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBhd2FpdCBwYWdlTG9hZEJsdWVwcmludCgpO1xuICAgIH07XG4gICAgYDtcblxuICAgIGNvbnN0IGNhbmFyeSA9IG5ldyBhd3Nfc3ludGhldGljc19hbHBoYS5DYW5hcnkodGhpcywgYGNhbmFyeS0ke2lkfWAsIHtcbiAgICAgIHNjaGVkdWxlOiBhd3Nfc3ludGhldGljc19hbHBoYS5TY2hlZHVsZS5yYXRlKER1cmF0aW9uLm1pbnV0ZXMoNSkpLFxuICAgICAgdGVzdDogYXdzX3N5bnRoZXRpY3NfYWxwaGEuVGVzdC5jdXN0b20oe1xuICAgICAgICBjb2RlOiBhd3Nfc3ludGhldGljc19hbHBoYS5Db2RlLmZyb21JbmxpbmUoaGFuZGxlciksXG4gICAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgICAgIH0pLFxuICAgICAgcnVudGltZTogYXdzX3N5bnRoZXRpY3NfYWxwaGEuUnVudGltZS5TWU5USEVUSUNTX05PREVKU19QVVBQRVRFRVJfM180LFxuICAgIH0pO1xuXG4gICAgY29uc3QgY2FuYXJ5QWxhcm0gPSBuZXcgYXdzX2Nsb3Vkd2F0Y2guQWxhcm0odGhpcywgYGFsYXJtLSR7aWR9YCwge1xuICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDUsXG4gICAgICB0aHJlc2hvbGQ6IDkwLFxuICAgICAgbWV0cmljOiBjYW5hcnkubWV0cmljU3VjY2Vzc1BlcmNlbnQoeyBwZXJpb2Q6IER1cmF0aW9uLnNlY29uZHMoNjApIH0pLFxuICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOiBhd3NfY2xvdWR3YXRjaC5Db21wYXJpc29uT3BlcmF0b3IuTEVTU19USEFOX1RIUkVTSE9MRCxcbiAgICB9KTtcblxuICAgIGNvbnN0IGN3V2lkZ2V0ID0gbmV3IGF3c19jbG91ZHdhdGNoLkFsYXJtV2lkZ2V0KHtcbiAgICAgIGFsYXJtOiBjYW5hcnlBbGFybSxcbiAgICAgIHRpdGxlOiBDV3RpdGxlLFxuICAgIH0pO1xuXG4gICAgdGhpcy5jbG91ZHdhdGNoV2lkZ2V0cy5wdXNoKGN3V2lkZ2V0KTtcbiAgfVxufVxuIl19