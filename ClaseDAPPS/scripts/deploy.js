const { ethers } = require("hardhat")

async function main() {
    const owners = [
        "0x1881520890eCD07b9a0CAc5E49fd34e5Dc8dA8f8",
        "0x3bB94F092f247A37DA1832D802Ae2CC2cA8d4526",
    ]

    const shares = [60, 40]
    const requiredApprovals = 2

    console.log("Deploying contract MultiSignPaymentWallet")

    const Wallet = await ethers.getContractFactory("contracts/Wallet.sol:MultiSignPaymentWallet")
    const wallet = await Wallet.deploy(owners, requiredApprovals, owners, shares)

    console.log("Waiting on deploy's transaction confirmation")
    const tx = wallet.deployTransaction
    const receipt = await tx.wait()

    console.log("Contract deployed succesfully")
    console.log("-----------------------------")
    console.log("Contract address:", wallet.address)
    console.log("Transaction hash", tx.hash)
    console.log("Gas fee:", receipt.gasUsed.toString())
    console.log("Owners:", owners)
    console.log("Payees:", owners)
    console.log("Shares:", shares)
    console.log("Required approvals:", requiredApprovals)
    console.log("-----------------------------")

    try {
        const events = await wallet.queryFilter(
            wallet.filters.ContractDeployed(), 
            receipt.blockNumber, 
            receipt.blockNumber
        )
        if (events.length > 0) {
            console.log("\nEvent detected:")
            console.log(events[0].args)
        } else {
            console.log("\nEvent couldn't be found, try double-checking the ABI")
        }
    } catch (err) {
        console.log("\nEvent couldn't be read. Error:", err.message)
    }
    console.log("\nDeploy successfully finished")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deploy error:", error)
        process.exit(1)
    })