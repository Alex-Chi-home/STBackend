export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: { id: number };
    }
  }
}
