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
  'client_secret': 'ENNdKzIieAKPzQusnAo0AGTbhHa6pK9RniBgXwvqq9HfhgmVL5_9G2zTp1XYyI9sFVQXUhA7OOwN3uzQ)

route.post('/', async (req, res, next) => {

  if(!req.user) return res.send(400);

  //Checking what is in the users cart
  var finalCookie;
  var name = "cart" + "=";
  var ca = req.headers.cookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      finalCookie = await c.substring(name.length, c.length);
    } 
  } 

  let item = await items.findOne({ sku: finalCookie });
  console.log(finalCookie);
  console.log(item);
  if(!item){
      finalCookie = null;
  }

  //creating paypal intent
  const create_payment_json = {
      "intent": "sale",
      "payer": {
          "payment_method": "paypal"
      },
      "redirect_urls": {
          "return_url": "https://tumull.casino/api/success",
          "cancel_url": "https://tumull.casino/api/cancel"
      },
      "transactions": [{
          "item_list": {
              "items": [{
                  "name": item.name,
                  "sku": item.sku,
                  "price": item.price,
                  "currency": "USD",
                  "quantity": 1
              }]
          },
          "amount": {
              "currency": "USD",
              "total": item.price
          },
          "description": item.name
      }]
  };
  
  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
        throw error;
    } else {
        for(let i = 0;i < payment.links.length;i++){
          if(payment.links[i].rel === 'approval_url'){
            res.redirect(payment.links[i].href);
          }
        }
    }
  });

});



/*

    try{

      const userWallet = await wallet.findOne({ userid: req.user.id });
      const sku = await items.findOne({ sku: order.result.purchase_units[0].description.split(" ")[0] });

      const transaction = await new gobalTransactionIndex({
        userid: req.user.id,
        walletId: userWallet.walletId,
        transactionName: `${sku.price} From Paypal To ${sku.name}`,
        transactionId: Math.random().toString(36).substring(7),
        transactionAmount: sku.name
      }).save();

      await userWallet.updateOne({ userid: req.user.id }, {$set: { walletAmount: userWallet.walletAmount += 1 }});

      req.cookies("cart", {});

    }catch(err){
      console.log(err);
    }
    */

module.exports = route;
