import mercadopago from 'mercadopago';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Mercado Pago
if (process.env.MERCADOPAGO_TOKEN) {
  mercadopago.configure({
    access_token: process.env.MERCADOPAGO_TOKEN,
  });
}

/**
 * Create a payment with Mercado Pago (Boleto or PIX)
 * @param {Object} paymentData - { invoice_id, client_email, client_name, amount, payment_type: 'boleto' or 'pix' }
 * @returns {Object} Payment details with QR code (PIX) or barcode (boleto)
 */
export async function createPayment(paymentData) {
  try {
    const { invoice_id, client_email, client_name, amount, payment_type } = paymentData;

    if (!invoice_id || !amount || !payment_type) {
      throw new Error('Missing required fields: invoice_id, amount, payment_type');
    }

    const paymentRequest = {
      transaction_amount: parseFloat(amount),
      description: `Invoice ${invoice_id}`,
      payment_method_id: payment_type === 'pix' ? 'account_money' : 'bolbradesco',
      payer: {
        email: client_email || 'customer@example.com',
        first_name: client_name ? client_name.split(' ')[0] : 'Customer',
        last_name: client_name ? client_name.split(' ').slice(1).join(' ') : '',
      },
    };

    // Handle PIX payments
    if (payment_type === 'pix') {
      paymentRequest.payment_method_id = 'account_money';
      paymentRequest.capture = false;
    }

    // Handle Boleto payments
    if (payment_type === 'boleto') {
      paymentRequest.payment_method_id = 'bolbradesco';
    }

    const response = await mercadopago.payment.create(paymentRequest);

    if (response.body && response.body.id) {
      return {
        success: true,
        payment_id: response.body.id,
        status: response.body.status,
        external_id: response.body.id,
        transaction_details: response.body.transaction_details || {},
        point_of_interaction: response.body.point_of_interaction || {},
        payment_method: response.body.payment_method,
      };
    } else {
      throw new Error('Payment creation failed');
    }
  } catch (error) {
    console.error('Payment error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get payment status from Mercado Pago
 * @param {string} paymentId - Payment ID from Mercado Pago
 * @returns {Object} Payment status
 */
export async function getPaymentStatus(paymentId) {
  try {
    const response = await mercadopago.payment.findById(paymentId);
    if (response.body) {
      return {
        success: true,
        status: response.body.status,
        status_detail: response.body.status_detail,
        payment_id: response.body.id,
      };
    }
  } catch (error) {
    console.error('Error getting payment status:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create a preference for payment (Checkout Pro)
 * @param {Object} preferenceData
 * @returns {Object} Preference with init_point URL
 */
export async function createPreference(preferenceData) {
  try {
    const { invoice_id, client_email, client_name, amount, plan_name } = preferenceData;

    const preference = {
      items: [
        {
          title: plan_name || 'License Plan',
          quantity: 1,
          unit_price: parseFloat(amount),
        },
      ],
      payer: {
        email: client_email,
        name: client_name,
      },
      back_urls: {
        success: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payments/success`,
        failure: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payments/failure`,
        pending: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payments/pending`,
      },
      external_reference: invoice_id,
      auto_return: 'approved',
    };

    const response = await mercadopago.preference.create(preference);
    return {
      success: true,
      init_point: response.body.init_point,
      preference_id: response.body.id,
    };
  } catch (error) {
    console.error('Preference creation error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Parse webhook notification from Mercado Pago
 * @param {Object} webhookData
 * @returns {Object} Parsed payment data
 */
export async function parseWebhook(webhookData) {
  try {
    const { type, data } = webhookData;

    if (type === 'payment') {
      const paymentId = data.id;
      const paymentStatus = await getPaymentStatus(paymentId);

      return {
        success: true,
        type: 'payment',
        event_type: webhookData.action || 'payment.updated',
        payment_id: paymentId,
        status: paymentStatus.status,
        external_id: paymentId,
      };
    }

    return {
      success: true,
      type,
    };
  } catch (error) {
    console.error('Webhook parse error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export default {
  createPayment,
  getPaymentStatus,
  createPreference,
  parseWebhook,
};
