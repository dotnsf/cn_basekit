//. DB
exports.postgres_database_url = 'postgres://user:pass@localhost:5432/db';
exports.mysql_database_url = 'mysql://user:pass@localhost:3306/db';
exports.db2_database_url = 'DATABASE=db;HOSTNAME=localhost;UID=db2inst1;PWD=db2inst1;PORT=50000;PROTOCOL=TCPIP';
exports.mongo_database_url = 'mongodb://user:pass@localhost:27017/local?authSource=admin';
exports.couchbase_database_url = 'couchbase://user:password@localhost/db';
exports.elasticsearch_database_url = 'http://localhost:9200/db';
exports.couchdb_database_url = 'http://user:pass@localhost:5984/db';

exports.dbtype = '';

//. Redis
exports.redis_database_url = ''; //'redis://localhost:6379';

//. Auth0
exports.auth0_callback_url = 'http://localhost:8080/auth0/callback';
exports.auth0_client_id = '';
exports.auth0_client_secret = '';
exports.auth0_domain = '';

//. AppID
exports.appid_region = 'us-south';
exports.appid_tenantId = '';
exports.appid_apiKey = '';
exports.appid_secret = '';
exports.appid_clientId = '';
exports.appid_redirectUri = 'http://localhost:8080/appid/callback';
exports.appid_oauthServerUrl = 'https://' + exports.appid_region + '.appid.cloud.ibm.com/oauth/v4/' + exports.tenantId;

exports.authtype = '';
