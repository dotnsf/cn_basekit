//. app.js
var express = require( 'express' ),
    ejs = require( 'ejs' ),
    session = require( 'express-session' ),
    app = express();

var settings = require( './settings' );

var dbtype = 'DBTYPE' in process.env ? process.env.DBTYPE : ( settings.dbtype ? settings.dbtype : "no" ); 
var db = require( './api/db_' + dbtype );
if( dbtype == 'redis' ){
  db = db.api;
}
app.use( '/api/db', db );

var redisObj = require( './api/db_redis' );
var redisClient = redisObj.redisClient;

app.use( express.Router() );
app.use( express.static( __dirname + '/public' ) );

app.set( 'views', __dirname + '/views' );
app.set( 'view engine', 'ejs' );

//. Auth0
var settings_auth0_callback_url = 'AUTH0_CALLBACK_URL' in process.env ? process.env.AUTH0_CALLBACK_URL : settings.auth0_callback_url; 
var settings_auth0_client_id = 'AUTH0_CLIENT_ID' in process.env ? process.env.AUTH0_CLIENT_ID : settings.auth0_client_id; 
var settings_auth0_client_secret = 'AUTH0_CLIENT_SECRET' in process.env ? process.env.AUTH0_CLIENT_SECRET : settings.auth0_client_secret; 
var settings_auth0_domain = 'AUTH0_DOMAIN' in process.env ? process.env.AUTH0_DOMAIN : settings.auth0_domain; 

//. AppID
var settings_appid_region = 'APPID_REGION' in process.env ? process.env.APPID_REGION : settings.appid_region;
var settings_appid_tenantId = 'APPID_TENANTID' in process.env ? process.env.APPID_TENANTID : settings.appid_tenantId;
var settings_appid_apiKey = 'APPID_APIKEY' in process.env ? process.env.APPID_APIKEY : settings.appid_apiKey;
var settings_appid_secret = 'APPID_SECRET' in process.env ? process.env.APPID_SECRET : settings.appid_secret;
var settings_appid_clientId = 'APPID_CLIENTID' in process.env ? process.env.APPID_CLIENTID : settings.appid_clientId;
var settings_appid_redirectUri = 'APPID_REDIRECTURI' in process.env ? process.env.APPID_REDIRECTURI : settings.appid_redirectUri;
var settings_appid_oauthServerUrl = 'APPID_OAUTHSERVERURL' in process.env ? process.env.APPID_OAUTHSERVERURL : settings.appid_oauthServerUrl;

//. Auth Type
var authtype = 'AUTHTYPE' in process.env ? process.env.AUTHTYPE : ( settings.authtype ? settings.authtype : '' );

var RedisStore = require( 'connect-redis' )( session );
var passport = require( 'passport' );

//. Session
var sess = {
  secret: 'cn_basekit',
  cookie: {
    path: '/',
    maxAge: (7 * 24 * 60 * 60 * 1000)
  },
  resave: false,
  saveUninitialized: false //true
};
if( redisClient ){
  sess.store = new RedisStore( { client: redisClient } );
}
app.use( session( sess ) );

var strategy = null;
if( authtype == 'auth0' && settings_auth0_domain && settings_auth0_client_id && settings_auth0_client_secret && settings_auth0_callback_url ){
  var Auth0Strategy = require( 'passport-auth0' );
  strategy = new Auth0Strategy({
    domain: settings_auth0_domain,
    clientID: settings_auth0_client_id,
    clientSecret: settings_auth0_client_secret,
    callbackURL: settings_auth0_callback_url
  }, function( accessToken, refreshToken, extraParams, profile, done ){
    profile.idToken = extraParams.id_token;
    return done( null, profile );
  });

  passport.use( strategy );
  passport.serializeUser( function( user, done ){
    done( null, user );
  });
  passport.deserializeUser( function( user, done ){
    done( null, user );
  });

  app.use( passport.initialize() );
  app.use( passport.session() );
}else if( authtype == 'appid' && settings_appid_region && settings_appid_tenantId && settings_appid_apiKey && settings_appid_secret && settings_appid_clientId && settings_appid_redirectUri && settings_appid_oauthServerUrl ){
  var WebAppStrategy = require( 'ibmcloud-appid' ).WebAppStrategy;

  app.use( passport.initialize() );
  app.use( passport.session() );
  passport.serializeUser( ( user, cb ) => cb( null, user ) );
  passport.deserializeUser( ( user, cb ) => cb( null, user ) );
  passport.use( new WebAppStrategy({
    tenantId: settings_appid_tenantId,
    clientId: settings_appid_clientId,
    secret: settings_appid_secret,
    oauthServerUrl: settings_appid_oauthServerUrl,
    redirectUri: settings_appid_redirectUri
  }));
}

var settings_cors = 'CORS' in process.env ? process.env.CORS : '';
app.all( '/*', function( req, res, next ){
  if( settings_cors ){
    res.setHeader( 'Access-Control-Allow-Origin', settings_cors );
    res.setHeader( 'Vary', 'Origin' );
  }
  next();
});

if( authtype == 'auth0' ){
  //. login
  app.get( '/auth0/login', passport.authenticate( 'auth0', {
    scope: 'openid profile email'
  }, function( req, res ){
    res.redirect( '/' );
  }));

  //. logout
  app.get( '/auth0/logout', function( req, res ){
    req.logout();
    res.redirect( '/' );
  });

  app.get( '/auth0/callback', async function( req, res, next ){
    passport.authenticate( 'auth0', function( err, user ){
      if( err ) return next( err );
      if( !user ) return res.redirect( '/auth0/login' );

      req.logIn( user, function( err ){
        if( err ) return next( err );
        res.redirect( '/' );
      })
    })( req, res, next );
  });
}else if( authtype == 'appid' ){
  //. login
  app.get( '/appid/login', passport.authenticate( WebAppStrategy.STRATEGY_NAME, {
    successRedirect: '/',
    forceLogin: false //true
  }));

  //. logout
  app.get( '/appid/logout', function( req, res ){
    WebAppStrategy.logout( req );
    res.redirect( '/' );
  });

  //. callback
  app.get( '/appid/callback', function( req, res, next ){
    next();
  }, passport.authenticate( WebAppStrategy.STRATEGY_NAME )
  );
}

app.get( '/', async function( req, res ){
  try{
    if( authtype && !req.user ){ 
      res.redirect( '/' + authtype + '/login' );
    }else{
      var user = authtype ? req.user : null
      //console.log( { user } );  //. id, nickname & picture
      if( user && user.sub ){
        user.id = user.sub;
        user.nickname = user.name;
        user.picture = '';
      }

      var result = await db.readItems();
      if( result.status ){
        res.render( 'index', { items: result.results, authtype: authtype, dbtype: dbtype, user: user } );
      }else{
        res.render( 'index', { items: [], authtype: authtype, dbtype: dbtype, user: user } );
      }
    }
  }catch( e ){
    console.log( e );
    res.render( 'index', { items: [], authtype: authtype, dbtype: dbtype, user: null } );
  }finally{
  }
});


var port = process.env.PORT || 8080;
app.listen( port );
console.log( "server starting on " + port + " ..." );

module.exports = app;
