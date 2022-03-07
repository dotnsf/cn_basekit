//. db_db2.js

var express = require( 'express' ),
    multer = require( 'multer' ),
    bodyParser = require( 'body-parser' ),
    fs = require( 'fs' ),
    uuidv1 = require( 'uuid/v1' ),
    api = express();

var settings = require( '../settings' );

var Pool = require( 'ibm_db' ).Pool;
var database_url = 'DB2_DATABASE_URL' in process.env ? process.env.DB2_DATABASE_URL : settings.db2_database_url; 

var settings_cors = 'CORS' in process.env ? process.env.CORS : '';
api.all( '/*', function( req, res, next ){
  if( settings_cors ){
    res.setHeader( 'Access-Control-Allow-Origin', settings_cors );
    res.setHeader( 'Vary', 'Origin' );
  }
  next();
});

var pool = null;
if( database_url ){
  console.log( 'database_url = ' + database_url );
  pool = new Pool();
  pool.init( 5, database_url );  //. 5: Pool size

  /*
  pool.on( 'error', function( err ){
    console.log( 'error on working', err );
    try_reconnect( 1000 );
  });
  */
}

function try_reconnect( ts ){
  setTimeout( function(){
    console.log( 'reconnecting...' );
    pool = new Pool();
    pool.init( 5, database_url );
    pool.on( 'error', function( err ){
      console.log( 'error on retry(' + ts + ')', err );
      ts = ( ts < 10000 ? ( ts + 1000 ) : ts );
      try_reconnect( ts );
    });
  }, ts );
}


api.use( multer( { dest: '../tmp/' } ).single( 'image' ) );
api.use( bodyParser.urlencoded( { extended: true } ) );
api.use( bodyParser.json() );
api.use( express.Router() );

