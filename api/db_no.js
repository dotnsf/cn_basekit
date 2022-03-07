//. db_no.js
var express = require( 'express' ),
    multer = require( 'multer' ),
    bodyParser = require( 'body-parser' ),
    request = require( 'request' ),
    uuidv1 = require( 'uuid/v1' ),
    api = express();

var settings = require( '../settings' );

//. memory db
var db = {};

var settings_cors = 'CORS' in process.env ? process.env.CORS : '';
api.all( '/*', function( req, res, next ){
  if( settings_cors ){
    res.setHeader( 'Access-Control-Allow-Origin', settings_cors );
    res.setHeader( 'Vary', 'Origin' );
  }
  next();
});

//. POST メソッドで JSON データを受け取れるようにする
api.use( multer( { dest: '../tmp/' } ).single( 'image' ) );
api.use( bodyParser.urlencoded( { extended: true } ) );
api.use( bodyParser.json() );
api.use( express.Router() );


api.createItem = function( item ){
  return new Promise( ( resolve, reject ) => {
    if( !item.id ){
      item.id = uuidv1();
    }

    if( db[item.id] ){
      resolve( { status: false, error: 'id in use.' } );
    }else{
      var t = ( new Date() ).getTime();
      item.created = t;
      item.updated = t;

      db[item.id] = item;

      resolve( { status: true, result: item } );
    }
  });
};

api.createItems = function( items ){
  return new Promise( ( resolve, reject ) => {
    var count = 0;
    for( var i = 0; i < items.length; i ++ ){
      var item = items[i];
      if( !item.id ){
        item.id = uuidv1();
      }

      if( db[item.id] ){
      }else{
        var t = ( new Date() ).getTime();
        item.created = t;
        item.updated = t;

        db[item.id] = item;
        count ++;
      }
    }

    resolve( { status: true, count: count } );
  });
};

api.readItem = function( item_id ){
  return new Promise( async ( resolve, reject ) => {
    if( !item_id ){
      resolve( { status: false, error: 'id not specified.' } );
    }else{
      if( !db[item_id] ){
        resolve( { status: false, error: 'no data found.' } );
      }else{
        resolve( { status: true, result: db[item_id] } );
      }
    }
  });
};

api.readItems = function( limit, start ){
  return new Promise( async ( resolve, reject ) => {
    var items = [];
    Object.keys( db ).forEach( function( key ){
      items.push( db[key] );
    });

    if( start ){
      items.splice( 0, start );
    }
    if( limit ){
      items.splice( limit )
    }

    resolve( { status: true, results: items } );
  });
};

api.queryItems = function( key, limit, start ){
  return new Promise( async ( resolve, reject ) => {
    var items = [];
    Object.keys( db ).forEach( function( id ){
      if( db[id].name.indexOf( key ) > -1 || db[id].user.indexOf( key ) > -1 ){
        items.push( db[id] );
      }
    });

    if( start ){
      items.splice( 0, start );
    }
    if( limit ){
      items.splice( limit )
    }

    resolve( { status: true, results: items } );
  });
};

api.updateItem = function( item ){
  return new Promise( ( resolve, reject ) => {
    if( !item.id ){
      resolve( { status: false, error: 'no id specified.' } );
    }else{
      if( !db[item.id] ){
        resolve( { status: false, error: 'no data found.' } );
      }else{
        var t = ( new Date() ).getTime();
        item.updated = t;

        db[item.id] = item;
        resolve( { status: true, result: item } );
      }
    }
  });
};

api.deleteItem = function( item_id ){
  return new Promise( ( resolve, reject ) => {
    if( !item_id ){
      resolve( { status: false, error: 'no id specified.' } );
    }else{
      if( !db[item_id] ){
        resolve( { status: false, error: 'no data found.' } );
      }else{
        delete db[item_id];
        resolve( { status: true } );
      }
    }
  });
};

api.deleteItems = async function(){
  return new Promise( async ( resolve, reject ) => {
    db = {};
    resolve( { status: true } );
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
