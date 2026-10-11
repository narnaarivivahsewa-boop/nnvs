async function runStatisticalBenchmark() {
  console.log("================================================================================");
  console.log("5. PRODUCTION ENDPOINT BENCHMARKS (PRE-CHANGE BASELINE: 6 RUNS PER ENDPOINT)");
  console.log("================================================================================");

  const endpoints = [
    { name: "/api/public/stats", url: "https://www.rishteclub.com/api/public/stats" },
    { name: "/api/public/profiles (Default 24)", url: "https://www.rishteclub.com/api/public/profiles" },
    { name: "/api/public/profiles?gender=FEMALE", url: "https://www.rishteclub.com/api/public/profiles?gender=FEMALE" },
    { name: "/api/public/profiles?page=2", url: "https://www.rishteclub.com/api/public/profiles?page=2" },
  ];

  for (const ep of endpoints) {
    console.log(`\nTesting: ${ep.name}`);
    const runs: number[] = [];
    let statusCode = 0;
    let payloadSize = 0;

    for (let i = 1; i <= 6; i++) {
      const start = Date.now();
      try {
        const res = await fetch(ep.url, {
          method: "GET",
          headers: { "User-Agent": "Rishteclub-Benchmark-Agent/2.0" },
        });
        const duration = Date.now() - start;
        const text = await res.text();
        runs.push(duration);
        statusCode = res.status;
        payloadSize = text.length;
        console.log(`  Run ${i}: ${duration}ms (Status ${res.status}, Size: ${text.length} B)`);
      } catch (err: any) {
        console.log(`  Run ${i}: FAILED - ${err.message}`);
      }
    }

    // Calculations
    const sorted = [...runs].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const mean = Math.round(runs.reduce((a, b) => a + b, 0) / runs.length);
    const median = Math.round((sorted[2] + sorted[3]) / 2);

    console.log(`  --------------------------------------------------`);
    console.log(`  Summary [${ep.name}]:`);
    console.log(`    - Min:    ${min}ms`);
    console.log(`    - Max:    ${max}ms`);
    console.log(`    - Median: ${median}ms`);
    console.log(`    - Mean:   ${mean}ms`);
    console.log(`    - Range:  ${min}ms - ${max}ms`);
    console.log(`    - Status: ${statusCode} OK | Size: ${payloadSize} bytes`);
  }
}

runStatisticalBenchmark();
