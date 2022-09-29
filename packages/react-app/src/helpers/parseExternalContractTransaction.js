import { ethers } from "ethers";

const axios = require("axios");

// This function will pull a contract's abi from etherscan, create a new interface to interact with it's parseTransaction function.

export default async function parseExternalContractTransaction(contractAddress, txData) {
  console.log("Parse ", contractAddress, txData);
  try {
    // Pull the abi
    let response = await axios.get("https://api.etherscan.io/api", {
      params: {
        module: "contract",
        action: "getabi",
        address: contractAddress,
        apikey: "53KS3TP7DKUEWFID7BE7TAA882ZK1QWDPW",
      },
    });
    console.log("RESPONSE: ", response);
    // Interact with the parsetransaction function
    const getParsedTransaction = async () => {
      const abi = response?.data?.result;
      if (abi && txData && txData !== "") {
        const iface = new ethers.utils.Interface(JSON.parse(abi));
        return iface.parseTransaction({ data: txData }); // using the built in function for interfaces
      }
    };

    // Return the parsed transaction
    const parsedT = await getParsedTransaction(response);
    console.log("Parsed transaction: ", parsedT);
    return await getParsedTransaction(response);
  } catch (err) {
    console.log("parseExternalContractTransaction error: ", err);
  }
}
