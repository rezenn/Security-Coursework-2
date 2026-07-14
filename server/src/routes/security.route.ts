import { Router } from "express";
import { reportCspViolation } from "../controllers/security.controller";

const router = Router();

router.post("/csp-report", reportCspViolation);

export default router;
