//. db_cloudant.js
var express = require( 'express' ),
    multer = require( 'multer' ),
    bodyParser = require( 'body-parser' ),
    request = require( 'request' ),
    uuidv1 = require( 'uuid/v1' ),
    api = express();

var settings = require( '../settings' );

//. env values
var database_url = 'COUCHDB_DATABASE_URL' in process.env ? process.env.COUCHDB_DATABASE_URL : settings.couchdb_database_url; 

var db = '';
var db_headers = { 'Accept': 'application/json' };

var tmp = database_url.split( '/' );
if( tmp.length > 0 ){
  db = tmp[tmp.length-1];
}

tmp = database_url.split( '//' );
if( tmp.length > 0 ){
  tmp = tmp[1].split( '@' );
  if( tmp.length > 0 ){
    var db_basic = Buffer.from( tmp[0] ).toString( 'base64' );
    db_headers['Authorization'] = 'Basic ' + db_basic;
  }
}

//. POST メソッドで JSON データを受け取れるようにする
api.use( multer( { dest: '../tmp/' } ).single( 'image' ) );
api.use( bodyParser.urlencoded( { extended: true } ) );
api.use( bodyParser.json() );
api.use( express.Router() );


//. 新規作成用関数
api.createDb = function( db ){
  return new Promise( ( resolve, reject ) => {
    if( db ){
      var option = {
        url: database_url,
        method: 'PUT',
        headers: db_headers
      };
      request( option, ( err, res, body ) => {
        if( err ){
          resolve( { status: false, error: err } );
        }else{
          body = JSON.parse( body );
          resolve( { status: true, db: body } );
        }
      });
    }else{
      resolve( { status: false, error: 'no db' } );
    }
  });
};

api.createDoc = function( db, doc, id ){
  return new Promise( ( resolve, reject ) => {
    if( db ){
      var option = {
        url: database_url + '/' + id,
        method: 'PUT',
        json: doc,
        headers: db_headers
      };
      request( option, ( err, res, body ) => {
        if( err ){
          resolve( { status: false, error: err } );
        }else{
          resolve( { status: true, doc: body } );
        }
      });
    }else{
      resolve( { status: false, error: 'no db' } );
    }
  });
};
api.createItem = async function( db, doc, id ){
  return await api.createDoc( db, doc, id );
};

//. 複数件取得用関数
api.getDbs = function( limit, start ){
  return new Promise( ( resolve, reject ) => {
    var url = database_url + '/_all_dbs';
    if( limit ){
      url += '?limit=' + limit;
      if( start ){
        url += '&skip=' + start;
      }
    }else if( start ){
      url += '&skip=' + start;
    }
    var option = {
      url: url,
      method: 'GET',
      headers: db_headers
    };
    request( option, ( err, res, dbs ) => {
      if( err ){
        resolve( { status: false, error: err } );
      }else{
        dbs = JSON.parse( dbs );
        resolve( { status: true, dbs: dbs } );
      }
    });
  });
};

//. １件取得用関数
api.getDoc = function( db, id ){
  return new Promise( ( resolve, reject ) => {
    if( db ){
      if( id ){
        var option = {
          url: database_url + '/' + id,
          method: 'GET',
          headers: db_headers
        };
        request( option, ( err, res, doc ) => {
          if( err ){
            resolve( { status: false, error: err } );
          }else{
            doc = JSON.parse( doc );
            resolve( { status: true, result: doc } );
          }
        });
      }else{
        resolve( { status: false, error: 'no id' } );
      }
    }else{
      resolve( { status: false, error: 'no db' } );
    }
  });
};
api.readItem = async function( db, id ){
  return await api.getDoc( db, id );
};

//. 複数件取得用関数
api.getDocs = function( db, limit, start ){
  return new Promise( ( resolve, reject ) => {
    if( db ){
      var url = database_url + '/_all_docs?include_docs=true';
      if( limit ){
        url += '&limit=' + limit;
      }
      if( start ){
        url += '&skip=' + start;
      }
      var option = {
        url: url,
        method: 'GET',
        headers: db_headers
      };
      request( option, ( err, res, body ) => {
        if( err ){
          resolve( { status: false, error: err } );
        }else{
          body = JSON.parse( body );
          var docs = [];
          if( body && body.rows ){
            body.rows.forEach( function( doc ){
              docs.push( doc.doc );
            });
          }
          resolve( { status: true, results: docs } );
        }
      });
    }else{
      resolve( { status: false, error: 'no db' } );
    }
  });
};
api.readItems = async function( limit, start ){
  return await api.getDocs( db, limit, start );
};

