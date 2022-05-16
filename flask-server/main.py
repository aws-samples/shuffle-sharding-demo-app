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
            workers = ec2_metadata.tags['totalInstances']
            notlocal = True
        except Exception as e:
            print("ec2_metadata query issue")
    if(notlocal):
        targetgroups = ec2_metadata.tags['totalTG']
        instance_name = ec2_metadata.tags['Name']
        mode = int(ec2_metadata.tags['mode'])
        value = request.args.get(keyname)
    else:
        print("static response")
        targetgroups = 28
        instance_name = "/Worker7"
        keyname = 'number'
        value = 26
        workers = 8
        mode = int('3') # mode = 1 , shard disabled, shuffle disabled. mode=2 ., shard enabled. mode3 shuffle enabled 
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