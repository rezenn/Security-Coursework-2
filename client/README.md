# QuickPalo -- Appointment Booking & Queue Management System

QuickPalo is a full-stack web application designed to modernize
traditional appointment scheduling and queuing systems. It enables users
to book appointments remotely, complete secure payments, and verify
bookings via QR-based check-in. Service providers can manage slots,
monitor queues, and optimize workflow efficiency.

------------------------------------------------------------------------

## Architecture Overview

-   **Frontend:** Next.js (React-based with Server-Side Rendering)
-   **Backend:** Node.js + Express (RESTful API)
-   **Database:** MongoDB with Mongoose
-   **Language:** TypeScript
-   **Authentication:** JWT-based authentication
-   **Architecture Pattern:** Layered Architecture

------------------------------------------------------------------------

# Frontend -- Next.js Application

## Overview

The frontend is built using Next.js with App Router architecture. It
supports Server-Side Rendering (SSR), file-based routing, and
server/client component separation.

## Key Features

-   Server-Side Rendering (SSR)
-   File-based routing
-   Server Actions
-   Middleware-based authentication
-   Component separation (Server & Client Components)
-   Dynamic appointment booking UI
-   QR-based booking confirmation

## Folder Structure

    frontend/
    │
    ├── app/
    │   ├── (auth)/
    │   ├── admin/ 
    │   ├── organization/
    │   ├── user/    
    │   ├── dashboard/
    │   ├── appointments/
    │   └── api/
    │
    ├── components/
    ├── lib/
    ├── proxy.ts
    ├── services/
    └── types/

## Run Frontend

``` bash
cd client
npm install
npm run dev
```

App runs at: http://localhost:3000
