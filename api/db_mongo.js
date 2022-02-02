//. db_mongo.js
var express = require( 'express' ),
    multer = require( 'multer' ),
    bodyParser = require( 'body-parser' ),
    request = require( 'request' ),
    uuidv1 = require( 'uuid/v1' ),
    api = express();

var settings = require( '../settings' );

//. env values
var database_url = 'MONGO_DATABASE_URL' in process.env ? process.env.MONGO_DATABASE_URL : settings.mongo_database_url; 

var dbname = '';
var tmp = database_url.split( '?' );
if( tmp.length > 0 ){
  tmp = tmp[0].split( '/' );
  if( tmp.length > 0 ){
    dbname = tmp[tmp.length-1];
  }
}

var mongodb = require( 'mongodb' );
var mongoClient = mongodb.MongoClient;
var collection = null;
mongoClient.connect( database_url, function( err, client ){
  if( err ){
    console.log( err );
  }else{
    var db = client.db( dbname );
    collection = db.collection( dbname );
  }
});

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

      collection.insertOne( item, function( err, result ){
        if( err ){
          console.log( err );
          resolve( { status: false, error: err } );
        }else{
          resolve( { status: true, result: result } );
        }
      });
    }else{
      resolve( { status: false, error: 'no db' } );
    }
  });
};

api.createItems= function( items ){
  return new Promise( ( resolve, reject ) => {
    if( collection ){
      for( var i = 0; i < items.length; i ++ ){
        if( !items[i].id ){
          items[i].id = uuidv1();
        }
        var t = ( new Date() ).getTime();
        items[i].created = t;
        items[i].updated = t;
      }

      collection.insertMany( items, function( err, result ){
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

api.readItem = function( item_id ){
  return new Promise( async ( resolve, reject ) => {
    if( collection ){
      if( !item_id ){
        resolve( { status: false, error: 'id not specified.' } );
      }else{
        var items = await collection.find( { id: item_id } ).toArray();
        if( items && items.length > 0 ){
          resolve( { status: true, result: items[0] } );
        }else{
          resolve( { status: false, error: 'no data' } );
        }
      }
    }else{
      resolve( { status: false, error: 'no db' } );
    }
  });
};

api.readItems = function( limit, start ){
  return new Promise( async ( resolve, reject ) => {
    if( collection ){
      var items = await collection.find({}).toArray();

      if( start ){
        items.splice( 0, start );
      }
      if( limit ){
        items.splice( limit )
      }

      resolve( { status: true, results: items } );
    }else{
      resolve( { status: false, error: 'no db' } );
    }
  });
};

api.queryItems = function( key, limit, start ){
  return new Promise( async ( resolve, reject ) => {
    if( collection ){
      var items = await collection.find( { name: key } ).toArray();

      if( start ){
        items.splice( 0, start );
      }
      if( limit ){
        items.splice( limit )
      }

      resolve( { status: true, results: items } );
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

        collection.updateOne( { id: item.id }, { $set: item }, function( err, result ){
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
        collection.deleteMany( { id: item_id }, function( err, result ){
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
    if( collection ){
      collection.deleteMany( {}, function( err, result ){
        if( err ){
          console.log( err );
          resolve( { status: false, error: err } );
        }else{
          resolve( { status: true, result: result } );
        }
      });
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
    item._id = item.id;
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
