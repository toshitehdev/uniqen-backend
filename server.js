const express = require("express");
const ethers = require("ethers");
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

app.post("/collections", async (req, res) => {
  console.log(req.body);
  try {
    const account = req.body.account;
    const tokenHoldings = await dstContract.getAddressToIds(account);

    const uu = tokenHoldings.map((item) => ethers.toNumber(item));
    res.json(uu);
  } catch (error) {
    res.send(error);
  }
});

app.listen(port, () => {
  console.log("listening on:", port);
});
