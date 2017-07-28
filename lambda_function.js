'use strict';

// require('async');
const subprocess = require( 'child_process' );
const xml2js = require('xml2js');//.parseString;
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
    // console.log( 'event', event.Records[0] );
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
            // console.log('CONTENT TYPE:', data.ContentType);
            // callback(null, data.ContentType);
            console.log( 'data', data);
            console.log('params', params);

            const item = { keyName : params.Key, technicalMetadata : data.ContentType };
            console.log( 'item', item );
            const help = subprocess.spawn('./mediainfo', ['--help']);
            console.log('help:', help);
            
            const results = subprocess.spawn('./mediainfo', ['--full', '--output=XML', data] );
            // console.log('results', results);
            results.stdout.on('data', (results) => {
                // console.log( 'out args: ', arguments, '\nthose were the args');
                console.log('results:', typeof results);
                console.log(results);
                const unbuffed = results.toString();
                console.log('unbuffed:', unbuffed);
                
                const parser = new xml2js.Parser({ ignoreAttrs : true });
                parser.parseString( unbuffed, function( err, js_result ){
                    console.log('inside');
                    const json_out = JSON.stringify(js_result);
                    console.log( json_out);

                    const query = { 
                        TableName : 'TechnicalMetadata', 
                        Item :  {
                            "keyName" : item.keyName,
                            "technicalMetadata" : json_out
                        }
                    };
                    dynamodb.put( query, function( err, dbresults){
                        console.log( 'trying dynamodb' );
                        if( err ){
                            console.log( err );
                        } else {
                            console.log( 'succcess', dbresults );
                        }
                    });
                });
                
                    
            });

        }
    });
};

