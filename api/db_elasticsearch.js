//. db_elasticsearch.js
var express = require( 'express' ),
    multer = require( 'multer' ),
    bodyParser = require( 'body-parser' ),
    request = require( 'request' ),
    uuidv1 = require( 'uuid/v1' ),
    api = express();

var settings = require( '../settings' );

//. env values
var database_url = 'ELASTICSEARCH_DATABASE_URL' in process.env ? process.env.ELASTICSEARCH_DATABASE_URL : settings.elasticsearch_database_url; 

var db_headers = { 'Content-Type': 'application/json' };

//. POST メソッドで JSON データを受け取れるようにする
api.use( multer( { dest: '../tmp/' } ).single( 'image' ) );
api.use( bodyParser.urlencoded( { extended: true } ) );
api.use( bodyParser.json() );
api.use( express.Router() );


//. 新規作成用関数
api.createItem = function( item, id ){
  return new Promise( ( resolve, reject ) => {
    var option = {
      url: database_url + '/_doc/' + id + '?pretty&pretty',
      method: 'PUT',
      json: item,
      headers: db_headers
    };
    request( option, ( err, res, body ) => {
      if( err ){
        resolve( { status: false, error: err } );
      }else{
        resolve( { status: true, result: body } );
      }
    });
  });
};

//. １件取得用関数
api.readItem = function( id ){
  return new Promise( ( resolve, reject ) => {
    if( id ){
      var option = {
        url: database_url + '/_doc/' + id + '?pretty&pretty',
        method: 'GET',
        headers: db_headers
      };
      request( option, ( err, res, doc ) => {
        if( err ){
          resolve( { status: false, error: err } );
        }else{
          //doc = JSON.parse( doc );
          delete doc['found'];
          delete doc['_source'];
          resolve( { status: true, result: doc } );
        }
      });
    }else{
      resolve( { status: false, error: 'no id' } );
    }
  });
};

//. 複数件取得用関数
api.readItems = function( limit, start ){
  return new Promise( ( resolve, reject ) => {
    var json = { query: { match_all: {} } };
    if( limit ){ json.size = limit; }
    if( start ){ json.from = start; }
    var url = database_url + '/_search?pretty';
    var option = {
      url: url,
      method: 'GET',
      json: json,
      headers: db_headers
    };
    request( option, ( err, res, body ) => {
      if( err ){
        resolve( { status: false, error: err } );
      }else{
        var items = [];
        if( body && body.hits && body.hits.hits ){
          body.hits.hits.forEach( function( item ){
            items.push( item._source );
          });
        }

        resolve( { status: true, results: items } );
      }
    });
  });
};

api.queryItems = function( key, limit, start ){
  return new Promise( ( resolve, reject ) => {
    var json = { query: { match: { name: key } } };
    if( limit ){ json.size = limit; }
    if( start ){ json.from = start; }
    var url = database_url + '/_search?pretty';
    var option = {
      url: url,
      method: 'GET',
      json: json,
      headers: db_headers
    };
    request( option, ( err, res, body ) => {
      if( err ){
        resolve( { status: false, error: err } );
      }else{
        var items = [];
        if( body && body.hits && body.hits.hits ){
          body.hits.hits.forEach( function( item ){
            items.push( item._source );
          });
        }

        resolve( { status: true, results: items } );
      }
    });
  });
};

//. １件更新用関数
api.updateItem = function( item ){
  return new Promise( ( resolve, reject ) => {
    if( !item.id ){
      resolve( { status: false, error: 'id needed.' } );
    }else{
      var option = {
        url: database_url + '/_doc/' + item.id + '?pretty&pretty',
        method: 'POST',
        json: item,
        headers: db_headers
      };
      request( option, ( err, res, body ) => {
        if( err ){
          resolve( { status: false, error: err } );
        }else{
          resolve( { status: true, result: body } );
        }
      });
    }
  });
};

//. １件削除用関数
api.deleteItem = function( id ){
  return new Promise( ( resolve, reject ) => {
    if( !id ){
      resolve( { status: false, error: 'id needed.' } );
    }else{
      var option = {
        url: database_url + '/_doc/' + id + '?pretty&pretty',
        method: 'DELETE',
        headers: db_headers
      };
      request( option, ( err, res, result ) => {
        if( err ){
          resolve( { status: false, error: err } );
        }else{
          resolve( { status: true, result: result } );
        }
      });
    }
  });
};

api.deleteItems = function(){
  return new Promise( ( resolve, reject ) => {
    var url = database_url + '/_search?pretty';
    var option = {
      url: url,
      method: 'GET',
      json: { query: { match_all: {} } },
      headers: db_headers
    };
    request( option, ( err, res, body ) => {
      if( err ){
        resolve( { status: false, error: err } );
      }else{
        var ids = [];
        if( body && body.hits && body.hits.hits ){
          body.hits.hits.forEach( function( item ){
            ids.push( '{"index":{"_id":"' + item._source.id + '"}}\n' );  //. item._id
          });
        }

        url = database_url + '/_bulk?pretty&pretty';
        option = {
          url: url,
          method: 'DELETE',
          json: { ids },
          headers: db_headers
        };
        request( option, ( err, res, body ) => {
          if( err ){
            resolve( { status: false, error: err } );
          }else{
            resolve( { status: true } );
          }
        });
      }
    });
  });
};


api.post( '/item', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item = req.body;
  item.price = parseInt( item.price );
  if( !item.id ){
    item.id = uuidv1();
  }
  var t = ( new Date() ).getTime();
  item.created = t;
  item.updated = t;
  api.createItem( item, item.id ).then( function( result ){
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
  //item.id = item_id;
  item._id = item_id;
  api.updateItem( doc ).then( function( result ){
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
