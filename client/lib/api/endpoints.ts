export const API = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    GETUSER: "/api/auth/get-user",
    UPDATEPROFILE: "/api/auth/update-user",
    REQUEST_PASSWORD_RESET: "/api/auth/request-password-reset",
    RESET_PASSWORD: (token: string) => `/api/auth/reset-password/${token}`,
  },
  ADMIN: {
    GETALLUSERS: "/api/admin/auth/users",
    CREATEUSER: "/api/admin/auth/create-user",
    REGISTERORGANIZATION: "/api/admin/auth/register-organization",
    GETUSERBYID: (id: string) => `/api/auth/${id}`,
    UPDATEUSERASADMIN: (id: string) => `/api/admin/auth/${id}`,
    DELETEUSERASADMIN: (id: string) => `/api/admin/auth/${id}`,
  },
  ORGANIZATION: {
    GETORGANIZATIONS: "/api/organizations",
    GETORGANIZATIONBYID: (id: string) => `/api/organizations/${id}`,
    POSTORGANIZATIONDETAILS: "/api/organizations/details",
    GETORGANIZATIONDETAILS: "/api/organizations/details",
    UPDATEORGANIZATIONDETAILS: "/api/organizations/details",
    DELETEORGANIZATIONDETAILS: "/api/organizations/details",
  },
  MESSAGE: {
    SENDTOORG: "/api/message/send-to-org",
    STREAMTOKEN: "/api/message/stream-token",
  },
  APPOINTMENT: {
    CREATE: "/api/appointments",
    GETUSERAPPOINTMENT: "/api/appointments/user",
    GETBYID: (id: string) => `/api/appointments/${id}`,
    UPDATE: (id: string) => `/api/appointments/${id}`,
    CANCEL: (id: string) => `/api/appointments/${id}/cancel`,
    COMPLETE: (id: string) => `/api/appointments/${id}/complete`,
    CHECKAVAILABILITY: "/api/appointments/availability",
    GETBYDATERANGE: "/api/appointments/date-range",
    GETALL: "/api/appointments?limit=1000",
    GETBYORGANIZATION: (orgId: string) =>
      `/api/appointments/organization/${orgId}`,
  },
  PAYMENT: {
    CREATEINTENT: "/api/payments/create-payment-intent",
    MARKPAID: (id: string) => `/api/payments/${id}/mark-paid`,
  },
};