//. Create
api.createItem = async function( item ){
  return new Promise( async ( resolve, reject ) => {
    try{
      if( pool ){
        pool.open( database_url, function( err, conn ){
          if( err ){
            if( conn ){
              conn.close();
            }
            console.log( err );
            resolve( { status: false, error: err } );
          }else{
            var sql = 'insert into items( "id", "name", "price", "user", "created", "updated" ) values ( ?, ?, ?, ?, ?, ? )';
            if( !item.id ){
              item.id = uuidv1();
            }
            var t = ( new Date() ).getTime();
            item.created = t;
            item.updated = t;

            conn.query( sql, [ item.id, item.name, item.price, item.user, item.created, item.updated ], function( err, result ){
              if( err ){
                conn.close();
                console.log( err );
                resolve( { status: false, error: err } );
              }else{
                conn.close();
                resolve( { status: true, result: result } );
              }
            });
          }
        });
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }catch( e ){
      console.log( e );
      resolve( { status: false, error: err } );
    }finally{
    }
  });
};

api.createItems = async function( items ){
  return new Promise( async ( resolve, reject ) => {
    try{
      if( pool ){
        pool.open( database_url, function( err, conn ){
          if( err ){
            if( conn ){
              conn.close();
            }
            console.log( err );
            resolve( { status: false, error: err } );
          }else{
            var num = 0;
            var count = 0;

            var sql = 'insert into items( "id", "name", "price", "user", "created", "updated" ) values ( ?, ?, ?, ?, ?, ? )';
            for( var i = 0; i < items.length; i ++ ){
              var item = items[i];
              if( !item.id ){
                item.id = uuidv1();
              }
              var t = ( new Date() ).getTime();
              item.created = t;
              item.updated = t;

              conn.query( sql, [ item.id, item.name, item.price, item.user, item.created, item.updated ], function( err, result ){
                num ++;
                if( err ){
                  console.log( err );
                }else{
                  count ++;
                }

                if( num == items.length ){
                  conn.close();
                  resolve( { status: true, count: count } );
                }
              });
            }
          }
        });
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }catch( e ){
      console.log( e );
      resolve( { status: false, error: err } );
    }finally{
    }
  });
};

//. Read
api.readItem = async function( item_id ){
  return new Promise( async ( resolve, reject ) => {
    try{
      if( pool ){
        pool.open( database_url, function( err, conn ){
          if( err ){
            if( conn ){
              conn.close();
            }
            console.log( err );
            resolve( { status: false, error: err } );
          }else{
            var sql = 'select "id", "name", "price", "user", "created", "updated" from items where "id" = ?';
            conn.query( sql, [ item_id ], function( err, results ){
              if( err ){
                conn.close();
                console.log( err );
                resolve( { status: false, error: err } );
              }else{
                conn.close();
                if( results && results.length > 0 ){
                  resolve( { status: true, result: results[0] } );
                }else{
                  resolve( { status: false, error: 'no data' } );
                }
              }
            });
          }
        });
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }catch( e ){
      console.log( e );
      resolve( { status: false, error: err } );
    }finally{
    }
  });
};

//. Reads
api.readItems = async function( limit, offset ){
  return new Promise( async ( resolve, reject ) => {
    try{
      if( pool ){
        pool.open( database_url, function( err, conn ){
          if( err ){
            if( conn ){
              conn.close();
            }
            console.log( err );
            resolve( { status: false, error: err } );
          }else{
            var sql = 'select "id", "name", "price", "user", "created", "updated" from items order by "updated"';
            if( offset ){
              sql += " offset " + offset + " rows";
            }
            if( limit ){
              sql += " fetch first " + limit + " rows only";
            }
            conn.query( sql, [], function( err, results ){
              if( err ){
                conn.close();
                console.log( err );
                resolve( { status: false, error: err } );
              }else{
                conn.close();
                resolve( { status: true, results: results } );
              }
            });
          }
        });
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }catch( e ){
      console.log( e );
      resolve( { status: false, error: err } );
    }finally{
    }
  });
};

api.queryItems = async function( key, limit, offset ){
  return new Promise( async ( resolve, reject ) => {
    try{
      if( pool ){
        pool.open( database_url, function( err, conn ){
          if( err ){
            if( conn ){
              conn.close();
            }
            console.log( err );
            resolve( { status: false, error: err } );
          }else{
            var sql = 'select "id", "name", "price", "user", "created", "updated" from items where "name" like \'%' + key + '%\' or "user" like \'%' + key + '%\' order by "updated"';
            if( offset ){
              sql += " offset " + offset + " rows";
            }
            if( limit ){
              sql += " fetch first " + limit + " rows only";
            }
            conn.query( sql, [], function( err, results ){
              if( err ){
                conn.close();
                console.log( err );
                resolve( { status: false, error: err } );
              }else{
                conn.close();
                resolve( { status: true, results: results } );
              }
            });
          }
        });
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }catch( e ){
      console.log( e );
      resolve( { status: false, error: err } );
    }finally{
    }
  });
};

//. Update
api.updateItem = async function( item ){
  return new Promise( async ( resolve, reject ) => {
    try{
      if( pool ){
        pool.open( database_url, function( err, conn ){
          if( err ){
            if( conn ){
              conn.close();
            }
            console.log( err );
            resolve( { status: false, error: err } );
          }else{
            if( !item.id ){
              conn.close();
              resolve( { status: false, error: 'no id.' } );
            }else{
              var sql = 'update items set "name" = ?, "price" = ?, "user" = ?, "updated" = ? where "id" = ?';
              conn.query( sql, [ item.name, item.price, item.user, item.updated, item.id ], function( err, result ){
                if( err ){
                  conn.close();
                  console.log( err );
                  resolve( { status: false, error: err } );
                }else{
                  conn.close();
                  resolve( { status: true, result: result } );
                }
              });
            }
          }
        });
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }catch( e ){
      console.log( e );
      resolve( { status: false, error: err } );
    }finally{
    }
  });
};

//. Delete
api.deleteItem = async function( item_id ){
  return new Promise( async ( resolve, reject ) => {
    try{
      if( pool ){
        pool.open( database_url, function( err, conn ){
          if( err ){
            if( conn ){
              conn.close();
            }
            console.log( err );
            resolve( { status: false, error: err } );
          }else{
            if( !item_id ){
              conn.close();
              resolve( { status: false, error: 'no id.' } );
            }else{
              var sql = 'delete from items where "id" = ?';
              conn.query( sql, [ item_id ], function( err, result ){
                if( err ){
                  conn.close();
                  console.log( err );
                  resolve( { status: false, error: err } );
                }else{
                  conn.close();
                  resolve( { status: true, result: result } );
                }
              });
            }
          }
        });
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }catch( e ){
      console.log( e );
      resolve( { status: false, error: err } );
    }finally{
    }
  });
};

api.deleteItems = async function(){
  return new Promise( async ( resolve, reject ) => {
    try{
      if( pool ){
        pool.open( database_url, function( err, conn ){
          if( err ){
            if( conn ){
              conn.close();
            }
            console.log( err );
            resolve( { status: false, error: err } );
          }else{
            var sql = 'delete from items';
            conn.query( sql, [], function( err, result ){
              if( err ){
                conn.close();
                /*
                if( err.state == '01504' ){
                  //. https://knowledgebase.progress.com/articles/Article/000043103
                  console.log( result );
                  resolve( { status: true, result: result } );
                }else{
                  console.log( err );
                  resolve( { status: false, error: err } );
                }
                */
                //. https://stackoverflow.com/questions/70964021/warning-is-treated-as-error-when-executing-sql-delete-from-tablename-i
                if( err.sqlcode < 0 ){
                  console.log( err );
                  resolve( { status: false, error: err } );
                }else{
                  resolve( { status: true, result: result } );
                }
              }else{
                conn.close();
                resolve( { status: true, result: result } );
              }
            });
          }
        });
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }catch( e ){
      console.log( e );
      resolve( { status: false, error: err } );
    }finally{
    }
  });
};


api.post( '/item', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item = req.body;
  item.price = parseInt( item.price );
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

  var limit = req.query.limit ? parseInt( limit ) : 0;
  var offset = req.query.offset ? parseInt( offset ) : 0;
  api.readItems( limit, offset ).then( function( results ){
    res.status( results.status ? 200 : 400 );
    res.write( JSON.stringify( results, null, 2 ) );
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
