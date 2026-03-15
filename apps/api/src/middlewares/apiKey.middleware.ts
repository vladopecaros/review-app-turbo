import { NextFunction, Request, Response } from 'express';
import { OrganizationRepository } from '../modules/organization/organization.repository';
import { logger } from '../config/logger';

export function createRequireApiKey(organizations: OrganizationRepository) {
  return async function requireApiKey(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const apiKey = req.header('x-api-key');

    if (!apiKey) {
      logger.warn('API key missing on public request', { path: req.path });
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const organization = await organizations.findByApiKey(apiKey);

      if (!organization) {
        logger.warn('Invalid API key presented', { path: req.path, keyPrefix: apiKey.slice(0, 8) });
        return res.status(401).json({ message: 'Unauthorized' });
      }

      req.apiKeyOrganizationId = organization._id.toString();
      return next();
    } catch (error) {
      return next(error);
    }
  };
}
