const Setting = require('./setting.model');
const { updateSettingSchema } = require('./setting.validation');

// GET /settings
const getSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne().lean();
    if (!settings) {
      // Create default settings if none exist
      const newSettings = new Setting({});
      await newSettings.save();
      settings = newSettings.toObject();
    }

    // Role-based access:
    // Director: full settings
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
      data: settings,
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

    const currentSettings = await Setting.findOne().lean();
    const oldFee = currentSettings ? currentSettings.defaultConsultationFee : null;
    const newFee = validatedData.defaultConsultationFee;

    const settings = await Setting.findOneAndUpdate(
      {}, 
      { $set: validatedData },
      { new: true, upsert: true }
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
      data: settings,
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
  getSettings,
  updateSettings
};
