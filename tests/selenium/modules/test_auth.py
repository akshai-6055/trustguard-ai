import pytest
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from tests.selenium.config import (
    FRONTEND_URL,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    EMPLOYEE_EMAIL,
    EMPLOYEE_PASSWORD,
    DEFAULT_TIMEOUT
)
from tests.selenium.db_helper import reset_test_data

def test_employee_registration_valid(driver):
    """Employee registration with valid data -> success."""
    driver.get(f"{FRONTEND_URL}/register")
    
    # Wait for the form to load
    WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='text']"))
    )
    
    inputs = driver.find_elements(By.CSS_SELECTOR, "input")
    name_input = inputs[0]
    email_input = driver.find_element(By.CSS_SELECTOR, "input[type='email']")
    select_role = driver.find_element(By.CSS_SELECTOR, "select")
    passwords = driver.find_elements(By.CSS_SELECTOR, "input[type='password']")
    pass_input = passwords[0]
    confirm_pass_input = passwords[1]
    terms_checkbox = driver.find_element(By.CSS_SELECTOR, "input[type='checkbox']")
    submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    
    # Fill in the form
    name_input.send_keys("QA Employee")
    email_input.send_keys("QA_employee@trustguard.local")
    
    # Select Employee role
    for option in select_role.find_elements(By.TAG_NAME, "option"):
        if option.text == "Employee":
            option.click()
            break
            
    pass_input.send_keys("TestPass123!")
    confirm_pass_input.send_keys("TestPass123!")
    
    if not terms_checkbox.is_selected():
        terms_checkbox.click()
        
    driver.execute_script("arguments[0].click();", submit_btn)
    
    # Should see success message
    success_msg = WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, ".alert-success"))
    )
    assert "successfully" in success_msg.text.lower()
    
    # Should redirect to login
    WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.url_contains("/login")
    )

def test_registration_duplicate_email(driver):
    """Registration with a duplicate email -> rejected with clear error."""
    driver.get(f"{FRONTEND_URL}/register")
    
    # Wait for the form to load
    WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='text']"))
    )
    
    inputs = driver.find_elements(By.CSS_SELECTOR, "input")
    name_input = inputs[0]
    email_input = driver.find_element(By.CSS_SELECTOR, "input[type='email']")
    select_role = driver.find_element(By.CSS_SELECTOR, "select")
    passwords = driver.find_elements(By.CSS_SELECTOR, "input[type='password']")
    pass_input = passwords[0]
    confirm_pass_input = passwords[1]
    terms_checkbox = driver.find_element(By.CSS_SELECTOR, "input[type='checkbox']")
    submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    
    # Use existing admin email to trigger duplicate
    name_input.send_keys("QA Duplicate")
    email_input.send_keys(ADMIN_EMAIL)
    
    for option in select_role.find_elements(By.TAG_NAME, "option"):
        if option.text == "Employee":
            option.click()
            break
            
    pass_input.send_keys("TestPass123!")
    confirm_pass_input.send_keys("TestPass123!")
    
    if not terms_checkbox.is_selected():
        terms_checkbox.click()
        
    driver.execute_script("arguments[0].click();", submit_btn)
    
    # Should see error message
    error_msg = WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, ".alert-danger"))
    )
    assert error_msg.is_displayed()
    assert len(error_msg.text) > 0

def test_login_admin(driver):
    """Login with valid Admin credentials -> redirected to Admin Dashboard."""
    driver.get(FRONTEND_URL)
    driver.execute_script("localStorage.clear(); sessionStorage.clear();")
    driver.get(f"{FRONTEND_URL}/login")
    
    email_input = WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
    )
    password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
    submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    
    email_input.send_keys(ADMIN_EMAIL)
    password_input.send_keys(ADMIN_PASSWORD)
    driver.execute_script("arguments[0].click();", submit_btn)
    
    WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.url_contains("/admin/dashboard")
    )
    
    # We are now logged in as admin. We will logout to clean state.
    logout_btn = driver.find_element(By.XPATH, "//*[contains(text(), 'Sign Out') or contains(text(), 'Logout')]")
    driver.execute_script("arguments[0].click();", logout_btn)
    WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.url_contains("/login")
    )

