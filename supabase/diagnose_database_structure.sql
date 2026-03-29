-- 数据库结构诊断脚本
-- 在 Supabase SQL 编辑器中执行此脚本

-- 1. 检查 profiles 表结构
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 检查 profiles 表的约束
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'profiles' 
AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 3. 检查当前 profiles 表中的数据
SELECT 
    id,
    user_id,
    username,
    char_length(username) as username_length,
    created_at
FROM public.profiles 
LIMIT 10;

-- 4. 检查 auth.users 表结构（用于关联）
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'auth'
ORDER BY ordinal_position;

-- 5. 检查 RLS（行级安全）策略
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
AND schemaname = 'public';

-- 6. 测试用户名约束（如果存在）
DO $$
DECLARE
    test_username text;
    test_result record;
BEGIN
    -- 测试有效用户名
    test_username := 'testuser123';
    RAISE NOTICE '测试用户名: % (长度: %)', test_username, char_length(test_username);
    
    -- 测试无效用户名（长度0）
    BEGIN
        test_username := '';
        RAISE NOTICE '测试空用户名: % (长度: %) - 应该失败', test_username, char_length(test_username);
        INSERT INTO public.profiles (user_id, username) VALUES (gen_random_uuid(), test_username);
        RAISE NOTICE '空用户名测试: 意外成功';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE '空用户名测试: 正确失败 (check_violation)';
        WHEN unique_violation THEN
            RAISE NOTICE '空用户名测试: 正确失败 (unique_violation)';
        WHEN others THEN
            RAISE NOTICE '空用户名测试: 失败 - %', SQLERRM;
    END;
    
    -- 测试无效用户名（长度16）
    BEGIN
        test_username := '1234567890123456';
        RAISE NOTICE '测试长用户名: % (长度: %) - 应该失败', test_username, char_length(test_username);
        INSERT INTO public.profiles (user_id, username) VALUES (gen_random_uuid(), test_username);
        RAISE NOTICE '长用户名测试: 意外成功';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE '长用户名测试: 正确失败 (check_violation)';
        WHEN unique_violation THEN
            RAISE NOTICE '长用户名测试: 正确失败 (unique_violation)';
        WHEN others THEN
            RAISE NOTICE '长用户名测试: 失败 - %', SQLERRM;
    END;
    
    -- 测试有效用户名（边界值）
    BEGIN
        test_username := 'a';
        RAISE NOTICE '测试单字符用户名: % (长度: %) - 应该成功', test_username, char_length(test_username);
        INSERT INTO public.profiles (user_id, username) VALUES (gen_random_uuid(), test_username);
        RAISE NOTICE '单字符用户名测试: 成功';
        DELETE FROM public.profiles WHERE username = test_username;
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE '单字符用户名测试: 失败 - %', SQLERRM;
    END;
    
    -- 测试有效用户名（边界值）
    BEGIN
        test_username := '123456789012345';
        RAISE NOTICE '测试15字符用户名: % (长度: %) - 应该成功', test_username, char_length(test_username);
        INSERT INTO public.profiles (user_id, username) VALUES (gen_random_uuid(), test_username);
        RAISE NOTICE '15字符用户名测试: 成功';
        DELETE FROM public.profiles WHERE username = test_username;
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE '15字符用户名测试: 失败 - %', SQLERRM;
    END;
    
END $$;

-- 7. 检查当前数据库版本和扩展
SELECT version();

SELECT 
    extname,
    extversion
FROM pg_extension 
WHERE extname IN ('postgis', 'pg_stat_statements', 'uuid-ossp');

-- 完成诊断
SELECT '数据库结构诊断完成！' AS message;