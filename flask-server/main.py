import boto3
from ec2_metadata import ec2_metadata
from flask import Flask, render_template
import json

app = Flask("__main__")

@app.route('/')
def serve():
    instance_region = ec2_metadata.region
    # instance_region = "us-east-1" #//local debug
    # instance_id = "i-05dfdb583e6866c62"  #// local debug
    client = boto3.client('ec2', region_name=instance_region)
    instance_id = ec2_metadata.instance_id # comment out locally
    instance = client.describe_tags(
    Filters=[
        {
            'Name': 'resource-id',
            'Values': [
                instance_id
            ]
        },
        {
            'Name': 'key',
            'Values': [
                'Name'
            ]
        }
    ]
)
    client = boto3.client('elbv2', region_name=instance_region)
    targetgroups = len(client.describe_target_groups(LoadBalancerArn="arn:aws:elasticloadbalancing:us-east-1:117923233529:loadbalancer/app/Shuff-AppLo-KDFFDIH6DP1V/82e814eb738b18fc")['TargetGroups'])
    instance_name = instance['Tags'][0]['Value']
    payload = {
        "targetgroupsSize" : targetgroups,
        "instance_name": instance_name
    }
    return render_template("index.html", flask_token=json.dumps(payload))
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=80)