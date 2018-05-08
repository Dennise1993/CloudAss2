start-swarm:
	# Put us in swam mode
	docker swarm init

	# Create custom networks
	docker network create \
	  --driver overlay \
	  --subnet 10.0.9.0/24 \
	  --opt encrypted \
	  backend

	# Create the registry
	# TODO - secure the registry in "prod"
	docker service create --name registry --publish published=5000,target=5000 registry:2

	# Build the images and push them to the registry
	docker-compose build
	docker-compose push

	docker pull rabbitmq:3-management-alpine
	docker tag rabbitmq:3-management-alpine 127.0.0.1:5000/rabbitmq:3-management-alpine
	docker push 127.0.0.1:5000/rabbitmq:3-management-alpine

	docker pull redgeoff/couchdb-service:2.1.1
	docker tag redgeoff/couchdb-service:2.1.1 127.0.0.1:5000/redgeoff/couchdb-service:2.1.1
	docker push 127.0.0.1:5000/redgeoff/couchdb-service:2.1.1

	# TODO - add this in "prod" for couchdb so we can have data persistence
	# --mount type=bind,source=/home/ubuntu/common,destination=/common \

	# TODO - change credentials
	docker service create --replicas 3 --name couchdb --network backend \
	  --hostname="couchdb{{.Task.Slot}}" \
	  -e COUCHDB_COOKIE="hiJEvxwsPBvZrkp0CiGv3Mm6DXQQJ531" \
	  -e COUCHDB_USER="couchdb" \
	  -e COUCHDB_PASSWORD="crepesgiganticsuperfluousstranger" \
	  -e COUCHDB_HASHED_PASSWORD="-pbkdf2-66f97f623061e1519142b8fd0aea60014c8c97a1,7be0d542a3d61dd243d926748bf5941e,10" \
	  -e COUCHDB_SECRET="PX7Ha1jJefGe5XHTJqT77VS5TNlq99Mc" \
	  -e NODENAME="couchdb{{.Task.Slot}}" \
	  -e SERVICE_NAME="{{.Service.Name}}" \
	  -e TASK_SLOT="{{.Task.Slot}}" \
	  -e COUCHDB_DATA_DIR="/common/data/{{.Service.Name}}{{.Task.Slot}}" \
	  -p 5984:5984 \
	  --detach=true \
	  redgeoff/couchdb-service

	# Deploy the services
	docker stack deploy --compose-file docker-compose.yml stack

stop-swarm:
	# Remove the services
	docker stack rm stack
	docker service rm registry
	docker service rm couchdb

	# Remove the network
	docker network rm backend

	# Exit swarm mode
	docker swarm leave --force
