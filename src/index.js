import express from "express";
import cors from "cors";
import helmet from "helmet";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import pino from "pino";
import dns from "dns/promises";
import net from "net";
import puppeteer from "puppeteer";
import axeCore from "axe-core";
import "dotenv/config";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

const app = express();
app.use(express.json({ limit: "200kb" }));
app.use(helmet());

const corsOrigin = process.env.CORS_ORIGIN || "*";
app.use(
  cors({
    origin:
      corsOrigin === "*" ? true : corsOrigin.split(",").map((s) => s.trim()),
  })
);

// Optional API key middleware (no-op if not set)
function requireApiKey(req, res, next) {
  const expected = process.env.API_KEY;
  
  if (!expected) return next();
  const provided = req.header("x-api-key");
  if (provided && provided === expected) return next();
  return res
    .status(401)
    .json({ error: "Unauthorized: missing or invalid API key." });
}

// Optional rate limiting
if ((process.env.ENABLE_RATE_LIMIT || "false").toLowerCase() === "true") {
  const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
    max: Number(process.env.RATE_LIMIT_MAX || 10),
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);
}

// ------- Utilities: SSRF guard (block private/loopback) -------
function isIpv4Private(ip) {
  // Convert IPv4 to integer
  const toInt = (s) =>
    s.split(".").reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
  if (!net.isIPv4(ip)) return false;
  const n = toInt(ip);
  // 10.0.0.0/8
  if ((n & 0xff000000) === 0x0a000000) return true;
  // 172.16.0.0/12
  if ((n & 0xfff00000) === 0xac100000) return true;
  // 192.168.0.0/16
  if ((n & 0xffff0000) === 0xc0a80000) return true;
  // 127.0.0.0/8 (loopback)
  if ((n & 0xff000000) === 0x7f000000) return true;
  // 169.254.0.0/16 (link-local)
  if ((n & 0xffff0000) === 0xa9fe0000) return true;
  return false;
}

function isIpv6Private(ip) {
  if (!net.isIPv6(ip)) return false;
  const lower = ip.toLowerCase();
  return (
    lower.startsWith("fc") || // unique local
    lower.startsWith("fd") || // unique local
    lower === "::1" || // loopback
    lower.startsWith("fe80") // link-local
  );
}

async function resolveAndCheckHost(hostname) {
  // Resolve A/AAAA; reject if only private
  try {
    const addrs = await dns.lookup(hostname, { all: true });
    for (const a of addrs) {
      if (net.isIPv4(a.address) && isIpv4Private(a.address)) {
        throw new Error(`Resolved to private IPv4 (${a.address})`);
      }
      if (net.isIPv6(a.address) && isIpv6Private(a.address)) {
        throw new Error(`Resolved to private IPv6 (${a.address})`);
      }
    }
  } catch (err) {
    // If DNS fails entirely, surface it (likely a bad host)
    throw new Error(`DNS resolution failed for ${hostname}: ${err.message}`);
  }
}

// ------- Puppeteer singleton -------
let browser;
async function getBrowser() {
  if (browser && browser.process() && !browser.isClosed?.()) return browser;
  browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
    ],
  });
  browser.on("disconnected", () =>
    logger.warn("Puppeteer browser disconnected")
  );
  return browser;
}

// ------- Validation -------
const auditBodySchema = z.object({
  urls: z
    .array(
      z
        .string()
        .min(1)
        .max(2048)
        .transform((s) => s.trim())
    )
    .min(1),
  options: z
    .object({
      includeIframes: z.boolean().default(true),
      resultNodeLimit: z
        .number()
        .int()
        .min(50)
        .max(10000)
        .default(Number(process.env.RESULT_NODE_LIMIT || 1000)),
    })
    .partial()
    .default({}),
});

