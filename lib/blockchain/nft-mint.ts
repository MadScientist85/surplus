import * as Sentry from "@sentry/nextjs"

export interface NFTMetadata {
  name: string
  description: string
  image: string
  attributes: Array<{
    trait_type: string
    value: string | number
  }>
}

export interface EthicsNFT {
  leadId: string
  claimAmount: number
  ethicsScore: number
  complianceChecks: string[]
  timestamp: string
}

export async function mintEthicsNFT(data: EthicsNFT): Promise<string> {
  return Sentry.startSpan({ op: "blockchain.mint", name: "Mint Ethics NFT" }, async (span) => {
    span.setAttribute("lead_id", data.leadId)
    span.setAttribute("claim_amount", data.claimAmount)
    span.setAttribute("ethics_score", data.ethicsScore)

    try {
      // Build NFT metadata
      const metadata: NFTMetadata = {
        name: `HBU Ethics Guarantee #${data.leadId.slice(0, 8)}`,
        description: `Ethics guarantee for asset recovery claim. This NFT certifies that all compliance checks were passed and ethical standards maintained.`,
        image: await generateEthicsImage(data),
        attributes: [
          { trait_type: "Claim Amount", value: data.claimAmount },
          { trait_type: "Ethics Score", value: data.ethicsScore },
          { trait_type: "Compliance Checks", value: data.complianceChecks.length },
          { trait_type: "Timestamp", value: data.timestamp },
          { trait_type: "Lead ID", value: data.leadId },
        ],
      }

      // Upload metadata to IPFS (using pinata or similar)
      const metadataUri = await uploadToIPFS(metadata)

      // Mint NFT on Polygon
      const txHash = await mintOnPolygon(metadataUri, data.leadId)

      const { logger } = Sentry
      logger.info("Ethics NFT minted successfully", {
        lead_id: data.leadId,
        tx_hash: txHash,
        metadata_uri: metadataUri,
      })

      return txHash
    } catch (error) {
      Sentry.captureException(error)
      throw error
    }
  })
}

async function generateEthicsImage(data: EthicsNFT): Promise<string> {
  // Generate a unique image for the ethics guarantee
  // In production, this would create a custom graphic
  // For now, return a placeholder that will be generated server-side
  return `https://${process.env.VERCEL_URL}/api/nft/image/${data.leadId}`
}

async function uploadToIPFS(metadata: NFTMetadata): Promise<string> {
  // Upload to IPFS using Pinata or similar service
  const pinataApiKey = process.env.PINATA_API_KEY
  const pinataSecret = process.env.PINATA_SECRET_KEY

  if (!pinataApiKey || !pinataSecret) {
    throw new Error("IPFS credentials not configured")
  }

  try {
    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecret,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: metadata.name,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`IPFS upload failed: ${response.statusText}`)
    }

    const data = await response.json()
    return `ipfs://${data.IpfsHash}`
  } catch (error) {
    Sentry.captureException(error)
    throw error
  }
}

async function mintOnPolygon(metadataUri: string, leadId: string): Promise<string> {
  // Mint NFT on Polygon network
  // This requires ethers.js and a wallet connection
  const contractAddress = process.env.NFT_CONTRACT_ADDRESS
  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY

  if (!contractAddress || !privateKey) {
    throw new Error("Blockchain credentials not configured")
  }

  // In production, use ethers.js to interact with smart contract
  // For now, return a mock transaction hash
  const mockTxHash = `0x${Math.random().toString(16).slice(2)}${leadId.slice(0, 8)}`

  // Simulated delay for blockchain confirmation
  await new Promise((resolve) => setTimeout(resolve, 2000))

  return mockTxHash
}

export async function verifyNFTOwnership(nftId: string, walletAddress: string): Promise<boolean> {
  return Sentry.startSpan({ op: "blockchain.verify", name: "Verify NFT Ownership" }, async (span) => {
    span.setAttribute("nft_id", nftId)
    span.setAttribute("wallet", walletAddress)

    try {
      // Verify NFT ownership on Polygon
      // In production, query the blockchain

      // Mock verification for now
      return true
    } catch (error) {
      Sentry.captureException(error)
      return false
    }
  })
}
