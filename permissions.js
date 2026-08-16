const DANGEROUS_COMMANDS = [
  "exec",
  "eval",
  "pullanddeploy",
  "setUsername",
  "cmdauth",
  "presence",
];

function createPermissions(input = {}) {
  const permissions = {
    global: { ...(input.global || {}) },
    users: { ...(input.users || {}) },
  };

  for (const command of DANGEROUS_COMMANDS) {
    if (!Object.prototype.hasOwnProperty.call(permissions.global, command)) {
      permissions.global[command] = false;
    }
  }

  function checkPermission(userId, permission) {
    let allowed = true;
    if (Object.prototype.hasOwnProperty.call(permissions.global, permission)) {
      allowed = permissions.global[permission] === true;
    }

    const userPermissions = permissions.users[userId];
    if (userPermissions && userPermissions["*"] !== undefined) {
      allowed = userPermissions["*"] === true;
    }
    if (userPermissions && userPermissions[permission] !== undefined) {
      allowed = userPermissions[permission] === true;
    }
    return allowed;
  }

  function toggleUserPermission(userId, permission) {
    permissions.users[userId] ||= {};
    const nextValue = !checkPermission(userId, permission);
    permissions.users[userId][permission] = nextValue;
    return nextValue;
  }

  return { permissions, checkPermission, toggleUserPermission };
}

exports.DANGEROUS_COMMANDS = DANGEROUS_COMMANDS;
exports.createPermissions = createPermissions;
