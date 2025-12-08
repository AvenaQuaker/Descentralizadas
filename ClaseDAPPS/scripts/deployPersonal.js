const { ethers } = require("hardhat")

async function main() {

    console.log("Deploying contract PersonalManager...")

    // Obtener el factory del contrato
    const Personal = await ethers.getContractFactory("contracts/Personal.sol:PersonalManager")

    const personal = await Personal.deploy()

    console.log("Waiting on deploy's transaction confirmation...")
    const tx = personal.deployTransaction
    const receipt = await tx.wait()

    console.log("\nContract deployed successfully!")
    console.log("-----------------------------")
    console.log("Contract address:", personal.address)
    console.log("Transaction hash:", tx.hash)
    console.log("Gas used:", receipt.gasUsed.toString())
    console.log("-----------------------------")

    // Intentar leer algún evento emitido al deploy (si existe)
    try {
        const events = await personal.queryFilter(
            {}, 
            receipt.blockNumber, 
            receipt.blockNumber
        )
        if (events.length > 0) {
            console.log("\nEvent(s) detected at deploy:")
            for (const evt of events) {
                console.log(evt.event, evt.args)
            }
        } else {
            console.log("\nNo deploy events found. (This is normal if your contract does not emit events on constructor)")
        }
    } catch (err) {
        console.log("\nEvent couldn't be read. Error:", err.message)
    }

    console.log("\nDeploy successfully finished.")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deploy error:", error)
        process.exit(1)
    })
