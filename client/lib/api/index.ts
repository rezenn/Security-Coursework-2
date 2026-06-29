import api from "./axios";
import { API } from "./endpoints";

export const authApi = {
  register: (data: { email: string; username: string; password: string; captchaToken?: string }) =>
    api.post(API.AUTH.REGISTER, data).then((r) => r.data),
  login: (data: { email: string; password: string; captchaToken?: string; mfaToken?: string }) =>
    api.post(API.AUTH.LOGIN, data).then((r) => r.data),
  logout: () => api.post(API.AUTH.LOGOUT).then((r) => r.data),
  me: () => api.get(API.AUTH.ME).then((r) => r.data),
  verifyEmailToken: (token: string) =>
    api.post(API.AUTH.VERIFY_EMAIL_TOKEN(token), {}).then((r) => r.data),
  verifyEmailCode: (email: string, code: string) =>
    api.post(API.AUTH.VERIFY_EMAIL_CODE, { email, code }).then((r) => r.data),
  requestReset: (email: string, captchaToken?: string) =>
    api.post(API.AUTH.REQUEST_RESET, { email, captchaToken }).then((r) => r.data),
  resetPasswordToken: (token: string, password: string, captchaToken?: string) =>
    api.post(API.AUTH.RESET_PASSWORD(token), { password, captchaToken }).then((r) => r.data),
  setupMFA: () => api.post(API.AUTH.MFA_SETUP, {}).then((r) => r.data),
  confirmMFA: (token: string) =>
    api.post(API.AUTH.MFA_CONFIRM, { token }).then((r) => r.data),
};

export const courseApi = {
  list: (params?: Record<string, string>) =>
    api.get(API.COURSES.LIST, { params }).then((r) => r.data),
  detail: (slug: string) =>
    api.get(API.COURSES.DETAIL(slug)).then((r) => r.data),
};

export const profileApi = {
  get: () => api.get(API.PROFILE.GET).then((r) => r.data),
  update: (data: { firstName?: string; lastName?: string; bio?: string }) =>
    api.patch(API.PROFILE.UPDATE, data).then((r) => r.data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post(API.PROFILE.CHANGE_PASSWORD, { currentPassword, newPassword }).then((r) => r.data),
  export: () => api.get(API.PROFILE.EXPORT, { responseType: "blob" }),
};

export const paymentApi = {
  initiate: (courseId: string) =>
    api.post(API.PAYMENTS.INITIATE, { courseId }).then((r) => r.data),
  verify: (pidx: string) =>
    api.post(API.PAYMENTS.VERIFY, { pidx }).then((r) => r.data),
  myTransactions: () => api.get(API.PAYMENTS.MY_TRANSACTIONS).then((r) => r.data),
};

export const adminApi = {
  stats: () => api.get(API.ADMIN.STATS).then((r) => r.data),
  users: (params?: Record<string, string>) =>
    api.get(API.ADMIN.USERS, { params }).then((r) => r.data),
  toggleUser: (id: string) => api.patch(API.ADMIN.TOGGLE_USER(id), {}).then((r) => r.data),
  deleteUser: (id: string) => api.delete(API.ADMIN.DELETE_USER(id)).then((r) => r.data),
  logs: () => api.get(API.ADMIN.LOGS).then((r) => r.data),
  courses: () => api.get(API.ADMIN.COURSES).then((r) => r.data),
  createCourse: (data: Record<string, unknown>) =>
    api.post(API.ADMIN.COURSES, data).then((r) => r.data),
  updateCourse: (id: string, data: Record<string, unknown>) =>
    api.patch(API.ADMIN.UPDATE_COURSE(id), data).then((r) => r.data),
  deleteCourse: (id: string) => api.delete(API.ADMIN.DELETE_COURSE(id)).then((r) => r.data),
  addLesson: (id: string, data: Record<string, unknown>) =>
    api.post(API.ADMIN.ADD_LESSON(id), data).then((r) => r.data),
  transactions: () => api.get(API.ADMIN.TRANSACTIONS).then((r) => r.data),
};
