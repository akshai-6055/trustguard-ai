#  TrustGuard AI – Adaptive Zero Trust Security Platform

**Mini Project**  
A web-based Zero Trust Security Platform that continuously verifies user identity, device trust, and access policies before granting access to organizational resources.

---

##  Project Overview

Traditional security models assume that users inside an organization's network are trustworthy after authentication. This approach increases the risk of unauthorized access and insider threats.

**TrustGuard AI** follows the **Zero Trust Architecture (ZTA)** principle of **"Never Trust, Always Verify."** Every user, device, and access request is verified continuously before access to protected resources is granted.

This project demonstrates the core concepts of Zero Trust Security through a modern web application built using **React**, **Node.js**, **Express.js**, and **MySQL**.

---

##  Objectives

- Implement secure user authentication
- Verify trusted devices before granting access
- Enforce policy-based access control
- Continuously verify user sessions
- Maintain comprehensive security audit logs
- Demonstrate the core principles of Zero Trust Security

---

#  Technology Stack

## Frontend
- React.js
- Bootstrap 5
- React Router
- Axios

## Backend
- Node.js
- Express.js

## Database
- MySQL

## Authentication & Security
- JSON Web Token (JWT)
- bcrypt
- Express Middleware

## Development Tools
- Visual Studio Code
- Git & GitHub
- Postman

---

#  Project Modules

## Module 1 – Identity & Authentication

Responsible for verifying the identity of users before granting access.

### Features

- User Registration
- Secure Login
- Password Hashing (bcrypt)
- JWT Authentication
- Logout
- Role-Based Authentication


---

## Module 2 – Device Trust

Verifies whether users are accessing the system using a trusted device.

### Features

- Register Device
- View Registered Devices
- Approve Devices
- Block Devices
- Device Verification

### Device Status

- Pending
- Approved
- Blocked


---

## Module 3 – Policy-Based Access Control

Controls access to resources based on user role, device trust, and organizational security policies.

### Features

- Role-Based Access Control (RBAC)
- Least Privilege Access
- Department-Based Permissions
- Time-Based Policies
- Trusted Device Policies

### Example Policies

- HR employees can access payroll only during office hours.
- Managers can access reports only from trusted devices.
- Employees cannot access administrative settings.


---

## Module 4 – Continuous Authentication

Instead of trusting users after login, the system verifies every sensitive request.

### Features

- Session Verification
- JWT Validation
- Device Verification
- Account Status Verification
- Policy Re-evaluation


---

## Module 5 – Security Dashboard & Audit Logs

Provides administrators with complete visibility into system security and user activities.

### Dashboard Features

###  Admini

- Total Users
- Active Sessions
- Security Alerts
- Audit Logs
- Employee Management
- Pending Devices
- Blocked Devices
- Failed Login Attempts

### Employee

- Profile
- Registered Devices
- Login History

### Audit Log Events

- Login
- Logout
- Failed Login
- Device Registration
- Device Approval
- Access Granted
- Access Denied

---

#  User Roles

## Super Administrator

- Manage Organizations
- Manage Security Administrators
- Configure Global Security Policies
- Monitor Audit Logs
- View Security Dashboard
- Manage Employees
- Approve Devices
- Configure Security Policies
- Monitor Login Activities
- View Audit Logs

---

## Employee

- Login Securely
- Register Devices
- Access Authorized Resources
- View Login History
- Manage Profile

---

#  Zero Trust Principles Implemented

- Never Trust, Always Verify
- Identity Verification
- Device Trust Verification
- Continuous Authentication
- Policy-Based Access Control
- Least Privilege Access
- Security Monitoring
- Audit Logging

---

#  Planned Database Tables

 users            
 roles            
 user_sessions    
 devices           
 permissions       
 role_permissions 
 security_policies 
 audit_logs        
 login_history 

---

#  Development Roadmap

### Phase 1
- Project Initialization
- Database Design
- Authentication Module

### Phase 2
- Device Trust Module
- User Role Management

### Phase 3
- Policy-Based Access Control
- Protected Resources

### Phase 4
- Continuous Authentication
- Session Management

### Phase 5
- Security Dashboard
- Audit Logs
- Testing & Documentation

---

# Future Enhancements

- Multi-Factor Authentication (Email OTP)
- AI-Based Login Risk Analysis
- Behavioral Authentication
- AI Security Assistant
- Intelligent Threat Detection
- Cloud Deployment
- Mobile Application Support
- Real-Time Security Alerts

---

#  Academic Purpose

This project is developed as a **Mini Project** for the **Master of Computer Applications (MCA)** program to demonstrate the implementation of **Zero Trust Security Architecture** using modern web technologies.

---

##  Developer

**Akshai Raj**

---

## License

This project is intended for academic and educational purposes.
