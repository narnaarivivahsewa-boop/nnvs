async function testProductionCacheHeaders() {
  console.log("================================================================================");
  console.log("2. VERIFYING PRODUCTION API CACHE BEHAVIOUR & HEADERS ON LIVE ENVIRONMENT");
  console.log("================================================================================");

  const testCases = [
    { name: "Public Stats (Call 1)", url: "https://www.rishteclub.com/api/public/stats" },
    { name: "Public Stats (Call 2 - Identical)", url: "https://www.rishteclub.com/api/public/stats" },
    { name: "Public Profiles (Call 1 - Default Page 1)", url: "https://www.rishteclub.com/api/public/profiles" },
    { name: "Public Profiles (Call 2 - Identical Default Page 1)", url: "https://www.rishteclub.com/api/public/profiles" },
    { name: "Public Profiles (Call 3 - Isolated Filter: ?gender=FEMALE)", url: "https://www.rishteclub.com/api/public/profiles?gender=FEMALE" },
    { name: "Public Profiles (Call 4 - Isolated Pagination: ?page=2)", url: "https://www.rishteclub.com/api/public/profiles?page=2" },
  ];

  for (const tc of testCases) {
    console.log(`\n--- Request: ${tc.name} [${tc.url}] ---`);
    const start = Date.now();
    try {
      const res = await fetch(tc.url, {
        method: "GET",
        headers: { "User-Agent": "Rishteclub-Cache-Probe/1.0" },
      });
      const duration = Date.now() - start;
      console.log(`  HTTP Status: ${res.status} | Roundtrip: ${duration}ms`);
      console.log(`  cache-control:  ${res.headers.get("cache-control") || "(none)"}`);
      console.log(`  x-vercel-cache: ${res.headers.get("x-vercel-cache") || "(none - uncached lambda execution)"}`);
      console.log(`  age:            ${res.headers.get("age") || "(none)"}`);
      console.log(`  x-vercel-id:    ${res.headers.get("x-vercel-id") || "(none)"}`);
      console.log(`  content-type:   ${res.headers.get("content-type") || "(none)"}`);
      console.log(`  date:           ${res.headers.get("date") || "(none)"}`);
    } catch (e: any) {
      console.log(`  Fetch error: ${e.message}`);
    }
  }
}

testProductionCacheHeaders();
