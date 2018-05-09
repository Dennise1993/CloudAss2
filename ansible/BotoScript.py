
# coding: utf-8

# # A simple implement of EC2 Boto Services For python
# 
# 
# Author: Huanan Li
# 
# Date written: 16/04/2018
# 
# Version: 1.0
# 
# Program: Python 3.6 and Anaconda Jupyter notebook
# 
# Libraries used:
# * boto
# * time
# 
# ##  Introduction
# 
#  
# >** Task 1)** Import useful library <br >
# **Task 2)** Connect to EC2 instance(Nectar Services)  <br >
# **Task 3)** Launch instances and create volumes for each instances(P.S: It is important to add placement parameter which ensures the availability zone in the same area) <br >
# **Task 4)** Check if the instances is running, if not running, then sleep for 1 min, sometimes due to the Cloud services issues, it may take a long time to launch one instances, mostly in 1 min<br >
# **Task 5)** Attach volumes to each instances
# 

# In[1]:


import boto
import time




from boto.ec2.regioninfo import RegionInfo
region = RegionInfo(name='melbourne', endpoint='nova.rc.nectar.org.au')
ec2_conn = boto.connect_ec2(aws_access_key_id='c6789431068d4598b738df4346735fed',
 aws_secret_access_key='8984d9e386784af8811fe464fd344ea6',
 is_secure=True,
 region=region,
 port=8773,
 path='/services/Cloud',
 validate_certs=False) 




reservation = ""
vol_req = ""



i = 0
while i < 1:
    reservation = ec2_conn.run_instances('ami-00003837',
     key_name='Durian',
     instance_type='m1.small',
     placement='melbourne-qh2',
     security_groups=['default'])
    vol_req = ec2_conn.create_volume(30,'melbourne-qh2')
    i = i + 1




print(reservation)
print(vol_req)




print(reservation.instances[0].id)
print(vol_req.id)



reservations = ec2_conn.get_all_reservations()
print(reservations)
curr_vols = ec2_conn.get_all_volumes()




with open('ansible_hosts', 'a') as the_file:
    the_file.write('[cloudHost]')
    the_file.write('\n')
    i = 0
    while i < 4:
        instances = reservations[i].instances[0].private_ip_address
        the_file.write(instances+'\n')
        i = i + 1
    the_file.write('[cloudHost:vars]')
    the_file.write('\n')
    the_file.write('ansible_ssh_user=ubuntu')
    the_file.write('\n')
    the_file.write('ansible_ssh_private_key_file=~/.ssh/durian.pem')




for res in reservations:
    for ins in res.instances:
        if ins.state != "running":
            print("sleep 1min")
            time.sleep(60)



for ins,v in zip([i for r in reservations for i in r.instances],[v for v in curr_vols]):
    # ec2_conn.attach_volume(v.id, ins.id,'/dev/vdc')
    ec2_conn.attach_volume(vol_req.id, reservation.instances[0].id,'/dev/vdc')

