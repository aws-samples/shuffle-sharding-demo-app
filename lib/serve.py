import boto3
from ec2_metadata import ec2_metadata
from flask import Flask, render_template

app = Flask("__main__")

@app.route('/')
def serve(path):
    instance_region = ec2_metadata.region
    client = boto3.client('ec2', region_name=instance_region)
    instance_id = ec2_metadata.instance_id
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
    return render_template("index.html", flask_token="Hello   world")
if __name__ == "__main__":
    app.run(use_reloader=True, host='0.0.0.0', port=80, threaded=True)