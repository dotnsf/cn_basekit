//. db_memcached.js
var express = require( 'express' ),
    multer = require( 'multer' ),
    bodyParser = require( 'body-parser' ),
    request = require( 'request' ),
    uuidv1 = require( 'uuid/v1' ),
    api = express();

var settings = require( '../settings' );

//. env values
var database_url = 'MEMCACHED_DATABASE_URL' in process.env ? process.env.MEMCACHED_DATABASE_URL : settings.memcached_database_url; 

var Memcached = require( 'memcached' );
var memcached = new Memcached( database_url );  //. こっちだと動くっぽい・・・・

//. POST メソッドで JSON データを受け取れるようにする
api.use( multer( { dest: '../tmp/' } ).single( 'image' ) );
api.use( bodyParser.urlencoded( { extended: true } ) );
api.use( bodyParser.json() );
api.use( express.Router() );


api.createItem = function( item ){
  return new Promise( ( resolve, reject ) => {
    if( memcached ){
      if( !item.id ){
        item.id = uuidv1();
      }
      var t = ( new Date() ).getTime();
      item.created = t;
      item.updated = t;

      memcached.set( item.id, item, 0, function( err, result ){
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
    if( memcached ){
      var cnt = 0;
      var results = [];
      for( var i = 0; i < items.length; i ++ ){
        if( !items[i].id ){
          items[i].id = uuidv1();
        }
        var t = ( new Date() ).getTime();
        items[i].created = t;
        items[i].updated = t;

        memcached.set( items[i].id, items[i], 0, function( err, result ){
          if( err ){
            console.log( err );
          }else{
            results.push( result );
          }

          cnt ++;
          if( cnt == items.length ){
            resolve( { status: true, results: results } );
          }
        });
      }
    }else{
      resolve( { status: false, error: 'no memcached' } );
    }
  });
};

api.readItem = function( item_id ){
  return new Promise( async ( resolve, reject ) => {
    if( memcached ){
      if( !item_id ){
        resolve( { status: false, error: 'id not specified.' } );
      }else{
        memcached.get( item_id, function( err, item ){
          if( err ){
            resolve( { status: false, error: err } );
          }else{
            resolve( { status: true, result: item } );
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
    if( memcached ){
      var r = await api.getAll();
      if( r && r.status ){
        resolve( { status: true, results: r.results } );
      }else{
        resolve( { status: false, error: r.error } );
      }
    }else{
      resolve( { status: false, error: 'no db' } );
    }
  });
};

api.queryItems = function( key, limit, start ){
  return new Promise( async ( resolve, reject ) => {
    if( memcached ){
      var r = await api.getAll();
      if( r && r.status ){
        var results = [];
        r.results.forEach( function( result ){
          //if( result.name.indexOf( key ) > -1 ){
          if( result.name.indexOf( key ) > -1 || result.user.indexOf( key ) > -1 ){ //. #22
            results.push( result );
          }
        });

        resolve( { status: true, results: results } );
      }else{
        resolve( { status: false, error: r.error } );
      }
    }else{
      resolve( { status: false, error: 'no db' } );
    }
  });
};

api.updateItem = function( item ){
  return new Promise( ( resolve, reject ) => {
    if( memcached ){
      memcached.replace( item.id, item, function( err, result ){
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

api.deleteItem = function( item_id ){
  return new Promise( ( resolve, reject ) => {
    if( memcached ){
      if( !item_id ){
        resolve( { status: false, error: 'no id specified.' } );
      }else{
        memcached.del( item_id, function( err, result ){
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
    if( memcached ){
      var r = await api.getAll();
      if( r && r.status ){
        var cnt = 0;
        r.results.forEach( function( item ){
          memcached.del( item.id, function( err, result ){
            if( err ){
              console.log( err );
            }

            cnt ++;
            if( cnt == r.results.length ){
              resolve( { status: true } );
            }
          });
        });
      }else{
        resolve( { status: false, error: e.error } );
      }
      memcached.flush( function( err, result ){
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


//. #20
api.getAll = async function(){
  return new Promise( async ( resolve, reject ) => {
    if( memcached ){
      memcached.items( function( err, results ){
        if( err ){
          resolve( { status: false, error: err } );
        }else{
          var cnt = 0;
          var values = [];
          results.forEach( function( result ){
            var obj_keys = Object.keys( result );
            if( obj_keys.length == 0 ){
              resolve( { status: true, results: [] } );
            }else{
              Object.keys( result ).forEach( function( slabid ){
                if( slabid != 'server' ){
                  memcached.cachedump( result.server, parseInt( slabid ), result[slabid].number, function( err, key_results ){
                    var keys = [];
                    if( 'length' in key_results ){
                      key_results.forEach( function( key_result ){
                        var key = key_result['key'];
                        keys.push( key );
                      });
                    }else{
                      var key = key_results['key'];
                      keys.push( key );
                    }
  
                    memcached.getMulti( keys, function( err, data ){
                      if( !err ){
                        keys.forEach( function( key ){
                          values.push( data[key] );
                        });
                      }

                      cnt ++;
                      if( cnt == results.length ){
                        resolve( { status: true, results: values } );
                      }
                    });
                  });
                }
              });
            }
          });
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
