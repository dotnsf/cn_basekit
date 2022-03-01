//. api.spec.js

var request = require( 'supertest' ),
    chai = require( 'chai' ),
    app = require( './app' );

chai.should();

describe( 'POST item, GET item, DELETE items, GET item', function(){
  it( 'should work as expected', async function(){
    var result1 = await request( app ).post( '/api/db/item' ).send( { name: 'シャンプー', price: 500, user: 'K.Kimura' } );
    var item_id = result1.body.result.id;
    result1.body.status.should.equal( true );
    result1.statusCode.should.equal( 200 );

    var result2 = await request( app ).get( '/api/db/item/' + item_id );
    result2.statusCode.should.equal( 200 );
    result2.body.status.should.equal( true );
    result2.body.result.price.should.equal( 500 );

    var result3 = await request( app ).put( '/api/db/item/' + item_id ).send( { name: 'シャンプー', price: 600, user: 'K.Kimura' } );
    result3.body.status.should.equal( true );
    result3.statusCode.should.equal( 200 );

    var result4 = await request( app ).get( '/api/db/item/' + item_id );
    result4.statusCode.should.equal( 200 );
    result4.body.status.should.equal( true );
    result4.body.result.price.should.equal( 600 );

    var result5 = await request( app ).delete( '/api/db/item/' + item_id );
    result5.statusCode.should.equal( 200 );
    result5.body.status.should.equal( true );

    var result6 = await request( app ).get( '/api/db/item/' + item_id );
    result6.statusCode.should.equal( 400 );
    result6.body.status.should.equal( false );

    /*
    var result900 = await request( app ).delete( '/api/db/items' );
    result900.statusCode.should.equal( 200 );
    result900.body.status.should.equal( true );
    */
  });
});
