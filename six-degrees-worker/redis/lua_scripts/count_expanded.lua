-- KEYS:
-- 1 = aliveKey
-- 2 = statsKey

if redis.call("EXISTS", KEYS[1]) == 0 then
  return 0
end

return redis.call("HINCRBY", KEYS[2], "totalExpanded", 1)
