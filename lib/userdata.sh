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
# get node into yum
curl --silent --location https://rpm.nodesource.com/setup_17.x | bash -
# install node (and npm) with yum
yum -y install nodejs
npm install typescript -g
cd react-app
npm install
npm run build
cd..
cd flask-server
nohup python main.py >>/var/log/webserver.log 2>&1 &