-- 极简数据库诊断脚本
-- 查看 profiles 表的基本信息

-- 1. 查看 profiles 表的所有列
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public';

-- 2. 查看 profiles 表的约束
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'profiles' 
AND table_schema = 'public';

-- 3. 查看当前数据（前5条）
SELECT id, user_id, username, char_length(username) as len, created_at 
FROM public.profiles 
LIMIT 5;