import sha256 from 'crypto-js/sha256';

// Build some dates. We need ISO8601 YYYYMMDD’T’HHMMSS’Z and YYYYMMDD.
const date = new Date();
export const dateYYYYMMDD = date.toISOString().substring(0, 10).replace(/-/g, '');
export const convertedIsoDate = date.toISOString();

export const isoDate = (dateInput = convertedIsoDate) =>
  `${dateInput.replace(/-/g, '').replace(/:/g, '').split('.')[0]}Z`;

const condensedIsoDate = isoDate(convertedIsoDate);

export const buildCanonical = (pathParams, queryParams, canonicalDate) => {
  return (
    `GET \n` +
    `${pathParams}\n` +
    // `${queryParams}\n` +
    `content-type:application/x-www-form-urlencoded; charset=utf-8\n` +
    `date:${canonicalDate}\n` +
    `host:api.antavo.com\n` +
    `\n` +
    `content-type;date;host\n` +
    `${sha256('')}`
  );
};

export const getCredentialScope = (date_YYYYMMDD, region, service) =>
  `${date_YYYYMMDD}/${region}/${service}/antavo_request`;

export const getStringToSign = (
  iso_Date,
  date_YYYYMMDD,
  region,
  service,
  hash_canonical_request
) => {
  // datestamp + '/' + region + '/' + service + '/' + 'antavo_request'
  const stringToSign = `ANTAVO-HMAC-SHA256\n${iso_Date}\n${getCredentialScope(
    date_YYYYMMDD,
    region,
    service
  )}\n${hash_canonical_request}`;

  return stringToSign;
};

function hashMessage(key, message) {
  return sha256(key, message);
}

export const getSigningKey = (secret, date_YYYYMMDD) => {
  // HMAC(HMAC(HMAC(HMAC("ANTAVO" + kSecret,"20170307"),"ml"),"api"),"antavo_request"
  const hashedDate = hashMessage(encodeURIComponent(`ANTAVO${secret}`), date_YYYYMMDD);
  const hashedRegion = hashMessage(hashedDate, 'rc');
  const hashedService = hashMessage(hashedRegion, 'api');
  const hashedSigning = hashMessage(hashedService, 'antavo_request');
  console.log({ hashedSigning });
  return hashedSigning;
};

export default function buildAuthHeader() {
  const secret = process.env.ANTAVO_API_SECRET;
  const accessKey = process.env.ANTAVO_ACCESS_KEY;
  const region = 'rc';
  const service = 'api';
  const pathParams = '/customers/07166170/activities/spend'; // Example.
  const queryParams = '';

  // Build plain canoical request, example: https://apidocs.antavo.com/api/signing.html#canonical-request.
  const canonicalRequest = buildCanonical(pathParams, queryParams, condensedIsoDate);

  // Hash the canoical request.
  const hashedCanonicalRequest = sha256(canonicalRequest);

  // Build the string to sign.
  const stringToSign = getStringToSign(
    hashedCanonicalRequest,
    condensedIsoDate,
    dateYYYYMMDD,
    region,
    service
  );

  // Build the signing key, example: HMAC(HMAC(HMAC(HMAC("ANTAVO" + kSecret,"20170307"),"ml"),"api"),"antavo_request").
  const signingKey = getSigningKey(secret, dateYYYYMMDD);

  // Build the signature by encoding the stringToSign with the signing key. https://apidocs.antavo.com/api/signing.html#step-3.
  const signature = hashMessage(signingKey, stringToSign);

  // Build auth header. https://apidocs.antavo.com/api/signing.html#step-4-add-the-signing-information-to-the-request.
  const authHeader = `ANTAVO-HMAC-SHA256 Credential=${accessKey}/${getCredentialScope(
    dateYYYYMMDD,
    region,
    service
  )}, SignedHeaders=content-type;date;host, Signature=${signature}`;

  return authHeader;
}
