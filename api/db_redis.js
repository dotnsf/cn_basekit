//. db_redis.js
var express = require( 'express' ),
    multer = require( 'multer' ),
    bodyParser = require( 'body-parser' ),
    fs = require( 'fs' ),
    uuidv1 = require( 'uuid/v1' ),
    api = express();

var settings = require( '../settings' );

var settings_redis_url = 'REDIS_DATABASE_URL' in process.env ? process.env.REDIS_DATABASE_URL : settings.redis_database_url; 

//. Redis
var redis = require( 'redis' );
//var RedisStore = require( 'connect-redis' )( session );
var redisClient = null;
if( settings_redis_url ){
  redisClient = redis.createClient( settings_redis_url, {} );
  console.log( 'redis connected' );
  redisClient.on( 'error', function( err ){
    console.error( 'on error redis', err );
    try_reconnect( 1000 );
  });
}

function try_reconnect( ts ){
  setTimeout( function(){
    console.log( 'reconnecting...' );
    redisClient = redis.createClient( settings_redis_url, {} );
    redisClient.on( 'error', function( err ){
      console.error( 'on error redis', err );
      ts = ( ts < 10000 ? ( ts + 1000 ) : ts );
      try_reconnect( ts );
    });
  }, ts );
}

api.use( multer( { dest: './tmp/' } ).single( 'image' ) );
api.use( bodyParser.urlencoded( { extended: true } ) );
api.use( bodyParser.json() );
api.use( express.Router() );

//. Create
api.createItem = function( item ){
  return new Promise( ( resolve, reject ) => {
    if( redisClient ){
      if( !item.id ){
        item.id = uuidv1();
      }
      var t = ( new Date() ).getTime();
      item.created = t;
      item.updated = t;
      redisClient.set( item.id, JSON.stringify( item ), function( err ){
        if( err ){
          console.log( err );
          resolve( { status: false, error: err } );
        }else{
          resolve( { status: true, result: item } );
        }
      });
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

//. Read
api.readItem = function( item_id ){
  return new Promise( ( resolve, reject ) => {
    if( redisClient ){
      redisClient.get( item_id, function( err, result ){
        if( err ){
          console.log( err );
          resolve( { status: false, error: err } );
        }else{
          resolve( { status: true, result: JSON.parse( result ) } );
        }
      });
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

//. Reads
api.readItems = function( limit, offset ){
  return new Promise( ( resolve, reject ) => {
    if( redisClient ){
      redisClient.keys( '*', function( err, results ){
        if( err ){
          console.log( { err } );
          resolve( { status: false, error: err } );
        }else{
          var items = [];
          var cnt = 0;
          for( var i = 0; i < results.length; i ++ ){
            if( results[i].indexOf( ':' ) == -1 ){
              redisClient.get( results[i], function( err, item ){
                items.push( JSON.parse( item ) );
                cnt ++;

                if( cnt == results.length ){
                  if( offset ){
                    items.splice( 0, offset );
                  }
                  if( limit ){
                    items.splice( limit )
                  }

                  resolve( { status: true, results: items } );
                }
              });
            }else{
              cnt ++;

              if( cnt == results.length ){
                if( offset ){
                  items.splice( 0, offset );
                }
                if( limit ){
                  items.splice( limit )
                }

                resolve( { status: true, results: items } );
              }
            }
          }
        }
      });
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

//. update
api.updateitem = function( item ){
  return new promise( ( resolve, reject ) => {
    if( redisClient ){
      if( !item.id ){
        resolve( { status: false, error: 'id not specified.' } );
      }else{
        var t = ( new Date() ).getTime();
        item.updated = t;
        redisClient.set( item.id, item, function( err ){
          if( err ){
            console.log( err );
            resolve( { status: false, error: err } );
          }else{
            resolve( { status: true, result: item } );
          }
        });
      }
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

//. Delete
api.deleteItem = function( item_id ){
  return new Promise( ( resolve, reject ) => {
    if( redisClient ){
      redisClient.del( item_id, function( err, result ){
        if( err ){
          console.log( err );
          resolve( { status: false, error: err } );
        }else{
          resolve( { status: true, result: result } );
        }
      });
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};


api.post( '/item', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item = req.body;
  api.createItem( item ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.get( '/item/:id', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item_id = req.params.id;
  api.readItem( item_id ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.get( '/items', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var limit = req.query.limit ? parseInt( limit ) : 0;
  var offset = req.query.offset ? parseInt( offset ) : 0;
  api.readItems( limit, offset ).then( function( results ){
    res.status( results.status ? 200 : 400 );
    res.write( JSON.stringify( results, null, 2 ) );
    res.end();
  });
});

api.put( '/item/:id', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item_id = req.params.id;
  var item = req.body;
  item.id = item_id;
  api.updateItem( item ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.delete( '/item/:id', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item_id = req.params.id;
  api.deleteItem( item_id ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

//. api をエクスポート
module.exports = { api: api, redisClient: redisClient };
