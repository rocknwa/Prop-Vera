// lib/pinata.ts
// Uploads a File to Pinata IPFS and returns the public gateway URL.
// Requires NEXT_PUBLIC_PINATA_JWT set in .env.local
// Get your JWT from: https://app.pinata.cloud/developers/api-keys

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud";

export async function uploadImageToPinata(file: File): Promise<string> {
  if (!PINATA_JWT) {
    throw new Error(
      "NEXT_PUBLIC_PINATA_JWT is not set. Add it to your .env.local file.\n" +
      "Get your JWT from: https://app.pinata.cloud/developers/api-keys"
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "pinataMetadata",
    JSON.stringify({ name: `propvera-${Date.now()}-${file.name}` })
  );
  formData.append(
    "pinataOptions",
    JSON.stringify({ cidVersion: 1 })
  );

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pinata upload failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  const cid = data.IpfsHash;

  // Return public gateway URL
  return `${PINATA_GATEWAY}/ipfs/${cid}`;
}