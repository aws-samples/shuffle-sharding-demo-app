import boto3
from ec2_metadata import ec2_metadata
from flask import Flask, render_template

app = Flask("__main__")

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve():
    instance_region = ec2_metadata.region
    # instance_region = "us-east-1" //local debug
    # instance_id = "i-0bbcc05da5fb99f54"  // local debug
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
    response = "<h1>This is " + instance['Tags'][0]['Value'] + "</h1>"
    return render_template("index.html", flask_token=response)
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=80)