//. db_cloudant.js
var express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    request = require( 'request' ),
    router = express();

var settings = require( '../settings' );

//. env values
var database_url = 'CLOUDANT_DATABASE_URL' in process.env ? process.env.CLOUDANT_DATABASE_URL : settings.cloudant_database_url; 


//. POST メソッドで JSON データを受け取れるようにする
router.use( bodyParser.urlencoded( { extended: true } ) );
router.use( bodyParser.json() );


//. 新規作成用関数
router.createDb = function( db ){
  return new Promise( ( resolve, reject ) => {
    if( db ){
      var option = {
        url: settings.db_url + '/' + db,
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

router.createDoc = function( db, doc, id ){
  return new Promise( ( resolve, reject ) => {
    if( db ){
      //var id = generateId();
      var option = {
        url: settings.db_url + '/' + db + '/' + id,
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

//. 複数件取得用関数
router.getDbs = function( limit, start ){
  return new Promise( ( resolve, reject ) => {
    var url = settings.db_url + '/_all_dbs';
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
router.getDoc = function( db, id ){
  return new Promise( ( resolve, reject ) => {
    if( db ){
      if( id ){
        var option = {
          url: settings.db_url + '/' + db + '/' + id,
          method: 'GET',
          headers: db_headers
        };
        request( option, ( err, res, doc ) => {
          if( err ){
            resolve( { status: false, error: err } );
          }else{
            doc = JSON.parse( doc );
            resolve( { status: true, doc: doc } );
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

//. 複数件取得用関数
router.getDocs = function( db, limit, start ){
  return new Promise( ( resolve, reject ) => {
    if( db ){
      var url = settings.db_url + '/' + db + '/_all_docs?include_docs=true';
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
          resolve( { status: true, docs: docs } );
        }
      });
    }else{
      resolve( { status: false, error: 'no db' } );
    }
  });
};

//. １件更新用関数
router.updateDoc = function( db, doc ){
  return new Promise( ( resolve, reject ) => {
    if( db ){
      if( !doc._id ){
        resolve( { status: false, error: 'id needed.' } );
      }else{
        var option = {
          url: settings.db_url + '/' + db + '/' + doc._id,
          method: 'GET',
          headers: db_headers
        };
        request( option, ( err, res, body ) => {
          if( err ){
            resolve( { status: false, error: err } );
          }else{
            body = JSON.parse( body );
            option = {
              url: settings.db_url + '/' + db + '/' + doc._id + '?rev=' + body._rev,
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

//. １件削除用関数
router.deleteDb = function( db ){
  return new Promise( ( resolve, reject ) => {
    if( db ){
      var option = {
        url: settings.db_url + '/' + db,
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

router.deleteDoc = function( db, id ){
  return new Promise( ( resolve, reject ) => {
    if( db ){
      if( !id ){
        resolve( { status: false, error: 'id needed.' } );
      }else{
        var option = {
          url: settings.db_url + '/' + db + '/' + id,
          method: 'GET',
          headers: db_headers
        };
        request( option, ( err, res, doc ) => {
          if( err ){
            resolve( { status: false, error: err } );
          }else{
            doc = JSON.parse( doc );
            option = {
              url: settings.db_url + '/' + db + '/' + id + '?rev=' + doc._rev,
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


//. POST /api/db/{db}
router.post( '/:db', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var db = req.params.db;
  router.createDb( db ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

//. POST /api/db/{db}/{id}
router.post( '/:db/:id', function( req, res ){
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
router.get( '/', function( req, res ){
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
  router.getDbs( limit, start ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

//. GET /api/db/{db}
router.get( '/:db', function( req, res ){
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
  router.getDocs( db, limit, start ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

//. GET /api/db/{db}/{id}
router.get( '/:db/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var db = req.params.db;
  var id = req.params.id;
  router.getDoc( db, id ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

//. PUT /api/db/{db}/{id}
router.put( '/:db/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var db = req.params.db;
  var id = req.params.id;
  var doc = req.body;
  doc._id = id;
  router.updateDoc( db, doc ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

//. DELETE /api/db/{db}
router.delete( '/:db', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var db = req.params.db;
  router.deleteDb( db ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

//. DELETE /api/db/{db}/{id}
router.delete( '/:db/:id', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var db = req.params.db;
  var id = req.params.id;
  router.deleteDoc( db, id ).then( function( result ){
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

//. router をエクスポート
module.exports = router;
