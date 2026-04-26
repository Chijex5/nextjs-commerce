const adminPermissions: Record<string, Record<string, string[]>> = {
    "admin": {
        "admin_dashboard": ["read", "delete"]
    },
    "super_admin": {
        "admin_dashboard": ["read", "create", "delete", "update"]
    }
};

export function hasPermission(role: string, resource: string, action: string): {reason?: string, permitted: boolean}  {
    const permissions = adminPermissions[role];
    if (!permissions) {
        return { reason: "Role not found", permitted: false };
    }

    const resourcePermissions = permissions[resource];
    if (!resourcePermissions) {
        return { reason: "Resource not found for this role", permitted: false };
    }
    
    return { reason: "Permission granted", permitted: resourcePermissions.includes(action) }; // Check if the action is allowed
}