#!/bin/bash -x
yum update -y
yum install python-pip -y
pip install flask
pip install boto3
pip install ec2-metadata
curl -o /home/ec2-user/buggy-webserver.py https://aws-well-architected-labs-virginia.s3.amazonaws.com/Reliability/300_Fault_Isolation_with_Shuffle_Sharding/buggy-webserver.py
nohup python /home/ec2-user/buggy-webserver.py >>/var/log/webserver.log 2>&1 &