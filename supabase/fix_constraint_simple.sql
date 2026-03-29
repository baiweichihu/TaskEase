-- 简单约束修复脚本
-- 1. 先查看当前的检查约束内容
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass
AND conname = 'profiles_username_check';

-- 2. 删除可能不正确的约束
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_check;

-- 3. 添加正确的约束（1-15个字符，支持任意字符）
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_username_check 
CHECK (char_length(username) >= 1 AND char_length(username) <= 15);

-- 4. 验证新约束
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass
AND conname = 'profiles_username_check';

-- 5. 简单测试
DO $$
DECLARE
    test_user_id uuid := gen_random_uuid();
BEGIN
    -- 测试有效用户名
    BEGIN
        INSERT INTO public.profiles (user_id, username) VALUES (test_user_id, 'test123');
        RAISE NOTICE '有效用户名测试: 成功';
        DELETE FROM public.profiles WHERE user_id = test_user_id;
    EXCEPTION
        WHEN others THEN RAISE NOTICE '有效用户名测试失败: %', SQLERRM;
    END;
    
    -- 测试无效用户名
    BEGIN
        INSERT INTO public.profiles (user_id, username) VALUES (test_user_id, '');
        RAISE NOTICE '空用户名测试: 意外成功';
        DELETE FROM public.profiles WHERE user_id = test_user_id;
    EXCEPTION
        WHEN check_violation THEN RAISE NOTICE '空用户名测试: 正确失败';
        WHEN others THEN RAISE NOTICE '空用户名测试失败: %', SQLERRM;
    END;
END $$;

SELECT '约束修复完成！' AS message;