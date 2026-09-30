import pymysql
import pymysql.cursors
from tests.selenium.config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT

def get_connection():
    return pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        port=DB_PORT,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True
    )

def grant_permission(role_name, permission_name):
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            # Get role ID
            cursor.execute("SELECT id FROM roles WHERE role_name = %s", (role_name,))
            role = cursor.fetchone()
            if not role:
                return False
            role_id = role['id']
            
            # Get permission ID
            cursor.execute("SELECT permission_id FROM permissions WHERE permission_name = %s", (permission_name,))
            perm = cursor.fetchone()
            if not perm:
                return False
            perm_id = perm['permission_id']
            
            # Insert if not exists
            cursor.execute("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (%s, %s)", (role_id, perm_id))
        return True
    finally:
        connection.close()

def revoke_permission(role_name, permission_name):
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            # Get role ID
            cursor.execute("SELECT id FROM roles WHERE role_name = %s", (role_name,))
            role = cursor.fetchone()
            if not role:
                return False
            role_id = role['id']
            
            # Get permission ID
            cursor.execute("SELECT permission_id FROM permissions WHERE permission_name = %s", (permission_name,))
            perm = cursor.fetchone()
            if not perm:
                return False
            perm_id = perm['permission_id']
            
            # Delete permission
            cursor.execute("DELETE FROM role_permissions WHERE role_id = %s AND permission_id = %s", (role_id, perm_id))
        return True
    finally:
        connection.close()

def reset_test_data():
    """Deletes any leftover test_ or QA_ prefixed rows in users, devices, security_policies."""
    from tests.selenium.config import EMPLOYEE_EMAIL, ADMIN_EMAIL, EMPLOYEE_PASSWORD, ADMIN_PASSWORD
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM security_policies WHERE policy_name LIKE 'test_%' OR policy_name LIKE 'QA_%'")
            cursor.execute("DELETE FROM devices WHERE device_name LIKE 'test_%' OR device_name LIKE 'QA_%'")
            
            # Also clear devices for the real test users to avoid Blocked state leaking across test runs
            cursor.execute("DELETE FROM devices WHERE user_id IN (SELECT id FROM users WHERE email IN (%s, %s))", (EMPLOYEE_EMAIL, ADMIN_EMAIL))
            
            # Reset passwords for real test users
            import bcrypt
            employee_hash = bcrypt.hashpw(EMPLOYEE_PASSWORD.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            admin_hash = bcrypt.hashpw(ADMIN_PASSWORD.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Ensure Employee exists
            cursor.execute("SELECT id FROM users WHERE email = %s", (EMPLOYEE_EMAIL,))
            if not cursor.fetchone():
                cursor.execute("INSERT INTO users (full_name, email, password, role_id, account_status) VALUES ('Automated Employee', %s, %s, 2, 'Active')", (EMPLOYEE_EMAIL, employee_hash))
            else:
                cursor.execute("UPDATE users SET password = %s WHERE email = %s", (employee_hash, EMPLOYEE_EMAIL))
                
            # Ensure Admin exists
            cursor.execute("SELECT id FROM users WHERE email = %s", (ADMIN_EMAIL,))
            if not cursor.fetchone():
                cursor.execute("INSERT INTO users (full_name, email, password, role_id, account_status) VALUES ('Automated Admin', %s, %s, 1, 'Active')", (ADMIN_EMAIL, admin_hash))
            else:
                cursor.execute("UPDATE users SET password = %s WHERE email = %s", (admin_hash, ADMIN_EMAIL))
            
            # Ensure VIEW_AUDIT_LOGS permission exists
            cursor.execute("SELECT permission_id FROM permissions WHERE permission_name = 'VIEW_AUDIT_LOGS'")
            perm = cursor.fetchone()
            if not perm:
                cursor.execute("INSERT INTO permissions (permission_name, description) VALUES ('VIEW_AUDIT_LOGS', 'Can view audit logs')")
                perm_id = cursor.lastrowid
            else:
                perm_id = perm['permission_id']
                
            # Grant VIEW_AUDIT_LOGS to Admin
            cursor.execute("SELECT id FROM roles WHERE role_name = 'Admin'")
            role = cursor.fetchone()
            if role:
                role_id = role['id']
                cursor.execute("SELECT * FROM role_permissions WHERE role_id = %s AND permission_id = %s", (role_id, perm_id))
                if not cursor.fetchone():
                    cursor.execute("INSERT INTO role_permissions (role_id, permission_id) VALUES (%s, %s)", (role_id, perm_id))
            
            cursor.execute("SELECT id FROM users WHERE email LIKE 'test_%' OR email LIKE 'QA_%' OR full_name LIKE 'test_%' OR full_name LIKE 'QA_%'")
            test_users = cursor.fetchall()
            if test_users:
                user_ids = [str(u['id']) for u in test_users]
                id_list = ",".join(user_ids)
                
                cursor.execute(f"DELETE FROM devices WHERE user_id IN ({id_list})")
                
                # Check for other referencing tables if they exist
                try: cursor.execute(f"DELETE FROM audit_logs WHERE user_id IN ({id_list})")
                except: pass
                
                try: cursor.execute(f"DELETE FROM login_history WHERE user_id IN ({id_list})")
                except: pass
                
                try: cursor.execute(f"DELETE FROM user_sessions WHERE user_id IN ({id_list})")
                except: pass
                
                cursor.execute(f"DELETE FROM users WHERE id IN ({id_list})")
        return True
    finally:
        connection.close()

def create_qa_user(email, full_name="QA Test User", role_id=2):
    """Inserts a temporary QA user directly into the database."""
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            # Check if exists to avoid errors
            cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cursor.fetchone():
                cursor.execute("UPDATE users SET role_id = %s WHERE email = %s", (role_id, email))
                connection.commit()
                return True
            # Insert with a dummy hash
            dummy_hash = "$2a$10$dummyhashdummyhashdummyhashdummyhashdummyhash"
            cursor.execute(
                "INSERT INTO users (full_name, email, password, role_id, account_status) VALUES (%s, %s, %s, %s, %s)",
                (full_name, email, dummy_hash, role_id, 'Active')
            )
        connection.commit()
        return True
    finally:
        connection.close()

def delete_qa_user(email):
    """Deletes a temporary QA user from the database."""
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()
            if user:
                user_id = user['id']
                cursor.execute("DELETE FROM audit_logs WHERE user_id = %s", (user_id,))
                cursor.execute("DELETE FROM login_history WHERE user_id = %s", (user_id,))
                cursor.execute("DELETE FROM devices WHERE user_id = %s", (user_id,))
                cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        connection.commit()
        return True
    finally:
        connection.close()

if __name__ == "__main__":
    # Test connection
    try:
        conn = get_connection()
        print("Successfully connected to the database!")
        conn.close()
    except Exception as e:
        print(f"Database connection failed: {e}")
