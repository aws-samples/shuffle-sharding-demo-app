import boto3

# Retrieve the list of existing buckets
s3 = boto3.client('s3')
response = s3.list_buckets()
s3resource = boto3.resource('s3')

# Output the bucket names
print('Existing buckets:')
for bucket in response['Buckets']:
    bucketname = bucket["Name"]
    print(f'  {bucketname}')
    if 'shuffleshardingdemosummi' in bucketname:
        print(f'deleting ${bucketname}')
        bucket = s3resource.Bucket(bucketname)
        bucket.objects.all().delete()
        bucket.delete() 
    