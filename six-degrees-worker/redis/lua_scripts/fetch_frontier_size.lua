-- KEYS:
-- 1 = frontierKey (ZSET)

local frontierSize = redis.call("ZCARD", KEYS[1])
return { frontierSize }