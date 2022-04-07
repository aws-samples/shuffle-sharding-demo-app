import boto3
from ec2_metadata import ec2_metadata
from flask import Flask, request, render_template

app = Flask(__name__, static_folder="build/static", template_folder="build")

def shutdown_server():
    func = request.environ.get('werkzeug.server.shutdown')
    if func is None:
        raise RuntimeError('Not running with the Werkzeug Server')
    func()
@app.route("/")
def echo():
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
    return render_template('index.html', content=response)
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=80)