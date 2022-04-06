#!/bin/bash -x
yum update -y
yum install python-pip -y
pip install flask
pip install boto3
pip install ec2-metadata
mkdir serving_static
cd serving_static
curl -o serve.py <url>
mkdir templates
git clone https://github.com/dudutwizer/ShuffleShardingDemo-Summit2022
mv -v ./ShuffleShardingDemo-Summit2022/website/build/* .
cd..
nohup python serve.py >>/var/log/webserver.log 2>&1 &