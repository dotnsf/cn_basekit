# cn_basekit

## Overview

Sample basic application kit with MySQL/PostgreSQL/Cloudant/Redis/Auth0.


## Environment values

- CLOUDANT_DATABASE_URL : URL connection string for Cloudant

- MYSQL_DATABASE_URL : URL connection string for MySQL

- POSTGRES_DATABASE_URL : URL connection string for PostgreSQL

- DBTYPE : Which type of DB to use(CLOUDANT/MYSQL/POSTGRES)

- REDIS_DATABASE_URL : URL connection string for Redis(, if needed)

- AUTH0_CALLBACK_URL : Callback URL after authentication with Auth0

- AUTH0_CLIENT_ID : Client ID for Auth0

- AUTH0_CLIENT_SECRET : Client Secret for Auth0

- AUTH0_DOMAIN : Domain host name for Auth0


## Running data services on docker

- PostgreSQL

  - `$ docker run -d --name postgres -p 5432:5432 -e POSTGRES_USER=user -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=db postgres`

  - `$ docker container exec -it postgres bash`

  - `# psql -U user -d db`

- Redis

  - `$ docker run --name redis -d -p 6379:6379 redis`

## Licensing

This code is licensed under MIT.


## Copyright

2022 K.Kimura @ Juge.Me all rights reserved.

