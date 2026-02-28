import { NextFunction, Request, Response } from 'express';
import { OrganizationRepository } from '../modules/organization/organization.repository';

export function createRequireApiKey(organizations: OrganizationRepository) {
  return async function requireApiKey(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const apiKey = req.header('x-api-key');

    if (!apiKey) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const organization = await organizations.findByApiKey(apiKey);

      if (!organization) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      req.apiKeyOrganizationId = organization._id.toString();
      return next();
    } catch (error) {
      return next(error);
    }
  };
}
