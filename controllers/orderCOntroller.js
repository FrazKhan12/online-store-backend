import Stripe from "stripe";
import Order from "../modals/orderModel.js";
import { catchAsync } from "../utils/catchAsync.js";
import Payment from "../modals/paymentModel.js";

// export const createOrder = catchAsync(async (req, res, next) => {
//   try {
//     const { cartItems } = req?.body;
//     console.log("cartItems === ", cartItems);
//     console.log(req?.body);

//     // Create a new order document
//     const newOrder = new Order({
//       // user: userId,
//       items: req?.body?.items,
//       totalAmount: req?.body?.totalAmount,
//     });

//     await newOrder.save();

//     const populatedOrder = await Order.populate(newOrder, {
//       path: "items.productId",
//       populate: { path: "categories" },
//     });

//     res.status(200).send({
//       message: "Order Placed",
//       success: true,
//       data: populatedOrder,
//     });
//   } catch (error) {
//     return res.status(500).send({
//       message: "internal server error",
//       success: false,
//       error: error.message,
//     });
//   }
// });

export const checkout = catchAsync(async (req, res, next) => {
  try {
    const { cartItems, amount, userId } = req?.body;

    // Create a new order document
    const newOrder = new Order({
      user: userId,
      items: req?.body?.items,
      totalAmount: req?.body?.totalAmount,
    });

    await newOrder.save();

    const populatedOrder = await Order.populate(newOrder, {
      path: "items.productId",
      populate: { path: "categories" },
    });

    // const { orderId, amount } = req?.body;

    const stripe = new Stripe(
      "sk_test_51Oua6q07U8GQEuIaTvKezjPXPgwf4FfMf6DdOfHODCX7dVTvhVMJ91Kl8TlCWrqzJLytbowGjSJ3hlrFpyiOf9ND009SKa8dPk"
    );
    const stripePaymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
    });

    const lineItms = cartItems?.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.productTitle,
        },
        unit_amount: parseInt(item.productPrice * item?.quantity * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItms,
      mode: "payment",
      success_url: "https://yourwebsite.com/success",
      cancel_url: "https://yourwebsite.com/cancel",
    });

    const payment = new Payment({
      ...req.body,
      user: userId,
      amount: stripePaymentIntent?.amount,
      status: stripePaymentIntent?.status,
      redirectToCheckout: true,
    });

    await payment.save();

    res.status(200).send({
      message: "Order Placed",
      success: true,
      orderdata: populatedOrder,
      paymentData: {
        payment,
        clientSecret: stripePaymentIntent.client_secret,
        sessionId: session.id,
      },
    });
  } catch (error) {
    return res.status(500).send({
      message: "internal server error",
      success: false,
      error: error.message,
    });
  }
});
