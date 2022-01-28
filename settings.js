//. DB
exports.postgres_database_url = 'postgres://user:pass@localhost:5432/db';
exports.mysql_database_url = 'mysql://user:pass@localhost:3306/db';
exports.couchdb_database_url = 'http://user:pass@localhost:5984/db';

exports.dbtype = 'postgres';

//. Redis
exports.redis_database_url = 'redis://localhost:6379';

//. Auth0
exports.auth0_callback_url = 'http://localhost:8080/auth0/callback';
exports.auth0_client_id = '';
exports.auth0_client_secret = '';
exports.auth0_domain = '';
