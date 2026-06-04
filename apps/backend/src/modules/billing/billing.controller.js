const billingService = require('./billing.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

exports.createInvoice = async (req, res, next) => {
  try {
    const data = await billingService.createInvoice(req.body, req.user);
    return sendSuccess(res, 201, data);
  } catch (error) {
    if (error.code) {
      return sendError(res, error.status, error.code, error.message);
    }
    next(error);
  }
};

exports.listInvoices = async (req, res, next) => {
  try {
    const { data, meta } = await billingService.listInvoices(req.query, req.user);
    return sendSuccess(res, 200, data, meta);
  } catch (error) {
    if (error.code) {
      return sendError(res, error.status, error.code, error.message);
    }
    next(error);
  }
};

exports.getInvoiceById = async (req, res, next) => {
  try {
    const data = await billingService.getInvoiceById(req.params.id);
    return sendSuccess(res, 200, data);
  } catch (error) {
    if (error.code) {
      return sendError(res, error.status, error.code, error.message);
    }
    next(error);
  }
};

exports.recordPayment = async (req, res, next) => {
  try {
    const data = await billingService.recordPayment(req.params.id, req.body, req.user);
    return sendSuccess(res, 200, data);
  } catch (error) {
    if (error.code) {
      return sendError(res, error.status, error.code, error.message);
    }
    next(error);
  }
};

exports.deleteInvoice = async (req, res, next) => {
  try {
    await billingService.deleteInvoice(req.params.id, req.user);
    return sendSuccess(res, 204);
  } catch (error) {
    if (error.code) {
      return sendError(res, error.status, error.code, error.message);
    }
    next(error);
  }
};

exports.generateInvoicePdf = async (req, res, next) => {
  try {
    const pdfStream = await billingService.generateInvoicePdf(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${req.params.id}.pdf"`);
    pdfStream.pipe(res);
  } catch (error) {
    if (error.code) {
      return sendError(res, error.status, error.code, error.message);
    }
    next(error);
  }
};
