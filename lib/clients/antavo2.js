import sha256 from 'crypto-js/sha256';
import hmac from 'crypto-js/hmac-sha256';

import { convertedIsoDate, dateYYYYMMDD, isoDate } from './antavo';

// Re-write Antavo.ts following the python example as a guide

// function toHex(s) {
//   // utf8 to latin1
//   var s = unescape(encodeURIComponent(s));
//   let h = '';
//   for (let i = 0; i < s.length; i++) {
//     h += s.charCodeAt(i).toString(16);
//   }
//   return h;
// }

function get_canonical_headers(content_headers, datetimestamp, host) {
  //   """
  // :param content_headers: content related headers, such as content type and charset
  //     :param datetimestamp: datetime; format: YYYYMMDD’T’HHMMSS’Z’
  // :param host: host URL
  //     :return: a header with an endline after each component
  //   """
  return `${content_headers}\n` + `date:${datetimestamp}\n` + `host:${host}\n`;
}

function get_canonical_request(
  method,
  canonical_uri,
  canonical_headers,
  signed_headers,
  hashed_payload
) {
  // """
  // :param method: HTTP method (e.g. GET)
  // :param canonical_uri: REST endpoint (e.g. /rewards)
  // :param canonical_querystring: optional - leave it empty if there's no query
  // :param canonical_headers: string containing content type, other content related data, datetime and host
  //   :param signed_headers: signed headers (e.g. date;host)
  // :param hashed_payload: hashed empty string
  //   :return: a canonical request with an endline after each component
  // """
  return `${method}\n${canonical_uri}\n${canonical_headers}\n${signed_headers}\n${hashed_payload}`;
}

function get_hashed_payload() {
  //   """
  // :return: a hashed empty string
  //   """
  return sha256('');
}

function get_hashed_canonical_request(canonical_request) {
  //   """
  //
  // :param canonical_request: a string returned by the get_canonical_request function
  //     :return: a hashed version of canonical_request
  //   """
  return sha256(canonical_request);
}

function get_credential_scope(datestamp, region, service) {
  // """
  //
  // :param datestamp: date; format: YYYYMMDD
  //   :param region: string containing the name of the region (e.g. ml)
  // :param service: string containing the nape of the service (e.g. api)
  // :return: a string with the following format: {Date}/{Region}/api/antavo_request\n
  // """
  return `${datestamp}/${region}/${service}/antavo_request`;
}

function get_string_to_sign(
  algorithm,
  datetimestamp,
  credential_scope,
  hashed_canonical_request
) {
  // """
  //
  // :param algorithm: string; the name of the hashing algorithm
  //   :param datetimestamp: datetime; format: YYYYMMDD’T’HHMMSS’Z’
  // :param credential_scope: string returned by the get_credential_scope function
  //   :param hashed_canonical_request: a hashed request returned by the get_hashed_canonical_request function
  //   :return: a string to be signed using the signing key
  // """
  return `${algorithm}\n${datetimestamp}\n${credential_scope}\n${hashed_canonical_request}`;
}

function sign(key, msg) {
  //   """
  //
  // :param key: signing key
  //     :param msg: message
  //     :return:a new hmac objects created from the arguments
  //   """
  return hmac(key, msg, sha256);
}

function get_signing_key(secret, date, region_name, service_name) {
  //   """
  //
  // :param secret: API secret key
  //     :param date: date; format: YYYYMMDD
  //     :param region_name: string containing the name of the region (e.g. ml)
  // :param service_name: string containing the nape of the service (e.g. api)
  // :return: the signing key calculated from the arguments
  //   """
  const key_date = sign(`ANTAVO ${secret}`, date);
  const key_region = sign(key_date, region_name);
  const key_service = sign(key_region, service_name);
  const signing_key = sign(key_service, 'antavo_request');
  return signing_key;
}

function get_signature(signing_key, string_to_sign) {
  //   """
  //
  // :param signing_key: signing key
  //     :param string_to_sign: string to sign
  //     :return: the generated signature
  //   """
  return hmac(signing_key, string_to_sign, sha256);
}

export default function returnHeaders(canonical_uri) {
  const secret_key = process.env.ANTAVO_API_SECRET;
  const access_key = process.env.ANTAVO_ACCESS_KEY;
  const method = 'GET';
  const service = 'api';
  const host = 'api.rc.antavo.com';
  const region = 'rc';
  const dt = isoDate(convertedIsoDate);
  const d = dateYYYYMMDD;
  const algorithm = 'ANTAVO-HMAC-SHA256';
  const content_headers = 'content-type:application/x-www-form-urlencoded; charset=utf-8';
  const signed_headers = 'content-type;date;host';
  const canonical_headers = get_canonical_headers(content_headers, dt, host);
  const hashed_payload = get_hashed_payload();
  const canonical_request = get_canonical_request(
    method,
    canonical_uri,
    canonical_headers,
    signed_headers,
    hashed_payload
  );
  const hashed_canonical_request = get_hashed_canonical_request(canonical_request);
  const credential_scope = get_credential_scope(d, region, service);
  const string_to_sign = get_string_to_sign(
    algorithm,
    dt,
    credential_scope,
    hashed_canonical_request
  );
  const signing_key = get_signing_key(secret_key, d, region, service);
  const signature = get_signature(signing_key, string_to_sign);
  const signedInformation = `${algorithm} Credential=${access_key}/${credential_scope}, SignedHeaders=${signed_headers}, Signature=${signature}`;
  return {
    Authorization: signedInformation,
    'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
    Host: host,
    Date: dt,
  };
}
