import boto3
from ec2_metadata import ec2_metadata
from flask import Flask, render_template, request
import json
import base64

app = Flask("__main__")

botoclient = False

try:
    instance_region = ec2_metadata.region
    ec2client = boto3.client('ec2', region_name=instance_region)
    elbclient = boto3.client('elbv2', region_name=instance_region)
    botoclient = True
except Exception as e:
    print("no clients")

def get_instance_tag(all_tags, tag_name):
  for tag in all_tags:
    if tag_name == tag['Key']:
      return tag['Value']

  return None

@app.route('/')
def serve():
    notlocal = False
    global botoclient
    keyname = 'number'
    value = request.args.get(keyname)
    if(value is not None and botoclient):
        try:
            workers = len(ec2client.describe_instances(Filters=[{'Name':'tag:Name','Values':['*Worker*']},{'Name': 'instance-state-name', 'Values': ['running']}])['Reservations'])
            notlocal = True
        except Exception as e:
            print("boto query issue")
        if(notlocal):
            instance_id = ec2_metadata.instance_id 
            instance = ec2client.describe_tags(
            Filters=[
                {
                    'Name': 'resource-id',
                    'Values': [
                        instance_id
                    ]
                }
            ]
            )
            targetgroups = len(elbclient.describe_target_groups(LoadBalancerArn=elbclient.describe_load_balancers()['LoadBalancers'][0]['LoadBalancerArn'])['TargetGroups'])-1
            instance_name = get_instance_tag(instance['Tags'], 'Name')
            mode = int(get_instance_tag(instance['Tags'], 'mode'))
            value = request.args.get(keyname)
    else:
        print("static response")
        targetgroups = 6
        instance_name = "/Worker1"
        keyname = 'number'
        value = 1
        workers = 4
        mode = int('1') # mode = 1 , shard disabled, shuffle disabled. mode=2 ., shard enabled. mode3 shuffle enabled 
    payload = {
        "targetgroupsSize" : targetgroups,
        "instance_name": instance_name,
        "keyname": keyname,
        "keyvalue": value,
        "number_of_vms": workers,
        'mode': mode
    }

    base64_bytes = base64.b64encode(json.dumps(payload).encode('ascii'))
    base64_message = base64_bytes.decode('ascii')

    return render_template("index.html", flask_token=base64_message)
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=80)