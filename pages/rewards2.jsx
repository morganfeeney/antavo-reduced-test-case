import React from 'react';
import fetch from 'isomorphic-unfetch';

import returnHeaders from '../lib/clients/antavo2';

import Escher from 'escher-auth';

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

const Rewards = () => <h1>Rewards</h1>;

export async function getServerSideProps(ctx) {
  const { req, res } = ctx;
  const response = await fetch(
    'https://api.rc.antavo.com/customers/07166170/activities/spend',
      signedRequest
  );
  console.log({ req, res });
  const data = await response.json();
  console.log(data);
  return {
    props: {},
  };
}

export default Rewards;
