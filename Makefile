all:
	node myapp.js

rebuild:
	sudo docker build . -t thesis/node-web-app
	sudo docker-compose up
