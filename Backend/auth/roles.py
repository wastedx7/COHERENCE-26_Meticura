"""
Role-based access control (RBAC) definitions and permissions
"""
from enum import Enum
from typing import Dict, Set


class Permission(str, Enum):
    """Permission enumeration"""
    # User management
    MANAGE_USERS = "manage:users"
    MANAGE_ROLES = "manage:roles"
    
    # Budget operations
    VIEW_BUDGET = "view:budget"
    EDIT_BUDGET = "edit:budget"
    APPROVE_REALLOCATION = "approve:reallocation"
    
    # Anomaly detection
    VIEW_ANOMALIES = "view:anomalies"
    REVIEW_ANOMALIES = "review:anomalies"
    RESOLVE_ANOMALIES = "resolve:anomalies"
    
    # Reporting & Analytics
    VIEW_REPORTS = "view:reports"
    GENERATE_REPORTS = "generate:reports"
    EXPORT_DATA = "export:data"
    
    # System administration
    VIEW_LOGS = "view:logs"
    MANAGE_SETTINGS = "manage:settings"


# Role to permissions mapping
ROLE_PERMISSIONS: Dict[str, Set[Permission]] = {
    "admin": {
        # User management
        Permission.MANAGE_USERS,
        Permission.MANAGE_ROLES,
        
        # Budget operations
        Permission.VIEW_BUDGET,
        Permission.EDIT_BUDGET,
        Permission.APPROVE_REALLOCATION,
        
        # Anomaly detection
        Permission.VIEW_ANOMALIES,
        Permission.REVIEW_ANOMALIES,
        Permission.RESOLVE_ANOMALIES,
        
        # Reporting
        Permission.VIEW_REPORTS,
        Permission.GENERATE_REPORTS,
        Permission.EXPORT_DATA,
        
        # System admin
        Permission.VIEW_LOGS,
        Permission.MANAGE_SETTINGS,
    },
    "manager": {
        # Budget operations
        Permission.VIEW_BUDGET,
        Permission.EDIT_BUDGET,
        Permission.APPROVE_REALLOCATION,
        
        # Anomaly detection
        Permission.VIEW_ANOMALIES,
        Permission.REVIEW_ANOMALIES,
        Permission.RESOLVE_ANOMALIES,
        
        # Reporting
        Permission.VIEW_REPORTS,
        Permission.GENERATE_REPORTS,
        Permission.EXPORT_DATA,
    },
    "analyst": {
        # Budget operations
        Permission.VIEW_BUDGET,
        
        # Anomaly detection
        Permission.VIEW_ANOMALIES,
        Permission.REVIEW_ANOMALIES,
        
        # Reporting
        Permission.VIEW_REPORTS,
        Permission.GENERATE_REPORTS,
        Permission.EXPORT_DATA,
    },
    "viewer": {
        # Minimal permissions - read-only
        Permission.VIEW_BUDGET,
        Permission.VIEW_ANOMALIES,
        Permission.VIEW_REPORTS,
    },
}


def get_role_permissions(role: str) -> Set[Permission]:
    """Get all permissions for a given role"""
    return ROLE_PERMISSIONS.get(role, set())


def has_permission(role: str, permission: Permission) -> bool:
    """Check if a role has a specific permission"""
    permissions = get_role_permissions(role)
    return permission in permissions


def has_any_permission(role: str, permissions: list[Permission]) -> bool:
    """Check if a role has any of the specified permissions"""
    role_permissions = get_role_permissions(role)
    return any(permission in role_permissions for permission in permissions)


def has_all_permissions(role: str, permissions: list[Permission]) -> bool:
    """Check if a role has all specified permissions"""
    role_permissions = get_role_permissions(role)
    return all(permission in role_permissions for permission in permissions)
