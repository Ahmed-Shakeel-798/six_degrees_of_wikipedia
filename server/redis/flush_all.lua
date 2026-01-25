-- clean_redis.lua
-- This Lua script clears all keys in all databases

return redis.call('FLUSHALL')