//. １件更新用関数
api.updateDoc = function( db, doc ){
  return new Promise( ( resolve, reject ) => {
    if( db ){
      if( !doc._id ){
        resolve( { status: false, error: 'id needed.' } );
      }else{
        var option = {
          url: database_url + '/' + doc._id,
          method: 'GET',
          headers: db_headers
        };
        request( option, ( err, res, body ) => {
          if( err ){
            resolve( { status: false, error: err } );
          }else{
            body = JSON.parse( body );
            option = {
              url: database_url + '/' + doc._id + '?rev=' + body._rev,
              method: 'PUT',
              json: doc,
              headers: db_headers
            };
            request( option, ( err, res, result ) => {
              if( err ){
                resolve( { status: false, error: err } );
              }else{
                //result = JSON.parse( result );
                resolve( { status: true, doc: result } );
              }
            });
          }
        });
      }
    }else{
      resolve( { status: false, error: 'no db' } );
    }
  });
};
api.updateItem = async function( db, doc ){
  return await api.updateDoc( db, doc );
};

//. １件削除用関数
api.deleteDb = function( db ){
  return new Promise( ( resolve, reject ) => {
    if( db ){
      var option = {
        url: database_url,
        method: 'DELETE',
        headers: db_headers
      };
      request( option, ( err, res, body ) => {
        if( err ){
          resolve( { status: false, error: err } );
        }else{
          body = JSON.parse( body );
          resolve( { status: true, body: body } );
        }
      });
    }else{
      resolve( { status: false, error: 'no db' } );
    }
  });
};

api.deleteDoc = function( db, id ){
  return new Promise( ( resolve, reject ) => {
    if( db ){
      if( !id ){
        resolve( { status: false, error: 'id needed.' } );
      }else{
        var option = {
          url: database_url + '/' + id,
          method: 'GET',
          headers: db_headers
        };
        request( option, ( err, res, doc ) => {
          if( err ){
            resolve( { status: false, error: err } );
          }else{
            doc = JSON.parse( doc );
            option = {
              url: database_url + '/' + id + '?rev=' + doc._rev,
              method: 'DELETE',
              headers: db_headers
            };
            request( option, ( err, res, body ) => {
              if( err ){
                resolve( { status: false, error: err } );
              }else{
                body = JSON.parse( body );
                resolve( { status: true, body: body } );
              }
            });
          }
        });
      }
    }else{
      resolve( { status: false, error: 'no db' } );
    }
  });
};
api.deleteItem = async function( db, id ){
  return await api.deleteDoc( db, id );
};



/*
//. POST /api/db/{db}
api.post( '/:db', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var db = req.params.db;
  router.createDb( db ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

//. POST /api/db/{db}/{id}
api.post( '/:db/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var db = req.params.db;
  var id = req.params.id;
  var doc = req.body;
  router.createDoc( db, doc, id ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

//. GET /api/db/
api.get( '/', function( req, res ){
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
  api.getDbs( limit, start ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

//. GET /api/db/{db}
api.get( '/:db', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var db = req.params.db;
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
  api.getDocs( db, limit, start ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

//. GET /api/db/{db}/{id}
api.get( '/:db/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var db = req.params.db;
  var id = req.params.id;
  api.getDoc( db, id ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

//. PUT /api/db/{db}/{id}
api.put( '/:db/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var db = req.params.db;
  var id = req.params.id;
  var doc = req.body;
  doc._id = id;
  api.updateDoc( db, doc ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

//. DELETE /api/db/{db}
api.delete( '/:db', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var db = req.params.db;
  api.deleteDb( db ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

//. DELETE /api/db/{db}/{id}
api.delete( '/:db/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var db = req.params.db;
  var id = req.params.id;
  api.deleteDoc( db, id ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});


//. ID作成用関数
function generateId(){
  var s = 1000;
  var id = '' + ( new Date().getTime().toString(16) ) + Math.floor( s * Math.random() ).toString(16);

  return id;
}

//. DB REST API ヘッダ
var db_headers = { 'Accept': 'application/json' };
if( settings.db_basic ){
  db_headers['Authorization'] = 'Basic ' + settings.db_basic;
}else if( settings.db_apikey ){
  var headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json'
  };
  var data = {
    'grant_type': 'urn:ibm:params:oauth:grant-type:apikey',
    'apikey': settings.db_apikey
  };
  var option = {
    url: 'https://iam.cloud.ibm.com/identity/token',
    method: 'POST',
    form: data,
    headers: headers
  };
  request( option, ( err, res, body ) => {
    if( err ){
    }else if( body ){
      body = JSON.parse( body );
      db_headers['Authorization'] = 'Bearer ' + body.access_token;
    }
  });
}
*/

api.post( '/item', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item = req.body;
  item.price = parseInt( item.price );
  if( !item.id ){
    item.id = uuidv1();
    item._id = item.id;
  }
  var t = ( new Date() ).getTime();
  item.created = t;
  item.updated = t;
  api.createDoc( db, item, item.id ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.get( '/item/:id', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item_id = req.params.id;
  api.getDoc( db, item_id ).then( function( result ){
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
  api.getDocs( db, limit, start ).then( function( result ){
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
  api.updateDoc( db, doc ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.delete( '/item/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item_id = req.params.id;
  api.deleteDoc( db, item_id ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});


//. api をエクスポート
module.exports = api;
