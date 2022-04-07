import { aws_cloudwatch, aws_ec2, Stack, StackProps } from 'aws-cdk-lib';
import { ApplicationListener, ApplicationLoadBalancer, IApplicationLoadBalancerTarget } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';
export declare class ShuffleShardingDemoSummit2022 extends Stack {
    listener: ApplicationListener;
    alb: ApplicationLoadBalancer;
    cloudwatchDashboard: aws_cloudwatch.Dashboard;
    cloudwatchWidgets: aws_cloudwatch.AlarmWidget[];
    readonly vpc: aws_ec2.Vpc;
    readonly stringParameter = "number";
    constructor(scope: Construct, id: string, props?: StackProps);
    createDist(number: number): void;
    createALB(port: number): void;
    createWorkers(number: number, size: string): aws_ec2.Instance[];
    defaultRoundRobing(instances: aws_ec2.Instance[]): void;
    newInstance(name: string, machineImage: aws_ec2.IMachineImage, size: string, userdata: string, azId: number): aws_ec2.Instance;
    createGroups(instances: aws_ec2.Instance[], options: {
        sharding: {
            enabled: boolean;
            shuffle: boolean;
        };
    }): number;
    addTargetsToALB(name: string, targets: IApplicationLoadBalancerTarget[], priority: number, queryStringEnabled?: boolean): void;
    createCanaryAlarm(url: string, id: string, CWtitle: string): void;
}
