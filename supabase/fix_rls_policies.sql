-- TaskEase RLS策略修复脚本
-- 解决用户名修改时的"new row violates row-level security policy"错误

-- 1. 删除现有的profiles表策略（如果存在）
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

-- 2. 创建新的RLS策略
-- 允许公开查询用户名（用于检查用户名是否被占用）
CREATE POLICY "profiles_select_public" ON public.profiles 
FOR SELECT USING (true);

-- 允许认证用户插入自己的profile
CREATE POLICY "profiles_insert_own" ON public.profiles 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 允许认证用户更新自己的profile（移除WITH CHECK约束）
CREATE POLICY "profiles_update_own" ON public.profiles 
FOR UPDATE TO authenticated 
USING (auth.uid() = user_id);

-- 允许认证用户查询自己的profile
CREATE POLICY "profiles_select_own" ON public.profiles 
FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

-- 3. 验证策略创建
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;

-- 完成消息
SELECT 'RLS策略修复完成！现在可以正常修改用户名了。' AS message;