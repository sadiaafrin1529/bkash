const axios = require("axios");
const modal = require("../model/modal");
const { v4: uuidv4 } = require("uuid");

class PaymentController {
  bkash_headers = async () => {
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: global.id_token, // টোকেনকে গ্লোবালি স্টোর করা হয়েছে
      "x-app-key": process.env.bkash_api_key,
    };
  };

  payment_create = async (req, res) => {
    const { amount, userId } = req.body;
    global.userId = userId; // গ্লোবালি userId সংরক্ষণ করা হচ্ছে
    try {
      const { data } = await axios.post(
        process.env.bkash_create_payment_url,
        {
          mode: "0011",
          payerReference: " ",
          callbackURL: "http://localhost:5000/api/bkash/payment/callback",
          amount: amount,
          currency: "BDT",
          intent: "sale",
          merchantInvoiceNumber: "Inv" + uuidv4().substring(0, 5),
        },
        {
          headers: await this.bkash_headers(),
        }
      );
      return res.status(200).json({ bkashURL: data.bkashURL });
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  };

  call_back = async (req, res) => {
    const { paymentID, status } = req.query;

    if (status === "cancel" || status === "failure") {
      return res.redirect(
        `http://localhost:3001/payment-fail?message=${status}`
      );
    }
    if (status === "success") {
      try {
        const { data } = await axios.post(
          process.env.bkash_execute_payment_url,
          { paymentID },
          {
            headers: await this.bkash_headers(),
          }
        );
        if (data && data.statusCode === "0000") {
          // গ্লোবালি সংরক্ষিত userId ব্যবহার করা হচ্ছে
          await modal.create({
            userId: Math.random() * 10 + 1,
            paymentID,
            trxID: data.trxID,
            date: data.paymentExecuteTime,
            amount: parseInt(data.amount),
          });

          return res.redirect(`http://localhost:3001/payment-success`);
        } else {
          return res.redirect(
            `http://localhost:3001/payment-fail?message=${data.statusMessage}`
          );
        }
      } catch (error) {
        console.log(error);
        return res.redirect(
          `http://localhost:3001/payment-fail?message=${error.message}`
        );
      }
    }
  };

  refund = async (req, res) => {
    const { trxID } = req.params;

    try {
      const payment = await modal.findOne({ trxID });

      const { data } = await axios.post(
        process.env.bkash_refund_transaction_url,
        {
          paymentID: payment.paymentID,
          amount: payment.amount,
          trxID,
          sku: "payment",
          reason: "cashback",
        },
        {
          headers: await this.bkash_headers(),
        }
      );
      if (data && data.statusCode === "0000") {
        return res.status(200).json({ message: "refund success" });
      } else {
        return res.status(404).json({ error: "refund failed" });
      }
    } catch (error) {
      return res.status(404).json({ error: "refund failed" });
    }
  };
}

module.exports = new PaymentController();
