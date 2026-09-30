import pytest
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

from tests.selenium.config import (
    FRONTEND_URL,
    DEFAULT_TIMEOUT
)

def test_admin_views_user_list(admin_login):
    """Admin views user list -> list populates."""
    driver = admin_login
    driver.get(f"{FRONTEND_URL}/admin/users")
    
    # Wait for the table to load
    table = WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_element_located((By.TAG_NAME, "table"))
    )
    
    # Assert there is at least one row in the tbody
    rows = table.find_elements(By.XPATH, ".//tbody/tr")
    assert len(rows) > 0, "User list is empty or failed to load."

def test_admin_changes_user_role(admin_login, qa_user):
    """Admin changes a user's role from Employee to Admin -> UI updates."""
    driver = admin_login
    driver.get(f"{FRONTEND_URL}/admin/users")
    
    email = qa_user['email']
    
    # Wait for the specific user's row
    row_xpath = f"//tr[.//td[contains(text(), '{email}')]]"
    row = WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_element_located((By.XPATH, row_xpath))
    )
    
    # Open Actions dropdown
    actions_btn = row.find_element(By.XPATH, ".//button[contains(text(), 'Actions')]")
    driver.execute_script("arguments[0].click();", actions_btn)
    
    # Click Edit User
    edit_btn = WebDriverWait(driver, 5).until(
        EC.element_to_be_clickable((By.XPATH, f"{row_xpath}//button[contains(., 'Edit User')]"))
    )
    driver.execute_script("arguments[0].click();", edit_btn)
    
    # Wait for Edit Modal
    WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, ".modal.show"))
    )
    
    # Find the Role select element based on its label
    role_select_elem = driver.find_element(By.XPATH, "//label[contains(text(), 'ROLE')]/following-sibling::select")
    role_select = Select(role_select_elem)
    
    # Change to Administrator (value '1' usually, or visible text)
    role_select.select_by_visible_text("Administrator")
    time.sleep(0.5) # Wait for React state to update
    
    # Save
    save_btn = WebDriverWait(driver, 5).until(
        EC.element_to_be_clickable((By.XPATH, "//div[contains(@class, 'modal-footer')]//button[contains(., 'Save User')]"))
    )
    driver.execute_script("arguments[0].click();", save_btn)
    
    # Wait for Modal to disappear
    WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.invisibility_of_element_located((By.CSS_SELECTOR, ".modal.show"))
    )
    
    # Assert the UI updates the role
    driver.refresh()
    # Wait for the table to load again
    WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_element_located((By.TAG_NAME, "table"))
    )
    WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_element_located((By.XPATH, f"{row_xpath}//*[contains(text(), 'Admin')]"))
    )
    
def test_admin_deletes_user(admin_login, qa_user):
    """Admin deletes a user -> UI removes them."""
    driver = admin_login
    driver.get(f"{FRONTEND_URL}/admin/users")
    
    email = qa_user['email']
    
    # Wait for the specific user's row
    row_xpath = f"//tr[.//td[contains(text(), '{email}')]]"
    row = WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.presence_of_element_located((By.XPATH, row_xpath))
    )
    
    # Open Actions dropdown
    actions_btn = row.find_element(By.XPATH, ".//button[contains(text(), 'Actions')]")
    driver.execute_script("arguments[0].click();", actions_btn)
    
    # Click Delete User
    delete_btn = WebDriverWait(driver, 5).until(
        EC.element_to_be_clickable((By.XPATH, f"{row_xpath}//button[contains(., 'Delete User')]"))
    )
    driver.execute_script("arguments[0].click();", delete_btn)
    
    # Wait for browser window.confirm alert and accept it
    alert = WebDriverWait(driver, DEFAULT_TIMEOUT).until(EC.alert_is_present())
    alert.accept()
    
    # Ensure it's gone from UI by checking if the row disappears
    WebDriverWait(driver, DEFAULT_TIMEOUT).until(
        EC.invisibility_of_element_located((By.XPATH, row_xpath))
    )
    
    # Assert
    rows = driver.find_elements(By.XPATH, row_xpath)
    assert len(rows) == 0, f"User row for {email} still exists in the UI after deletion."
