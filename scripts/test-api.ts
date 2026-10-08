async function test() {
  const url = 'https://www.rishteclub.com/api/integrations/google-form';
  const rawKey = '9377018194b7c3361ccd1c929de0d9d267c821544c05ff12ea64e5cabfdea20c';
  const quotedKey = '"9377018194b7c3361ccd1c929de0d9d267c821544c05ff12ea64e5cabfdea20c"';

  console.log('--- TEST 1: WITHOUT QUOTES ---');
  let res = await fetch(url, { headers: { 'x-integration-key': rawKey } });
  console.log('Status:', res.status, await res.text());

  console.log('--- TEST 2: WITH QUOTES ---');
  res = await fetch(url, { headers: { 'x-integration-key': quotedKey } });
  console.log('Status:', res.status, await res.text());
}
test();
