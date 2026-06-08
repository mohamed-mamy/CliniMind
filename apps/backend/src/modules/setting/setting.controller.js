const Setting = require('./setting.model');
const { updateSettingSchema } = require('./setting.validation');

// Fixed key for singleton pattern
const SINGLETON_FILTER = {};

/**
 * Sanitize settings to mask sensitive fields before sending to client.
 */
const sanitizeSettings = (settings) => {
  const sanitized = { ...settings };
  if (sanitized.smtpConfig) {
    sanitized.smtpConfig = { ...sanitized.smtpConfig };
    if (sanitized.smtpConfig.smtpPass) {
      sanitized.smtpConfig.smtpPass = '••••••••';
    }
  }
  return sanitized;
};

// GET /settings/public — no auth required, returns only clinicName
const getPublicSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOneAndUpdate(
      SINGLETON_FILTER,
      { $setOnInsert: {} },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    res.status(200).json({
      success: true,
      data: { clinicName: settings.clinicName },
      error: null,
      meta: null
    });
  } catch (error) {
    next(error);
  }
};

// GET /settings
const getSettings = async (req, res, next) => {
  try {
    // Atomic upsert to guarantee singleton
    let settings = await Setting.findOneAndUpdate(
      SINGLETON_FILTER,
      { $setOnInsert: {} },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    // Role-based access:
    // Director: full settings (sanitized)
    // Others: public settings only
    if (req.user.role !== 'director') {
      const publicSettings = {
        clinicName: settings.clinicName,
        clinicAddress: settings.clinicAddress,
        clinicPhone: settings.clinicPhone,
        clinicEmail: settings.clinicEmail,
        logoUrl: settings.logoUrl,
        defaultConsultationFee: settings.defaultConsultationFee
      };
      return res.status(200).json({
        success: true,
        data: publicSettings,
        error: null,
        meta: null
      });
    }

    res.status(200).json({
      success: true,
      data: sanitizeSettings(settings),
      error: null,
      meta: null
    });
  } catch (error) {
    next(error);
  }
};

// PUT /settings
const updateSettings = async (req, res, next) => {
  try {
    const validatedData = updateSettingSchema.parse(req.body);

    const currentSettings = await Setting.findOne(SINGLETON_FILTER).lean();
    const oldFee = currentSettings ? currentSettings.defaultConsultationFee : null;
    const newFee = validatedData.defaultConsultationFee;

    const settings = await Setting.findOneAndUpdate(
      SINGLETON_FILTER, 
      { $set: validatedData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    if (newFee !== undefined && oldFee !== newFee) {
      const AuditLog = require('../audit/audit.model');
      await AuditLog.create({
        userId: req.user.userId,
        action: 'modify_price',
        details: `Modified default consultation fee from ${oldFee || 0} to ${newFee}`,
        oldValues: { defaultConsultationFee: oldFee },
        newValues: { defaultConsultationFee: newFee },
        resourceType: 'Setting',
        resourceId: settings._id
      });
    }

    res.status(200).json({
      success: true,
      data: sanitizeSettings(settings),
      error: null,
      meta: null
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields: error.flatten().fieldErrors },
        meta: null
      });
    }
    next(error);
  }
};

module.exports = {
  getPublicSettings,
  getSettings,
  updateSettings
};