def test_login_employee(driver):
    """Login with valid Employee credentials -> redirected to Employee Dashboard."""
    driver.get(FRONTEND_URL)
    driver.execute_script("localStorage.clear(); sessionStorage.clear();")
    driver.get(f"{FRONTEND_URL}/login")
    
    email_input = WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
    )
    password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
    submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    
    email_input.send_keys(EMPLOYEE_EMAIL)
    password_input.send_keys(EMPLOYEE_PASSWORD)
    driver.execute_script("arguments[0].click();", submit_btn)
    
    WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.url_contains("/dashboard")
    )
    
    # We are now logged in as employee. We will logout to clean state.
    logout_btn = driver.find_element(By.XPATH, "//*[contains(text(), 'Sign Out') or contains(text(), 'Logout')]")
    driver.execute_script("arguments[0].click();", logout_btn)
    WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.url_contains("/login")
    )

def test_login_wrong_password(driver):
    """Login with wrong password -> rejected, error shown, no redirect."""
    driver.get(FRONTEND_URL)
    driver.execute_script("localStorage.clear(); sessionStorage.clear();")
    driver.get(f"{FRONTEND_URL}/login")
    
    email_input = WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
    )
    password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
    submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    
    email_input.send_keys(ADMIN_EMAIL)
    password_input.send_keys("WrongPass123!")
    driver.execute_script("arguments[0].click();", submit_btn)
    
    error_msg = WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, ".alert-danger"))
    )
    assert error_msg.is_displayed()
    assert "login" in driver.current_url

def test_login_nonexistent_email(driver):
    """Login with non-existent email -> rejected."""
    driver.get(FRONTEND_URL)
    driver.execute_script("localStorage.clear(); sessionStorage.clear();")
    driver.get(f"{FRONTEND_URL}/login")
    
    email_input = WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
    )
    password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
    submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    
    email_input.send_keys("does_not_exist@trustguard.local")
    password_input.send_keys("Pass123!")
    driver.execute_script("arguments[0].click();", submit_btn)
    
    error_msg = WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, ".alert-danger"))
    )
    assert error_msg.is_displayed()
    assert "login" in driver.current_url

def test_logout(driver):
    """Logout -> session/token cleared, redirected to login, protected pages no longer accessible."""
    driver.get(FRONTEND_URL)
    driver.execute_script("localStorage.clear(); sessionStorage.clear();")
    driver.get(f"{FRONTEND_URL}/login")
    
    email_input = WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
    )
    password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
    submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    
    email_input.send_keys(ADMIN_EMAIL)
    password_input.send_keys(ADMIN_PASSWORD)
    driver.execute_script("arguments[0].click();", submit_btn)
    
    WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.url_contains("/admin/dashboard")
    )
    
    logout_btn = driver.find_element(By.XPATH, "//*[contains(text(), 'Sign Out') or contains(text(), 'Logout')]")
    driver.execute_script("arguments[0].click();", logout_btn)
    
    WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.url_contains("/login")
    )
    
    # Try accessing protected page
    driver.get(f"{FRONTEND_URL}/admin/dashboard")
    
    # Should redirect to login
    WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.url_contains("/login")
    )

def test_direct_url_access_logged_out(driver):
    """Direct URL access to /admin/dashboard while logged out -> redirected to login."""
    # Ensure logged out state
    driver.get(f"{FRONTEND_URL}/login")
    time.sleep(1) # just to settle
    
    driver.get(f"{FRONTEND_URL}/admin/dashboard")
    
    WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.url_contains("/login")
    )

@pytest.fixture(autouse=True, scope="module")
def cleanup_after_module():
    """Cleanup QA_ prefix test data after module completes."""
    yield
    reset_test_data()
