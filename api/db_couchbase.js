//. db_couchbase.js
var express = require( 'express' ),
    multer = require( 'multer' ),
    bodyParser = require( 'body-parser' ),
    request = require( 'request' ),
    uuidv1 = require( 'uuid/v1' ),
    api = express();

var settings = require( '../settings' );

//. env values
var database_url = 'COUCHBASE_DATABASE_URL' in process.env ? process.env.COUCHBASE_DATABASE_URL : settings.couchbase_database_url; 
console.log( 'database_url1 = ' + database_url );

var user = '';
var pass = '';
var bucketname = '';
var tmp = database_url.split( '?' );
if( tmp.length > 0 ){
  tmp = tmp[0].split( '/' );
  if( tmp.length > 3 ){
    bucketname = tmp[3];
    tmp = tmp[2].split( '@' );
    if( tmp.length > 1 ){
      database_url = 'couchbase://' + tmp[1];
      tmp = tmp[0].split( ':' );
      if( tmp.length > 1 ){
        user = tmp[0];
        pass = tmp[1];
      }
    }
  }
}


var couchbase = require( 'couchbase' );
var cluster = new couchbase.Cluster( database_url, { username: user, password: pass } );
var bucket = cluster.bucket( bucketname );
var collection = bucket.defaultCollection();

//. POST メソッドで JSON データを受け取れるようにする
api.use( multer( { dest: '../tmp/' } ).single( 'image' ) );
api.use( bodyParser.urlencoded( { extended: true } ) );
api.use( bodyParser.json() );
api.use( express.Router() );


api.createItem = function( item ){
  return new Promise( ( resolve, reject ) => {
    if( collection ){
      if( !item.id ){
        item.id = uuidv1();
      }
      var t = ( new Date() ).getTime();
      item.created = t;
      item.updated = t;

      //collection.upsert( item.id, item, function( err, result ){
      collection.insert( item.id, item, function( err, result ){
        if( err ){
          console.log( err );
          resolve( { status: false, error: err } );
        }else{
          resolve( { status: true, result: result } );
        }
      });
    }else{
      resolve( { status: false, error: 'no collection' } );
    }
  });
};

api.createItems = function( items ){
  return new Promise( ( resolve, reject ) => {
    if( collection ){
      var num = 0;
      var count = 0;

      var t = ( new Date() ).getTime();
      for( var i = 0; i < items.length; i ++ ){
        if( !items[i].id ){
          items[i].id = uuidv1();
        }
        items[i].created = t;
        items[i].updated = t;

        //collection.upsert( item.id, item, function( err, result ){
        collection.insert( items[i].id, items[i], function( err, result ){
          num ++;
          if( err ){
            console.log( err );
          }else{
            count ++;
          }

          if( num == items.length ){
            resolve( { status: true, count: count } );
          }
        });
      }
    }else{
      resolve( { status: false, error: 'no collection' } );
    }
  });
};

api.readItem = function( item_id ){
  return new Promise( async ( resolve, reject ) => {
    if( collection ){
      if( !item_id ){
        resolve( { status: false, error: 'id not specified.' } );
      }else{
        collection.get( item_id, function( err, result ){
          if( err ){
            console.log( err );
            resolve( { status: false, error: err } );
          }else{
            resolve( { status: true, result: result.value } );
          }
        });
      }
    }else{
      resolve( { status: false, error: 'no db' } );
    }
  });
};

api.readItems = function( limit, start ){
  return new Promise( async ( resolve, reject ) => {
    if( cluster && bucket ){
      //var sql = 'SELECT id, name, price, created, updated from \`' + bucketname + '\`';
      var sql = 'SELECT id, name, price, created, updated from \`' + bucketname + '\`';
      try{
        var result = await cluster.query( sql );
        if( result && result.rows ){
          var items = [];
          result.rows.forEach( function( row ){
            items.push( row );
          });

          if( start ){
            items.splice( 0, start );
          }
          if( limit ){
            items.splice( limit )
          }

          resolve( { status: true, results: items } );
        }else{
          resolve( { status: false, error: 'no data.' } );
        }
      }catch( e ){
        console.log( e );   //. "PlanningFailureError"
        resolve( { status: false, error: e } );
      }
    }else{
      resolve( { status: false, error: 'no db' } );
    }
  });
};

