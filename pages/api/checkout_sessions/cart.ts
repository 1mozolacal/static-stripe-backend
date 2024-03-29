import { NextApiRequest, NextApiResponse } from 'next'

/*
 * Product data can be loaded from anywhere. In this case, we’re loading it from
 * a local JSON file, but this could also come from an async call to your
 * inventory management service, a database query, or some other API call.
 *
 * The important thing is that the product info is loaded from somewhere trusted
 * so you know the pricing information is accurate.
 */
// import { validateCartItems } from 'use-shopping-cart/utilities/serverless'
import { validateCartItems } from 'use-shopping-cart/utilities'
import inventory from '../../../utils/testProducts'

import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // https://github.com/stripe/stripe-node#configuration
  apiVersion: '2020-08-27',
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      // Validate the cart details that were sent from the client.
      const line_items = validateCartItems(inventory as any, req.body)
    //   console.log("CALVIN LION ITEMS",line_items)
    //   throw line_items;
    // res.status(200).json({data:line_items, other:inventory})
    
      // Create Checkout Sessions from body params.
      const params: Stripe.Checkout.SessionCreateParams = {
        submit_type: 'pay',
        allow_promotion_codes:true,
        payment_method_types: ['card'],
        billing_address_collection: 'auto',
        shipping_address_collection: {
          allowed_countries: ['US', 'CA'],
        },
        // line_items,
        line_items: inventory.map( (ele,i) =>{
            return ({
                price: ele.id,
                quantity: line_items[i].quantity,
                tax_rates: ["txr_1LD8qEJPBEwx0hFAgd89nojl"]
            })
        }),
        success_url: `${req.headers.origin}/result?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/use-shopping-cart`,
        mode: 'payment',
      }

      const checkoutSession: Stripe.Checkout.Session =
        await stripe.checkout.sessions.create(params)

      res.status(200).json(checkoutSession)
    } catch (err) {
      console.log(err)
      const errorMessage =
        err instanceof Error ? err.message : 'Internal server error'
      res.status(500).json({ statusCode: 500, message: errorMessage })
    }
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
  }
}


                // price_data:{
                //     product:'',
                //      currency:'CAD',//TODO
                //      unit_amount: ''
                //     ele.price_data},
                // product:ele,
                // quantity:ele.quantity,