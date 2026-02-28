import { Types } from 'mongoose';
import { UserRepository } from './user.repository';

export class UserService {
  constructor(private readonly users: UserRepository) {}

  async getUserById(id: Types.ObjectId) {
    return this.users.findById(id);
  }

  async getUserByEmail(email: string) {
    return this.users.findByEmail(email);
  }
}
