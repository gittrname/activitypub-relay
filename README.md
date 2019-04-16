

$ cp .env.sample .env.production

$ vi .env.production

$ docker-compose build

$ docker-compose run --rm relay npm run build:keypair

$ docker-compose run --rm relay npm run build:migrate

$ docker-compose up -d
