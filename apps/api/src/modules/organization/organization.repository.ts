import { ClientSession, Types } from 'mongoose';
import { OrganizationDocument, OrganizationModel } from './organization.model';
import { Organization } from './organization.types';
import { AppError } from '../../errors/app.error';
import crypto from 'crypto';

export class OrganizationRepository {
  async create(
    data: {
      name: string;
      slug: string;
      ownerUserId: Types.ObjectId;
    },
    session?: ClientSession,
  ) {
    try {
      const organization = session
        ? (await OrganizationModel.create([data], { session }))[0]
        : await OrganizationModel.create(data);
      return this.toDomain(organization);
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new AppError('Organization with this slug already exists', 409);
      }
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mongoose lean() and populate() results lose their Document type; `any` used intentionally to map raw doc fields
  private toDomain(doc: any): Organization {
    return {
      _id: doc._id,
      name: doc.name,
      slug: doc.slug,
    };
  }

  public mapToDomain(doc: OrganizationDocument): Organization {
    return this.toDomain(doc);
  }

  public async deleteById(id: Types.ObjectId): Promise<void> {
    await OrganizationModel.findByIdAndDelete(id).exec();
  }

  private isDuplicateKeyError(error: unknown): error is { code: number } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: number }).code === 11000
    );
  }

  async findMultiple(ids: Types.ObjectId[]) {
    return OrganizationModel.find({
      _id: { $in: ids },
    });
  }

  async findById(id: Types.ObjectId) {
    return OrganizationModel.findOne({ _id: id });
  }

  async storeApiKey(key: string, organizationId: Types.ObjectId) {
    await OrganizationModel.updateOne({ _id: organizationId }, { apiKey: key });
  }

  public createApiKeyPair() {
    const key = crypto.randomBytes(32).toString('base64url');
    const hash = crypto.createHash('sha256').update(key).digest('hex');

    return { key, hash };
  }

  private encryptApiKey(key: string) {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  async findByApiKey(key: string) {
    const keyHash = this.encryptApiKey(key);
    return OrganizationModel.findOne({ apiKey: keyHash });
  }
}
