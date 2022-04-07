import boto3
import os
from ec2_metadata import ec2_metadata
from flask import Flask, send_from_directory

app = Flask(__name__, static_folder='react_app/build')

# Serve React App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
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
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')
if __name__ == "__main__":
    app.run(use_reloader=True, host='0.0.0.0', port=80, threaded=True))