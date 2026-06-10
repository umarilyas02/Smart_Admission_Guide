// Cloudflare Worker: Smart Admission Guide scraper.
//
// Deploy this to Cloudflare Workers; CLOUDFLARE_WORKER_URL (in .env.local)
// must point at the deployed worker. The Next.js server action
// (src/app/actions/scrape.js) fetches this worker, writes the JSON to
// data.json, then runs scripts/auto_post_clean_data.py to clean + post it.
//
// Each target now declares two extra static facts the scraped HTML can't be
// relied on to yield cleanly:
//   - location: the campus city (the tag-stripping below would otherwise make
//     an address line hard to isolate).
//   - feeUrl:   the canonical fee-structure page. We keep the link itself
//     because the cleaner strips every <a href> tag, so URLs living in markup
//     never survive into `content`. Emitting it here is the only reliable way
//     to hand the fee page through to the database.
export default {
  async fetch(request, env) {
    const targets = [
      {
        name: "FAST NUCES (Lahore/Chiniot)",
        location: "Lahore",
        feeUrl: 'https://nu.edu.pk/Admissions/FeeStructure',
        urls: [
          'https://nu.edu.pk/Admissions/Schedule',
          'https://www.nu.edu.pk/Admissions/ProgramOffered',
          'https://nu.edu.pk/Admissions/EligibilityCriteria',
          'https://nu.edu.pk/Admissions/FeeStructure'
        ]
      },
      {
        name: "UMT Sialkot",
        location: "Sialkot",
        feeUrl: 'https://skt.umt.edu.pk/Fee.aspx',
        urls: [
          'https://skt.umt.edu.pk/Academic/Undergraduate.aspx',
          'https://skt.umt.edu.pk/Fee.aspx' // Dead 404 schedule link removed
        ]
      },
      {
        name: "LUMS (Lahore)",
        location: "Lahore",
        feeUrl: 'https://admission.lums.edu.pk/fee-structure-undergraduate',
        urls: [
          'https://admission.lums.edu.pk/critical-dates-all-programmes',
          'https://lums.edu.pk/programme-finder',
          'https://admission.lums.edu.pk/fee-structure-undergraduate'
        ]
      },
      {
        name: "COMSATS University Islamabad (Lahore Campus)",
        location: "Lahore",
        feeUrl: 'https://lahore.comsats.edu.pk/fee-structure.aspx',
        urls: [
          'https://lahore.comsats.edu.pk/admissions.aspx',
          'https://lahore.comsats.edu.pk/undergraduate.aspx',
          'https://lahore.comsats.edu.pk/fee-structure.aspx'
        ]
      },
      {
        name: "ITU (Lahore)",
        location: "Lahore",
        feeUrl: 'https://itu.edu.pk/admissions/fee-structure/',
        urls: [
          'https://itu.edu.pk/admissions/',
          'https://itu.edu.pk/academics/',
          'https://itu.edu.pk/admissions/fee-structure/'
        ]
      },
      {
        name: "UET Lahore",
        location: "Lahore",
        feeUrl: null, // No dedicated fee page exposed publicly
        urls: [
          'https://admission.uet.edu.pk/',
          'https://uet.edu.pk/faculties/faculties'
        ]
      },
      {
        name: "Punjab University (PU)",
        location: "Lahore",
        feeUrl: null,
        urls: [
          'https://pu.edu.pk/program/index/Undergraduate',
          'https://pu.edu.pk/program/index/Graduate'
        ]
      },
      {
        name: "University of Central Punjab (UCP)",
        location: "Lahore",
        feeUrl: 'https://ucp.edu.pk/admissions/fee-structure/',
        urls: [
          'https://ucp.edu.pk/undergraduate/',
          'https://ucp.edu.pk/admissions/fee-structure/'
        ]
      },
      {
        name: "University of Sialkot (USKT)",
        location: "Sialkot",
        feeUrl: 'https://www.uskt.edu.pk/feestructure',
        urls: [
          'https://www.uskt.edu.pk/',
          'https://www.uskt.edu.pk/feestructure'
        ]
      },
      {
        name: "GC Women University Sialkot (GCWUS)",
        location: "Sialkot",
        feeUrl: null,
        urls: [
          'https://gcwus.edu.pk/',
          'https://admission.gcwus.com/'
        ]
      }
    ];

    try {
      const requestHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      };

      // Fetch universities concurrently to beat the 30-second Cloudflare timeout
      const results = await Promise.all(targets.map(async (uni) => {
        let combinedText = "";
        // Whether we actually reached the fee page in this run; lets the
        // Python side know the link is live rather than a stale guess.
        let feeUrlReachable = false;

        // Fetch URLs within a specific university SEQUENTIALLY to avoid rate-limiting
        for (const url of uni.urls) {
          try {
            const res = await fetch(url, { headers: requestHeaders });

            // Silently skip if the server blocks the request (like PU does)
            if (!res.ok) continue;

            if (uni.feeUrl && url === uni.feeUrl) feeUrlReachable = true;

            let html = await res.text();

            let cleanText = html
              .replace(/<nav\b[^>]*>([\s\S]*?)<\/nav>/gmi, "")
              .replace(/<header\b[^>]*>([\s\S]*?)<\/header>/gmi, "")
              .replace(/<footer\b[^>]*>([\s\S]*?)<\/footer>/gmi, "")
              .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi, "")
              .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gmi, "")
              .replace(/<[^>]*>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();

            combinedText += " " + cleanText;
          } catch (e) {
            console.log(`Failed to fetch ${url}`);
          }
        }

        return {
          university: uni.name,
          category: "Combined_Admission_Data",
          location: uni.location || "",
          // Fee page link, passed through from config (markup hrefs don't
          // survive tag-stripping). null when the university has no public page.
          fee_structure_url: uni.feeUrl || "",
          fee_url_reachable: feeUrlReachable,
          content: combinedText.substring(0, 25000)
        };
      }));

      return new Response(JSON.stringify({
        project: "Smart Admission Guide",
        engine: "v9-Location-Fee-Extraction",
        results
      }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }
};