// ------- Axe runner (main frame + same-origin iframes) -------
async function runAxeOnPage(
  page,
  { includeIframes = true, resultNodeLimit = 1000 } = {}
) {
  // Inject axe into a frame
  async function runInFrame(frame) {
    await frame.addScriptTag({ content: axeCore.source });
    const result = await frame.evaluate(async (limit) => {
      // Configure a modest limit to avoid huge payloads
      window.axe.configure({
        checks: [
          // you can customize checks here if needed
        ],
      });
      const res = await window.axe.run(document, {
        resultTypes: ["violations", "incomplete"], // we focus on violations; incomplete may be useful
        // You can pass "rules" or "runOnly" here to scope audits
      });

      // Trim nodes per violation
      res.violations.forEach((v) => {
        if (Array.isArray(v.nodes) && v.nodes.length > limit) {
          v.nodes = v.nodes.slice(0, limit);
          v.truncated = true;
        }
      });
      return res;
    }, resultNodeLimit);

    return {
      frameUrl: frame.url(),
      ...result,
    };
  }

  const results = [];
  // Always main frame
  results.push(await runInFrame(page.mainFrame()));

  if (includeIframes) {
    for (const frame of page.frames()) {
      if (frame === page.mainFrame()) continue;
      try {
        // Only run in same-origin frames; cross-origin will throw
        if (new URL(frame.url()).origin === new URL(page.url()).origin) {
          results.push(await runInFrame(frame));
        }
      } catch {
        // ignore cross-origin
      }
    }
  }

  // Merge violations from all frames
  const merged = { violations: [], incomplete: [] };
  for (const r of results) {
    merged.violations.push(
      ...(r.violations || []).map((v) => ({ frameUrl: r.frameUrl, ...v }))
    );
    merged.incomplete.push(
      ...(r.incomplete || []).map((v) => ({ frameUrl: r.frameUrl, ...v }))
    );
  }

  return { merged };
}

// ------- Route -------
// ------- Route (all violations in one array) -------
app.post("/audit", requireApiKey, async (req, res, next) => {
  const t0 = Date.now();
  try {
    const parsed = auditBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Invalid body", details: parsed.error.flatten() });
    }
    const { urls, options } = parsed.data;

    const browser = await getBrowser();
    const violations = [];
    const summaries = [];

    for (const url of urls) {
      let u;
      try {
        u = new URL(url);
        if (!/^https?:$/.test(u.protocol)) {
          summaries.push({ url, error: "Only http(s) URLs are allowed" });
          continue;
        }
      } catch {
        summaries.push({ url, error: "Invalid URL" });
        continue;
      }

      try {
        // SSRF guard
        await resolveAndCheckHost(u.hostname);

        const page = await browser.newPage();
        const navTimeout = Number(process.env.NAV_TIMEOUT_MS || 20000);
        await page.setBypassCSP(true);
        await page.setDefaultNavigationTimeout(navTimeout);
        await page.setDefaultTimeout(navTimeout);
        await page.setUserAgent(
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        );

        // Request interception (block private IPs + heavy resources)
        await page.setRequestInterception(true);
        page.on("request", async (reqInter) => {
          try {
            const rurl = reqInter.url();
            try {
              const host = new URL(rurl).hostname;
              const addrs = await dns.lookup(host, { all: true });
              for (const a of addrs) {
                if (
                  (net.isIPv4(a.address) && isIpv4Private(a.address)) ||
                  (net.isIPv6(a.address) && isIpv6Private(a.address))
                ) {
                  return reqInter.abort();
                }
              }
            } catch {}
            if (
              ["image", "media", "font", "stylesheet"].includes(
                reqInter.resourceType()
              )
            ) {
              return reqInter.abort();
            }
            return reqInter.continue();
          } catch {
            try {
              return reqInter.continue();
            } catch {}
          }
        });

        // Navigate
        try {
          await page.goto(u.toString(), {
            waitUntil: "networkidle2",
            timeout: navTimeout,
          });
        } catch (e) {
          await page.close().catch(() => {});
          summaries.push({ url, error: `Navigation error: ${e.message}` });
          continue;
        }

        // Run axe
        const { merged } = await runAxeOnPage(page, options);

        summaries.push({
          url: u.toString(),
          totalViolations: merged.violations.length,
          totalIncompleteViolations: merged.incomplete.length,
        });

        // Push all violations into global array, tagging with URL
        violations.push(
          ...merged.violations.map((v) => ({
            url: u.toString(),
            frameUrl: v.frameUrl,
            id: v.id,
            impact: v.impact,
            description: v.description,
            help: v.help,
            helpUrl: v.helpUrl,
            nodes: v.nodes.map((node) => ({
              html: node.html,
              target: node.target,
              failureSummary: node.failureSummary,
            })),
          }))
        );

        await page.close().catch(() => {});
      } catch (err) {
        summaries.push({ url, error: err.message });
      }
    }

    const t1 = Date.now();
    return res.json({
      auditedAt: new Date().toISOString(),
      timingsMs: { total: t1 - t0 },
      summary: summaries,
      violations,
      numberOfURLsTested: urls?.length,
    });
  } catch (err) {
    return next(err);
  }
});

// Error middleware
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  logger.error({ err }, "Unhandled error");
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message || "Internal Server Error" });
});

const port = Number(process.env.PORT || 8080);
const hostname = process.env.HOST || "0.0.0.0"; // Add a default hostname
app.listen(port, hostname, () => {
  logger.info(`axe-audit-api listening on ${hostname}:${port}`);
});
