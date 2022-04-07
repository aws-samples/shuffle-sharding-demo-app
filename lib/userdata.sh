#!/bin/bash -x
yum update -y
yum install python-pip -y
pip install flask
pip install boto3
yum install git -y
pip install ec2-metadata
cd ~
mkdir serving_static
cd serving_static
curl -o serve.py https://raw.githubusercontent.com/dudutwizer/ShuffleShardingDemo-Summit2022/main/lib/serve.py
mkdir react_app
git clone https://github.com/dudutwizer/ShuffleShardingDemo-Summit2022
mv -v ./ShuffleShardingDemo-Summit2022/website/shuffle-demo/build/* ./react_app
nohup python serve.py >>/var/log/webserver.log 2>&1 &