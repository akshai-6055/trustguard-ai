import pytest
import os
import json
import time
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
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

# Global variables for results and run timestamp
RUN_TIMESTAMP = datetime.now().strftime("%Y%m%d_%H%M%S")
RESULTS_LIST = []
RESULTS_DIR = os.path.join(os.path.dirname(__file__), "results")
SCREENSHOTS_DIR = os.path.join(os.path.dirname(__file__), "screenshots", RUN_TIMESTAMP)

os.makedirs(RESULTS_DIR, exist_ok=True)
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

def take_screenshot(driver, name):
    """Helper to take a screenshot and return the path."""
    safe_name = name.replace(" ", "_").replace("/", "_")
    filename = f"{safe_name}_{int(time.time())}.png"
    filepath = os.path.join(SCREENSHOTS_DIR, filename)
    driver.save_screenshot(filepath)
    return filepath

@pytest.fixture(scope="session", autouse=True)
def setup_test_data():
    """Ensure a clean database before the test session starts."""
    try:
        from tests.selenium.db_helper import reset_test_data
        reset_test_data()
    except Exception as e:
        print(f"Failed to reset test data: {e}")

@pytest.fixture(scope="session")
def driver():
    options = webdriver.ChromeOptions()
    # options.add_argument("--headless")
    options.add_argument("--window-size=1920,1080")
    
    # Auto-accept geolocation to prevent timeouts
    prefs = {"profile.default_content_setting_values.geolocation": 1}
    options.add_experimental_option("prefs", prefs)
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    driver.implicitly_wait(DEFAULT_TIMEOUT)
    yield driver
    driver.quit()

@pytest.fixture
def admin_login(driver):
    """Logs in as the test Admin and returns an authenticated driver."""
    driver.get(FRONTEND_URL)
    driver.execute_script("localStorage.clear(); sessionStorage.clear();")
    driver.get(f"{FRONTEND_URL}/login")
    
    email_input = WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
    )
    password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
    submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    
    email_input.clear()
    email_input.send_keys(ADMIN_EMAIL)
    password_input.clear()
    password_input.send_keys(ADMIN_PASSWORD)
    submit_btn.click()
    
    WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.url_contains("/admin/dashboard")
    )
    return driver

@pytest.fixture
def employee_login(driver):
    """Logs in as the test Employee and returns an authenticated driver."""
    driver.get(FRONTEND_URL)
    driver.execute_script("localStorage.clear(); sessionStorage.clear();")
    driver.get(f"{FRONTEND_URL}/login")
    
    email_input = WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
    )
    password_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
    submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    
    email_input.clear()
    email_input.send_keys(EMPLOYEE_EMAIL)
    password_input.clear()
    password_input.send_keys(EMPLOYEE_PASSWORD)
    submit_btn.click()
    
    WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.url_contains("/dashboard")
    )
    return driver

# Pytest hooks for result recording
@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()
    
    if report.when == "call":
        # Get driver instance if available for screenshot
        driver = None
        if "driver" in item.funcargs:
            driver = item.funcargs["driver"]
        elif "admin_login" in item.funcargs:
            driver = item.funcargs["admin_login"]
        elif "employee_login" in item.funcargs:
            driver = item.funcargs["employee_login"]
            
        screenshot_path = ""
        status = "Pass" if report.passed else "Fail"
        
        if report.failed and driver:
            try:
                screenshot_path = take_screenshot(driver, f"FAIL_{item.name}")
            except Exception as e:
                print(f"Failed to take screenshot: {e}")
                
        # Extract module name nicely
        module_name = item.nodeid.split("::")[0].split("/")[-1].replace(".py", "")
        
        result_entry = {
            "test_id": item.nodeid,
            "module": module_name,
            "description": item.function.__doc__ or item.name,
            "expected_result": "Success", # Generic, can be improved per-test
            "actual_result": report.longreprtext if report.failed else "Passed as expected",
            "status": status,
            "duration": round(report.duration, 2),
            "screenshot_path": screenshot_path
        }
        RESULTS_LIST.append(result_entry)

def pytest_sessionfinish(session, exitstatus):
    """Save results to JSON file after run completes."""
    results_file = os.path.join(RESULTS_DIR, f"run_{RUN_TIMESTAMP}.json")
    with open(results_file, "w") as f:
        json.dump(RESULTS_LIST, f, indent=4)

@pytest.fixture
def qa_user():
    """Creates a temporary QA user in the database and cleans it up after."""
    from tests.selenium.db_helper import create_qa_user, delete_qa_user
    email = "qa_temp_user@trustguard.local"
    full_name = "QA Temporary User"
    
    # Ensure it's clean before starting
    delete_qa_user(email)
    
    # Create the user
    create_qa_user(email, full_name, role_id=2) # Employee role
    
    yield {"email": email, "full_name": full_name}
    
    # Cleanup after test
    delete_qa_user(email)
