-- KEYS:
-- 1 = frontierKey

local frontierSize = redis.call("LLEN", KEYS[1])

return { frontierSize }