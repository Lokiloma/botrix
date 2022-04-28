const {Router} = require('express'),
paypal = require('paypal-rest-sdk'),
transactions = require('../../../models/paypalTransactions'),
gobalTransactionIndex = require('../../../models/globalTransactionIndex'),
wallet = require('../../../models/wallet'),
items = require('../../../models/items');


const route = Router();

paypal.configure({
  'mode': 'live',
  'client_id': 'AdTPCMEBcVxb7AmkBbkxpUogPTmxMCIJhBwzXMl2FgCZCzmZdzjcVC3xhXCikLWoOXA-XJsbtJgMSwoy',
  'client_secret': 'ENNdKzIieAKPzQusnAo0AGTbhHa6pK9RniBgXwvqq9HfhgmVL5_9G2zTp1XYyI9sFVQXUhA7OOwN3uzQ'
})

route.get('/', (req, res) => {

    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
  
    const execute_payment_json = {
      "payer_id": payerId
    };
    console.log(req.query);
    paypal.payment.execute(paymentId, execute_payment_json, async function (error, payment) {
      
      if (error) {
          console.log(error.response);
          throw error;
      } else {

          console.log(payment.transactions[0].item_list.items[0].sku);

          try{

            const userWallet = await wallet.findOne({ userid: req.user.id });
            const sku = await items.findOne({ sku: payment.transactions[0].item_list.items[0].sku });
            const prevTransaction = await transactions.findOne({ transactionId: paymentId });

            if(prevTransaction){
                let data = {
                    payment: payment,
                    wallet: req.session,
                    user: req.user
                }
                return res.render('checkout/paymentSucsess', data);
            }

            await new gobalTransactionIndex({
              userid: req.user.id,
              walletId: userWallet.walletId,
              transactionName: `${sku.price} From Paypal To ${sku.name}`,
              transactionId: Math.random().toString(36).substring(7),
              transactionAmount: sku.name
            }).save();
            
            console.log(sku.realPrice);
            let newWalletAmount = userWallet.walletAmount += Number(sku.realPrice);
            console.log(newWalletAmount + " " + sku.realPrice);
            await wallet.updateOne({ userid: req.user.id }, {$set: { walletAmount: newWalletAmount }});
            
            await new transactions({
                transactionId: paymentId
            }).save();

      
          }catch(err){
            console.log(err);
          }

          let data = {
              payment: payment,
              wallet: req.session,
              user: req.user
          }

          res.render('checkout/paymentSucsess', data);
      }
  });
  });

module.exports = route;