api.queryItems = function( key, limit, start ){
  return new Promise( async ( resolve, reject ) => {
    if( cluster && bucket ){
      var sql = 'SELECT id, name, price, created, updated from \`' + bucketname + '\` where name like \'%' + key + '%\'';
      try{
        var result = await cluster.query( sql );
        if( result && result.rows ){
          var items = [];
          result.rows.forEach( function( row ){
            items.push( row );
          });

          if( start ){
            items.splice( 0, start );
          }
          if( limit ){
            items.splice( limit )
          }

          resolve( { status: true, results: items } );
        }else{
          resolve( { status: false, error: 'no data.' } );
        }
      }catch( e ){
        resolve( { status: false, error: e } );
      }
    }else{
      resolve( { status: false, error: 'no db' } );
    }
  });
};

api.updateItem = function( item ){
  return new Promise( ( resolve, reject ) => {
    if( collection ){
      if( !item.id ){
        resolve( { status: false, error: 'no id specified.' } );
      }else{
        var t = ( new Date() ).getTime();
        item.updated = t;

        collection.upsert( item.id, item, function( err, result ){
          if( err ){
            console.log( err );
            resolve( { status: false, error: err } );
          }else{
            resolve( { status: true, result: result } );
          }
        });
      }
    }else{
      resolve( { status: false, error: 'no db' } );
    }
  });
};

api.deleteItem = function( item_id ){
  return new Promise( ( resolve, reject ) => {
    if( collection ){
      if( !item_id ){
        resolve( { status: false, error: 'no id specified.' } );
      }else{
        collection.remove( item_id, function( err, result ){
          if( err ){
            console.log( err );
            resolve( { status: false, error: err } );
          }else{
            resolve( { status: true, result: result } );
          }
        });
      }
    }else{
      resolve( { status: false, error: 'no db' } );
    }
  });
};

api.deleteItems = async function(){
  return new Promise( async ( resolve, reject ) => {
    if( cluster && collection && bucket ){
      var sql = 'SELECT id from \`' + bucketname + '\`';
      try{
        var result = await cluster.query( sql );
        if( result && result.rows ){
          result.rows.forEach( async function( row ){
            await collection.remove( row.id );
          });

          resolve( { status: true } );
        }else{
          resolve( { status: false, error: 'no data.' } );
        }
      }catch( e ){
        resolve( { status: false, error: e } );
      }
    }else{
      resolve( { status: false, error: 'no db' } );
    }
  });
};


api.post( '/item', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item = req.body;
  item.price = parseInt( item.price );
  if( !item.id ){
    item.id = uuidv1();
  }

  api.createItem( item ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.post( '/items', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var items = req.body;
  items.forEach( function( item ){
    item.price = parseInt( item.price );
    if( !item.id ){
      item.id = uuidv1();
    }
  });

  api.createItems( items ).then( function( result ){
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

  var limit = 0;
  var start = 0;
  if( req.query.limit ){
    try{
      limit = parseInt( req.query.limit );
    }catch( e ){
    }
  }
  if( req.query.start ){
    try{
      start = parseInt( req.query.start );
    }catch( e ){
    }
  }
  api.readItems( limit, start ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.get( '/items/:key', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var key = req.params.key;
  api.queryItems( key ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.put( '/item/:id', function( req, res ){
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

api.delete( '/item/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item_id = req.params.id;
  api.deleteItem( item_id ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.delete( '/items', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  api.deleteItems().then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});


//. api をエクスポート
module.exports = api;
