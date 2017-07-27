'use strict';

const async = require('async');
const subprocess = require( 'child_process' );

const aws = require('aws-sdk');
const s3 = new aws.S3({ apiVersion: '2006-03-01' });
const dynamodb = new aws.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
    // console.log('Received event:', JSON.stringify(event, null, 2));

    // Get the object from the event and show its content type
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    // console.log('bucket: ' + bucket );
    // console.log( 'key: ' + key);
    console.log( 'event', event.Records[0] );
    const params = {
        Bucket: bucket,
        Key: key,
    };
    // async.waterfall([

    // ]);
    const url = s3.getSignedUrl( 'getObject', params, (err, data) => {
        if (err) {
            console.log(err);
            const message = `Error getting signed url for object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
            console.log(message);
            callback(message);
        } else {
            console.log( 'got signed url', data);
        }
    });
    // console.log('CONTENT TYPE:', data.ContentType);
    // callback(null, data.ContentType);
    console.log( 'url', url);
    console.log('params', params);

    const item = { keyName : params.Key, technicalMetadata : 'test entry' };
    console.log( 'item', item );

    console.log( typeof subprocess.spawnSync);
    const results = subprocess.spawnSync('./mediainfo', ['--full', '--output=XML', url] );
    console.log('results', results);


    dynamodb.put({ TableName : 'TechnicalMetadata', Item : item }, function( err, response){
        console.log( 'trying dynamodb' );
        if( err ){
            console.log( err );
        } else {
            console.log( 'succcess', response );
        }
    });


};

