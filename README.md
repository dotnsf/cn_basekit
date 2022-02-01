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

- `DBTYPE` : Which type of DB to use(couchdb/mysql/postgres/db2/mongo/redis/couchbase/elasticsearch)

- One of following values ( or `REDIS_DATABASE_URL` ) need to be set:

  - `COUCHDB_DATABASE_URL` : URL connection string for CouchDB

  - `MYSQL_DATABASE_URL` : URL connection string for MySQL

  - `POSTGRES_DATABASE_URL` : URL connection string for PostgreSQL

  - `DB2_DATABASE_URL` : URL connection string for DB2

  - `MONGO_DATABASE_URL` : URL connection string for MongoDB

  - `COUCHBASE_DATABASE_URL` : URL connection string for CouchBase

  - `ELASTICSEARCH_DATABASE_URL` : URL connection string for ElasticSearch

- `REDIS_DATABASE_URL` : URL connection string for Redis(, as session server if needed)

- `AUTHTYPE` : Which type of authentication to use(auth0/appid/(blank))

- Following all four values need to be set, if you use Auth0 as IDaaS:

  - `AUTH0_CALLBACK_URL` : Callback URL after authentication with Auth0

  - `AUTH0_CLIENT_ID` : Client ID for Auth0

  - `AUTH0_CLIENT_SECRET` : Client Secret for Auth0

  - `AUTH0_DOMAIN` : Domain host name for Auth0

- Following all seven values need to be set, if you use AppID as IDaaS:

  - `APPID_REGION` : Callback URL after authentication with AppID

  - `APPID_TENANTID` : Tenant ID for AppID

  - `APPID_APIKEY` : API Key for AppID

  - `APPID_SECRET` : API Secret for AppID

  - `APPID_CLIENTID` : Client ID for AppID

  - `APPID_REDIRECTURI` : Callback URL after authentication with AppID

  - `APPID_OAUTHSERVERURL` : OAuth server name for AppID


## Running data services on docker

- CouchDB

  - `$ docker run -d --name couchdb -p 5984:5984 -e COUCHDB_USER=user -e COUCHDB_PASSWORD=pass couchdb`

  - `http://localhost:5984/_utils/`

    - Create `db` database.

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

- Db2

  - `$ docker run -d --name db2 -p 50000:50000 --privileged=true -e LICENSE=accept -e DB2INST1_PASSWORD=db2inst1 -e DBNAME=db ibmcom/db2`

  - `$ docker container exec -it db2 bash -c "su - db2inst1"`

  - `$ db2`

  - `db2 => activate database db`

  - `db2 => connecto to db`

  - `db2 => create table if not exists items ( id varchar(50) not null primary key, name varchar(50) default '', price int default 0, created bigint default 0, updated bigint default 0 );`

- MongoDB

  - `$ docker run -d --name mongo -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=user -e MONGO_INITDB_ROOT_PASSWORD=pass -e MONGO_INITDB_DATABASE=db mongo`

  - `$ docker container exec -it mongo bash`

  - `# mongo db -u user --authenticationDatabase admin`

  - `> use db`

  - `> db.createCollection('db');`

- CouchBase

  - `$ docker run -d --name couchbase -p 8091-8094:8091-8094 -p 11210:11210 couchbase`

  - `http://localhost:8091/`

    - Create `cluster` cluster.

    - Create `db` buckets.

  - `$ docker container exec -it couchbase cbq --user user`

  - `cbq> create primary index on default:db`;`

    - Create index.

  - `cbq> \quit;`

- ElasticSearch

  - `$ docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 -e discovery.type=single-node docker.elastic.co/elasticsearch/elasticsearch:7.13.2`

  - `$ docker container exec -it elasticsearch bash`

  - `# bin/elasticsearch-plugin install analysis-kuromoji`

  - `# exit`

  - `$ docker restart elasticsearch`

  - `$ curl -X PUT "http://localhost:9200/db?pretty&pretty"`

    - index(db) 作成


- Redis

  - `$ docker run --name redis -d -p 6379:6379 redis`

## Licensing

This code is licensed under MIT.


## Copyright

2022 K.Kimura @ Juge.Me all rights reserved.

