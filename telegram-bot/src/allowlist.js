function isAllowedUser(userId, allowedUserIdsEnv) {
  if (!allowedUserIdsEnv) return false;

  const allowed = allowedUserIdsEnv
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  return allowed.includes(String(userId));
}

module.exports = { isAllowedUser };
