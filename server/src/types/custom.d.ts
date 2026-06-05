declare module "xss-clean" {
  import { RequestHandler } from "express";
  function xssClean(): RequestHandler;
  export = xssClean;
}

declare module "csurf" {
  import { RequestHandler } from "express";
  function csurf(options?: any): RequestHandler;
  namespace csurf {}
  export = csurf;
}

declare global {
  namespace Express {
    interface Request {
      csrfToken(): string;
    }
  }
}
