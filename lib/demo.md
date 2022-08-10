1. `cdk deploy`

2. Simulate app issue on two instances

```bash
aws ssm send-command --instance-ids $(aws ec2 describe-instances --query 'Reservations[].Instances[].InstanceId' --filters "Name=tag:Name,Values=*Worker1*" --region eu-west-1 --output text) --document-name "AWS-RunShellScript" --parameters "commands=['killall python3']" --region eu-west-1  --output json
```

```bash
aws ssm send-command --instance-ids $(aws ec2 describe-instances --query 'Reservations[].Instances[].InstanceId' --filters "Name=tag:Name,Values=*Worker2*" --region eu-west-1 --output text) --document-name "AWS-RunShellScript" --parameters "commands=['killall python3']" --region eu-west-1  --output json
```

3. Open the browser, click on 'click to get new key' until it fails.

4. Change the CDK Code to enable shuffle sharding and run `CDK Deploy`

5. Restart the python process

```bash
aws ssm send-command --instance-ids $(aws ec2 describe-instances --query 'Reservations[].Instances[].InstanceId' --filters "Name=tag:Name,Values=*Worker*" --region eu-west-1 --output text) --document-name "AWS-RunShellScript" --parameters "commands=['killall python3','nohup python3 /root/shuffle-sharding-demo-app/flask-server/main.py >>/var/log/webserver.log 2>&1 &']" --region eu-west-1  --output json
```

6. Open the browser again and test

7. end
