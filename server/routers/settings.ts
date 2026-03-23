import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

/**
 * Default settings values
 */
const DEFAULT_SETTINGS = {
  currency: 'INR',
  minRechargeAmount: 10,
  maxRechargeAmount: 5000,
  referralPercent: 0,
  minRedeem: 0,
  numberExpiryMinutes: 20,
  minCancelMinutes: 2,
  maintenanceMode: false,
  maxDiscountPercent: 20,
  upiId: '',
  bharatpeMerchantId: '',
  bharatpeToken: '',
  bharatpeQrImage: '',
  telegramSupportUsername: '',
  apiDocsBaseUrl: '',
  telegramHelpUrl: '',
};

/**
 * Settings update schema (partial - only update provided fields)
 */
const settingsUpdateSchema = z
  .object({
    bharatpeMerchantId: z.string().optional(),
    bharatpeToken: z.string().optional(),
    bharatpeQrImage: z.string().optional(),
    minRechargeAmount: z.number().positive().optional(),
    maxRechargeAmount: z.number().positive().optional(),
    upiId: z.string().optional(),
    referralPercent: z.number().min(0).max(100).optional(),
    minRedeem: z.number().min(0).optional(),
    numberExpiryMinutes: z.number().int().positive().optional(),
    currency: z.string().optional(),
    minCancelMinutes: z.number().int().positive().optional(),
    maxDiscountPercent: z.number().int().min(1).max(100).optional(),
    maintenanceMode: z.boolean().optional(),
    telegramHelpUrl: z.string().url().optional(),
    telegramSupportUsername: z.string().optional(),
    apiDocsBaseUrl: z.string().url().optional(),
  })
  .strict();

/**
 * Settings Router
 * Application settings management
 */
export const settingsRouter = router({
  /**
   * Get application settings
   * Returns default values if settings don't exist
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const { prisma } = ctx;

    let settings = await prisma.settings.findUnique({
      where: { id: '1' },
    });

    if (!settings) {
      // Return default settings without creating them
      return {
        id: '1',
        ...DEFAULT_SETTINGS,
      };
    }

    return settings;
  }),

  /**
   * Update application settings
   * Only updates provided fields, leaves others unchanged
   */
  update: protectedProcedure
    .input(settingsUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      const { prisma, admin } = ctx;

      // Prepare update data with type conversion for Decimal fields
      const updateData: any = {};
      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined && value !== null) {
          updateData[key] = value;
        }
      }

      const settings = await prisma.settings.upsert({
        where: { id: '1' },
        create: { id: '1', ...DEFAULT_SETTINGS, ...updateData },
        update: updateData,
      });

      // Create audit log
      try {
        await prisma.userAuditLog.create({
          data: {
            userId: admin.id,
            adminId: admin.id,
            action: 'UPDATE_SETTINGS',
            changes: updateData,
            reason: 'Settings update',
          },
        });
      } catch (error) {
        // Don't fail the request if audit log fails
        console.error('Failed to create audit log for settings update:', error);
      }

      return settings;
    }),

  /**
   * Reset settings to defaults
   */
  reset: protectedProcedure.mutation(async ({ ctx }) => {
    const { prisma, admin } = ctx;

    const settings = await prisma.settings.upsert({
      where: { id: '1' },
      update: DEFAULT_SETTINGS,
      create: { id: '1', ...DEFAULT_SETTINGS },
    });

    // Create audit log
    try {
      await prisma.userAuditLog.create({
        data: {
          userId: admin.id,
          adminId: admin.id,
          action: 'RESET_SETTINGS',
          changes: { resetToDefaults: true },
          reason: 'Settings reset to defaults',
        },
      });
    } catch (error) {
      console.error('Failed to create audit log for settings reset:', error);
    }

    return settings;
  }),
});
