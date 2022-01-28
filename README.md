# cn_basekit

## Overview

Sample **Cloud Native** basic application kit with MySQL/PostgreSQL/CouchDB/Redis/Auth0.


## Description for "Cloud-Native"ness

**Micro services** is one of main element for Cloud Native application. Developing front-end application can be elastic with container-like infrastructure, but there are no live guarantee for back end services, like Database. Cloud Native application need to handle back-end maintenances.

This sample application can handle database maintenances. Even if DB would stop suddenly, this application would handle that exception event, tries to reconnect(tries to create connection pool), and would behave as normal again.


## Demo scenario

1. Start DB(as docker container, for example)

2. Run application, and connect to that DB.

3. Use application. Create/Read/Update/Delete data.

4. Stop DB.

5. Restart DB again.

6. Confirm if you would be able to use running application so that there would be no DB restart(, because application automatically reconnect to DB again).


## Environment values

- One of follow three value need to be set:

  - `COUCHDB_DATABASE_URL` : URL connection string for CouchDB

  - `MYSQL_DATABASE_URL` : URL connection string for MySQL

  - `POSTGRES_DATABASE_URL` : URL connection string for PostgreSQL

- `DBTYPE` : Which type of DB to use(COUCHDB/MYSQL/POSTGRES)

- `REDIS_DATABASE_URL` : URL connection string for Redis(, if needed)

- Following all four values need to be set

  - `AUTH0_CALLBACK_URL` : Callback URL after authentication with Auth0

  - `AUTH0_CLIENT_ID` : Client ID for Auth0

  - `AUTH0_CLIENT_SECRET` : Client Secret for Auth0

  - `AUTH0_DOMAIN` : Domain host name for Auth0


## Running data services on docker

- CouchDB

  - `$ docker run -d --name couchdb -p 5984:5984 -e COUCHDB_USER=user -e COUCHDB_PASSWORD=pass couchdb`

  - `http://localhost:5984/_utils/`

  - `db` データベースを作成しておく

- MySQL

  - `$ docker run -d --name mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=P@ssw0rd -e MYSQL_DATABASE=db -e MYSQL_USER=user -e MYSQL_PASSWORD=pass mysql:5.7`

  - `$ docker container exec -it mysql bash`

  - `# mysql -u user -p db`

  - `mysql> create table if not exists items ( id varchar(50) not null primary key, name varchar(50) default '', price int default 0, created bigint default 0, updated bigint default 0 ) default charset=utf8;`

- PostgreSQL

  - `$ docker run -d --name postgres -p 5432:5432 -e POSTGRES_USER=user -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=db postgres`

  - `$ docker container exec -it postgres bash`

  - `# psql -U user -d db`

  - `db=# create table if not exists items ( id varchar(50) not null primary key, name varchar(50) default '', price int default 0, created bigint default 0, updated bigint default 0 );`

- Redis

  - `$ docker run --name redis -d -p 6379:6379 redis`

## Licensing

This code is licensed under MIT.


## Copyright

2022 K.Kimura @ Juge.Me all rights reserved.

