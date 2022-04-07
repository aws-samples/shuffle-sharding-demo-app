#!/bin/bash -x
yum update -y
yum install python-pip -y
pip install flask
pip install boto3
yum install git -y
pip install ec2-metadata
cd ~
git clone https://github.com/dudutwizer/ShuffleShardingDemo-Summit2022
cd ShuffleShardingDemo-Summit2022
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install node
npm run build
cd flask-server
nohup python serve.py >>/var/log/webserver.log 2>&1 &