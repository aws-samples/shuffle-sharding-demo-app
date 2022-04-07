#!/bin/bash -x
yum update -y
yum install python-pip -y
yum install git -y
pip3 install flask
pip3 install ec2-metadata
pip3 install boto3
cd ~
git clone https://github.com/dudutwizer/ShuffleShardingDemo-Summit2022
cd ShuffleShardingDemo-Summit2022
curl --silent --location https://rpm.nodesource.com/setup_17.x | bash -
yum -y install nodejs
npm install typescript -g
cd react-app
npm install
npm run build
cd ..
cd flask-server
nohup python3 main.py >>/var/log/webserver.log 2>&1 &