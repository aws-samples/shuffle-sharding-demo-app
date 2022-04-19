import boto3
from ec2_metadata import ec2_metadata
from flask import Flask, render_template, request
import json
import base64

app = Flask("__main__")

@app.route('/')
def serve():
    notlocal = False
    keyname = 'number'
    value = request.args.get(keyname)
    if(value is not None):
        try:
            instance_region = ec2_metadata.region
            client = boto3.client('ec2', region_name=instance_region)
            workers = len(client.describe_instances(Filters=[{'Name':'tag:Name','Values':['*Worker*']},{'Name': 'instance-state-name', 'Values': ['running']}])['Reservations'])
            notlocal = True
        except Exception as e:
            print("no boto, working locally")
        if(notlocal):
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
            targetgroups = len(client.describe_target_groups(LoadBalancerArn=client.describe_load_balancers()['LoadBalancers'][0]['LoadBalancerArn'])['TargetGroups'])-1
            instance_name = instance['Tags'][0]['Value']
            value = request.args.get(keyname)
    else:
        targetgroups = 6
        instance_name = "/Worker1"
        keyname = 'number'
        value = 1
        workers = 4
    payload = {
        "targetgroupsSize" : targetgroups,
        "instance_name": instance_name,
        "keyname": keyname,
        "keyvalue": value,
        "number_of_vms": workers
    }

    base64_bytes = base64.b64encode(json.dumps(payload).encode('ascii'))
    base64_message = base64_bytes.decode('ascii')

    return render_template("index.html", flask_token=base64_message)
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=80)