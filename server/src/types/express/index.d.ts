import { UserRole } from "../../models/user.model";

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        email: string;
        role: UserRole;
        sessionId: string;
      };
    }
  }
}
