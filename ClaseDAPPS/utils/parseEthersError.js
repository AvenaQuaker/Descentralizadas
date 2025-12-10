function parseEthersError(err) {
    try {
        const full = JSON.stringify(err, null, 2);

        const regex = /execution reverted:? ([A-Za-z0-9 _\-.,]+)/i;
        const match = full.match(regex);
        if (match && match[1]) return match[1].trim();

        const hex = extractRevertHex(err);
        if (hex) return hex;

        return "Transaction failed";
    } catch {
        return "Transaction failed";
    }
}

function extractRevertHex(err) {
    const possibleHex =
        err?.data ||
        err?.error?.data ||
        err?.error?.error?.data ||
        err?.error?.body ||
        null;

    if (!possibleHex) return null;

    if (typeof possibleHex === "string" && possibleHex.includes("0x08c379a0")) {
        const hexString = possibleHex.match(/0x08c379a0[0-9a-fA-F]+/);
        if (!hexString) return null;

        const hex = hexString[0];

        const reasonHex = "0x" + hex.slice(10 + 64);
        try {
            const reason = Buffer.from(
                reasonHex.replace(/^0x/, ""),
                "hex"
            ).toString();
            return reason.trim();
        } catch {
            return null;
        }
    }

    return null;
}

module.exports = { parseEthersError };
