-- KEYS:
-- 1 = aliveKey
-- 2 = frontierKey (ZSET)
-- 3 = depthKey
-- 4 = statsKey

if redis.call("EXISTS", KEYS[1]) == 0 then
  return nil
end

local res = redis.call("ZPOPMAX", KEYS[2], 1)
if #res == 0 then
  return nil
end

local article = res[1]
local hScore = res[2] -- not used here, but could be logged if needed
local depth = redis.call("HGET", KEYS[3], article)
local expanded = redis.call("HINCRBY", KEYS[4], "totalExpanded", 1)

return { article, depth, expanded, hScore }
