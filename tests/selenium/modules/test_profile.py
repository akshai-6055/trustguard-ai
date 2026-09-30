import pytest
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from tests.selenium.config import (
    FRONTEND_URL,
    EMPLOYEE_EMAIL,
    EMPLOYEE_PASSWORD,
    ADMIN_EMAIL,
    DEFAULT_TIMEOUT
)

def test_view_profile_shows_correct_data(employee_login):
    """View profile shows correct logged-in user's data."""
    driver = employee_login
    driver.get(f"{FRONTEND_URL}/profile")
    
    # Wait for the profile page to load, indicated by "User Information"
    WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'User Information')]"))
    )
    
    # The email is displayed on the profile page
    email_display = driver.find_element(By.XPATH, f"//*[contains(text(), '{EMPLOYEE_EMAIL}')]")
    assert email_display.is_displayed()

def test_edit_profile_name(employee_login):
    """Edit profile (name) -> saved and reflected in UI."""
    driver = employee_login
    driver.get(f"{FRONTEND_URL}/profile/edit")
    
    # Wait for input fields to load
    name_input = WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='text']"))
    )
    submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    
    # Edit the name - only letters allowed
    import random
    import string
    random_suffix = ''.join(random.choices(string.ascii_uppercase, k=4))
    new_name = f"Updated Employee {random_suffix}"
    name_input.send_keys(u'\ue009' + 'a') # Keys.CONTROL + 'a'
    name_input.send_keys(u'\ue003') # Keys.BACKSPACE
    name_input.send_keys(new_name)
    driver.execute_script("arguments[0].click();", submit_btn)
    
    # Should see success message and redirect
    WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, ".alert-success"))
    )
    
    WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        lambda d: d.current_url.rstrip("/") == f"{FRONTEND_URL}/profile"
    )
    
    # Profile page should show the new name
    WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_element_located((By.XPATH, f"//*[contains(text(), '{new_name}')]"))
    )
    
    # Change it back
    driver.get(f"{FRONTEND_URL}/profile/edit")
    name_input = WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='text']"))
    )
    submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    name_input.send_keys(u'\ue009' + 'a')
    name_input.send_keys(u'\ue003')
    name_input.send_keys("Test Employee")
    driver.execute_script("arguments[0].click();", submit_btn)
    WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        lambda d: d.current_url.rstrip("/") == f"{FRONTEND_URL}/profile"
    )

def test_edit_profile_duplicate_email(employee_login):
    """Edit profile with a duplicate email -> rejected."""
    driver = employee_login
    driver.get(f"{FRONTEND_URL}/profile/edit")
    
    # Wait for input fields to load
    email_input = WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
    )
    submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    
    email_input.clear()
    email_input.send_keys(ADMIN_EMAIL)
    driver.execute_script("arguments[0].click();", submit_btn)
    
    # Should see error message
    error_msg = WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, ".alert-danger"))
    )
    assert error_msg.is_displayed()

def test_change_password_correct(employee_login):
    """Change password with correct current password -> success, check old and new logins."""
    driver = employee_login
    driver.get(f"{FRONTEND_URL}/change-password")
    
    passwords = WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, "input[type='password']"))
    )
    current_pass = passwords[0]
    new_pass = passwords[1]
    confirm_pass = passwords[2]
    submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    
    new_password_val = "NewEmpPass123!"
    
    try:
        current_pass.send_keys(EMPLOYEE_PASSWORD)
        new_pass.send_keys(new_password_val)
        confirm_pass.send_keys(new_password_val)
        driver.execute_script("arguments[0].click();", submit_btn)
        
        # Success message and redirect to profile
        WebDriverWait(driver, DEFAULT_TIMEOUT).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".alert-success"))
        )
        WebDriverWait(driver, DEFAULT_TIMEOUT).until(
            EC.url_contains("/profile")
        )
        
        # Logout
        logout_btn = driver.find_element(By.XPATH, "//*[contains(text(), 'Logout')]")
        driver.execute_script("arguments[0].click();", logout_btn)
        WebDriverWait(driver, DEFAULT_TIMEOUT).until(
            EC.url_contains("/login")
        )
        
        # Attempt login with OLD password -> should fail
        email_input = WebDriverWait(driver, DEFAULT_TIMEOUT).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
        )
        password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        
        email_input.send_keys(EMPLOYEE_EMAIL)
        password_input.send_keys(EMPLOYEE_PASSWORD)
        driver.execute_script("arguments[0].click();", submit_btn)
        
        error_msg = WebDriverWait(driver, DEFAULT_TIMEOUT).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".alert-danger"))
        )
        assert error_msg.is_displayed()
        
        # Attempt login with NEW password -> should succeed
        driver.get(f"{FRONTEND_URL}/login")
        driver.execute_script("localStorage.clear(); sessionStorage.clear();")
        driver.get(f"{FRONTEND_URL}/login")
        
        email_input = WebDriverWait(driver, DEFAULT_TIMEOUT).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
        )
        password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        
        email_input.send_keys(EMPLOYEE_EMAIL)
        password_input.send_keys(new_password_val)
        driver.execute_script("arguments[0].click();", submit_btn)
        
        WebDriverWait(driver, DEFAULT_TIMEOUT).until(
            EC.url_contains("/dashboard")
        )
    finally:
        try:
            # Change it back so we don't break subsequent test runs
            driver.get(f"{FRONTEND_URL}/change-password")
            passwords = WebDriverWait(driver, 5).until(
                EC.presence_of_all_elements_located((By.CSS_SELECTOR, "input[type='password']"))
            )
            passwords[0].send_keys(new_password_val)
            passwords[1].send_keys(EMPLOYEE_PASSWORD)
            passwords[2].send_keys(EMPLOYEE_PASSWORD)
            submit_reset_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            driver.execute_script("arguments[0].click();", submit_reset_btn)
            WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".alert-success"))
            )
        except Exception:
            pass

def test_change_password_incorrect(employee_login):
    """Change password with incorrect current password -> rejected."""
    driver = employee_login
    driver.get(f"{FRONTEND_URL}/change-password")
    
    passwords = WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, "input[type='password']"))
    )
    current_pass = passwords[0]
    new_pass = passwords[1]
    confirm_pass = passwords[2]
    submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    
    current_pass.send_keys("WrongCurrentPass!")
    new_pass.send_keys("NewEmpPass123!")
    confirm_pass.send_keys("NewEmpPass123!")
    driver.execute_script("arguments[0].click();", submit_btn)
    
    # Should see error message
    error_msg = WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, ".alert-danger"))
    )
    assert error_msg.is_displayed()
