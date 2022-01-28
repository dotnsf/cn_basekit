//. app.js
var express = require( 'express' ),
    ejs = require( 'ejs' ),
    session = require( 'express-session' ),
    app = express();

var settings = require( './settings' );

var dbtype = 'DBTYPE' in process.env ? process.env.DBTYPE : settings.dbtype; 
var db = require( './api/db_' + dbtype );
app.use( '/api/db', db );

var redisClient = require( './api/db_redis' );

app.use( express.Router() );
app.use( express.static( __dirname + '/public' ) );

app.set( 'views', __dirname + '/views' );
app.set( 'view engine', 'ejs' );

//. Auth0
var settings_auth0_callback_url = 'AUTH0_CALLBACK_URL' in process.env ? process.env.AUTH0_CALLBACK_URL : settings.auth0_callback_url; 
var settings_auth0_client_id = 'AUTH0_CLIENT_ID' in process.env ? process.env.AUTH0_CLIENT_ID : settings.auth0_client_id; 
var settings_auth0_client_secret = 'AUTH0_CLIENT_SECRET' in process.env ? process.env.AUTH0_CLIENT_SECRET : settings.auth0_client_secret; 
var settings_auth0_domain = 'AUTH0_DOMAIN' in process.env ? process.env.AUTH0_DOMAIN : settings.auth0_domain; 

//. Auth0
var RedisStore = require( 'connect-redis' )( session );
var passport = require( 'passport' );
var Auth0Strategy = require( 'passport-auth0' );
var strategy = new Auth0Strategy({
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

//. Session
var sess = {
  secret: 'cn_basekit',
  cookie: {
    path: '/',
    //maxAge: (7 * 24 * 60 * 60 * 1000)
    maxAge: (1 * 60 * 1000)
  },
  resave: false,
  saveUninitialized: true
};
if( redisClient ){
  sess.store = new RedisStore( { client: redisClient } );
}
app.use( session( sess ) );
app.use( passport.initialize() );
app.use( passport.session() );

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


app.get( '/', async function( req, res ){
  var conn = null;
  try{
    if( !req.user ){ 
      res.redirect( '/auth0/login' );
    }else{
      var user = req.user;
      var result = await db.readItems();
      if( result.status ){
        res.render( 'index', { items: result.results, user: user } );
      }else{
        res.render( 'index', { items: [], user: user } );
      }
    }
  }catch( e ){
    console.log( e );
    res.render( 'index', { items: [], user: null } );
  }finally{
    if( conn ){
      conn.release();
    }
  }
});


var port = process.env.PORT || 8080;
app.listen( port );
console.log( "server starting on " + port + " ..." );
