import React from 'react';
import Escher from 'escher-auth';
const https = require('https')

const Rewards = () => <h1>Rewards</h1>;

const escher = new Escher({
  credentialScope: 'rc/api/antavo_request',
  accessKeyId: process.env.ANTAVO_ACCESS_KEY,
  apiSecret: process.env.ANTAVO_API_SECRET,
  algoPrefix: 'ANTAVO',
  hashAlgo: 'SHA256',
  authHeaderName: 'Authorization',
  dateHeaderName: 'Date',
});

const requestOptions = {
  host: 'api.rc.antavo.com',
  method: 'GET',
  url: '/customers/07166170/activities/spend',
  path: 'https://api.rc.antavo.com/customers/07166170/activities/spend',
  headers: [
    ['Host', 'api.rc.antavo.com'],
    ['Content-Type', 'application/x-www-form-urlencoded; charset=utf-8'],
  ],
};

const signedRequest = escher.signRequest(requestOptions, '');

export async function getServerSideProps(ctx) {
  https
    .get(signedRequest, (resp) => {
      const { statusCode } = resp;
      const contentType = resp.headers['content-type'];
      console.log({ resp });
      let error;
      if (statusCode !== 200) {
        // eslint-disable-next-line no-useless-concat
        error = new Error('Request Failed.\n' + `Status Code: ${statusCode}`);
      } else if (!/^application\/json/.test(contentType)) {
        error = new Error(
          'Invalid content-type.\n' +
            `Expected application/json but received ${contentType}`
        );
      }
      if (error) {
        console.error(error.message);
        resp.resume();
        return;
      }

      resp.setEncoding('utf8');
      let rawData = '';
      resp.on('data', (chunk) => {
        rawData += chunk;
      });
      resp.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          console.log(parsedData);
        } catch (e) {
          console.error(e.message);
        }
      });
    })
    .on('error', (e) => {
      console.error(`Got error: ${e.message}`);
    });

  return {
    props: {}, // will be passed to the page component as props
  };
}

export default Rewards;
