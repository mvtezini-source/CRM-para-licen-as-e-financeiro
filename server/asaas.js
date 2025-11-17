import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// ASAAS API Configuration
const ASAAS_BASE_URL = process.env.ASAAS_ENV === 'production' 
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/v3';

const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

// Initialize Axios instance
const asaasClient = axios.create({
  baseURL: ASAAS_BASE_URL,
  headers: {
    'access_token': ASAAS_API_KEY,
  },
});

/**
 * Create a payment request with ASAAS (Invoice/Cobrança)
 * @param {Object} paymentData - { invoiceId, clientEmail, clientName, amount, dueDate, description }
 * @returns {Object} Payment details
 */
export async function createPayment(paymentData) {
  try {
    const { invoiceId, clientEmail, clientName, amount, dueDate, description } = paymentData;

    if (!invoiceId || !clientEmail || !amount || !dueDate) {
      throw new Error('Missing required fields: invoiceId, clientEmail, amount, dueDate');
    }

    // First, create or find a customer
    const customerResponse = await findOrCreateCustomer(clientEmail, clientName);
    const customerId = customerResponse.customerId;

    // Create the payment request
    const paymentResponse = await asaasClient.post('/payments', {
      customer: customerId,
      value: parseFloat(amount),
      dueDate: dueDate,
      description: description || `Fatura ${invoiceId}`,
      externalReference: invoiceId,
      notificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/api/webhooks/asaas`,
    });

    if (paymentResponse.data && paymentResponse.data.id) {
      return {
        success: true,
        payment_id: paymentResponse.data.id,
        status: paymentResponse.data.status,
        external_id: paymentResponse.data.id,
        invoice_url: paymentResponse.data.invoiceUrl,
        barcode: paymentResponse.data.barCode,
        pix_qr_code: paymentResponse.data.pixQrCode,
        pix_copy_paste: paymentResponse.data.pixCopyPaste,
        customer_id: customerId,
      };
    } else {
      throw new Error('Payment creation failed - no ID returned');
    }
  } catch (error) {
    console.error('Payment creation error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.errors?.[0]?.description || error.message,
    };
  }
}

/**
 * Find or create a customer in ASAAS
 * @param {string} email - Customer email
 * @param {string} name - Customer name
 * @returns {Object} Customer ID
 */
export async function findOrCreateCustomer(email, name) {
  try {
    // Try to find existing customer
    const searchResponse = await asaasClient.get('/customers', {
      params: {
        email: email,
      },
    });

    if (searchResponse.data.data && searchResponse.data.data.length > 0) {
      return {
        success: true,
        customerId: searchResponse.data.data[0].id,
        isNew: false,
      };
    }

    // Create new customer if not found
    const createResponse = await asaasClient.post('/customers', {
      name: name || 'Cliente Padrão',
      email: email,
      mobilePhone: '',
      cpfCnpj: '',
      postalCode: '',
      address: '',
      addressNumber: '',
      complement: '',
      province: '',
      city: '',
      state: '',
    });

    if (createResponse.data && createResponse.data.id) {
      return {
        success: true,
        customerId: createResponse.data.id,
        isNew: true,
      };
    }

    throw new Error('Failed to create customer');
  } catch (error) {
    console.error('Customer error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get payment status from ASAAS
 * @param {string} paymentId - Payment ID from ASAAS
 * @returns {Object} Payment status
 */
export async function getPaymentStatus(paymentId) {
  try {
    const response = await asaasClient.get(`/payments/${paymentId}`);
    
    if (response.data) {
      return {
        success: true,
        status: response.data.status,
        status_code: response.data.status,
        payment_id: response.data.id,
        value: response.data.value,
        received_value: response.data.receivedValue,
        pix_qr_code: response.data.pixQrCode,
        pix_copy_paste: response.data.pixCopyPaste,
        barcode: response.data.barCode,
        invoice_url: response.data.invoiceUrl,
      };
    }
  } catch (error) {
    console.error('Error getting payment status:', error.response?.data || error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update customer information
 * @param {string} customerId - Customer ID
 * @param {Object} customerData - Updated customer data
 * @returns {Object} Updated customer
 */
export async function updateCustomer(customerId, customerData) {
  try {
    const response = await asaasClient.put(`/customers/${customerId}`, customerData);
    
    if (response.data) {
      return {
        success: true,
        customer: response.data,
      };
    }
  } catch (error) {
    console.error('Customer update error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Parse webhook notification from ASAAS
 * @param {Object} webhookData - Webhook data from ASAAS
 * @returns {Object} Parsed payment data
 */
export async function parseWebhook(webhookData) {
  try {
    const { event, payment } = webhookData;

    // Map ASAAS status to our status
    const statusMap = {
      'PENDING': 'pending',
      'CONFIRMED': 'approved',
      'OVERDUE': 'overdue',
      'REFUNDED': 'refunded',
      'RECEIVED': 'approved',
      'RECEIVED_IN_CASH': 'approved',
      'REFUND_REQUESTED': 'refund_requested',
      'REFUND_IN_PROGRESS': 'refund_in_progress',
      'REFUND_FAILED': 'refund_failed',
      'CHARGEBACK_REQUESTED': 'chargeback_requested',
      'CHARGEBACK_DISPUTE': 'chargeback_dispute',
      'AWAITING_CHARGEBACK_REVERSAL': 'awaiting_chargeback_reversal',
      'DUNNING_REQUESTED': 'dunning_requested',
      'DUNNING_RECEIVED': 'dunning_received',
      'AWAITING_RISK_ANALYSIS': 'awaiting_risk_analysis',
    };

    return {
      success: true,
      event_type: event,
      payment_id: payment?.id,
      external_id: payment?.id,
      status: statusMap[payment?.status] || payment?.status,
      original_status: payment?.status,
      value: payment?.value,
      received_value: payment?.receivedValue,
      external_reference: payment?.externalReference,
      payment_date: payment?.paymentDate,
    };
  } catch (error) {
    console.error('Webhook parse error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Refund a payment
 * @param {string} paymentId - Payment ID
 * @param {number} amount - Amount to refund (optional, if not provided refunds all)
 * @returns {Object} Refund result
 */
export async function refundPayment(paymentId, amount = null) {
  try {
    const requestBody = {
      paymentId: paymentId,
    };

    if (amount) {
      requestBody.value = parseFloat(amount);
    }

    const response = await asaasClient.post('/refunds', requestBody);

    if (response.data && response.data.id) {
      return {
        success: true,
        refund_id: response.data.id,
        status: response.data.status,
      };
    }

    throw new Error('Refund failed');
  } catch (error) {
    console.error('Refund error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.errors?.[0]?.description || error.message,
    };
  }
}

/**
 * List all payments
 * @param {Object} filters - Filter options (limit, offset, status, etc)
 * @returns {Array} List of payments
 */
export async function listPayments(filters = {}) {
  try {
    const response = await asaasClient.get('/payments', {
      params: {
        limit: filters.limit || 100,
        offset: filters.offset || 0,
        status: filters.status,
        ...filters,
      },
    });

    if (response.data && response.data.data) {
      return {
        success: true,
        payments: response.data.data,
        total_count: response.data.totalCount,
      };
    }
  } catch (error) {
    console.error('List payments error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

export default {
  createPayment,
  findOrCreateCustomer,
  getPaymentStatus,
  updateCustomer,
  parseWebhook,
  refundPayment,
  listPayments,
};
