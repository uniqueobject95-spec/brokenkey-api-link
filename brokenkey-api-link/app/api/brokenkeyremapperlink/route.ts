import { type NextRequest, NextResponse } from "next/server"
import { withX402 } from "@x402/next"
import { declareBuilderCodeExtension, BUILDER_CODE as BUILDER_CODE_EXTENSION_KEY } from "@x402/extensions/builder-code"
import { declareDiscoveryExtension } from "@x402/extensions/bazaar"
import { resourceServer, BASE_MAINNET, PAY_TO_ADDRESS, PRICE, BUILDER_CODE } from "@/lib/x402"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Google Drive file id for "Broken Key Remapper" — delivered after payment.
 */
const SOFTWARE_FILE_ID = "1dCFyioeR_ST0OF1gZZzPXGn82U7Q-Vvp"
const SOFTWARE_DOWNLOAD_URL = `https://drive.google.com/uc?export=download&id=${SOFTWARE_FILE_ID}`

/**
 * The actual fulfillment. This only runs after the x402 payment has been
 * verified and settled on Base mainnet, so we can safely hand over the software.
 */
async function handler(_request: NextRequest) {
  return NextResponse.json({
    name: "Broken Key Remapper",
    description: "Thanks for your purchase. Use the link below to download the software.",
    downloadUrl: SOFTWARE_DOWNLOAD_URL,
    license: "Single-seat license. Do not redistribute.",
    purchasedAt: new Date().toISOString(),
  })
}

export const GET = withX402(
  handler,
  {
    accepts: {
      scheme: "exact",
      network: BASE_MAINNET,
      payTo: PAY_TO_ADDRESS,
      price: PRICE,
    },
    description: "Purchase and download the Broken Key Remapper software (one-time license).",
    mimeType: "application/json",
    serviceName: "Broken Key Remapper",
    tags: ["software", "download", "utility", "keyboard"],
    // ERC-8021 Builder Code attribution ("a" app code) on every settlement.
    extensions: {
      // Must be keyed under the "builder-code" extension id so the resource
      // server declares it and the CDP facilitator appends the ERC-8021 suffix
      // (the "a" app code) to the settlement transaction calldata.
      [BUILDER_CODE_EXTENSION_KEY]: declareBuilderCodeExtension(BUILDER_CODE),
      // Bazaar discovery metadata: tells agents how to call this endpoint.
      ...declareDiscoveryExtension({
        output: {
          example: {
            name: "Broken Key Remapper",
            downloadUrl: SOFTWARE_DOWNLOAD_URL,
            license: "Single-seat license. Do not redistribute.",
          },
        },
      }),
    },
  },
  resourceServer,
)
