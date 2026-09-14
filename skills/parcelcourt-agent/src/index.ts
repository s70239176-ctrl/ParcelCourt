import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import {
  getReadClient,
  contractAddress,
  writesEnabled,
  writeAndConfirm,
} from "./genlayer-client.js";

// stdout is the MCP protocol channel — every diagnostic in this file must
// go to console.error, never console.log, or it corrupts the JSON-RPC
// stream a connected agent is reading from stdin.

function textResult(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

function errorResult(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return { content: [{ type: "text" as const, text: message }], isError: true as const };
}

function createServer(): McpServer {
  const server = new McpServer({ name: "parcelcourt-agent", version: "0.1.0" });

  // --- Read tools: always available, no on-chain identity required ---

  server.registerTool(
    "list_claims",
    { description: "List every claim on the ParcelCourt docket, open and settled." },
    async () => {
      try {
        const client = await getReadClient();
        const claims = await client.readContract({
          address: contractAddress(),
          functionName: "list_claims",
          args: [],
        });
        return textResult(claims);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    "get_claim",
    {
      description: "Get one claim by id: order/sku/amount, status, verdict, and rationale.",
      inputSchema: z.object({
        claim_id: z.number().int().nonnegative().describe("The claim's numeric id"),
      }),
    },
    async ({ claim_id }) => {
      try {
        const client = await getReadClient();
        const claim = await client.readContract({
          address: contractAddress(),
          functionName: "get_claim",
          args: [claim_id],
        });
        return textResult(claim);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    "get_evidence",
    {
      description: "Get every evidence row submitted for one claim (seller/buyer/carrier/warehouse).",
      inputSchema: z.object({
        claim_id: z.number().int().nonnegative().describe("The claim's numeric id"),
      }),
    },
    async ({ claim_id }) => {
      try {
        const client = await getReadClient();
        const evidence = await client.readContract({
          address: contractAddress(),
          functionName: "get_evidence",
          args: [claim_id],
        });
        return textResult(evidence);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    "get_rubric",
    { description: "Get the adjudication rubric (id, minimum meaningful claim amount, possible verdicts)." },
    async () => {
      try {
        const client = await getReadClient();
        const rubric = await client.readContract({
          address: contractAddress(),
          functionName: "get_rubric",
          args: [],
        });
        return textResult(rubric);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    "get_balance",
    {
      description: "Get an address's mock-escrow balance held by the ParcelCourt contract.",
      inputSchema: z.object({
        address: z
          .string()
          .regex(/^0x[0-9a-fA-F]{40}$/, "must be a 0x-prefixed 40-character hex address")
          .describe("Wallet address to check"),
      }),
    },
    async ({ address }) => {
      try {
        const client = await getReadClient();
        const balance = await client.readContract({
          address: contractAddress(),
          functionName: "get_balance",
          args: [address],
        });
        return textResult(balance);
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // --- Write tools: only registered when PARCELCOURT_ENABLE_WRITES=1 ---
  // Every write here executes as PARCELCOURT_AGENT_PRIVATE_KEY's on-chain
  // identity, not the calling agent's — see SKILL.md's trust-boundary note
  // before enabling this in any environment a untrusted agent can reach.

  if (writesEnabled()) {
    server.registerTool(
      "open_claim",
      {
        description:
          "Open a new inbound-condition claim. The configured agent identity " +
          "becomes the claim's buyer — not the calling agent.",
        inputSchema: z.object({
          order_id: z.string().min(1),
          sku: z.string().min(1),
          amount_cents: z.number().int().positive().describe("Order amount in cents, must be positive"),
          seller: z
            .string()
            .regex(/^0x[0-9a-fA-F]{40}$/, "must be a 0x-prefixed 40-character hex address"),
          tracking_url: z.string().url(),
          listing_url: z.string().url(),
        }),
      },
      async (args) => {
        try {
          const hash = await writeAndConfirm("open_claim", [
            args.order_id,
            args.sku,
            args.amount_cents,
            args.seller,
            args.tracking_url,
            args.listing_url,
          ]);
          // Same as app/lib/genlayer.ts's openClaim(): writeContract's
          // receipt doesn't reliably decode a typed return value, so
          // re-read list_claims and match on order_id rather than trust
          // the receipt shape. Narrows, doesn't eliminate, a race if two
          // callers open a claim with the same order_id concurrently.
          const client = await getReadClient();
          const claims = (await client.readContract({
            address: contractAddress(),
            functionName: "list_claims",
            args: [],
          })) as Array<{ id: number; order_id: string }> | null;
          const matches = (claims ?? []).filter((c) => c.order_id === args.order_id);
          const newest = matches.length > 0 ? matches[matches.length - 1] : undefined;
          return textResult({ transaction_hash: hash, claim_id: newest?.id ?? null });
        } catch (err) {
          return errorResult(err);
        }
      }
    );

    server.registerTool(
      "submit_evidence",
      {
        description: "Submit one evidence row (photo/video URI + note) for an open claim.",
        inputSchema: z.object({
          claim_id: z.number().int().nonnegative(),
          role: z.enum(["seller", "buyer", "carrier", "warehouse"]),
          uri: z.string().url(),
          sha256: z.string().min(1),
          note: z.string(),
          weight_g: z.number().int().nonnegative(),
        }),
      },
      async (args) => {
        try {
          const hash = await writeAndConfirm("submit_evidence", [
            args.claim_id,
            args.role,
            args.uri,
            args.sha256,
            args.note,
            args.weight_g,
          ]);
          return textResult({ transaction_hash: hash });
        } catch (err) {
          return errorResult(err);
        }
      }
    );

    server.registerTool(
      "adjudicate",
      {
        description:
          "Run adjudication on an open claim: fetches tracking/listing facts, builds the " +
          "evidence dossier, and settles a verdict via the Intelligent Contract's LLM judge.",
        inputSchema: z.object({
          claim_id: z.number().int().nonnegative(),
        }),
      },
      async ({ claim_id }) => {
        try {
          const hash = await writeAndConfirm("adjudicate", [claim_id]);
          const client = await getReadClient();
          const claim = await client.readContract({
            address: contractAddress(),
            functionName: "get_claim",
            args: [claim_id],
          });
          return textResult({ transaction_hash: hash, claim });
        } catch (err) {
          return errorResult(err);
        }
      }
    );
  } else {
    console.error(
      "parcelcourt-agent: PARCELCOURT_ENABLE_WRITES is not \"1\" — only " +
        "read tools (list_claims, get_claim, get_evidence, get_rubric, " +
        "get_balance) are registered. See SKILL.md to enable writes."
    );
  }

  return server;
}

void serveStdio(createServer);
console.error("parcelcourt-agent MCP server running on stdio");
