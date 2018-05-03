Ansible Documentation
P.S: This ansible script is not the final script.

It needs to install python on your machine.
It needs to install ansible on your machine. (The link of how to install ansible on the local machine is: http://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html#latest-releases-via-pip) Execute the FinalBOTO.py, and this file will create a nectar Virtual machine, and also create a file called ansible_hosts. run the command below: ansible-playbook playbook.yml -i ansible_hosts -u ubuntu
That's it!
