 // test-yahoo.js
 console.log(import.meta.url);
 console.log(process.cwd())
 import yahooFinance from 'yahoo-finance2'
 try {
  const quote = await yahooFinance.quote("AMD");
  console.log(quote);
} catch (err) {
  console.error("Error getting quote:", err);
}
