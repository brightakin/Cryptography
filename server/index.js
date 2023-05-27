const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
const secp = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { utf8ToBytes, toHex } = require("ethereum-cryptography/utils");

app.use(cors());
app.use(express.json());

const balances = {
  "03974709bb4757fbf1f529e8608e40113ff87a90a52f175676b33e7b26e4454690": 100,
  "0398494b66a3f1b835065dca49ff6943288c13b1a4a5851e32e1236453e927d7fc": 50,
  "020075217850cc1cde12d9445c61a341fad70c17390a54c1f38fdda306af8be237": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", async (req, res) => {
  const { sender, recipient, amount, sign, nonce } = req.body;

  setInitialBalance(sender);
  setInitialBalance(recipient);

  const [signature, recoveredBit] = sign;

  const formattedSignature = Uint8Array.from(Object.values(signature));
  const message = utf8ToBytes(amount + recipient + JSON.stringify(nonce));
  const hashMessage = toHex(keccak256(message));
  const publicKey = secp.secp256k1.recoverPublicKey(
    hashMessage,
    formattedSignature,
    recoveredBit
  );

  const verifyTx = secp.secp256k1.verify(
    formattedSignature,
    hashMessage,
    publicKey
  );

  console.log(verifyTx);

  if (verifyTx) {
    if (balances[sender] < amount) {
      res.status(400).send({ message: "Not enough funds!" });
    } else if (sender == recipient) {
      res.status(400).send({ message: "Please! Enter Another address" });
    } else if (recipient && amount) {
      balances[sender] -= amount;
      balances[recipient] += amount;
      res.send({ balance: balances[sender] });
    } else {
      res.status(400).send({ message: "Something Went Wrong !!" });
    }
  } else res.status(400).send({ message: "Invalid Transaction" });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
