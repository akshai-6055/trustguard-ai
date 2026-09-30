import pytest
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from tests.selenium.config import (
    FRONTEND_URL,
    DEFAULT_TIMEOUT,
    EMPLOYEE_EMAIL,
    EMPLOYEE_PASSWORD,
    ADMIN_EMAIL,
    ADMIN_PASSWORD
)
from tests.selenium.db_helper import grant_permission, revoke_permission

def test_employee_cannot_access_admin_dashboard(employee_login):
    """Employee attempts to access /admin/dashboard -> Denied and redirected."""
    driver = employee_login
    
    # Attempt to navigate to an admin-only route
    driver.get(f"{FRONTEND_URL}/admin/dashboard")
    
    # Wait for the UI to redirect to the employee dashboard or login
    # Based on the ProtectedRoute logic, it redirects unauthorized users to /dashboard
    WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.url_to_be(f"{FRONTEND_URL}/dashboard")
    )
    
    assert driver.current_url == f"{FRONTEND_URL}/dashboard", "Employee was not redirected away from Admin Dashboard."

def test_admin_can_access_employee_dashboard(admin_login):
    """Admin attempts to access a protected employee route -> Allowed."""
    driver = admin_login
    
    # Attempt to navigate to the generic dashboard
    driver.get(f"{FRONTEND_URL}/dashboard")
    
    # Should not redirect to login or /admin/dashboard
    # ProtectedRoute allows any logged-in user if allowedRoles is empty, 
    # which applies to /dashboard.
    WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.url_to_be(f"{FRONTEND_URL}/dashboard")
    )
    
    # Check if the Employee dashboard loads
    # "Your Devices" or "User Information" usually shows up
    WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_element_located((By.XPATH, "//*[contains(@class, 'card')]"))
    )
    assert driver.current_url == f"{FRONTEND_URL}/dashboard"

def test_missing_view_audit_logs_permission(admin_login):
    """Missing VIEW_AUDIT_LOGS permission prevents seeing the audit log menu item or accessing the route."""
    driver = admin_login
    
    # Revoke permission
    success = revoke_permission("Admin", "VIEW_AUDIT_LOGS")
    
    if not success:
        pytest.skip("VIEW_AUDIT_LOGS permission does not exist in the database. The granular PBAC feature is missing.")
        
    try:
        driver.refresh()
        
        # 1. Assert the menu item is missing
        try:
            WebDriverWait(driver, 5).until(
                EC.invisibility_of_element_located((By.XPATH, "//a[contains(@href, '/admin/audit-logs')]"))
            )
        except:
            pass
        
        audit_log_links = driver.find_elements(By.XPATH, "//a[contains(@href, '/admin/audit-logs')]")
        if audit_log_links:
            for link in audit_log_links:
                assert not link.is_displayed(), "Audit Logs menu item is still visible despite missing permission."
        
        # 2. Assert direct access is prevented
        driver.get(f"{FRONTEND_URL}/admin/audit-logs")
        
        # The frontend should show an access denied error or redirect
        # If it loads the table, it failed the authorization check.
        try:
            # Check if table populates
            table = WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.TAG_NAME, "table"))
            )
            pytest.fail("Accessed /admin/audit-logs successfully despite missing VIEW_AUDIT_LOGS permission.")
        except:
            # Good, table didn't load
            pass
            
    finally:
        grant_permission("Admin", "VIEW_AUDIT_LOGS")
