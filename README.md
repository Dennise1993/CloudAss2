# CloudAss2

## Ansible
Required libraries on your local machine:
1. Python 3
2. Boto library for Python 3.

Ansible install via pip.(http://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html#latest-releases-via-pip)
python FinalBOTO.py the output is ansible_hosts.
Execute the ansible command
     ansible-playbook playbook.yml -i ansible_hosts -u ubuntu

The ansible_hosts will be used.

## Docker

To boot up a local instance of the backend system start up Docker on your
computer, and once it has finished turning on, just run the command:

```
make start-swarm
```

To shut it down, run:

```
make stop-swarm
```

It should take a few minutes for the command to finish running. However, it may also
take an additional 30 seconds after the command has completed for the CouchDB
cluster to complete setup.

Note that to run the command, you will need make installed on your
computer. There is also a dependency on Docker. The way to install it depends
on your operating system:

**Windows:** Docker for Windows
**Mac:** Docker for Mac
**Linux:** Varies depending on the Linux distribution. Generally this is 
through a package that can be installed via apt-get, yum, etc. There are several different
types of Docker packages which all do different things, so make sure to be installing the right one.

Do not install "Docker Toolbox". It is old and essentially deprecated.

Nothing else is required, including Bash. All the infrastructure required to run programs
(such as installing Python, libraries and so forth) is setup as part of
this command. None of this is installed on your actual computer.

Note that quitting the Docker program will not shut down the system, as it will
put the system back up on boot. The stop-swarm command must be used.

### Services

There are some components of the system which have admin portals which can be
used to maintain and view the status of the system. Assuming a local deployment
on one's computer (and not production), these can all be accessed at the
IP address "127.0.0.1" in your browser.

Details for these portals are as follows:

#### CouchDB
**Port:** 5984
**Username:** admin
**Password:** admin

#### RabbitMQ
**Port:** 15672
**Username:** rabbitmq
**Password:** jerseygrapefruitpetrolcalcium
