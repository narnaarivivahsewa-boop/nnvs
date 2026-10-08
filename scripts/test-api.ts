async function test() {
  const url = 'https://www.rishteclub.com/api/integrations/google-form';
  const key = '9377018194b7c3361ccd1c929de0d9d267c821544c05ff12ea64e5cabfdea20c';

  const testPayload = {
    dryRun: false,
    batch: [
      {
        sourceId: 'TEST_ROW_1',
        rowNumber: 1,
        legacyProfileId: 'NNVS-TEST-001',
        name: 'Test Candidate',
        gender: 'Male',
        mobile: '9876543210',
        maritalStatus: 'Never Married',
        qualification: 'B.Tech',
        occupation: 'Software Engineer',
      }
    ]
  };

  console.log('Sending test POST request...');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-integration-key': key,
    },
    body: JSON.stringify(testPayload),
  });

  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

test();
