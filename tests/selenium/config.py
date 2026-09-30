import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env.test'))

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000/api")

# Test Accounts
ADMIN_EMAIL = os.getenv("TEST_ADMIN_EMAIL", "test_admin@trustguard.local")
ADMIN_PASSWORD = os.getenv("TEST_ADMIN_PASSWORD", "AdminPass123!")
EMPLOYEE_EMAIL = os.getenv("TEST_EMPLOYEE_EMAIL", "test_employee@trustguard.local")
EMPLOYEE_PASSWORD = os.getenv("TEST_EMPLOYEE_PASSWORD", "EmpPass123!")

# Database
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "2004")
DB_NAME = os.getenv("DB_NAME", "trustguard_ai")
DB_PORT = int(os.getenv("DB_PORT", "3306"))

# Timeouts
DEFAULT_TIMEOUT = 20
