-- KEYS:
-- 1 = aliveKey
-- 2 = frontierKey
-- 3 = depthKey
-- 4 = statsKey

if redis.call("EXISTS", KEYS[1]) == 0 then
  return nil
end

if redis.call("LLEN", KEYS[2]) == 0 then
  return nil
end

local article = redis.call("RPOP", KEYS[2])
local depth = redis.call("HGET", KEYS[3], article)
local expanded = redis.call("HINCRBY", KEYS[4], "totalExpanded", 1)

return { article, depth, expanded }
