-- KEYS:
-- 1 = aliveKey
-- 2 = visitedKey
-- 3 = parentKey
-- 4 = depthKey
-- 5 = frontierKey

-- ARGV:
-- 1 = article
-- 2 = parentArticle
-- 3 = depth

if redis.call("EXISTS", KEYS[1]) == 0 then
  return 0
end

-- Abort if frontier gone (job cleanup)
if redis.call("EXISTS", KEYS[5]) == 0 then
  return 0
end

if redis.call("SADD", KEYS[2], ARGV[1]) == 0 then
  return 0
end

redis.call("HSET", KEYS[3], ARGV[1], ARGV[2])
redis.call("HSET", KEYS[4], ARGV[1], ARGV[3])
redis.call("LPUSH", KEYS[5], ARGV[1])

return 1
