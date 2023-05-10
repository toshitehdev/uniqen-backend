const express = require("express");
const { ethers } = require("ethers");
const cors = require("cors");
require("dotenv").config();

const {
  srcContractAddress,
  srcContractABI,
  dstContractAddress,
  dstContractABI,
} = require("./constant");

const srcProvider = new ethers.getDefaultProvider(process.env.SRC_PROVIDER);
const dstProvider = new ethers.getDefaultProvider(process.env.DST_PROVIDER);
const srcContract = new ethers.Contract(
  srcContractAddress,
  srcContractABI,
  srcProvider
);
const dstContract = new ethers.Contract(
  dstContractAddress,
  dstContractABI,
  dstProvider
);

const app = express();
const port = 5000;
app.use(cors({ origin: "*" }));
app.use(express.json());

app.post("/verify", async (req, res) => {
  //read storage
  const tokenOwned = await dstContract.getAddressToIds(req.body.account);
  const tokenIds = tokenOwned.map((item) => ethers.toNumber(item));
  // console.log(tokenOwned);
  //verify req.body against cid
  const idVerified = req.body.ids.map((tokenId) => {
    if (tokenIds.includes(tokenId)) {
      return true;
    } else {
      return false;
    }
  });
  //sign
  const signer = new ethers.Wallet(process.env.PRIV_KEY);
  const to = req.body.account;
  const amount = req.body.ids.length;
  const message = req.body.ids;
  const hash = await srcContract.getMessageHash(to, amount, message);
  if (idVerified.includes(false)) {
    res.status(400).send({
      message: "id doesn't match",
    });
  } else {
    const signature = await signer.signMessage(hash);
    res.send(signature);
  }
});

app.post("/collections", async (req, res) => {
  try {
    const account = req.body.account;
    const tokenHoldings = await dstContract.getAddressToIds(account);

    const uu = tokenHoldings.map((item) => ethers.toNumber(item));
    res.json(uu);
  } catch (error) {
    res.send(error);
  }
});

const eventListener = () => {
  srcContract.on("StorageUpdate", async (sender, recipient, amount) => {
    const signer = new ethers.Wallet(process.env.PRIV_KEY, dstProvider);
    const contractSigned = new ethers.Contract(
      dstContractAddress,
      dstContractABI,
      signer
    );
    const tx = await contractSigned.transferBulk(sender, recipient, amount);
    console.log(tx);
    const response = await dstProvider.getTransactionReceipt(tx.hash);
    // await response.confirmations();
    // console.log(response);
  });
};

eventListener();

app.listen(port, () => {
  console.log("listening on:", port);
});
