#!/bin/bash -x
yum update -y
yum install python-pip -y
yum install git -y
pip install boto3
pip install flask
pip install ec2-metadata
cd ~
mkdir serving_static
cd serving_static
curl -o serve.py https://raw.githubusercontent.com/dudutwizer/ShuffleShardingDemo-Summit2022/main/lib/serve.py
mkdir build
git clone https://github.com/dudutwizer/ShuffleShardingDemo-Summit2022
mv -v ./ShuffleShardingDemo-Summit2022/website/shuffle-demo/build/* ./build
nohup python serve.py >>/var/log/webserver.log 2>&1 &